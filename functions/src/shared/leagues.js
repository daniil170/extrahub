import { db } from '../config/firebase.js';

export const LEAGUE_CONSTANTS = {
  MAX_GROUP_SIZE: 30,
  PROMOTION_TOP_COUNT: 5,
  RELEGATION_BOTTOM_COUNT: 5,
  RANK_ORDER: ['bronze', 'silver', 'gold', 'diamond'],
};

/**
 * Fisher-Yates unbiased array shuffle
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Split array of items into balanced groups of maximum size
 * @template T
 * @param {T[]} items
 * @param {number} [maxSize]
 * @returns {T[][]}
 */
export function splitIntoGroups(items, maxSize = LEAGUE_CONSTANTS.MAX_GROUP_SIZE) {
  if (!items || items.length === 0) return [];
  if (items.length <= maxSize) return [[...items]];

  const numGroups = Math.ceil(items.length / maxSize);
  const groups = Array.from({ length: numGroups }, () => []);

  items.forEach((item, index) => {
    groups[index % numGroups].push(item);
  });

  return groups;
}

/**
 * Retrieve current active season document (or null)
 * @returns {Promise<any|null>}
 */
export async function getActiveSeason() {
  try {
    const snap = await db
      .collection('seasons')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err) {
    console.warn('getActiveSeason error:', err.message);
    return null;
  }
}

/**
 * Increment seasonal XP in user's active LeagueMembership
 * @param {FirebaseFirestore.Transaction} transaction
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.xpAmount
 * @param {string} [params.seasonId]
 */
export async function incrementSeasonalLeagueXP(transaction, { userId, xpAmount, seasonId }) {
  if (!userId || !xpAmount || xpAmount <= 0) return;

  try {
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await getActiveSeason();
      if (!activeSeason) return; // No active season currently running
      targetSeasonId = activeSeason.id;
    }

    const membershipDocId = `${targetSeasonId}_${userId}`;
    const membershipRef = db.collection('leagueMemberships').doc(membershipDocId);
    const memberDoc = await transaction.get(membershipRef);
    const nowStr = new Date().toISOString();

    if (memberDoc.exists) {
      const currentXP = memberDoc.data().xpEarnedThisSeason || 0;
      transaction.update(membershipRef, {
        xpEarnedThisSeason: currentXP + xpAmount,
        updatedAt: nowStr,
      });
    } else {
      // If student was not yet in division, enroll in Bronze Group 1
      const divisionId = `${targetSeasonId}_bronze_group_1`;
      transaction.set(
        membershipRef,
        {
          id: membershipDocId,
          seasonId: targetSeasonId,
          divisionId,
          rank: 'bronze',
          groupNumber: 1,
          userId,
          xpEarnedThisSeason: xpAmount,
          pseudonym: '',
          useRealName: true,
          updatedAt: nowStr,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn(`Could not increment seasonal league XP for ${userId}:`, err.message);
  }
}

/**
 * Determine promoted/relegated rank
 * @param {'bronze' | 'silver' | 'gold' | 'diamond'} currentRank
 * @param {'promote' | 'relegate' | 'maintain'} action
 * @returns {'bronze' | 'silver' | 'gold' | 'diamond'}
 */
export function getNextRank(currentRank, action) {
  const ranks = LEAGUE_CONSTANTS.RANK_ORDER;
  const idx = ranks.indexOf(currentRank);
  if (idx === -1) return 'bronze';

  if (action === 'promote') {
    return ranks[Math.min(ranks.length - 1, idx + 1)];
  }
  if (action === 'relegate') {
    return ranks[Math.max(0, idx - 1)];
  }
  return currentRank;
}
