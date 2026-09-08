import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { promoteFromWaitlist } from '../shared/waitlist.js';

/**
 * Core business logic to find and process all expired holds
 * Exported for testing and execution by scheduler
 * @param {import('firebase-admin/firestore').Firestore} firestoreDb
 * @param {Date} [referenceDate=new Date()]
 * @returns {Promise<{ expiredCount: number, affectedGroups: string[] }>}
 */
export async function processExpiredHolds(firestoreDb, referenceDate = new Date()) {
  const nowIso = referenceDate.toISOString();

  // Find all pending enrollments whose hold time has expired
  const expiredSnap = await firestoreDb
    .collection('enrollments')
    .where('status', '==', 'pending_parent_approval')
    .where('holdExpiresAt', '<', nowIso)
    .get();

  if (expiredSnap.empty) {
    return { expiredCount: 0, affectedGroups: [] };
  }

  const affectedGroupIds = new Set();
  let expiredCount = 0;

  for (const enrDoc of expiredSnap.docs) {
    const enrData = enrDoc.data();
    const enrollmentId = enrDoc.id;
    const groupId = enrData.groupId;
    const groupRef = firestoreDb.collection('activityGroups').doc(groupId);

    // Find linked invite
    const inviteSnap = await firestoreDb
      .collection('parentInvites')
      .where('enrollmentId', '==', enrollmentId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    try {
      await firestoreDb.runTransaction(async (transaction) => {
        const currentEnr = await transaction.get(enrDoc.ref);
        if (!currentEnr.exists || currentEnr.data().status !== 'pending_parent_approval') {
          return;
        }

        // Cancel expired enrollment
        transaction.update(enrDoc.ref, {
          status: 'cancelled_by_timeout',
          cancelledAt: nowIso,
        });

        // Mark invite as expired
        if (!inviteSnap.empty) {
          transaction.update(inviteSnap.docs[0].ref, {
            status: 'expired',
          });
        }

        // Decrement group enrolledCount
        transaction.update(groupRef, {
          enrolledCount: FieldValue.increment(-1),
        });
      });

      expiredCount++;
      affectedGroupIds.add(groupId);
    } catch (err) {
      console.error(`Error expiring hold for enrollment ${enrollmentId}:`, err);
    }
  }

  // Promote from waitlist for every group that had spots released
  for (const groupId of affectedGroupIds) {
    try {
      await promoteFromWaitlist(firestoreDb, groupId);
    } catch (err) {
      console.error(`Error promoting from waitlist for group ${groupId}:`, err);
    }
  }

  return {
    expiredCount,
    affectedGroups: Array.from(affectedGroupIds),
  };
}

/**
 * Scheduled Cloud Function running every 15 minutes to cancel expired holds
 */
export const expireHoldsScheduled = onSchedule('every 15 minutes', async (_event) => {
  const result = await processExpiredHolds(db);
  console.info(`expireHoldsScheduled completed: ${result.expiredCount} holds expired.`);
});
