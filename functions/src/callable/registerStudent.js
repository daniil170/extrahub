import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../config/firebase.js';

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'pifagorschool.kz';
const DEMO_MASTER_EMAIL = (process.env.DEMO_MASTER_EMAIL || 'daniilivakin30@gmail.com').trim().toLowerCase();

/**
 * Callable Cloud Function for self-registration of students.
 * Enforces @pifagorschool.kz email domain, sets 'student' custom claims,
 * and initializes both 'users' and 'students' Firestore records.
 */
export const registerStudent = onCall(async (request) => {
  const { email, password, fullName, className, shift } = request.data || {};

  if (!email || !password) {
    throw new HttpsError('invalid-argument', 'Email и пароль обязательны');
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedName = fullName ? String(fullName).trim() : '';

  if (!trimmedName) {
    throw new HttpsError('invalid-argument', 'Укажите ваше имя и фамилию (ФИО)');
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Пароль должен содержать не менее 6 символов');
  }

  // Enforce allowed email domain, with exception for demo master account
  const isMasterEmail = trimmedEmail === DEMO_MASTER_EMAIL;
  if (!isMasterEmail && !trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    throw new HttpsError(
      'invalid-argument',
      `Регистрация учеников разрешена только с корпоративной школьной почтой @${ALLOWED_EMAIL_DOMAIN}`
    );
  }

  const parsedClass = className !== undefined && className !== null && className !== ''
    ? Number(className)
    : 7;
  const parsedShift = Number(shift) === 2 ? 2 : 1;

  // 1. Create user in Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: trimmedEmail,
      password: String(password),
      displayName: trimmedName,
      emailVerified: true,
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Пользователь с таким email уже зарегистрирован');
    }
    throw new HttpsError('internal', `Ошибка создания аккаунта: ${err.message}`);
  }

  // 2. Set Custom User Claims: student
  await auth.setCustomUserClaims(userRecord.uid, { role: 'student' });

  const now = new Date().toISOString();

  // 3. Create document in 'users' collection
  await db.collection('users').doc(userRecord.uid).set({
    id: userRecord.uid,
    email: trimmedEmail,
    fullName: trimmedName,
    role: 'student',
    className: parsedClass,
    shift: parsedShift,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  // 4. Create document in 'students' collection
  await db.collection('students').doc(userRecord.uid).set({
    id: userRecord.uid,
    fullName: trimmedName,
    className: parsedClass,
    shift: parsedShift,
    email: trimmedEmail,
    parentIds: [],
    status: 'active',
    createdAt: now,
  });

  return {
    success: true,
    userId: userRecord.uid,
    role: 'student',
    email: trimmedEmail,
  };
});
