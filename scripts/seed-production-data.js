/**
 * ExtraHub — Production Firestore Seeding Script
 *
 * Populates real Firestore in project extrahub-c95af with:
 * 1. activities (all official school clubs with descriptions, prices in ₸, syllabus)
 * 2. activityGroups (schedule, daysOfWeek, times, capacity, enrolledCount: 0)
 * 3. users (coordinator & technician staff records)
 * 4. equipmentIssues (demo breakdown tickets for technician cabinet)
 *
 * Usage:
 *   node scripts/seed-production-data.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  DEMO_ACTIVITIES,
  DEMO_ACTIVITY_GROUPS,
  DEMO_EQUIPMENT_ISSUES,
  DEMO_TECHNICIANS,
} from '../src/shared/data/demoData.js';

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'extrahub-c95af';

// Converts JS values into Firestore REST value representations
function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: val.toString() }
      : { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Converts JS object into Firestore document fields
function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

// Get Google OAuth token from Firebase CLI configuration
function getFirebaseCliToken() {
  const toolsPath = join(process.env.HOME || '', '.config/configstore/firebase-tools.json');
  if (!existsSync(toolsPath)) {
    throw new Error(`Firebase CLI credentials not found at ${toolsPath}. Run 'firebase login' first.`);
  }
  const tools = JSON.parse(readFileSync(toolsPath, 'utf8'));
  const token = tools.tokens?.access_token;
  if (!token) {
    throw new Error('No access_token found in firebase-tools config.');
  }
  return token;
}

async function writeFirestoreDoc(accessToken, collectionName, docId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}`;
  const body = JSON.stringify({
    fields: toFirestoreFields(data),
  });

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to write ${collectionName}/${docId} (${res.status}): ${errorText}`);
  }

  return res.json();
}

async function main() {
  console.log('====================================================');
  console.log(`  🚀 ExtraHub Production Firestore Seeder`);
  console.log(`  Target Project: [${PROJECT_ID}]`);
  console.log('====================================================\n');

  const accessToken = getFirebaseCliToken();
  console.log('🔑 Authenticated with active Firebase CLI session.\n');

  // 1. Seed Activities
  console.log(`📌 Seeding Activities (${DEMO_ACTIVITIES.length} items)...`);
  for (const act of DEMO_ACTIVITIES) {
    await writeFirestoreDoc(accessToken, 'activities', act.id, act);
    const priceStr = act.price === 0 ? 'Бесплатно' : `${act.price.toLocaleString('ru-RU')} ₸/мес`;
    console.log(`   ✓ [${act.id}] ${act.title.padEnd(45)} -> ${priceStr}`);
  }

  // 2. Seed Activity Groups (reset enrolledCount to 0 for fresh production state)
  console.log(`\n📌 Seeding Activity Groups (${DEMO_ACTIVITY_GROUPS.length} items)...`);
  for (const grp of DEMO_ACTIVITY_GROUPS) {
    const prodGroup = {
      ...grp,
      enrolledCount: 0, // Real students will register dynamically
    };
    await writeFirestoreDoc(accessToken, 'activityGroups', prodGroup.id, prodGroup);
    console.log(`   ✓ [${prodGroup.id}] ${prodGroup.name.padEnd(35)} (0/${prodGroup.capacity} мест)`);
  }

  // 3. Seed Coordinator and Technician Staff in users collection
  console.log('\n📌 Seeding Staff Accounts (Users)...');
  const staffUsers = [
    {
      id: 'coordinator-main',
      email: 'coordinator@extrahub.kz',
      fullName: 'Елена Викторовна Романова',
      role: 'coordinator',
      phone: '+7 (701) 555-01-99',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    ...Object.values(DEMO_TECHNICIANS).map((tech) => ({
      ...tech,
      createdAt: new Date().toISOString(),
    })),
  ];

  for (const user of staffUsers) {
    await writeFirestoreDoc(accessToken, 'users', user.id, user);
    console.log(`   ✓ [${user.id}] ${user.fullName} (${user.role}) -> ${user.email}`);
  }

  // 4. Seed Equipment Issues for Technician Cabinet Demo
  console.log(`\n📌 Seeding Equipment Issues (${DEMO_EQUIPMENT_ISSUES.length} items)...`);
  for (const issue of DEMO_EQUIPMENT_ISSUES) {
    await writeFirestoreDoc(accessToken, 'equipmentIssues', issue.id, issue);
    console.log(`   ✓ [${issue.id}] [${issue.priority.toUpperCase()}] ${issue.title} (${issue.location}) - Status: ${issue.status}`);
  }

  console.log('\n====================================================');
  console.log('  🎉 Real Firestore production seeding successfully completed!');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Seeding failed with error:', err.message);
  process.exit(1);
});
