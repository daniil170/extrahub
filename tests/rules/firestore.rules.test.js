import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnv;

const PROJECT_ID = 'extrahub-test-project';
const rules = readFileSync('firestore.rules', 'utf8');

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      // Seed setup data via admin context
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // Seed users
        await setDoc(doc(db, 'users', 'student-alice'), {
          id: 'student-alice',
          fullName: 'Alice Smith',
          role: 'student',
          status: 'active',
        });
        await setDoc(doc(db, 'users', 'student-bob'), {
          id: 'student-bob',
          fullName: 'Bob Jones',
          role: 'student',
          status: 'active',
        });
        await setDoc(doc(db, 'users', 'parent-carol'), {
          id: 'parent-carol',
          fullName: 'Carol Smith',
          role: 'parent',
          status: 'active',
        });
        await setDoc(doc(db, 'users', 'parent-dave'), {
          id: 'parent-dave',
          fullName: 'Dave Jones',
          role: 'parent',
          status: 'active',
        });
        await setDoc(doc(db, 'users', 'teacher-eva'), {
          id: 'teacher-eva',
          fullName: 'Eva Teacher',
          role: 'teacher',
          status: 'active',
        });
        await setDoc(doc(db, 'users', 'teacher-frank'), {
          id: 'teacher-frank',
          fullName: 'Frank Teacher',
          role: 'teacher',
          status: 'active',
        });
        await setDoc(doc(db, 'users', 'coordinator-helen'), {
          id: 'coordinator-helen',
          fullName: 'Helen Coordinator',
          role: 'coordinator',
          status: 'active',
        });

        // Seed students
        await setDoc(doc(db, 'students', 'student-alice'), {
          id: 'student-alice',
          fullName: 'Alice Smith',
          className: '7-B',
          parentIds: ['parent-carol'],
          schoolId: 'school-1',
        });
        await setDoc(doc(db, 'students', 'student-bob'), {
          id: 'student-bob',
          fullName: 'Bob Jones',
          className: '8-A',
          parentIds: ['parent-dave'],
          schoolId: 'school-1',
        });

        // Seed activity & groups
        await setDoc(doc(db, 'activities', 'act-robotics'), {
          id: 'act-robotics',
          title: 'Robotics',
          teacherId: 'teacher-eva',
          price: 3500,
        });

        await setDoc(doc(db, 'activityGroups', 'group-eva-1'), {
          id: 'group-eva-1',
          activityId: 'act-robotics',
          teacherId: 'teacher-eva',
          capacity: 15,
          enrolledCount: 10,
        });

        await setDoc(doc(db, 'activityGroups', 'group-frank-1'), {
          id: 'group-frank-1',
          activityId: 'act-robotics',
          teacherId: 'teacher-frank',
          capacity: 12,
          enrolledCount: 5,
        });

        // Seed existing enrollment
        await setDoc(doc(db, 'enrollments', 'enr-alice-1'), {
          id: 'enr-alice-1',
          studentId: 'student-alice',
          groupId: 'group-eva-1',
          activityId: 'act-robotics',
          status: 'pending_parent_approval',
          enrolledAt: '2026-09-08T10:00:00.000Z',
        });
      });
    }
  });

  describe('1. Enrollment Rules', () => {
    it('student CANNOT create enrollment with status "active" directly', async () => {
      const studentDb = testEnv.authenticatedContext('student-alice').firestore();
      const enrollmentRef = doc(studentDb, 'enrollments', 'enr-alice-direct-active');

      await assertFails(
        setDoc(enrollmentRef, {
          id: 'enr-alice-direct-active',
          studentId: 'student-alice',
          groupId: 'group-eva-1',
          status: 'active', // FORBIDDEN: must start with pending_parent_approval
          enrolledAt: new Date().toISOString(),
        })
      );
    });

    it('student CAN create enrollment with status "pending_parent_approval" for themselves', async () => {
      const studentDb = testEnv.authenticatedContext('student-alice').firestore();
      const enrollmentRef = doc(studentDb, 'enrollments', 'enr-alice-pending');

      await assertSucceeds(
        setDoc(enrollmentRef, {
          id: 'enr-alice-pending',
          studentId: 'student-alice',
          groupId: 'group-eva-1',
          status: 'pending_parent_approval',
          enrolledAt: new Date().toISOString(),
        })
      );
    });

    it('student CANNOT create enrollment for another student', async () => {
      const studentDb = testEnv.authenticatedContext('student-alice').firestore();
      const enrollmentRef = doc(studentDb, 'enrollments', 'enr-bob-by-alice');

      await assertFails(
        setDoc(enrollmentRef, {
          id: 'enr-bob-by-alice',
          studentId: 'student-bob', // FORBIDDEN: Alice cannot enroll Bob
          groupId: 'group-eva-1',
          status: 'pending_parent_approval',
          enrolledAt: new Date().toISOString(),
        })
      );
    });
  });

  describe('2. Parent Approval Rules', () => {
    it('parent CANNOT approve enrollment for another student child', async () => {
      // Dave is parent of Bob, trying to approve Alice's enrollment
      const parentDaveDb = testEnv.authenticatedContext('parent-dave').firestore();
      const enrollmentRef = doc(parentDaveDb, 'enrollments', 'enr-alice-1');

      await assertFails(
        updateDoc(enrollmentRef, {
          status: 'active',
          approvedByParentId: 'parent-dave',
          parentApprovedAt: new Date().toISOString(),
        })
      );
    });

    it('parent CAN approve enrollment for their own child', async () => {
      // Carol is parent of Alice
      const parentCarolDb = testEnv.authenticatedContext('parent-carol').firestore();
      const enrollmentRef = doc(parentCarolDb, 'enrollments', 'enr-alice-1');

      await assertSucceeds(
        updateDoc(enrollmentRef, {
          status: 'active',
          approvedByParentId: 'parent-carol',
          parentApprovedAt: new Date().toISOString(),
        })
      );
    });
  });

  describe('3. Teacher Attendance Scopes', () => {
    it('teacher CANNOT mark attendance for a group they do NOT teach', async () => {
      // Eva is teacher for group-eva-1, NOT group-frank-1
      const teacherEvaDb = testEnv.authenticatedContext('teacher-eva').firestore();
      const attendanceRef = doc(teacherEvaDb, 'attendance', 'att-eva-on-frank-group');

      await assertFails(
        setDoc(attendanceRef, {
          id: 'att-eva-on-frank-group',
          groupId: 'group-frank-1',
          studentId: 'student-bob',
          date: '2026-09-08',
          status: 'present',
          markedBy: 'teacher-eva',
        })
      );
    });

    it('teacher CAN mark attendance for their assigned group', async () => {
      const teacherEvaDb = testEnv.authenticatedContext('teacher-eva').firestore();
      const attendanceRef = doc(teacherEvaDb, 'attendance', 'att-eva-correct');

      await assertSucceeds(
        setDoc(attendanceRef, {
          id: 'att-eva-correct',
          groupId: 'group-eva-1',
          studentId: 'student-alice',
          date: '2026-09-08',
          status: 'present',
          markedBy: 'teacher-eva',
        })
      );
    });
  });

  describe('4. Direct Client Mutation Protection (enrolledCount)', () => {
    it('coordinator/client CANNOT directly mutate enrolledCount on activity group', async () => {
      const coordinatorDb = testEnv.authenticatedContext('coordinator-helen').firestore();
      const groupRef = doc(coordinatorDb, 'activityGroups', 'group-eva-1');

      // Attempting to increment enrolledCount directly
      await assertFails(
        updateDoc(groupRef, {
          enrolledCount: 11,
        })
      );
    });

    it('coordinator CAN update other group metadata (e.g. capacity, schedule)', async () => {
      const coordinatorDb = testEnv.authenticatedContext('coordinator-helen').firestore();
      const groupRef = doc(coordinatorDb, 'activityGroups', 'group-eva-1');

      await assertSucceeds(
        updateDoc(groupRef, {
          capacity: 20,
        })
      );
    });
  });

  describe('5. Unauthenticated / Unauthorized Access', () => {
    it('unauthenticated client CAN read public activities catalog', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      const activityRef = doc(unauthDb, 'activities', 'act-robotics');

      await assertSucceeds(getDoc(activityRef));
    });

    it('unauthenticated client CANNOT read private student records', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      const studentRef = doc(unauthDb, 'students', 'student-alice');

      await assertFails(getDoc(studentRef));
    });
  });
});
