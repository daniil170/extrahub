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
import { createLeagueMembership, createSeason } from '../../entities/league/model.js';

/**
 * Realtime subscription to the active season
 * @param {(season: import('../../entities/league/model.js').Season|null) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeActiveSeason(onUpdate, onError) {
  const q = query(
    collection(db, COLLECTIONS.SEASONS),
    where('status', '==', 'active')
  );

  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        onUpdate({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Fallback default season if Firestore hasn't been initialized yet
        onUpdate(
          createSeason({
            id: 'season-demo-current',
            name: 'Осенний сезон 2026 (1 четверть)',
            status: 'active',
          })
        );
      }
    },
    (err) => {
      onUpdate(
        createSeason({
          id: 'season-demo-current',
          name: 'Осенний сезон 2026 (1 четверть)',
          status: 'active',
        })
      );
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to student's league membership for current active season
 * @param {string} userId
 * @param {(membership: import('../../entities/league/model.js').LeagueMembership|null) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeStudentLeagueMembership(userId, onUpdate, onError) {
  const fallbackMembership = createLeagueMembership({
    id: `season-demo_${userId || 'student-1'}`,
    seasonId: 'season-demo-current',
    divisionId: 'season-demo-current_bronze_group_1',
    rank: 'bronze',
    groupNumber: 1,
    userId: userId || 'student-1',
    xpEarnedThisSeason: 0,
    useRealName: true,
  });

  if (!userId) {
    onUpdate(fallbackMembership);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.LEAGUE_MEMBERSHIPS),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        // Sort by updatedAt desc in case of multiple season history
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        onUpdate(list[0]);
      } else {
        // Fallback demo membership
        onUpdate(fallbackMembership);
      }
    },
    (err) => {
      onUpdate(fallbackMembership);
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to all participants in a specific division leaderboard
 * @param {string} divisionId
 * @param {(members: import('../../entities/league/model.js').LeagueMembership[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeDivisionLeaderboard(divisionId, onUpdate, onError) {
  const fallbackMembers = [
    { id: 'm1', userId: 'student-demo-1', fullName: 'Алихан Сейткали', rank: 'bronze', xpEarnedThisSeason: 250, useRealName: true, pseudonym: '' },
    { id: 'm2', userId: 'student-demo-2', fullName: 'Айзере Нургалиева', rank: 'bronze', xpEarnedThisSeason: 220, useRealName: false, pseudonym: 'CyberFox' },
    { id: 'm3', userId: 'student-demo-3', fullName: 'Дамир Касымов', rank: 'bronze', xpEarnedThisSeason: 190, useRealName: true, pseudonym: '' },
    { id: 'm4', userId: 'student-demo-4', fullName: 'София Ким', rank: 'bronze', xpEarnedThisSeason: 160, useRealName: true, pseudonym: '' },
    { id: 'm5', userId: 'student-1', fullName: 'Алихан (Вы)', rank: 'bronze', xpEarnedThisSeason: 150, useRealName: true, pseudonym: '' },
    { id: 'm6', userId: 'student-demo-5', fullName: 'Арсен Маликов', rank: 'bronze', xpEarnedThisSeason: 100, useRealName: false, pseudonym: 'ShadowCoder' },
    { id: 'm7', userId: 'student-demo-6', fullName: 'Диана Жакипова', rank: 'bronze', xpEarnedThisSeason: 50, useRealName: true, pseudonym: '' },
    { id: 'm8', userId: 'student-demo-7', fullName: 'Тимур Ержанов', rank: 'bronze', xpEarnedThisSeason: 0, useRealName: true, pseudonym: '' },
  ];

  if (!divisionId) {
    onUpdate(fallbackMembers);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.LEAGUE_MEMBERSHIPS),
    where('divisionId', '==', divisionId)
  );

  return onSnapshot(
    q,
    async (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Fetch user display names if needed
      if (list.length === 0) {
        list = fallbackMembers;
      } else {
        // Try to attach student full names for students that useRealName
        try {
          const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
          const nameMap = {};
          studentsSnap.forEach((d) => {
            nameMap[d.id] = d.data().fullName;
          });

          list = list.map((m) => ({
            ...m,
            fullName: nameMap[m.userId] || (m.userId === 'student-1' ? 'Алихан Сейткали' : `Ученик (${m.userId.slice(0, 6)})`),
          }));
        } catch (e) {
          // ignore name lookup failure
        }
      }

      // Sort strictly by seasonal XP descending
      list.sort((a, b) => (b.xpEarnedThisSeason || 0) - (a.xpEarnedThisSeason || 0));
      onUpdate(list);
    },
    (err) => {
      onUpdate(fallbackMembers);
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to all seasons (for admin)
 * @param {(seasons: import('../../entities/league/model.js').Season[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeAllSeasons(onUpdate, onError) {
  const colRef = collection(db, COLLECTIONS.SEASONS);

  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      onUpdate(list);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to divisions in a season
 * @param {string} seasonId
 * @param {(divisions: import('../../entities/league/model.js').LeagueDivision[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeSeasonDivisions(seasonId, onUpdate, onError) {
  if (!seasonId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.LEAGUE_DIVISIONS),
    where('seasonId', '==', seasonId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.groupNumber || 1) - (b.groupNumber || 1));
      onUpdate(list);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Call Cloud Function to create a new Season
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.startDate
 * @param {string} params.endDate
 */
export async function createSeasonCall({ name, startDate, endDate }) {
  try {
    const fn = httpsCallable(functions, 'createSeason');
    const res = await fn({ name, startDate, endDate });
    return res.data;
  } catch (err) {
    console.error('createSeasonCall failed:', err);
    throw new Error(err.message || 'Не удалось создать сезон');
  }
}

/**
 * Call Cloud Function to finalize current season and promote/relegate
 * @param {Object} params
 * @param {string} params.seasonId
 * @param {string} [params.nextSeasonName]
 * @param {string} [params.nextStartDate]
 * @param {string} [params.nextEndDate]
 */
export async function finalizeSeasonAndPromoteCall({
  seasonId,
  nextSeasonName,
  nextStartDate,
  nextEndDate,
}) {
  try {
    const fn = httpsCallable(functions, 'finalizeSeasonAndPromote');
    const res = await fn({ seasonId, nextSeasonName, nextStartDate, nextEndDate });
    return res.data;
  } catch (err) {
    console.error('finalizeSeasonAndPromoteCall failed:', err);
    throw new Error(err.message || 'Не удалось завершить сезон');
  }
}

/**
 * Call Cloud Function to update student's league privacy profile
 * @param {Object} params
 * @param {boolean} params.useRealName
 * @param {string} params.pseudonym
 */
export async function updateLeagueProfileCall({ useRealName, pseudonym }) {
  try {
    const fn = httpsCallable(functions, 'updateLeagueProfile');
    const res = await fn({ useRealName, pseudonym });
    return res.data;
  } catch (err) {
    console.error('updateLeagueProfileCall failed:', err);
    throw new Error(err.message || 'Не удалось обновить настройки профиля');
  }
}
