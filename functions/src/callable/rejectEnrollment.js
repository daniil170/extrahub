import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { promoteFromWaitlist } from '../shared/waitlist.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to reject enrollment via parent invite token
 */
export const rejectEnrollment = onCall(async (request) => {
  try {
    const inviteToken = request.data?.inviteToken || request.data?.token;

    if (!inviteToken || typeof inviteToken !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр inviteToken или token обязателен');
    }

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

    const enrollmentRef = db.collection('enrollments').doc(inviteData.enrollmentId);
    const nowStr = new Date().toISOString();
    let targetGroupId = null;

    await db.runTransaction(async (transaction) => {
      const currentInvite = await transaction.get(inviteDoc.ref);
      if (!currentInvite.exists || currentInvite.data().status !== 'active') {
        throw new HttpsError('failed-precondition', 'Приглашение уже обработано или отозвано');
      }

      const currentEnrollment = await transaction.get(enrollmentRef);
      if (!currentEnrollment.exists) {
        throw new HttpsError('not-found', 'Запись в секцию не найдена');
      }

      const enrData = currentEnrollment.data();
      targetGroupId = enrData.groupId;
      const groupRef = db.collection('activityGroups').doc(targetGroupId);

      // Update enrollment status to cancelled
      transaction.update(enrollmentRef, {
        status: 'cancelled',
        cancelledAt: nowStr,
      });

      // Mark invite as revoked
      transaction.update(inviteDoc.ref, {
        status: 'revoked',
      });

      // Decrement enrolledCount on group
      transaction.update(groupRef, {
        enrolledCount: FieldValue.increment(-1),
      });
    });

    // Promote next student from waitlist if any
    if (targetGroupId) {
      try {
        await promoteFromWaitlist(db, targetGroupId);
      } catch (e) {
        console.error(`Waitlist promotion error after rejection for group ${targetGroupId}:`, e);
      }
    }

    const callerUid = request.auth?.uid;
    await logAuditEvent({
      action: 'enrollment.rejected',
      actorId: callerUid || 'parent-by-token',
      actorRole: 'parent',
      targetId: inviteData.enrollmentId,
      targetType: 'enrollment',
      metadata: {
        studentId: inviteData.studentId,
        inviteId: inviteDoc.id,
        groupId: targetGroupId,
      },
    });

    return {
      success: true,
      status: 'cancelled',
    };
  } catch (err) {
    console.error('rejectEnrollment error:', err);
    await logFunctionError({
      functionName: 'rejectEnrollment',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка отклонения записи: ${err.message}`);
  }
});
