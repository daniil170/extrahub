import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db, auth } from '../config/firebase.js';

/**
 * Callable Cloud Function to approve enrollment via parent invite token
 */
export const approveEnrollment = onCall(async (request) => {
  const inviteToken = request.data?.inviteToken || request.data?.token;

  if (!inviteToken || typeof inviteToken !== 'string') {
    throw new HttpsError('invalid-argument', 'Параметр inviteToken или token обязателен');
  }

  // Lookup invite by token
  const inviteQuery = await db
    .collection('parentInvites')
    .where('token', '==', inviteToken)
    .limit(1)
    .get();

  if (inviteQuery.empty) {
    throw new HttpsError('not-found', 'Приглашение не найдено');
  }

  const inviteDoc = inviteQuery.docs[0];
  const inviteData = inviteDoc.data();

  if (inviteData.status !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      `Приглашение не активно (статус: ${inviteData.status})`
    );
  }

  const now = new Date();
  const expiresAt = new Date(inviteData.expiresAt);
  if (expiresAt <= now) {
    throw new HttpsError('failed-precondition', 'Срок действия приглашения истёк');
  }

  const enrollmentRef = db.collection('enrollments').doc(inviteData.enrollmentId);
  const nowStr = now.toISOString();
  const parentId = request.auth ? request.auth.uid : 'parent-by-token';

  // Execute approval in transaction
  await db.runTransaction(async (transaction) => {
    const currentInvite = await transaction.get(inviteDoc.ref);
    if (!currentInvite.exists || currentInvite.data().status !== 'active') {
      throw new HttpsError('failed-precondition', 'Приглашение уже было использовано или отозвано');
    }

    const currentEnrollment = await transaction.get(enrollmentRef);
    if (!currentEnrollment.exists) {
      throw new HttpsError('not-found', 'Запись в секцию не найдена');
    }

    const enrData = currentEnrollment.data();
    if (enrData.status !== 'pending_parent_approval') {
      throw new HttpsError(
        'failed-precondition',
        `Невозможно подтвердить запись в статусе: ${enrData.status}`
      );
    }

    // Update enrollment status to active
    transaction.update(enrollmentRef, {
      status: 'active',
      parentApprovedAt: nowStr,
      approvedByParentId: parentId,
    });

    // Mark invite as accepted
    transaction.update(inviteDoc.ref, {
      status: 'accepted',
    });
  });

  // Link parent account if authenticated
  if (request.auth) {
    const callerUid = request.auth.uid;
    const studentRef = db.collection('students').doc(inviteData.studentId);
    const studentDoc = await studentRef.get();

    if (studentDoc.exists) {
      const currentParents = studentDoc.data().parentIds || [];
      if (!currentParents.includes(callerUid)) {
        await studentRef.update({
          parentIds: FieldValue.arrayUnion(callerUid),
        });
      }
    }

    // Ensure user profile has parent role or claims
    try {
      const userRef = db.collection('users').doc(callerUid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const currentRole = userDoc.data().role;
        if (!currentRole || currentRole === 'student') {
          await userRef.update({ role: 'parent' });
          await auth.setCustomUserClaims(callerUid, { role: 'parent' });
        }
      }
    } catch (e) {
      console.warn('Could not set parent custom claims:', e.message);
    }
  }

  return {
    success: true,
    enrollmentId: inviteData.enrollmentId,
    status: 'active',
  };
});
