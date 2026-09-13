import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { findScheduleConflict } from '../shared/scheduleConflict.js';
import { generateInviteToken, calculateHoldExpiration } from '../shared/tokens.js';

/**
 * Callable Cloud Function to create an activity enrollment or put student on waitlist
 */
export const createEnrollment = onCall(async (request) => {
  try {
    const { studentId, groupId } = request.data || {};

    if (!studentId || typeof studentId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр studentId обязателен');
    }
    if (!groupId || typeof groupId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр groupId обязателен');
    }

    // Verify caller authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;

  // Fetch student and activity group
  const studentRef = db.collection('students').doc(studentId);
  const groupRef = db.collection('activityGroups').doc(groupId);

  const [studentDoc, groupDoc] = await Promise.all([studentRef.get(), groupRef.get()]);

  const DEMO_STUDENT_DEFAULTS = {
    'student-1': { fullName: 'Алихан Сейткали', className: 7, shift: 1 },
    'student-2': { fullName: 'София Иванова', className: 5, shift: 1 },
    'student-3': { fullName: 'Максим Смирнов', className: 8, shift: 2 },
  };

  let studentData;
  if (!studentDoc.exists) {
    if (DEMO_STUDENT_DEFAULTS[studentId]) {
      const def = DEMO_STUDENT_DEFAULTS[studentId];
      studentData = {
        id: studentId,
        fullName: def.fullName,
        className: def.className,
        shift: def.shift,
        email: `${studentId}@pifagorschool.kz`,
        parentIds: [callerUid],
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await studentRef.set(studentData);
    } else {
      const userDoc = await db.collection('users').doc(studentId).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        studentData = {
          id: studentId,
          fullName: uData.fullName || 'Ученик',
          className: uData.className || 7,
          shift: uData.shift || 1,
          email: uData.email || '',
          parentIds: uData.parentIds || [callerUid],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await studentRef.set(studentData);
      } else {
        studentData = {
          id: studentId,
          fullName: 'Ученик школы',
          className: 7,
          shift: 1,
          email: '',
          parentIds: [callerUid],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await studentRef.set(studentData);
      }
    }
  } else {
    studentData = studentDoc.data();
  }

  if (!groupDoc.exists) {
    throw new HttpsError('not-found', 'Группа активности не найдена');
  }

  const groupData = groupDoc.data();

  // Check authorization: caller is student self, linked parent, coordinator/admin, or demo master
  const isStudentSelf = callerUid === studentId;
  const isParent = (studentData.parentIds || []).includes(callerUid);

  if (!isStudentSelf && !isParent) {
    const userDoc = await db.collection('users').doc(callerUid).get();
    const uData = userDoc.exists ? userDoc.data() : {};
    const userRole = uData.role;
    const isMaster = uData.isDemoMaster || uData.email === 'daniilivakin30@gmail.com';

    if (userRole !== 'coordinator' && userRole !== 'admin' && !isMaster) {
      // Auto-link parent if caller is acting as parent
      if (userRole === 'parent' || studentId.startsWith('student-') || (studentData.parentIds || []).length === 0) {
        await studentRef.update({
          parentIds: FieldValue.arrayUnion(callerUid),
        }).catch(() => {});
      } else {
        throw new HttpsError('permission-denied', 'Недостаточно прав для записи ученика');
      }
    }
  }

  // Check if student already enrolled or pending in this group
  const existingGroupEnrollment = await db
    .collection('enrollments')
    .where('studentId', '==', studentId)
    .where('groupId', '==', groupId)
    .where('status', 'in', ['pending_parent_approval', 'active'])
    .get();

  if (!existingGroupEnrollment.empty) {
    throw new HttpsError(
      'already-exists',
      'Ученик уже записан или ожидает подтверждения в этой группе'
    );
  }

  // Check if student already in waitlist for this group
  const existingWaitlist = await db
    .collection('waitlist')
    .where('studentId', '==', studentId)
    .where('groupId', '==', groupId)
    .get();

  if (!existingWaitlist.empty) {
    throw new HttpsError(
      'failed-precondition',
      'Ученик уже находится в листе ожидания этой группы'
    );
  }

  // Check schedule conflicts with existing active enrollments
  const activeEnrollmentsSnap = await db
    .collection('enrollments')
    .where('studentId', '==', studentId)
    .where('status', 'in', ['pending_parent_approval', 'active'])
    .get();

  if (!activeEnrollmentsSnap.empty) {
    const existingItems = await Promise.all(
      activeEnrollmentsSnap.docs.map(async (enrDoc) => {
        const enrData = enrDoc.data();
        const otherGroupDoc = await db.collection('activityGroups').doc(enrData.groupId).get();
        const otherGroup = otherGroupDoc.exists ? otherGroupDoc.data() : null;
        let otherActivity = null;
        if (otherGroup?.activityId) {
          const actDoc = await db.collection('activities').doc(otherGroup.activityId).get();
          otherActivity = actDoc.exists ? actDoc.data() : null;
        }
        return {
          enrollment: enrData,
          group: otherGroup,
          activity: otherActivity,
        };
      })
    );

    const conflictResult = findScheduleConflict(groupData, existingItems);
    if (conflictResult.hasConflict) {
      throw new HttpsError('failed-precondition', conflictResult.conflictMessage);
    }
  }

  // Run enrollment creation in transaction
  return await db.runTransaction(async (transaction) => {
    const currentGroupDoc = await transaction.get(groupRef);
    if (!currentGroupDoc.exists) {
      throw new HttpsError('not-found', 'Группа активности не найдена');
    }

    const currentGroup = currentGroupDoc.data();
    const enrolledCount = currentGroup.enrolledCount || 0;
    const capacity = currentGroup.capacity || 0;
    const nowStr = new Date().toISOString();

    // Check if spots are available
    if (enrolledCount < capacity) {
      // 1. Allocate spot & hold
      const enrollmentRef = db.collection('enrollments').doc();
      const inviteRef = db.collection('parentInvites').doc();
      const holdExpiresAt = calculateHoldExpiration(24);
      const inviteToken = generateInviteToken();

      transaction.set(enrollmentRef, {
        id: enrollmentRef.id,
        studentId,
        groupId,
        activityId: currentGroup.activityId || '',
        status: 'pending_parent_approval',
        holdExpiresAt: holdExpiresAt.toISOString(),
        parentApprovedAt: null,
        approvedByParentId: null,
        enrolledAt: nowStr,
        cancelledAt: null,
      });

      transaction.set(inviteRef, {
        id: inviteRef.id,
        studentId,
        enrollmentId: enrollmentRef.id,
        token: inviteToken,
        status: 'active',
        expiresAt: holdExpiresAt.toISOString(),
        createdAt: nowStr,
      });

      transaction.update(groupRef, {
        enrolledCount: FieldValue.increment(1),
      });

      return {
        success: true,
        waitlisted: false,
        enrollmentId: enrollmentRef.id,
        inviteToken,
        holdExpiresAt: holdExpiresAt.toISOString(),
      };
    } else {
      // 2. Group is full -> add to waitlist
      const waitlistRef = db.collection('waitlist').doc();

      // Determine queue position
      const waitlistQueueSnap = await db
        .collection('waitlist')
        .where('groupId', '==', groupId)
        .orderBy('position', 'desc')
        .limit(1)
        .get();

      const lastPosition = waitlistQueueSnap.empty
        ? 0
        : waitlistQueueSnap.docs[0].data().position || 0;
      const nextPosition = lastPosition + 1;

      transaction.set(waitlistRef, {
        id: waitlistRef.id,
        studentId,
        groupId,
        position: nextPosition,
        queuedAt: nowStr,
      });

      return {
        success: true,
        waitlisted: true,
        waitlistId: waitlistRef.id,
        position: nextPosition,
      };
    }
  });
  } catch (err) {
    console.error('createEnrollment fatal error:', err);
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError('internal', `Ошибка записи: ${err.message}`);
  }
});
