import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { promoteFromWaitlist } from '../shared/waitlist.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function for a parent, student or coordinator to cancel an existing enrollment
 */
export const cancelEnrollment = onCall(async (request) => {
  try {
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
    const callerClaims = request.auth.token || {};
    const callerEmail = (callerClaims.email || '').trim().toLowerCase();

    const userDoc = await db.collection('users').doc(callerUid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const userRole = callerClaims.role || userData.role;

    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'pifagorschool.kz';
    const isDemoEmail =
      callerEmail.startsWith('demo.') &&
      (callerEmail.endsWith('@pifagorschool.kz') || callerEmail.endsWith(`@${allowedDomain}`));
    const isDemoMaster = Boolean(callerClaims.isDemoMaster) || callerEmail === 'daniilivakin30@gmail.com' || isDemoEmail;
    const isStaff = userRole === 'coordinator' || userRole === 'admin' || isDemoMaster;

    const isStudentSelf = callerUid === enrData.studentId;

    const parentIds = studentData.parentIds || [];
    const isParent =
      userRole === 'parent' ||
      parentIds.includes(callerUid) ||
      (parentIds.includes('parent-1') && (userRole === 'parent' || isDemoEmail)) ||
      enrData.approvedByParentId === callerUid ||
      enrData.approvedByParentId === 'parent-by-token' ||
      enrData.approvedByParentId === 'parent-1' ||
      enrData.parentId === callerUid ||
      (callerEmail && (enrData.parentEmail === callerEmail || studentData.parentEmail === callerEmail));

    if (!isStudentSelf && !isParent && !isStaff) {
      throw new HttpsError('permission-denied', 'Недостаточно прав для отмены записи');
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

    // Log audit event
    await logAuditEvent({
      action: 'enrollment.cancelled',
      actorId: callerUid,
      actorRole: userRole || (isStudentSelf ? 'student' : isParent ? 'parent' : 'staff'),
      actorName: userData.fullName || callerEmail || 'Пользователь',
      targetId: enrollmentId,
      targetType: 'enrollment',
      metadata: {
        studentId: enrData.studentId,
        groupId,
        previousStatus: enrData.status,
      },
    });

    return {
      success: true,
      status: 'cancelled',
    };
  } catch (err) {
    console.error('cancelEnrollment error:', err);
    await logFunctionError({
      functionName: 'cancelEnrollment',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка отмены записи: ${err.message}`);
  }
});
