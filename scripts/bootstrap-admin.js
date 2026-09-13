/**
 * ExtraHub — Admin Bootstrap Script
 *
 * Creates or updates the first administrator account in Firebase Auth
 * with custom claim { role: 'admin' } and sets their document in Firestore 'users'.
 *
 * Usage:
 *   node scripts/bootstrap-admin.js [email] [password]
 * Or via env variables:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/bootstrap-admin.js
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'extrahub-c95af';

const app = getApps().length === 0 ? initializeApp({ projectId: PROJECT_ID }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

async function main() {
  const email = (
    process.argv[2] ||
    process.env.ADMIN_EMAIL ||
    'daniilivakin30@gmail.com'
  ).trim().toLowerCase();

  const password = (
    process.argv[3] ||
    process.env.ADMIN_PASSWORD ||
    generateSecurePassword(16)
  ).trim();

  console.log('====================================================');
  console.log('  🚀 ExtraHub — Initial Admin Bootstrap');
  console.log(`  Target Project: [${PROJECT_ID}]`);
  console.log(`  Admin Email:    [${email}]`);
  console.log('====================================================\n');

  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`ℹ️  User already exists with UID: ${userRecord.uid}. Updating credentials and claims...`);
    userRecord = await auth.updateUser(userRecord.uid, {
      password,
      displayName: 'Даниил Ивакин (Администратор)',
      emailVerified: true,
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('➕ Creating new user in Firebase Auth...');
      userRecord = await auth.createUser({
        email,
        password,
        displayName: 'Даниил Ивакин (Администратор)',
        emailVerified: true,
      });
    } else {
      throw err;
    }
  }

  // 1. Assign custom claim { role: 'admin' }
  console.log(`🔑 Setting custom claim { role: 'admin' } on UID: ${userRecord.uid}...`);
  await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

  // 2. Set/update Firestore document in 'users' collection
  console.log(`📝 Writing Firestore document in 'users/${userRecord.uid}'...`);
  const adminDocData = {
    id: userRecord.uid,
    email,
    fullName: userRecord.displayName || 'Даниил Ивакин (Администратор)',
    role: 'admin',
    status: 'active',
    phone: '+7 (701) 000-00-01',
    createdAt: userRecord.metadata?.creationTime || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection('users').doc(userRecord.uid).set(adminDocData, { merge: true });

  console.log('\n====================================================');
  console.log('  🎉 Администратор успешно создан и активирован!');
  console.log('====================================================');
  console.log(`  Email:            ${email}`);
  console.log(`  Временный пароль: ${password}`);
  console.log(`  Роль (claim):     admin`);
  console.log(`  UID:              ${userRecord.uid}`);
  console.log('----------------------------------------------------');
  console.log('  Инструкция:');
  console.log('  1. Откройте страницу входа в приложении: /login');
  console.log('  2. Введите указанные выше email и пароль');
  console.log('  3. После входа вы сразу получите права администратора');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Ошибка создания администратора:', err);
  process.exit(1);
});
