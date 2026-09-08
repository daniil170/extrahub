import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { promoteFromWaitlist } from '../shared/waitlist.js';

/**
 * Callable Cloud Function for a parent, student or coordinator to cancel an existing enrollment
 */
export const cancelEnrollment = onCall(async (request) => {
  const { enrollmentId } = request.data || {};

  if (!enrollmentId || typeof enrollmentId !== 'string') {
    throw new HttpsError('invalid-argument', 'Параметр enrollmentId обязателен');
  }

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется аутентификация');
  }

  const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
  const enrollmentDoc = await enrollmentRef.get();

  if (!enrollmentDoc.exists) {
    throw new HttpsError('not-found', 'Запись в секцию не найдена');
  }

  const enrData = enrollmentDoc.data();
  if (enrData.status === 'cancelled' || enrData.status === 'cancelled_by_timeout') {
    throw new HttpsError('failed-precondition', 'Запись уже отменена');
  }

  const studentRef = db.collection('students').doc(enrData.studentId);
  const studentDoc = await studentRef.get();
  const studentData = studentDoc.exists ? studentDoc.data() : {};

  // Check permissions: parent, student themselves, or coordinator/admin
  const callerUid = request.auth.uid;
  const isStudentSelf = callerUid === enrData.studentId;
  const isParent = (studentData.parentIds || []).includes(callerUid);

  if (!isStudentSelf && !isParent) {
    const userDoc = await db.collection('users').doc(callerUid).get();
    const role = userDoc.exists ? userDoc.data().role : null;
    if (role !== 'coordinator' && role !== 'admin') {
      throw new HttpsError('permission-denied', 'Недостаточно прав для отмены записи');
    }
  }

  const groupId = enrData.groupId;
  const groupRef = db.collection('activityGroups').doc(groupId);
  const nowStr = new Date().toISOString();

  // Find any active invite linked to this enrollment
  const inviteSnap = await db
    .collection('parentInvites')
    .where('enrollmentId', '==', enrollmentId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  await db.runTransaction(async (transaction) => {
    const currentEnr = await transaction.get(enrollmentRef);
    if (!currentEnr.exists || currentEnr.data().status === 'cancelled') {
      throw new HttpsError('failed-precondition', 'Запись уже была отменена');
    }

    // Cancel enrollment
    transaction.update(enrollmentRef, {
      status: 'cancelled',
      cancelledAt: nowStr,
    });

    // Revoke pending invite if any
    if (!inviteSnap.empty) {
      transaction.update(inviteSnap.docs[0].ref, {
        status: 'revoked',
      });
    }

    // Decrement enrolledCount
    transaction.update(groupRef, {
      enrolledCount: FieldValue.increment(-1),
    });
  });

  // Promote next student from waitlist if any
  try {
    await promoteFromWaitlist(db, groupId);
  } catch (e) {
    console.error(`Waitlist promotion error after cancellation for group ${groupId}:`, e);
  }

  return {
    success: true,
    status: 'cancelled',
  };
});
