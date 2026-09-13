import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
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
    if (t?.id) teacherMap[t.id] = t.fullName || t.name;
  });

  return (rawEnrollments || []).map((enr) => {
    const group = grpMap[enr.groupId] || null;
    const actId = enr.activityId || group?.activityId;
    const activity = actMap[actId] || null;
    const teacherId = activity?.teacherId || group?.teacherId;
    const teacherName =
      teacherMap[teacherId] ||
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
  const teachersList = [];

  function emit() {
    // 1. Resolve children
    const finalChildren =
      role === 'parent'
        ? childrenList || []
        : [
            {
              id: studentId || userId || 'student-1',
              fullName: 'Мой профиль',
              className: '',
            },
          ];

    // 2. Resolve enrollments
    const rawEnr = enrollmentsList || [];
    const acts = activitiesList || [];
    const grps = groupsList || [];
    const tchrs = teachersList || [];

    const enrichedEnrollments = enrichEnrollments(rawEnr, acts, grps, tchrs);

    // 3. Resolve payments
    const finalPayments = paymentsList || [];

    onUpdate({
      children: finalChildren,
      enrollments: enrichedEnrollments,
      payments: finalPayments,
    });
  }

  const unsubs = [];

  try {
    // 1. Children subscription for parent
    if (role === 'parent' && userId) {
      const parentQ = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('parentIds', 'array-contains', userId)
      );
      const unsubChildren = onSnapshot(
        parentQ,
        (snap) => {
          childrenList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          emit();
        },
        (err) => {
          if (err.code !== 'permission-denied') {
            console.error('Children snapshot error:', err);
          }
          childrenList = [];
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
          enrollmentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          emit();
        },
        (err) => {
          if (err.code !== 'permission-denied') {
            console.error('Enrollments snapshot error:', err);
          }
          enrollmentsList = [];
          emit();
        }
      );
      unsubs.push(unsubEnr);

      // 3. Payments subscription
      const payQ = query(collection(db, COLLECTIONS.PAYMENTS), where('studentId', '==', studentId));
      const unsubPay = onSnapshot(
        payQ,
        (snap) => {
          paymentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          emit();
        },
        (err) => {
          if (err.code !== 'permission-denied') {
            console.error('Payments snapshot error:', err);
          }
          paymentsList = [];
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
      (err) => {
        console.error('Activities snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubActs);

    const unsubGrps = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snap) => {
        groupsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Groups snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubGrps);

    return () => {
      unsubs.forEach((fn) => fn && fn());
    };
  } catch (err) {
    console.error('Dashboard data subscription error:', err);
    emit();
    if (onError) onError(err);
    return () => {};
  }
}

