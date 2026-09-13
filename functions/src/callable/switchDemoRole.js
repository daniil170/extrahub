import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../config/firebase.js';

const DEMO_MASTER_EMAIL = (process.env.DEMO_MASTER_EMAIL || 'daniilivakin30@gmail.com').trim().toLowerCase();

const ROLE_DEMO_ACCOUNTS = {
  student: {
    email: 'demo.student@pifagorschool.kz',
    fullName: 'Алихан Сейткали (Демо Ученик)',
    className: 7,
    shift: 1,
  },
  parent: {
    email: 'demo.parent@pifagorschool.kz',
    fullName: 'Бахыт Сейткали (Демо Родитель)',
  },
  teacher: {
    email: 'demo.teacher@pifagorschool.kz',
    fullName: 'Михаил Сергеевич Петров (Демо Преподаватель)',
  },
  coordinator: {
    email: 'demo.coordinator@pifagorschool.kz',
    fullName: 'Сауле Ахметова (Демо Координатор)',
  },
  technician: {
    email: 'demo.technician@pifagorschool.kz',
    fullName: 'Серикбаев Болат (Демо Техник)',
  },
  admin: {
    email: 'demo.admin@pifagorschool.kz',
    fullName: 'Администрация Школы (Демо)',
  },
};

const VALID_ROLES = ['student', 'parent', 'teacher', 'coordinator', 'technician', 'admin', 'master'];

/**
 * Callable Cloud Function to switch between demo roles instantaneously
 * for the project master account.
 */
export const switchDemoRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется авторизация');
  }

  const callerClaims = request.auth.token || {};
  const callerEmail = (callerClaims.email || '').trim().toLowerCase();
  const isDemoMaster = Boolean(callerClaims.isDemoMaster) || callerEmail === DEMO_MASTER_EMAIL;

  if (!isDemoMaster) {
    throw new HttpsError(
      'permission-denied',
      'Доступ запрещен. Переключение демо-ролей разрешено только мастер-аккаунту ExtraHub'
    );
  }

  const { targetRole } = request.data || {};

  if (!targetRole || !VALID_ROLES.includes(targetRole)) {
    throw new HttpsError(
      'invalid-argument',
      `Параметр targetRole должен быть одним из: ${VALID_ROLES.join(', ')}`
    );
  }

  let targetEmail;
  let targetDisplayName;
  let targetRoleName;
  let extraUserData = {};

  if (targetRole === 'master') {
    targetEmail = DEMO_MASTER_EMAIL;
    targetDisplayName = 'Даниил Ивакин (Владелец / Мастер)';
    targetRoleName = 'admin';
  } else {
    const info = ROLE_DEMO_ACCOUNTS[targetRole];
    targetEmail = info.email;
    targetDisplayName = info.fullName;
    targetRoleName = targetRole;
    extraUserData = {
      className: info.className || null,
      shift: info.shift || null,
      isDemoAccount: true,
    };
  }

  // 1. Locate or lazily provision target user in Firebase Auth
  let targetUser;
  try {
    targetUser = await auth.getUserByEmail(targetEmail);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      targetUser = await auth.createUser({
        email: targetEmail,
        password: 'DemoRole2026!#',
        displayName: targetDisplayName,
        emailVerified: true,
      });

      // Ensure Firestore document exists
      await db.collection('users').doc(targetUser.uid).set({
        id: targetUser.uid,
        email: targetEmail,
        fullName: targetDisplayName,
        role: targetRoleName,
        status: 'active',
        isDemoMaster: targetRole === 'master',
        ...extraUserData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      throw new HttpsError('internal', `Ошибка поиска демо-пользователя: ${err.message}`);
    }
  }

  // 2. Build custom token with { isDemoMaster: true, role: targetRoleName }
  // This allows the switched session to maintain isDemoMaster claim
  // so the user can continue switching roles without permission-denied.
  const customClaims = {
    role: targetRoleName,
    isDemoMaster: true,
    isSwitchedDemo: targetRole !== 'master',
  };

  const customToken = await auth.createCustomToken(targetUser.uid, customClaims);

  return {
    success: true,
    customToken,
    targetRole,
    effectiveRole: targetRoleName,
    email: targetEmail,
    uid: targetUser.uid,
  };
});
