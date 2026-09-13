/**
 * ExtraHub — Demo Master Account & Demo Roles Bootstrap Script
 *
 * 1. Creates or updates the master account (daniilivakin30@gmail.com) in Firebase Auth
 *    with custom claim { role: 'admin', isDemoMaster: true } and Firestore record in 'users'.
 * 2. Ensures demo accounts for each role (student, parent, teacher, coordinator, technician, admin)
 *    exist in Firebase Auth & Firestore for seamless role switching.
 *
 * Usage:
 *   node scripts/bootstrap-demo-master.js [password]
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'extrahub-c95af';

const app = getApps().length === 0 ? initializeApp({ projectId: PROJECT_ID }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const MASTER_EMAIL = (process.env.DEMO_MASTER_EMAIL || 'daniilivakin30@gmail.com').trim().toLowerCase();
const MASTER_PASSWORD = process.argv[2] || process.env.DEMO_MASTER_PASSWORD || 'MasterDemo2026!#';

const DEMO_ACCOUNTS = [
  {
    role: 'student',
    email: 'demo.student@pifagorschool.kz',
    password: 'DemoStudent2026!#',
    fullName: 'Алихан Сейткали (Демо Ученик)',
    className: 7,
    shift: 1,
  },
  {
    role: 'parent',
    email: 'demo.parent@pifagorschool.kz',
    password: 'DemoParent2026!#',
    fullName: 'Бахыт Сейткали (Демо Родитель)',
  },
  {
    role: 'teacher',
    email: 'demo.teacher@pifagorschool.kz',
    password: 'DemoTeacher2026!#',
    fullName: 'Михаил Сергеевич Петров (Демо Преподаватель)',
  },
  {
    role: 'coordinator',
    email: 'demo.coordinator@pifagorschool.kz',
    password: 'DemoCoord2026!#',
    fullName: 'Сауле Ахметова (Демо Координатор)',
  },
  {
    role: 'technician',
    email: 'demo.technician@pifagorschool.kz',
    password: 'DemoTech2026!#',
    fullName: 'Серикбаев Болат (Демо Техник)',
  },
  {
    role: 'admin',
    email: 'demo.admin@pifagorschool.kz',
    password: 'DemoAdmin2026!#',
    fullName: 'Администрация Школы (Демо)',
  },
];

async function ensureUser({ email, password, displayName, customClaims, firestoreData }) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`  ℹ️  Found user ${email} (UID: ${userRecord.uid}). Updating credentials & claims...`);
    userRecord = await auth.updateUser(userRecord.uid, {
      password,
      displayName,
      emailVerified: true,
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log(`  ➕ Creating user ${email}...`);
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
    } else {
      throw err;
    }
  }

  // Set Custom Claims
  await auth.setCustomUserClaims(userRecord.uid, customClaims);

  // Set Firestore User document
  await db.collection('users').doc(userRecord.uid).set(
    {
      id: userRecord.uid,
      email,
      fullName: displayName,
      updatedAt: new Date().toISOString(),
      ...firestoreData,
    },
    { merge: true }
  );

  return userRecord;
}

async function main() {
  console.log('====================================================');
  console.log('  🚀 ExtraHub — Demo Master & Roles Provisioning');
  console.log(`  Project:         [${PROJECT_ID}]`);
  console.log(`  Master Email:    [${MASTER_EMAIL}]`);
  console.log('====================================================\n');

  // 1. Provision Master Account
  console.log('👑 1. Provisioning Master Account...');
  const masterRecord = await ensureUser({
    email: MASTER_EMAIL,
    password: MASTER_PASSWORD,
    displayName: 'Даниил Ивакин (Владелец / Мастер)',
    customClaims: { role: 'admin', isDemoMaster: true },
    firestoreData: {
      role: 'admin',
      isDemoMaster: true,
      status: 'active',
      phone: '+7 (701) 000-00-00',
    },
  });
  console.log(`  ✅ Master account ready! UID: ${masterRecord.uid}\n`);

  // 2. Provision Demo Role Accounts
  console.log('👥 2. Provisioning Demo Accounts for Role Switching...');
  for (const acc of DEMO_ACCOUNTS) {
    await ensureUser({
      email: acc.email,
      password: acc.password,
      displayName: acc.fullName,
      customClaims: { role: acc.role },
      firestoreData: {
        role: acc.role,
        status: 'active',
        className: acc.className || null,
        shift: acc.shift || null,
        isDemoAccount: true,
      },
    });
    console.log(`  ✅ Demo account [${acc.role}]: ${acc.email}`);
  }

  console.log('\n====================================================');
  console.log('  🎉 Все аккаунты успешно подготовлены!');
  console.log('====================================================');
  console.log(`  Мастер-аккаунт:    ${MASTER_EMAIL}`);
  console.log(`  Пароль мастера:    ${MASTER_PASSWORD}`);
  console.log(`  Флаг isDemoMaster: true (в Custom Claims и в Firestore)`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
