import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../config/firebase.js';

const DEMO_MASTER_EMAIL = (process.env.DEMO_MASTER_EMAIL || 'daniilivakin30@gmail.com').trim().toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoRole2026!#';

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
  const isDemoEmail = callerEmail.startsWith('demo.') && callerEmail.endsWith('@pifagorschool.kz');
  const isDemoMaster = Boolean(callerClaims.isDemoMaster) || callerEmail === DEMO_MASTER_EMAIL || isDemoEmail;

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
        password: DEMO_PASSWORD,
        displayName: targetDisplayName,
        emailVerified: true,
      });
    } else {
      console.error('Error finding user by email:', err);
      throw new HttpsError('internal', `Ошибка поиска демо-пользователя: ${err.message}`);
    }
  }

  // Ensure password and display name for demo role accounts
  if (targetRole !== 'master') {
    try {
      await auth.updateUser(targetUser.uid, {
        password: DEMO_PASSWORD,
        displayName: targetDisplayName,
      });
    } catch (pwErr) {
      console.warn('Could not sync demo password:', pwErr.message);
    }
  }

  // 2. Ensure Firestore document exists
  try {
    await db.collection('users').doc(targetUser.uid).set({
      id: targetUser.uid,
      email: targetEmail,
      fullName: targetDisplayName,
      role: targetRoleName,
      status: 'active',
      isDemoMaster: true,
      isDemoAccount: targetRole !== 'master',
      ...extraUserData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (targetRole === 'student') {
      await db.collection('students').doc(targetUser.uid).set({
        id: targetUser.uid,
        fullName: targetDisplayName,
        className: 7,
        shift: 1,
        email: targetEmail,
        parentIds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (targetRole === 'teacher') {
      const grpsSnap = await db.collection('activityGroups').where('teacherId', '==', 'teacher-1').get();
      if (!grpsSnap.empty) {
        const batch = db.batch();
        grpsSnap.docs.forEach((d) => {
          batch.set(d.ref, { teacherId: targetUser.uid }, { merge: true });
        });
        await batch.commit().catch(() => {});
      }
    }
  } catch (fsErr) {
    console.error('Error writing demo user profile to Firestore:', fsErr);
    throw new HttpsError('internal', `Ошибка создания профиля пользователя: ${fsErr.message}`);
  }

  // 3. Build custom token if possible, or provide password fallback
  let customToken = null;
  try {
    const customClaims = {
      role: targetRoleName,
      isDemoMaster: true,
      isSwitchedDemo: targetRole !== 'master',
    };
    customToken = await auth.createCustomToken(targetUser.uid, customClaims);
  } catch (tokenErr) {
    console.warn('createCustomToken failed (fallback to email/password will be used):', tokenErr.message);
  }

  return {
    success: true,
    customToken,
    email: targetEmail,
    password: targetRole === 'master' ? null : DEMO_PASSWORD,
    targetRole,
    effectiveRole: targetRoleName,
    uid: targetUser.uid,
  };
});
