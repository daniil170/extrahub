import { FieldValue } from 'firebase-admin/firestore';
import { generateInviteToken, calculateHoldExpiration } from './tokens.js';

/**
 * Promotes the next student from the waitlist for a specific group
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} groupId
 * @returns {Promise<{ promoted: boolean, enrollmentId?: string, studentId?: string, inviteToken?: string, reason?: string }>}
 */
export async function promoteFromWaitlist(db, groupId) {
  // Query next student in queue (lowest position index)
  const waitlistSnap = await db
    .collection('waitlist')
    .where('groupId', '==', groupId)
    .orderBy('position', 'asc')
    .limit(1)
    .get();

  if (waitlistSnap.empty) {
    return { promoted: false, reason: 'waitlist_empty' };
  }

  const topWaitlistDoc = waitlistSnap.docs[0];
  const waitlistData = topWaitlistDoc.data();
  const studentId = waitlistData.studentId;

  // Retrieve group & student info for details
  const groupRef = db.collection('activityGroups').doc(groupId);
  const studentRef = db.collection('students').doc(studentId);

  const [groupDoc, studentDoc] = await Promise.all([groupRef.get(), studentRef.get()]);

  if (!groupDoc.exists) {
    return { promoted: false, reason: 'group_not_found' };
  }

  const groupData = groupDoc.data();
  if (groupData.enrolledCount >= groupData.capacity) {
    return { promoted: false, reason: 'group_full' };
  }

  const enrollmentRef = db.collection('enrollments').doc();
  const inviteRef = db.collection('parentInvites').doc();
  const holdExpiresAt = calculateHoldExpiration(24);
  const inviteToken = generateInviteToken();
  const nowStr = new Date().toISOString();

  // Run atomic promotion in transaction
  await db.runTransaction(async (transaction) => {
    const currentGroup = await transaction.get(groupRef);
    if (!currentGroup.exists) {
      throw new Error(`Group ${groupId} not found during promotion`);
    }

    const currentEnrolled = currentGroup.data().enrolledCount || 0;
    const capacity = currentGroup.data().capacity || 0;

    if (currentEnrolled >= capacity) {
      throw new Error(`Group ${groupId} capacity reached during transaction`);
    }

    // 1. Delete waitlist entry
    transaction.delete(topWaitlistDoc.ref);

    // 2. Create new enrollment
    transaction.set(enrollmentRef, {
      id: enrollmentRef.id,
      studentId,
      groupId,
      activityId: groupData.activityId || '',
      status: 'pending_parent_approval',
      holdExpiresAt: holdExpiresAt.toISOString(),
      parentApprovedAt: null,
      approvedByParentId: null,
      enrolledAt: nowStr,
      cancelledAt: null,
    });

    // 3. Create parent invite
    transaction.set(inviteRef, {
      id: inviteRef.id,
      studentId,
      enrollmentId: enrollmentRef.id,
      token: inviteToken,
      status: 'active',
      expiresAt: holdExpiresAt.toISOString(),
      createdAt: nowStr,
    });

    // 4. Increment enrolledCount
    transaction.update(groupRef, {
      enrolledCount: FieldValue.increment(1),
    });
  });

  // Re-index remaining waitlist items sequentially
  const remainingWaitlistSnap = await db
    .collection('waitlist')
    .where('groupId', '==', groupId)
    .orderBy('position', 'asc')
    .get();

  if (!remainingWaitlistSnap.empty) {
    const batch = db.batch();
    remainingWaitlistSnap.docs.forEach((docSnap, index) => {
      batch.update(docSnap.ref, { position: index + 1 });
    });
    await batch.commit();
  }

  // Create notifications for student and parents
  const studentData = studentDoc.exists ? studentDoc.data() : {};
  const parentIds = Array.isArray(studentData.parentIds) ? studentData.parentIds : [];
  const recipientIds = Array.from(new Set([studentId, ...parentIds]));

  const notifBatch = db.batch();
  for (const uid of recipientIds) {
    const notifRef = db.collection('notifications').doc();
    notifBatch.set(notifRef, {
      id: notifRef.id,
      userId: uid,
      type: 'waitlist_promoted',
      text: 'Освободилось место в секции! Вам предоставлен резерв на 24 часа для подтверждения записи.',
      channel: 'push',
      isRead: false,
      sentAt: nowStr,
    });
  }
  await notifBatch.commit();

  return {
    promoted: true,
    enrollmentId: enrollmentRef.id,
    inviteToken,
    studentId,
  };
}
