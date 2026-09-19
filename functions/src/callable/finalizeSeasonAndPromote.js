import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import {
  shuffleArray,
  splitIntoGroups,
  getNextRank,
  LEAGUE_CONSTANTS,
} from '../shared/leagues.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to finalize the current season and redistribute students into next season leagues
 */
export const finalizeSeasonAndPromote = onCall(async (request) => {
  try {
    const { seasonId, nextSeasonName, nextStartDate, nextEndDate } = request.data || {};

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;
    const userDoc = await db.collection('users').doc(callerUid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const isAdmin = userData.role === 'admin' || userData.role === 'coordinator';
    const isMaster = userData.isDemoMaster || userData.email === 'daniilivakin30@gmail.com';

    if (!isAdmin && !isMaster) {
      throw new HttpsError('permission-denied', 'Только администратор может завершать сезон');
    }

    // 1. Identify season to finalize
    let currentSeasonRef;
    let currentSeasonData;

    if (seasonId) {
      currentSeasonRef = db.collection('seasons').doc(seasonId);
      const sDoc = await currentSeasonRef.get();
      if (!sDoc.exists) {
        throw new HttpsError('not-found', `Сезон ${seasonId} не найден`);
      }
      currentSeasonData = sDoc.data();
    } else {
      const activeSnap = await db.collection('seasons').where('status', '==', 'active').limit(1).get();
      if (activeSnap.empty) {
        throw new HttpsError('failed-precondition', 'Нет активного сезона для завершения');
      }
      currentSeasonRef = activeSnap.docs[0].ref;
      currentSeasonData = activeSnap.docs[0].data();
    }

    const currentSeasonId = currentSeasonRef.id;
    const nowStr = new Date().toISOString();

    // 2. Fetch all divisions of this season
    const divisionsSnap = await db
      .collection('leagueDivisions')
      .where('seasonId', '==', currentSeasonId)
      .get();

    // 3. Fetch all memberships of this season
    const membershipsSnap = await db
      .collection('leagueMemberships')
      .where('seasonId', '==', currentSeasonId)
      .get();

    // Map memberships by divisionId
    const divisionMembersMap = {};
    divisionsSnap.forEach((d) => {
      divisionMembersMap[d.id] = [];
    });

    membershipsSnap.forEach((mSnap) => {
      const data = mSnap.data();
      if (divisionMembersMap[data.divisionId]) {
        divisionMembersMap[data.divisionId].push(data);
      } else {
        divisionMembersMap[data.divisionId] = [data];
      }
    });

    const studentRankAssignments = []; // { userId, newRank, oldRank, pseudonym, useRealName, xpPrevSeason }
    const promotions = [];
    const relegations = [];
    const maintained = [];

    // 4. Calculate promotions & relegations for each division
    divisionsSnap.forEach((divDoc) => {
      const division = divDoc.data();
      const members = divisionMembersMap[divDoc.id] || [];

      // Sort by seasonal XP descending
      members.sort((a, b) => (b.xpEarnedThisSeason || 0) - (a.xpEarnedThisSeason || 0));

      const totalMembers = members.length;
      const topCount = Math.min(LEAGUE_CONSTANTS.PROMOTION_TOP_COUNT, totalMembers);
      const bottomCount = Math.min(LEAGUE_CONSTANTS.RELEGATION_BOTTOM_COUNT, Math.max(0, totalMembers - topCount));

      members.forEach((member, index) => {
        let action = 'maintain';
        if (index < topCount) {
          action = 'promote';
        } else if (index >= totalMembers - bottomCount) {
          action = 'relegate';
        }

        const newRank = getNextRank(division.rank, action);

        const assignment = {
          userId: member.userId,
          oldRank: division.rank,
          newRank,
          action,
          pseudonym: member.pseudonym || '',
          useRealName: member.useRealName !== undefined ? member.useRealName : true,
          xpPrevSeason: member.xpEarnedThisSeason || 0,
        };

        studentRankAssignments.push(assignment);

        if (action === 'promote') {
          promotions.push({ userId: member.userId, from: division.rank, to: newRank });
        } else if (action === 'relegate') {
          relegations.push({ userId: member.userId, from: division.rank, to: newRank });
        } else {
          maintained.push({ userId: member.userId, rank: newRank });
        }
      });
    });

    // 5. Create new Season
    const newSeasonId = `season-${Date.now()}`;
    const newSeasonName =
      nextSeasonName || `Сезон ${new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`;
    const newStartDate = nextStartDate || new Date().toISOString().slice(0, 10);
    const newEndDate =
      nextEndDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    const batch = db.batch();

    // Close old season
    batch.update(currentSeasonRef, {
      status: 'completed',
      finalizedAt: nowStr,
    });

    // Create new season
    const newSeasonRef = db.collection('seasons').doc(newSeasonId);
    batch.set(newSeasonRef, {
      id: newSeasonId,
      name: newSeasonName,
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'active',
      createdAt: nowStr,
      finalizedAt: null,
      previousSeasonId: currentSeasonId,
      createdBy: callerUid,
    });

    // 6. Group students by new rank tier and randomly shuffle into groups of max 30
    const rankGroups = {
      diamond: [],
      gold: [],
      silver: [],
      bronze: [],
    };

    studentRankAssignments.forEach((st) => {
      if (rankGroups[st.newRank]) {
        rankGroups[st.newRank].push(st);
      } else {
        rankGroups.bronze.push(st);
      }
    });

    const newDivisionsCreated = [];

    const rankTitles = {
      diamond: 'Алмазная лига',
      gold: 'Золотая лига',
      silver: 'Серебряная лига',
      bronze: 'Бронзовая лига',
    };

    // Create divisions for each rank
    for (const [rankKey, students] of Object.entries(rankGroups)) {
      if (students.length === 0) continue;

      // Random shuffle to ensure fair non-deterministic group placement
      const shuffled = shuffleArray(students);
      const groups = splitIntoGroups(shuffled, LEAGUE_CONSTANTS.MAX_GROUP_SIZE);

      groups.forEach((groupStudents, groupIdx) => {
        const groupNumber = groupIdx + 1;
        const divisionId = `${newSeasonId}_${rankKey}_group_${groupNumber}`;
        const divisionRef = db.collection('leagueDivisions').doc(divisionId);

        batch.set(divisionRef, {
          id: divisionId,
          seasonId: newSeasonId,
          rank: rankKey,
          groupNumber,
          name: `${rankTitles[rankKey]} • Группа ${groupNumber}`,
          createdAt: nowStr,
        });

        newDivisionsCreated.push({
          divisionId,
          rank: rankKey,
          groupNumber,
          studentCount: groupStudents.length,
        });

        // Add memberships
        groupStudents.forEach((st) => {
          const membershipDocId = `${newSeasonId}_${st.userId}`;
          const memberRef = db.collection('leagueMemberships').doc(membershipDocId);

          batch.set(memberRef, {
            id: membershipDocId,
            seasonId: newSeasonId,
            divisionId,
            rank: rankKey,
            groupNumber,
            userId: st.userId,
            xpEarnedThisSeason: 0,
            pseudonym: st.pseudonym || '',
            useRealName: st.useRealName,
            updatedAt: nowStr,
          });
        });
      });
    }

    await batch.commit();

    await logAuditEvent({
      action: 'league.season_finalized_and_promoted',
      actorId: callerUid,
      actorRole: userData.role || 'admin',
      targetId: currentSeasonId,
      targetType: 'season',
      metadata: {
        completedSeasonId: currentSeasonId,
        newSeasonId,
        promotedCount: promotions.length,
        relegatedCount: relegations.length,
        maintainedCount: maintained.length,
      },
    });

    return {
      success: true,
      completedSeasonId: currentSeasonId,
      newSeasonId,
      newSeasonName,
      summary: {
        totalStudentsProcessed: studentRankAssignments.length,
        promotedCount: promotions.length,
        relegatedCount: relegations.length,
        maintainedCount: maintained.length,
        newDivisionsCount: newDivisionsCreated.length,
      },
      newDivisions: newDivisionsCreated,
    };
  } catch (err) {
    console.error('finalizeSeasonAndPromote error:', err);
    await logFunctionError({
      functionName: 'finalizeSeasonAndPromote',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка завершения сезона: ${err.message}`);
  }
});
