import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { generateInviteToken } from '../shared/tokens.js';

/**
 * Callable Cloud Function to create a staff invitation (Coordinator or Teacher)
 * Admin can invite Coordinators and Teachers.
 * Coordinators can invite Teachers (tied to a specific activityId).
 */
export const createStaffInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется авторизация');
  }

  const callerUid = request.auth.uid;
  let callerRole = request.auth.token?.role;

  if (!callerRole) {
    const callerDoc = await db.collection('users').doc(callerUid).get();
    callerRole = callerDoc.exists ? callerDoc.data()?.role : null;
  }

  const { targetRole, email, activityId } = request.data || {};

  if (!targetRole || !['coordinator', 'teacher', 'technician'].includes(targetRole)) {
    throw new HttpsError(
      'invalid-argument',
      'Параметр targetRole должен быть "coordinator", "teacher" или "technician"'
    );
  }

  // Permission checks
  if (targetRole === 'coordinator' && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Только администратор может приглашать координатора');
  }

  if (targetRole === 'technician' && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Только администратор может приглашать техника');
  }

  if (targetRole === 'teacher') {
    if (callerRole !== 'coordinator' && callerRole !== 'admin') {
      throw new HttpsError(
        'permission-denied',
        'Только координатор или администратор может приглашать преподавателя'
      );
    }
    if (!activityId) {
      throw new HttpsError(
        'invalid-argument',
        'Для приглашения преподавателя необходимо указать кружок (activityId)'
      );
    }

    // Verify activity exists
    const actDoc = await db.collection('activities').doc(activityId).get();
    if (!actDoc.exists) {
      throw new HttpsError('not-found', 'Указанный кружок не найден');
    }
  }

  const trimmedEmail = email ? String(email).trim().toLowerCase() : null;
  const token = generateInviteToken(24);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const inviteData = {
    token,
    targetRole,
    email: trimmedEmail,
    relatedEntityId: targetRole === 'teacher' ? activityId : null,
    status: 'active',
    expiresAt,
    createdBy: callerUid,
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection('invites').add(inviteData);

  return {
    success: true,
    inviteId: docRef.id,
    token,
    inviteUrl: `/staff-invite/${token}`,
    targetRole,
    email: trimmedEmail,
    expiresAt,
  };
});
