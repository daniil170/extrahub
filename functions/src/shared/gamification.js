import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

export const GAMIFICATION_CONFIG = {
  ATTENDANCE_XP: 50,
  ATTENDANCE_COINS: 10,
  PARENT_QUICK_APPROVAL_COINS: 20,
  EXAM_PASS_XP: 100,
  MAX_TEACHER_DAILY_REWARDS: 5,
  MAX_FREEZES_PER_QUARTER: 1,
};

/**
 * Returns current calendar quarter identifier (e.g. '2026-Q3')
 * @param {Date} [date]
 * @returns {string}
 */
export function getCurrentQuarterKey(date = new Date()) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

/**
 * Calculates XP multiplier based on weekly attendance streak
 * @param {number} streak
 * @returns {number}
 */
export function calculateStreakMultiplier(streak) {
  if (streak >= 12) return 2.5; // +150% XP
  if (streak >= 8) return 2.0;  // +100% XP
  if (streak >= 4) return 1.5;  // +50% XP
  return 1.0;
}

/**
 * Helper to get or initialize a UserBalance document reference inside a transaction
 * @param {FirebaseFirestore.Transaction} transaction
 * @param {string} userId
 */
export async function getOrCreateUserBalance(transaction, userId) {
  const balanceRef = db.collection('userBalances').doc(userId);
  const balanceDoc = await transaction.get(balanceRef);
  const currentQuarter = getCurrentQuarterKey();

  if (!balanceDoc.exists) {
    const initialData = {
      userId,
      xpPoints: 0,
      coins: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastAttendedDate: null,
      streakFreezeCount: 1,
      streakFreezeActive: false,
      usedFreezesQuarter: null,
      xpMultiplier: 1.0,
      updatedAt: new Date().toISOString(),
    };
    return { balanceRef, data: initialData, exists: false };
  }

  const data = balanceDoc.data();
  // Reset freeze tokens if quarter has changed
  if (data.usedFreezesQuarter && data.usedFreezesQuarter !== currentQuarter) {
    data.streakFreezeCount = 1;
    data.streakFreezeActive = false;
    data.usedFreezesQuarter = null;
  }

  return {
    balanceRef,
    data: {
      userId,
      xpPoints: data.xpPoints || 0,
      coins: data.coins || 0,
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      lastAttendedDate: data.lastAttendedDate || null,
      streakFreezeCount: typeof data.streakFreezeCount === 'number' ? data.streakFreezeCount : 1,
      streakFreezeActive: Boolean(data.streakFreezeActive),
      usedFreezesQuarter: data.usedFreezesQuarter || null,
      xpMultiplier: typeof data.xpMultiplier === 'number' ? data.xpMultiplier : 1.0,
      updatedAt: data.updatedAt || new Date().toISOString(),
    },
    exists: true,
  };
}

/**
 * Record a points ledger entry and update user balance atomically
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.amount
 * @param {'xp' | 'coin'} params.currencyType
 * @param {'attendance' | 'teacher_reward' | 'exam_pass' | 'parent_quick_approval' | 'streak_bonus'} params.source
 * @param {string} params.sourceRefId
 * @param {string} [params.reason]
 * @param {string} [params.createdBy]
 * @param {Record<string, any>} [params.metadata]
 * @param {string} [params.ledgerDocId]
 * @returns {Promise<{ awarded: boolean, balance: any }>}
 */
export async function awardPoints({
  userId,
  amount,
  currencyType,
  source,
  sourceRefId,
  reason = '',
  createdBy = 'system',
  metadata = {},
  ledgerDocId = null,
}) {
  if (!userId || amount <= 0) {
    return { awarded: false, reason: 'Invalid user or amount' };
  }

  const docId =
    ledgerDocId ||
    `ledger_${userId}_${source}_${sourceRefId ? sourceRefId.replace(/[^a-zA-Z0-9_-]/g, '_') : Date.now()}`;
  const ledgerRef = db.collection('pointsLedger').doc(docId);

  return await db.runTransaction(async (transaction) => {
    // 1. Check idempotency: if ledger entry already exists, skip
    const existingLedger = await transaction.get(ledgerRef);
    if (existingLedger.exists) {
      const balanceDoc = await transaction.get(db.collection('userBalances').doc(userId));
      return {
        awarded: false,
        alreadyProcessed: true,
        balance: balanceDoc.exists ? balanceDoc.data() : null,
      };
    }

    // 2. Fetch and prepare UserBalance
    const { balanceRef, data: balance } = await getOrCreateUserBalance(transaction, userId);
    const nowStr = new Date().toISOString();

    if (currencyType === 'xp') {
      balance.xpPoints += amount;
    } else if (currencyType === 'coin') {
      balance.coins += amount;
    }
    balance.updatedAt = nowStr;

    // 3. Write Ledger Entry
    transaction.set(ledgerRef, {
      id: docId,
      userId,
      amount,
      currencyType,
      source,
      sourceRefId,
      reason,
      createdBy,
      metadata,
      createdAt: nowStr,
    });

    // 4. Update UserBalance document
    transaction.set(balanceRef, balance, { merge: true });

    return {
      awarded: true,
      ledgerId: docId,
      balance,
    };
  });
}
