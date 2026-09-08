import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { MOCK_ACTIVITIES, MOCK_ACTIVITY_GROUPS, MOCK_TEACHERS } from '../catalog/api.js';

export const MOCK_CHILDREN = [
  {
    id: 'student-1',
    fullName: 'Александр Иванов',
    className: '7-Б класс',
    parentIds: ['dev-user-1', 'parent-1'],
    schoolId: 'school-1',
  },
  {
    id: 'student-2',
    fullName: 'София Иванова',
    className: '5-Б класс',
    parentIds: ['dev-user-1', 'parent-1'],
    schoolId: 'school-1',
  },
];

export const MOCK_ENROLLMENTS = [
  {
    id: 'enr-1',
    studentId: 'student-1',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
    holdExpiresAt: null,
    enrolledAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'enr-2',
    studentId: 'student-1',
    groupId: 'grp-3-1',
    activityId: 'act-3',
    status: 'pending_parent_approval',
    holdExpiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    enrolledAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'enr-3',
    studentId: 'student-2',
    groupId: 'grp-5-1',
    activityId: 'act-5',
    status: 'active',
    holdExpiresAt: null,
    enrolledAt: '2026-09-02T11:00:00.000Z',
  },
  {
    id: 'enr-4',
    studentId: 'student-2',
    groupId: 'grp-2-1',
    activityId: 'act-2',
    status: 'cancelled',
    cancelledAt: '2026-09-04T12:00:00.000Z',
    enrolledAt: '2026-09-03T09:00:00.000Z',
  },
];

export const MOCK_PAYMENTS = [
  {
    id: 'pay-1',
    enrollmentId: 'enr-1',
    studentId: 'student-1',
    activityId: 'act-1',
    amount: 25000,
    status: 'paid',
    dueDate: '2026-09-15',
    paidAt: '2026-09-03T14:20:00.000Z',
  },
  {
    id: 'pay-2',
    enrollmentId: 'enr-2',
    studentId: 'student-1',
    activityId: 'act-3',
    amount: 0,
    status: 'paid',
    dueDate: '2026-09-20',
    paidAt: '2026-09-08T12:00:00.000Z',
  },
  {
    id: 'pay-3',
    enrollmentId: 'enr-3',
    studentId: 'student-2',
    activityId: 'act-5',
    amount: 22000,
    status: 'pending',
    dueDate: '2026-09-25',
    paidAt: null,
  },
];

/**
 * Enriches enrollments with activity and group details
 */
export function enrichEnrollments(rawEnrollments, activities, groups, teachers) {
  const actMap = {};
  (activities || []).forEach((a) => {
    actMap[a.id] = a;
  });

  const grpMap = {};
  (groups || []).forEach((g) => {
    grpMap[g.id] = g;
  });

  const teacherMap = {};
  (teachers || []).forEach((t) => {
    teacherMap[t.id] = t.fullName || t.name;
  });

  return (rawEnrollments || []).map((enr) => {
    const group = grpMap[enr.groupId] || null;
    const actId = enr.activityId || group?.activityId;
    const activity = actMap[actId] || null;
    const teacherId = activity?.teacherId || group?.teacherId;
    const teacherName =
      teacherMap[teacherId] ||
      MOCK_TEACHERS[teacherId]?.fullName ||
      activity?.teacherName ||
      'Преподаватель школы';

    return {
      ...enr,
      activity: activity || {
        id: actId,
        title: 'Школьный кружок',
        category: 'Внеурочная деятельность',
        location: 'Школьный корпус',
        price: 0,
      },
      group: group || {
        id: enr.groupId,
        daysOfWeek: [],
        startTime: '15:00',
        endTime: '16:30',
        name: 'Основная группа',
      },
      teacherName,
    };
  });
}

/**
 * Subscribe to student or parent dashboard data in real-time
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.role
 * @param {string} params.studentId
 * @param {(data: { children: any[], enrollments: any[], payments: any[] }) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void} cleanup unsubscribe
 */
export function subscribeDashboardData({ userId, role, studentId }, onUpdate, onError) {
  let childrenList = null;
  let enrollmentsList = null;
  let paymentsList = null;
  let activitiesList = null;
  let groupsList = null;
  let teachersList = null;

  function emit() {
    // 1. Resolve children
    const finalChildren =
      role === 'parent'
        ? childrenList && childrenList.length > 0
          ? childrenList
          : MOCK_CHILDREN
        : [
            {
              id: studentId || userId || 'student-1',
              fullName: 'Мой профиль',
              className: '',
            },
          ];

    // 2. Resolve enrollments
    const rawEnr =
      enrollmentsList && enrollmentsList.length > 0
        ? enrollmentsList
        : MOCK_ENROLLMENTS.filter((e) => e.studentId === studentId);

    const acts = activitiesList && activitiesList.length > 0 ? activitiesList : MOCK_ACTIVITIES;
    const grps = groupsList && groupsList.length > 0 ? groupsList : MOCK_ACTIVITY_GROUPS;
    const tchrs =
      teachersList && teachersList.length > 0 ? teachersList : Object.values(MOCK_TEACHERS);

    const enrichedEnrollments = enrichEnrollments(rawEnr, acts, grps, tchrs);

    // 3. Resolve payments
    const finalPayments =
      paymentsList && paymentsList.length > 0
        ? paymentsList
        : MOCK_PAYMENTS.filter((p) => p.studentId === studentId);

    onUpdate({
      children: finalChildren,
      enrollments: enrichedEnrollments,
      payments: finalPayments,
    });
  }

  const unsubs = [];

  try {
    // 1. Children subscription for parent
    if (role === 'parent') {
      const parentQ = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('parentIds', 'array-contains', userId)
      );
      const unsubChildren = onSnapshot(
        parentQ,
        (snap) => {
          if (!snap.empty) {
            childrenList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            childrenList = MOCK_CHILDREN;
          }
          emit();
        },
        (err) => {
          console.warn('Children snapshot fallback:', err.message);
          childrenList = MOCK_CHILDREN;
          emit();
        }
      );
      unsubs.push(unsubChildren);
    }

    // 2. Enrollments subscription for activeStudentId
    if (studentId) {
      const enrQ = query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where('studentId', '==', studentId)
      );
      const unsubEnr = onSnapshot(
        enrQ,
        (snap) => {
          if (!snap.empty) {
            enrollmentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            enrollmentsList = MOCK_ENROLLMENTS.filter((e) => e.studentId === studentId);
          }
          emit();
        },
        (err) => {
          console.warn('Enrollments snapshot fallback:', err.message);
          enrollmentsList = MOCK_ENROLLMENTS.filter((e) => e.studentId === studentId);
          emit();
        }
      );
      unsubs.push(unsubEnr);

      // 3. Payments subscription
      const payQ = query(collection(db, COLLECTIONS.PAYMENTS), where('studentId', '==', studentId));
      const unsubPay = onSnapshot(
        payQ,
        (snap) => {
          if (!snap.empty) {
            paymentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            paymentsList = MOCK_PAYMENTS.filter((p) => p.studentId === studentId);
          }
          emit();
        },
        (err) => {
          console.warn('Payments snapshot fallback:', err.message);
          paymentsList = MOCK_PAYMENTS.filter((p) => p.studentId === studentId);
          emit();
        }
      );
      unsubs.push(unsubPay);
    }

    // 4. Activities & Groups metadata
    const unsubActs = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snap) => {
        activitiesList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubActs);

    const unsubGrps = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snap) => {
        groupsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubGrps);

    const unsubUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snap) => {
        teachersList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubUsers);

    return () => {
      unsubs.forEach((fn) => fn && fn());
    };
  } catch (err) {
    console.warn('Dashboard data subscription fallback:', err.message);
    emit();
    if (onError) onError(err);
    return () => {};
  }
}
