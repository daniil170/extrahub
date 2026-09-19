/**
 * Gamification Data Models (Firestore Collections: userBalances, pointsLedger)
 */

/**
 * @typedef {'xp' | 'coin'} CurrencyType
 */

/**
 * @typedef {'attendance' | 'teacher_reward' | 'exam_pass' | 'parent_quick_approval' | 'streak_bonus'} PointsSource
 */

/**
 * @typedef {Object} UserBalance
 * @property {string} userId - Target student / user ID
 * @property {number} xpPoints - Total accumulated experience points
 * @property {number} coins - Spendable extra coins balance
 * @property {number} currentStreak - Current continuous attendance streak (in sessions / weeks)
 * @property {number} longestStreak - All-time maximum attendance streak reached
 * @property {string|null} lastAttendedDate - ISO date (YYYY-MM-DD) of the last marked attendance
 * @property {number} streakFreezeCount - Available freeze tokens for current quarter (default max 1 per quarter)
 * @property {boolean} streakFreezeActive - Whether a freeze is pre-activated for the upcoming class
 * @property {string|null} usedFreezesQuarter - Quarter identifier when freeze was last used (e.g., '2026-Q1')
 * @property {number} xpMultiplier - XP bonus multiplier applied to future awards (default 1.0, increases with streak milestones)
 * @property {string} updatedAt - ISO timestamp of last balance update
 */

/**
 * @typedef {Object} PointsLedgerEntry
 * @property {string} id - Unique immutable transaction ledger entry ID
 * @property {string} userId - Student ID receiving the points/coins
 * @property {number} amount - Amount awarded (positive integer)
 * @property {CurrencyType} currencyType - Currency type ('xp' or 'coin')
 * @property {PointsSource} source - Cause of transaction
 * @property {string} sourceRefId - ID of the originating event (e.g. attendance record ID, enrollmentId, examAppId)
 * @property {string} [reason] - Human-readable explanation (e.g. for teacher rewards)
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} createdBy - Initiator identifier ('system' or teacher user ID)
 */

export const GAMIFICATION_CONSTANTS = {
  ATTENDANCE_XP: 50,
  ATTENDANCE_COINS: 10,
  PARENT_QUICK_APPROVAL_COINS: 20,
  EXAM_PASS_XP: 100,
  MAX_TEACHER_DAILY_REWARDS: 5,
  MAX_FREEZES_PER_QUARTER: 1,
  STREAK_THRESHOLDS: [
    { streak: 4, multiplier: 1.5, label: '4 недели (+50% XP)' },
    { streak: 8, multiplier: 2.0, label: '8 недель (+100% XP)' },
    { streak: 12, multiplier: 2.5, label: '12 недель (+150% XP)' },
  ],
};

/**
 * Factory function to create an empty UserBalance
 * @param {Partial<UserBalance>} data
 * @returns {UserBalance}
 */
export function createUserBalance(data = {}) {
  return {
    userId: data.userId || '',
    xpPoints: typeof data.xpPoints === 'number' ? data.xpPoints : 0,
    coins: typeof data.coins === 'number' ? data.coins : 0,
    currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : 0,
    longestStreak: typeof data.longestStreak === 'number' ? data.longestStreak : 0,
    lastAttendedDate: data.lastAttendedDate || null,
    streakFreezeCount: typeof data.streakFreezeCount === 'number' ? data.streakFreezeCount : 1,
    streakFreezeActive: Boolean(data.streakFreezeActive),
    usedFreezesQuarter: data.usedFreezesQuarter || null,
    xpMultiplier: typeof data.xpMultiplier === 'number' ? data.xpMultiplier : 1.0,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Factory function to create a PointsLedgerEntry
 * @param {Partial<PointsLedgerEntry>} data
 * @returns {PointsLedgerEntry}
 */
export function createPointsLedgerEntry(data = {}) {
  return {
    id: data.id || `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: data.userId || '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currencyType: data.currencyType || 'xp',
    source: data.source || 'attendance',
    sourceRefId: data.sourceRefId || '',
    reason: data.reason || '',
    createdAt: data.createdAt || new Date().toISOString(),
    createdBy: data.createdBy || 'system',
  };
}
