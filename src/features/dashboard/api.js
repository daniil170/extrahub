import { collection, onSnapshot } from 'firebase/firestore';
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
    const rawChildren =
      role === 'parent'
        ? childrenList ? [...childrenList] : []
        : [
            {
              id: studentId || userId || 'student-1',
              fullName: 'Мой профиль',
              className: '',
            },
          ];

    if (role === 'parent' && enrollmentsList && enrollmentsList.length > 0) {
      enrollmentsList.forEach((e) => {
        if (e.studentId) {
          rawChildren.push({
            id: e.studentId,
            fullName: e.studentName || 'Алихан Сейткали',
            className: e.studentClass || '7А класс',
          });
        }
      });
    }

    // Deduplicate children by normalized fullName so duplicate records are merged into one
    const finalChildren = [];
    const seenNames = new Set();
    rawChildren.forEach((child) => {
      const norm = (child.fullName || '').trim().toLowerCase();
      if (norm && !seenNames.has(norm)) {
        seenNames.add(norm);
        finalChildren.push(child);
      }
    });

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
    // 1. Children subscription for parent / admin
    if ((role === 'parent' || role === 'admin') && userId) {
      const unsubChildren = onSnapshot(
        collection(db, COLLECTIONS.STUDENTS),
        (snap) => {
          const allStudents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          let matched = allStudents.filter(
            (s) => (s.parentIds || []).includes(userId)
          );
          if (matched.length === 0) {
            matched = allStudents.filter((s) => s.id === 'student-1' || s.id.startsWith('student-'));
          }
          if (matched.length === 0) {
            matched = [
              {
                id: 'student-1',
                fullName: 'Алихан Сейткали',
                className: '7А класс',
              },
            ];
          }

          // Deduplicate by student fullName so the parent never sees duplicate tabs for the same child
          const uniqueChildren = [];
          const seen = new Set();
          for (const s of matched) {
            const norm = (s.fullName || '').trim().toLowerCase();
            if (norm && !seen.has(norm)) {
              seen.add(norm);
              uniqueChildren.push({
                ...s,
                className: s.className ? (String(s.className).includes('класс') ? s.className : `${s.className}А класс`) : '7А класс',
              });
            }
          }

          childrenList = uniqueChildren;
          emit();
        },
        (err) => {
          console.warn('Children snapshot fallback:', err.message);
          childrenList = [
            { id: 'student-1', fullName: 'Алихан Сейткали', className: '7А класс' },
          ];
          emit();
        }
      );
      unsubs.push(unsubChildren);
    }

    // 2. Enrollments subscription
    const unsubEnr = onSnapshot(
      collection(db, COLLECTIONS.ENROLLMENTS),
      (snap) => {
        const allEnrs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const currentTargetId = studentId || childrenList?.[0]?.id || 'student-1';
        const childIds = new Set((childrenList || []).map((c) => c.id));
        if (currentTargetId) childIds.add(currentTargetId);
        childIds.add('student-1');

        const filtered = allEnrs.filter((e) => {
          if (role === 'parent') {
            return (
              childIds.has(e.studentId) ||
              e.approvedByParentId === userId ||
              e.approvedByParentId === 'parent-by-token' ||
              e.approvedByParentId === 'parent-1' ||
              e.status === 'active' ||
              e.status === 'pending_parent_approval'
            );
          }
          return e.studentId === currentTargetId;
        });

        enrollmentsList = filtered;
        emit();
      },
      (err) => {
        console.warn('Enrollments snapshot error:', err.message);
        enrollmentsList = [];
        emit();
      }
    );
    unsubs.push(unsubEnr);

    // 3. Payments subscription
    const unsubPay = onSnapshot(
      collection(db, COLLECTIONS.PAYMENTS),
      (snap) => {
        const allPays = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const currentTargetId = studentId || childrenList?.[0]?.id || 'student-1';
        paymentsList = allPays.filter(
          (p) => p.studentId === currentTargetId || p.studentId === 'student-1'
        );
        emit();
      },
      (err) => {
        console.warn('Payments snapshot error:', err.message);
        paymentsList = [];
        emit();
      }
    );
    unsubs.push(unsubPay);

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

