import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createUserBalance } from '../../entities/gamification/model.js';

/**
 * Realtime subscription to student's gamification balance
 * @param {string} userId
 * @param {(balance: import('../../entities/gamification/model.js').UserBalance) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeUserBalance(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate(createUserBalance());
    return () => {};
  }

  const docRef = doc(db, COLLECTIONS.USER_BALANCES, userId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...createUserBalance(snap.data()) });
      } else {
        // Fallback default initial balance
        onUpdate(createUserBalance({ userId }));
      }
    },
    (err) => {
      console.warn('subscribeUserBalance error:', err.message || err);
      onUpdate(createUserBalance({ userId }));
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to student's points ledger transactions
 * @param {string} userId
 * @param {(entries: import('../../entities/gamification/model.js').PointsLedgerEntry[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribePointsLedger(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.POINTS_LEDGER),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort client-side by date descending
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      onUpdate(list);
    },
    (err) => {
      console.warn('subscribePointsLedger error:', err.message || err);
      onUpdate([]);
      if (onError) onError(err);
    }
  );
}

/**
 * Call Cloud Function to activate streak freeze for a student
 * @param {{ studentId: string }} params
 */
export async function useStreakFreezeCall({ studentId }) {
  try {
    const fn = httpsCallable(functions, 'useStreakFreeze');
    const res = await fn({ studentId });
    return res.data;
  } catch (err) {
    console.error('useStreakFreezeCall failed:', err);
    throw new Error(err.message || 'Не удалось активировать заморозку');
  }
}

/**
 * Call Cloud Function to award special recognition by teacher
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} params.groupId
 * @param {number} params.amount
 * @param {string} params.reason
 */
export async function awardSpecialRecognitionCall({ studentId, groupId, amount, reason }) {
  try {
    const fn = httpsCallable(functions, 'awardSpecialRecognition');
    const res = await fn({ studentId, groupId, amount, reason });
    return res.data;
  } catch (err) {
    console.error('awardSpecialRecognitionCall failed:', err);
    throw new Error(err.message || 'Не удалось начислить кураторскую награду');
  }
}

/**
 * Fetch count of teacher rewards already given today for a group
 * @param {string} groupId
 * @returns {Promise<{ usedToday: number, remainingToday: number, maxDaily: number }>}
 */
export async function fetchTeacherDailyRecognitionQuota(groupId) {
  const maxDaily = 5;
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const q = query(
      collection(db, COLLECTIONS.POINTS_LEDGER),
      where('source', '==', 'teacher_reward'),
      where('metadata.groupId', '==', groupId),
      where('metadata.date', '==', todayStr)
    );

    const snap = await getDocs(q);
    const usedToday = snap.size;
    const remainingToday = Math.max(0, maxDaily - usedToday);

    return { usedToday, remainingToday, maxDaily };
  } catch (err) {
    console.warn('fetchTeacherDailyRecognitionQuota warning:', err.message);
    return { usedToday: 0, remainingToday: maxDaily, maxDaily };
  }
}
