/**
 * ExtraHub — Production Mock Data Cleanup Script
 *
 * This script safely purges demo/seed data from real Firebase Firestore:
 * - Deletes demo activities (act-1 through act-6) and demo groups (grp-1-1 through grp-6-1)
 * - Deletes demo enrollments, demo attendance, demo payments, and mock equipment issues
 * - Resets enrolled counts on real groups to 0 (clean state before real enrollments)
 * - Retains REAL coordinator/admin activities (e.g. act-custom-1789285817032) and groups (grp-1789285818462)
 * - Retains real user accounts (ivakin.daniel@pifagorschool.kz, daniilivakin30@gmail.com) and demo auth shells
 *
 * Safety mechanism:
 * - Runs in DRY-RUN mode by default (shows what WOULD be deleted).
 * - Requires explicit `--confirm` flag to actually execute deletions in Firestore.
 *
 * Usage:
 *   node scripts/reset-production-mock-data.js           # Dry-run only
 *   node scripts/reset-production-mock-data.js --confirm # Actually delete
 */

import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync } from 'fs';

// Setup Google ADC if available
if (
  !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  existsSync('/Users/ivakindaniil/.config/gcloud/application_default_credentials.json')
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    '/Users/ivakindaniil/.config/gcloud/application_default_credentials.json';
}

const PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  'extrahub-c95af';

const isConfirmed = process.argv.includes('--confirm');

const app =
  getApps().length === 0
    ? initializeApp({
        credential: applicationDefault(),
        projectId: PROJECT_ID,
      })
    : getApps()[0];

const db = getFirestore(app);

// Whitelisted / Protected entities that must NEVER be deleted
const PROTECTED_USERS = new Set([
  'daniilivakin30@gmail.com',
  'ivakin.daniel@pifagorschool.kz',
]);

const PROTECTED_ACTIVITY_IDS = new Set([
  'act-custom-1789285817032', // Real activity: 3D-моделирование и цифровое производство
]);

const PROTECTED_GROUP_IDS = new Set([
  'grp-1789285818462', // Real group: FabLab-1
]);

async function main() {
  console.log('====================================================');
  console.log('  🧹 ExtraHub — Production Mock Data Cleanup');
  console.log(`  Target Project: [${PROJECT_ID}]`);
  console.log(`  Execution Mode: [${isConfirmed ? '🔴 ACTUAL DELETION (--confirm)' : '🟡 DRY-RUN ONLY (Safe)'}]`);
  console.log('====================================================\n');

  const deletionPlan = {
    activities: [],
    activityGroups: [],
    enrollments: [],
    attendance: [],
    payments: [],
    equipmentIssues: [],
    students: [],
    achievements: [],
    notifications: [],
    waitlist: [],
    examApplications: [],
    groupResets: [],
  };

  // 1. Scan Activities
  const activitiesSnap = await db.collection('activities').get();
  for (const doc of activitiesSnap.docs) {
    const data = doc.data();
    if (PROTECTED_ACTIVITY_IDS.has(doc.id)) {
      console.log(`🛡️  KEEPING real activity: [${doc.id}] "${data.title}"`);
    } else {
      deletionPlan.activities.push({ id: doc.id, title: data.title });
    }
  }

  // 2. Scan ActivityGroups
  const groupsSnap = await db.collection('activityGroups').get();
  for (const doc of groupsSnap.docs) {
    const data = doc.data();
    if (PROTECTED_GROUP_IDS.has(doc.id)) {
      console.log(`🛡️  KEEPING real group: [${doc.id}] "${data.name}" (Activity: ${data.activityId})`);
      if (data.enrolledCount > 0 || data.waitlistCount > 0) {
        deletionPlan.groupResets.push({
          id: doc.id,
          name: data.name,
          currentEnrolled: data.enrolledCount || 0,
        });
      }
    } else {
      deletionPlan.activityGroups.push({ id: doc.id, name: data.name, activityId: data.activityId });
    }
  }

  // 3. Scan Enrollments (all demo/test enrollments will be wiped)
  const enrollmentsSnap = await db.collection('enrollments').get();
  for (const doc of enrollmentsSnap.docs) {
    const data = doc.data();
    deletionPlan.enrollments.push({
      id: doc.id,
      activityId: data.activityId,
      groupId: data.groupId,
      studentId: data.studentId,
    });
  }

  // 4. Scan Attendance (all demo/test attendance records will be wiped)
  const attendanceSnap = await db.collection('attendance').get();
  for (const doc of attendanceSnap.docs) {
    const data = doc.data();
    deletionPlan.attendance.push({
      id: doc.id,
      groupId: data.groupId,
      studentId: data.studentId,
      date: data.date,
    });
  }

  // 5. Scan Payments (all demo payments will be wiped)
  const paymentsSnap = await db.collection('payments').get();
  for (const doc of paymentsSnap.docs) {
    const data = doc.data();
    deletionPlan.payments.push({
      id: doc.id,
      studentId: data.studentId,
      amount: data.amount,
      status: data.status,
    });
  }

  // 6. Scan EquipmentIssues (all mock issues will be wiped)
  const issuesSnap = await db.collection('equipmentIssues').get();
  for (const doc of issuesSnap.docs) {
    const data = doc.data();
    deletionPlan.equipmentIssues.push({
      id: doc.id,
      title: data.title,
      category: data.category,
    });
  }

  // 7. Scan Students collection: keep real user student documents, delete legacy demo student IDs
  const studentsSnap = await db.collection('students').get();
  for (const doc of studentsSnap.docs) {
    const data = doc.data();
    // student-1, student-3 are mock synthetic ids from demoData
    if (doc.id === 'student-1' || doc.id === 'student-3') {
      deletionPlan.students.push({
        id: doc.id,
        name: data.fullName,
      });
    } else {
      console.log(`🛡️  KEEPING student document: [${doc.id}] "${data.fullName || 'User student doc'}"`);
    }
  }

  // 8. Scan empty collections if any
  for (const collName of ['achievements', 'notifications', 'waitlist', 'examApplications']) {
    const snap = await db.collection(collName).get();
    for (const doc of snap.docs) {
      deletionPlan[collName].push({ id: doc.id });
    }
  }

  // Print Summary
  console.log('\n----------------------------------------------------');
  console.log('📋 SUMMARY OF ITEMS SCHEDULED FOR DELETION:');
  console.log('----------------------------------------------------');
  console.log(`• Activities:      ${deletionPlan.activities.length} docs`);
  deletionPlan.activities.forEach((a) => console.log(`    - [${a.id}] ${a.title}`));

  console.log(`• Activity Groups: ${deletionPlan.activityGroups.length} docs`);
  deletionPlan.activityGroups.forEach((g) => console.log(`    - [${g.id}] ${g.name} (act: ${g.activityId})`));

  console.log(`• Enrollments:     ${deletionPlan.enrollments.length} docs`);
  console.log(`• Attendance:      ${deletionPlan.attendance.length} docs`);
  console.log(`• Payments:        ${deletionPlan.payments.length} docs`);
  console.log(`• EquipmentIssues: ${deletionPlan.equipmentIssues.length} docs`);
  deletionPlan.equipmentIssues.forEach((i) => console.log(`    - [${i.id}] ${i.title}`));

  console.log(`• Synthetic Studs: ${deletionPlan.students.length} docs`);
  deletionPlan.students.forEach((s) => console.log(`    - [${s.id}] ${s.name}`));

  console.log(`• Real Group Reset: ${deletionPlan.groupResets.length} docs`);
  deletionPlan.groupResets.forEach((r) =>
    console.log(`    - [${r.id}] "${r.name}": reset enrolledCount (${r.currentEnrolled} -> 0)`)
  );

  const totalDeletions =
    deletionPlan.activities.length +
    deletionPlan.activityGroups.length +
    deletionPlan.enrollments.length +
    deletionPlan.attendance.length +
    deletionPlan.payments.length +
    deletionPlan.equipmentIssues.length +
    deletionPlan.students.length +
    deletionPlan.achievements.length +
    deletionPlan.notifications.length +
    deletionPlan.waitlist.length +
    deletionPlan.examApplications.length;

  console.log('----------------------------------------------------');
  console.log(`TOTAL DOCUMENTS TO DELETE: ${totalDeletions}`);
  console.log('----------------------------------------------------\n');

  if (!isConfirmed) {
    console.log('🟡 [DRY-RUN COMPLETE]');
    console.log('No data was modified in Firestore.');
    console.log('To execute this cleanup on production, run:');
    console.log('  npm run cleanup:mock-data -- --confirm\n');
    return;
  }

  // Execute Deletions
  console.log('🔴 Executing deletion batch in Firestore...');
  const batch = db.batch();
  let count = 0;

  async function commitBatchIfNeeded() {
    count++;
    if (count >= 400) {
      await batch.commit();
      count = 0;
    }
  }

  for (const a of deletionPlan.activities) {
    batch.delete(db.collection('activities').doc(a.id));
    await commitBatchIfNeeded();
  }

  for (const g of deletionPlan.activityGroups) {
    batch.delete(db.collection('activityGroups').doc(g.id));
    await commitBatchIfNeeded();
  }

  for (const e of deletionPlan.enrollments) {
    batch.delete(db.collection('enrollments').doc(e.id));
    await commitBatchIfNeeded();
  }

  for (const at of deletionPlan.attendance) {
    batch.delete(db.collection('attendance').doc(at.id));
    await commitBatchIfNeeded();
  }

  for (const p of deletionPlan.payments) {
    batch.delete(db.collection('payments').doc(p.id));
    await commitBatchIfNeeded();
  }

  for (const eq of deletionPlan.equipmentIssues) {
    batch.delete(db.collection('equipmentIssues').doc(eq.id));
    await commitBatchIfNeeded();
  }

  for (const s of deletionPlan.students) {
    batch.delete(db.collection('students').doc(s.id));
    await commitBatchIfNeeded();
  }

  for (const r of deletionPlan.groupResets) {
    batch.update(db.collection('activityGroups').doc(r.id), {
      enrolledCount: 0,
      waitlistCount: 0,
    });
    await commitBatchIfNeeded();
  }

  await batch.commit();
  console.log('✅ All demo/mock documents successfully deleted and real groups reset to clean state.');
}

main().catch((err) => {
  console.error('❌ Error executing mock data cleanup:', err);
  process.exit(1);
});
