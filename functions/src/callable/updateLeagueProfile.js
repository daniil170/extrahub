import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { getActiveSeason } from '../shared/leagues.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function for students to toggle anonymity (useRealName) and set a custom pseudonym
 */
export const updateLeagueProfile = onCall(async (request) => {
  try {
    const { useRealName, pseudonym } = request.data || {};

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;
    const cleanPseudonym = typeof pseudonym === 'string' ? pseudonym.trim().slice(0, 30) : '';
    const shouldShowRealName = useRealName !== undefined ? Boolean(useRealName) : true;

    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
      throw new HttpsError('failed-precondition', 'В данный момент нет активного сезона');
    }

    const membershipDocId = `${activeSeason.id}_${callerUid}`;
    const membershipRef = db.collection('leagueMemberships').doc(membershipDocId);

    const memDoc = await membershipRef.get();
    const nowStr = new Date().toISOString();

    if (memDoc.exists) {
      await membershipRef.update({
        useRealName: shouldShowRealName,
        pseudonym: cleanPseudonym,
        updatedAt: nowStr,
      });
    } else {
      // Create initial membership if not created yet
      await membershipRef.set({
        id: membershipDocId,
        seasonId: activeSeason.id,
        divisionId: `${activeSeason.id}_bronze_group_1`,
        rank: 'bronze',
        groupNumber: 1,
        userId: callerUid,
        xpEarnedThisSeason: 0,
        pseudonym: cleanPseudonym,
        useRealName: shouldShowRealName,
        updatedAt: nowStr,
      });
    }

    return {
      success: true,
      useRealName: shouldShowRealName,
      pseudonym: cleanPseudonym,
    };
  } catch (err) {
    console.error('updateLeagueProfile error:', err);
    await logFunctionError({
      functionName: 'updateLeagueProfile',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка обновления профиля лиги: ${err.message}`);
  }
});
