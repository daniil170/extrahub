import { describe, it, beforeAll, beforeEach, expect } from 'vitest';
import { db } from '../src/config/firebase.js';
import {
  createEnrollment,
  approveEnrollment,
  rejectEnrollment,
  cancelEnrollment,
  processExpiredHolds,
} from '../src/index.js';

describe('Cloud Functions: Enrollment & Waitlist Logic', () => {
  beforeAll(() => {
    // Ensure connecting to emulator
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  });

  beforeEach(async () => {
    // Clean up all collections in emulator before each test
    const collections = [
      'users',
      'students',
      'activities',
      'activityGroups',
      'enrollments',
      'waitlist',
      'parentInvites',
      'notifications',
    ];

    for (const colName of collections) {
      const snap = await db.collection(colName).get();
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Seed baseline entities
    await db.collection('users').doc('student-1').set({
      id: 'student-1',
      fullName: 'Александр Иванов',
      role: 'student',
    });

    await db.collection('users').doc('student-2').set({
      id: 'student-2',
      fullName: 'Дарья Смирнова',
      role: 'student',
    });

    await db.collection('users').doc('parent-1').set({
      id: 'parent-1',
      fullName: 'Елена Иванова',
      role: 'parent',
    });

    await db
      .collection('students')
      .doc('student-1')
      .set({
        id: 'student-1',
        fullName: 'Александр Иванов',
        className: '7-Б',
        parentIds: ['parent-1'],
      });

    await db.collection('students').doc('student-2').set({
      id: 'student-2',
      fullName: 'Дарья Смирнова',
      className: '7-А',
      parentIds: [],
    });

    await db.collection('activities').doc('act-robotics').set({
      id: 'act-robotics',
      title: 'Робототехника',
      category: 'Технологии',
      price: 3500,
    });

    await db.collection('activities').doc('act-chess').set({
      id: 'act-chess',
      title: 'Шахматы',
      category: 'Интеллект',
      price: 0,
    });

    // Group with 2 spots, 0 currently enrolled
    await db
      .collection('activityGroups')
      .doc('group-robotics-open')
      .set({
        id: 'group-robotics-open',
        activityId: 'act-robotics',
        capacity: 2,
        enrolledCount: 0,
        daysOfWeek: [1, 5], // Пн, Пт
        startTime: '15:30',
        endTime: '17:00',
      });

    // Group with 1 spot, already 1 enrolled (Full group)
    await db
      .collection('activityGroups')
      .doc('group-robotics-full')
      .set({
        id: 'group-robotics-full',
        activityId: 'act-robotics',
        capacity: 1,
        enrolledCount: 1,
        daysOfWeek: [2, 4], // Вт, Чт
        startTime: '16:00',
        endTime: '17:30',
      });
  });

  describe('1. createEnrollment', () => {
    it('successfully creates enrollment with hold when spots are available', async () => {
      const response = await createEnrollment.run({
        data: { studentId: 'student-1', groupId: 'group-robotics-open' },
        auth: { uid: 'student-1' },
      });

      expect(response.success).toBe(true);
      expect(response.waitlisted).toBe(false);
      expect(response.enrollmentId).toBeDefined();
      expect(response.inviteToken).toBeDefined();
      expect(response.holdExpiresAt).toBeDefined();

      // Check enrollment doc in Firestore
      const enrDoc = await db.collection('enrollments').doc(response.enrollmentId).get();
      expect(enrDoc.exists).toBe(true);
      expect(enrDoc.data().status).toBe('pending_parent_approval');
      expect(enrDoc.data().studentId).toBe('student-1');

      // Check parent invite doc in Firestore
      const inviteSnap = await db
        .collection('parentInvites')
        .where('token', '==', response.inviteToken)
        .get();
      expect(inviteSnap.empty).toBe(false);
      expect(inviteSnap.docs[0].data().status).toBe('active');

      // Check group enrolledCount was incremented to 1
      const groupDoc = await db.collection('activityGroups').doc('group-robotics-open').get();
      expect(groupDoc.data().enrolledCount).toBe(1);
    });

    it('places student on waitlist when group capacity is reached', async () => {
      const response = await createEnrollment.run({
        data: { studentId: 'student-1', groupId: 'group-robotics-full' },
        auth: { uid: 'student-1' },
      });

      expect(response.success).toBe(true);
      expect(response.waitlisted).toBe(true);
      expect(response.position).toBe(1);

      // Check waitlist doc in Firestore
      const waitlistDoc = await db.collection('waitlist').doc(response.waitlistId).get();
      expect(waitlistDoc.exists).toBe(true);
      expect(waitlistDoc.data().position).toBe(1);
      expect(waitlistDoc.data().studentId).toBe('student-1');

      // Check group enrolledCount was NOT incremented
      const groupDoc = await db.collection('activityGroups').doc('group-robotics-full').get();
      expect(groupDoc.data().enrolledCount).toBe(1);
    });

    it('blocks enrollment when schedule overlaps with an existing active enrollment', async () => {
      // First, enroll student in group-robotics-open (Пн, Пт 15:30 - 17:00)
      await createEnrollment.run({
        data: { studentId: 'student-1', groupId: 'group-robotics-open' },
        auth: { uid: 'student-1' },
      });

      // Create a conflicting chess group on Friday (5) from 16:00 to 17:30
      await db
        .collection('activityGroups')
        .doc('group-chess-conflict')
        .set({
          id: 'group-chess-conflict',
          activityId: 'act-chess',
          capacity: 10,
          enrolledCount: 0,
          daysOfWeek: [5], // Пятница (пересекается!)
          startTime: '16:00', // Пересекается с 15:30-17:00!
          endTime: '17:30',
        });

      // Attempting to enroll should throw failed-precondition
      await expect(
        createEnrollment.run({
          data: { studentId: 'student-1', groupId: 'group-chess-conflict' },
          auth: { uid: 'student-1' },
        })
      ).rejects.toThrow(/Накладка в расписании/);
    });
  });

  describe('2. approveEnrollment', () => {
    it('approves enrollment, activates status and links parent without double-incrementing enrolledCount', async () => {
      // Create initial pending enrollment
      const creation = await createEnrollment.run({
        data: { studentId: 'student-1', groupId: 'group-robotics-open' },
        auth: { uid: 'student-1' },
      });

      // Approve with parent-1
      const approval = await approveEnrollment.run({
        data: { inviteToken: creation.inviteToken },
        auth: { uid: 'parent-1' },
      });

      expect(approval.success).toBe(true);
      expect(approval.status).toBe('active');

      // Verify enrollment status is active
      const enrDoc = await db.collection('enrollments').doc(creation.enrollmentId).get();
      expect(enrDoc.data().status).toBe('active');
      expect(enrDoc.data().approvedByParentId).toBe('parent-1');
      expect(enrDoc.data().parentApprovedAt).toBeDefined();

      // Verify parent invite is accepted
      const inviteSnap = await db
        .collection('parentInvites')
        .where('token', '==', creation.inviteToken)
        .get();
      expect(inviteSnap.docs[0].data().status).toBe('accepted');

      // Verify enrolledCount remains 1 (not incremented twice)
      const groupDoc = await db.collection('activityGroups').doc('group-robotics-open').get();
      expect(groupDoc.data().enrolledCount).toBe(1);
    });
  });

  describe('3. rejectEnrollment & Waitlist Promotion', () => {
    it('rejects enrollment, decrements enrolledCount, and promotes next student from waitlist', async () => {
      // Capacity is 1 for group-robotics-full
      // First, place student-2 in waitlist for group-robotics-open (set capacity to 1)
      await db.collection('activityGroups').doc('group-robotics-open').update({
        capacity: 1,
      });

      // Student-1 takes the single spot
      const creation = await createEnrollment.run({
        data: { studentId: 'student-1', groupId: 'group-robotics-open' },
        auth: { uid: 'student-1' },
      });

      // Student-2 tries to enroll and goes to waitlist
      const waitlistRes = await createEnrollment.run({
        data: { studentId: 'student-2', groupId: 'group-robotics-open' },
        auth: { uid: 'student-2' },
      });
      expect(waitlistRes.waitlisted).toBe(true);

      // Student-1's parent rejects the enrollment
      const rejection = await rejectEnrollment.run({
        data: { inviteToken: creation.inviteToken },
        auth: null,
      });
      expect(rejection.success).toBe(true);
      expect(rejection.status).toBe('cancelled');

      // Verify Student-1 enrollment is cancelled
      const oldEnr = await db.collection('enrollments').doc(creation.enrollmentId).get();
      expect(oldEnr.data().status).toBe('cancelled');

      // Verify Student-2 was automatically promoted from waitlist!
      const waitlistCheck = await db.collection('waitlist').doc(waitlistRes.waitlistId).get();
      expect(waitlistCheck.exists).toBe(false); // Removed from waitlist

      // Verify new enrollment created for Student-2
      const student2EnrSnap = await db
        .collection('enrollments')
        .where('studentId', '==', 'student-2')
        .where('groupId', '==', 'group-robotics-open')
        .get();

      expect(student2EnrSnap.empty).toBe(false);
      expect(student2EnrSnap.docs[0].data().status).toBe('pending_parent_approval');

      // Verify notification sent to Student-2
      const notifSnap = await db
        .collection('notifications')
        .where('userId', '==', 'student-2')
        .get();
      expect(notifSnap.empty).toBe(false);
      expect(notifSnap.docs[0].data().type).toBe('waitlist_promoted');
    });
  });

  describe('4. expireHoldsScheduled', () => {
    it('expires timed-out holds, releases spots, and promotes waitlist', async () => {
      // Set group capacity to 1
      await db.collection('activityGroups').doc('group-robotics-open').update({
        capacity: 1,
      });

      // Create expired enrollment directly in DB for student-1
      const expiredHoldDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const enrRef = db.collection('enrollments').doc('enr-expired');
      await enrRef.set({
        id: 'enr-expired',
        studentId: 'student-1',
        groupId: 'group-robotics-open',
        status: 'pending_parent_approval',
        holdExpiresAt: expiredHoldDate,
      });

      await db.collection('parentInvites').doc('inv-expired').set({
        id: 'inv-expired',
        studentId: 'student-1',
        enrollmentId: 'enr-expired',
        token: 'token-expired',
        status: 'active',
        expiresAt: expiredHoldDate,
      });

      await db.collection('activityGroups').doc('group-robotics-open').update({
        enrolledCount: 1,
      });

      // Put student-2 on waitlist
      await db.collection('waitlist').doc('wl-student-2').set({
        id: 'wl-student-2',
        studentId: 'student-2',
        groupId: 'group-robotics-open',
        position: 1,
        queuedAt: new Date().toISOString(),
      });

      // Execute hold expiration logic
      const result = await processExpiredHolds(db, new Date());
      expect(result.expiredCount).toBe(1);

      // Verify expired enrollment is marked cancelled_by_timeout
      const updatedEnr = await enrRef.get();
      expect(updatedEnr.data().status).toBe('cancelled_by_timeout');

      // Verify invite is marked expired
      const updatedInv = await db.collection('parentInvites').doc('inv-expired').get();
      expect(updatedInv.data().status).toBe('expired');

      // Verify Student-2 was promoted
      const waitlistCheck = await db.collection('waitlist').doc('wl-student-2').get();
      expect(waitlistCheck.exists).toBe(false);

      const promotedEnrSnap = await db
        .collection('enrollments')
        .where('studentId', '==', 'student-2')
        .where('status', '==', 'pending_parent_approval')
        .get();
      expect(promotedEnrSnap.empty).toBe(false);
    });
  });

  describe('5. cancelEnrollment', () => {
    it('allows parent to cancel active enrollment and triggers waitlist promotion', async () => {
      // Set capacity 1
      await db.collection('activityGroups').doc('group-robotics-open').update({
        capacity: 1,
        enrolledCount: 1,
      });

      // Create active enrollment for student-1
      const enrRef = db.collection('enrollments').doc('enr-active-1');
      await enrRef.set({
        id: 'enr-active-1',
        studentId: 'student-1',
        groupId: 'group-robotics-open',
        status: 'active',
      });

      // Put student-2 in waitlist
      await db.collection('waitlist').doc('wl-student-2').set({
        id: 'wl-student-2',
        studentId: 'student-2',
        groupId: 'group-robotics-open',
        position: 1,
        queuedAt: new Date().toISOString(),
      });

      // Parent-1 cancels enrollment
      const cancelRes = await cancelEnrollment.run({
        data: { enrollmentId: 'enr-active-1' },
        auth: { uid: 'parent-1' },
      });

      expect(cancelRes.success).toBe(true);
      expect(cancelRes.status).toBe('cancelled');

      // Check enrollment cancelled
      const cancelledDoc = await enrRef.get();
      expect(cancelledDoc.data().status).toBe('cancelled');

      // Check student-2 promoted
      const student2Enr = await db
        .collection('enrollments')
        .where('studentId', '==', 'student-2')
        .get();
      expect(student2Enr.empty).toBe(false);
    });
  });

  describe('6. Validation & Permission Edge Cases', () => {
    it('createEnrollment throws invalid-argument if studentId or groupId is missing', async () => {
      await expect(
        createEnrollment.run({
          data: { studentId: '' },
          auth: { uid: 'student-1' },
        })
      ).rejects.toThrow(/studentId обязателен/);

      await expect(
        createEnrollment.run({
          data: { studentId: 'student-1' },
          auth: { uid: 'student-1' },
        })
      ).rejects.toThrow(/groupId обязателен/);
    });

    it('createEnrollment throws unauthenticated if auth context is missing', async () => {
      await expect(
        createEnrollment.run({
          data: { studentId: 'student-1', groupId: 'group-robotics-open' },
          auth: null,
        })
      ).rejects.toThrow(/Требуется аутентификация/);
    });

    it('approveEnrollment throws not-found for non-existent token', async () => {
      await expect(
        approveEnrollment.run({
          data: { inviteToken: 'non-existent-token-xyz' },
          auth: null,
        })
      ).rejects.toThrow(/Приглашение не найдено/);
    });

    it('cancelEnrollment throws permission-denied if caller is neither parent nor student nor admin', async () => {
      const enrRef = db.collection('enrollments').doc('enr-test-perm');
      await enrRef.set({
        id: 'enr-test-perm',
        studentId: 'student-1',
        groupId: 'group-robotics-open',
        status: 'active',
      });

      await expect(
        cancelEnrollment.run({
          data: { enrollmentId: 'enr-test-perm' },
          auth: { uid: 'student-2' }, // student-2 is unrelated
        })
      ).rejects.toThrow(/Недостаточно прав/);
    });
  });
});
