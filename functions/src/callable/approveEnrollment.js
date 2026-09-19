import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db, auth } from '../config/firebase.js';
import { awardPoints, GAMIFICATION_CONFIG } from '../shared/gamification.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to approve enrollment via parent invite token
 */
export const approveEnrollment = onCall(async (request) => {
  try {
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
    const callerUid = request.auth?.uid;
    if (inviteData.studentId) {
      const studentRef = db.collection('students').doc(inviteData.studentId);
      const parentIdsToAdd = ['parent-1'];
      if (callerUid) parentIdsToAdd.push(callerUid);

      await studentRef.set({
        id: inviteData.studentId,
        parentIds: FieldValue.arrayUnion(...parentIdsToAdd),
        status: 'active',
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch((e) => console.warn('Could not link parent to student:', e.message));

      if (callerUid) {
        try {
          const userRef = db.collection('users').doc(callerUid);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const isMaster = userData.isDemoMaster || callerUid === 'daniilivakin30@gmail.com';
            if (!isMaster) {
              const currentRole = userData.role;
              if (!currentRole) {
                await userRef.update({ role: 'parent' });
                await auth.setCustomUserClaims(callerUid, { role: 'parent' });
              }
            }
          }
        } catch (e) {
          console.warn('Could not check parent user profile:', e.message);
        }
      }
    }

    // Fast Parent Approval Gamification Bonus (within 6 hours of invite creation)
    let quickApprovalBonusAwarded = false;
    if (inviteData.studentId) {
      try {
        const inviteCreatedAt = inviteData.createdAt ? new Date(inviteData.createdAt) : null;
        const diffHours = inviteCreatedAt ? (now.getTime() - inviteCreatedAt.getTime()) / (1000 * 60 * 60) : 0;
        
        // If approved within first 6 hours of creation
        if (diffHours >= 0 && diffHours <= 6) {
          const awardRes = await awardPoints({
            userId: inviteData.studentId,
            amount: GAMIFICATION_CONFIG.PARENT_QUICK_APPROVAL_COINS,
            currencyType: 'coin',
            source: 'parent_quick_approval',
            sourceRefId: inviteData.enrollmentId,
            reason: 'Бонус за быстрое подтверждение родителем (в течение 6 часов)',
            createdBy: 'system',
            metadata: {
              enrollmentId: inviteData.enrollmentId,
              inviteId: inviteDoc.id,
              hoursToApprove: Number(diffHours.toFixed(2)),
            },
          });
          quickApprovalBonusAwarded = Boolean(awardRes.awarded);
        }
      } catch (gamifyErr) {
        console.warn('Could not process parent quick approval gamification reward:', gamifyErr.message);
      }
    }

    // Log audit event
    await logAuditEvent({
      action: 'enrollment.approved',
      actorId: callerUid || 'parent-by-token',
      actorRole: 'parent',
      targetId: inviteData.enrollmentId,
      targetType: 'enrollment',
      metadata: {
        studentId: inviteData.studentId,
        inviteId: inviteDoc.id,
      },
    });

    return {
      success: true,
      enrollmentId: inviteData.enrollmentId,
      status: 'active',
    };
  } catch (err) {
    console.error('approveEnrollment error:', err);
    await logFunctionError({
      functionName: 'approveEnrollment',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка подтверждения записи: ${err.message}`);
  }
});
