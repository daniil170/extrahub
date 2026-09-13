import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../config/firebase.js';

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'pifagorschool.kz';

/**
 * Callable Cloud Function to register staff account (Coordinator / Teacher) via invite token
 */
export const registerViaInvite = onCall(async (request) => {
  const { inviteToken, email, password, fullName } = request.data || {};

  if (!inviteToken || typeof inviteToken !== 'string') {
    throw new HttpsError('invalid-argument', 'Параметр inviteToken обязателен');
  }

  if (!email || !password) {
    throw new HttpsError('invalid-argument', 'Email и пароль обязательны');
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Пароль должен содержать не менее 6 символов');
  }

  const trimmedEmail = String(email).trim().toLowerCase();

  // Find invite
  const inviteQuery = await db
    .collection('invites')
    .where('token', '==', inviteToken)
    .limit(1)
    .get();

  if (inviteQuery.empty) {
    throw new HttpsError('not-found', 'Приглашение не найдено или недействительно');
  }

  const inviteDoc = inviteQuery.docs[0];
  const invite = inviteDoc.data();

  if (invite.status !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      `Приглашение уже использовано или отозвано (статус: ${invite.status})`
    );
  }

  if (new Date(invite.expiresAt) <= new Date()) {
    throw new HttpsError('failed-precondition', 'Срок действия приглашения истёк');
  }

  // If invite had a specific target email, verify exact match
  if (invite.email && invite.email.toLowerCase() !== trimmedEmail) {
    throw new HttpsError(
      'invalid-argument',
      `Это приглашение предназначено для адреса ${invite.email}`
    );
  }

  // Domain check for school staff (if not explicitly exempted by pre-set invite email)
  const isSchoolDomain = trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
  if (!isSchoolDomain && (!invite.email || !invite.email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`))) {
    throw new HttpsError(
      'invalid-argument',
      `Регистрация сотрудников возможна только с корпоративной почтой @${ALLOWED_EMAIL_DOMAIN}`
    );
  }

  // 1. Create Firebase Auth user
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: trimmedEmail,
      password: String(password),
      displayName: fullName ? String(fullName).trim() : trimmedEmail.split('@')[0],
      emailVerified: true,
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Пользователь с таким email уже зарегистрирован');
    }
    throw new HttpsError('internal', `Ошибка создания аккаунта: ${err.message}`);
  }

  const targetRole = invite.targetRole;
  const userFullName = fullName ? String(fullName).trim() : trimmedEmail.split('@')[0];

  // 2. Set Custom User Claims
  await auth.setCustomUserClaims(userRecord.uid, { role: targetRole });

  // 3. Create document in 'users' collection
  await db.collection('users').doc(userRecord.uid).set({
    id: userRecord.uid,
    email: trimmedEmail,
    fullName: userFullName,
    role: targetRole,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 4. If Teacher, bind to related activity
  if (targetRole === 'teacher' && invite.relatedEntityId) {
    try {
      const actRef = db.collection('activities').doc(invite.relatedEntityId);
      const actDoc = await actRef.get();
      if (actDoc.exists) {
        await actRef.update({
          teacherId: userRecord.uid,
          teacherName: userFullName,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not bind teacher to activity:', e);
    }
  }

  // 5. Mark invite accepted
  await inviteDoc.ref.update({
    status: 'accepted',
    acceptedBy: userRecord.uid,
    acceptedAt: new Date().toISOString(),
  });

  return {
    success: true,
    userId: userRecord.uid,
    role: targetRole,
    email: trimmedEmail,
  };
});
