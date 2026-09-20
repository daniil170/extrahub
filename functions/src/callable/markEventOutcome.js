import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';
import { awardPoints } from '../shared/gamification.js';

export const markEventOutcome = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to grade event outcomes.');
  }

  const role = auth.token?.role || 'student';
  const isMaster = auth.token?.email === 'daniilivakin30@gmail.com' || auth.token?.isDemoMaster;
  if (!['teacher', 'coordinator', 'admin'].includes(role) && !isMaster) {
    throw new HttpsError('permission-denied', 'Only teachers and coordinators can mark event outcomes.');
  }

  const data = request.data || {};
  const eventId = data.eventId;
  const studentId = data.studentId;
  const outcome = data.outcome; // 'attended' | 'absent'
  const grade = data.grade !== undefined ? data.grade : null;
  const feedback = (data.feedback || '').trim();

  if (!eventId || !studentId) {
    throw new HttpsError('invalid-argument', 'Event ID and Student ID are required.');
  }

  if (!['attended', 'absent'].includes(outcome)) {
    throw new HttpsError('invalid-argument', 'Outcome must be attended or absent.');
  }

  try {
    const eventDoc = await db.collection('clubEvents').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found.');
    }
    const eventData = eventDoc.data();

    const responseId = `${eventId}_${studentId}`;
    const responseRef = db.collection('eventResponses').doc(responseId);
    const existing = await responseRef.get();
    const now = new Date().toISOString();

    const existingData = existing.exists ? existing.data() : {};
    let awardedPoints = Boolean(existingData.awardedPoints);
    let pointsAwardResult = null;

    if (outcome === 'attended' && !awardedPoints) {
      const xpAmount = Number(eventData.xpReward) || 0;
      const coinAmount = Number(eventData.coinsReward) || 0;
      const source = eventData.isBossEvent ? 'boss_event' : 'calendar_event';

      if (xpAmount > 0) {
        await awardPoints({
          userId: studentId,
          amount: xpAmount,
          currencyType: 'xp',
          source,
          sourceRefId: eventId,
          reason: eventData.isBossEvent ? `⚔️ Победа в Босс-Событии: ${eventData.title}` : `Участие в событии: ${eventData.title}`,
          createdBy: auth.uid,
          metadata: { eventId, eventTitle: eventData.title, grade },
        });
      }

      if (coinAmount > 0) {
        await awardPoints({
          userId: studentId,
          amount: coinAmount,
          currencyType: 'coin',
          source,
          sourceRefId: eventId,
          reason: eventData.isBossEvent ? `⚔️ Награда за Босс-Событие: ${eventData.title}` : `Бонус за событие: ${eventData.title}`,
          createdBy: auth.uid,
          metadata: { eventId, eventTitle: eventData.title, grade },
        });
      }

      awardedPoints = true;
      pointsAwardResult = { xp: xpAmount, coins: coinAmount };
    }

    const updatedResponse = {
      id: responseId,
      eventId,
      studentId,
      studentName: data.studentName || existingData.studentName || 'Ученик',
      status: existingData.status || 'accepted',
      outcome,
      grade,
      feedback,
      awardedPoints,
      gradedAt: now,
      gradedBy: auth.uid,
      updatedAt: now,
    };

    if (!existing.exists) {
      updatedResponse.createdAt = now;
      updatedResponse.respondedAt = now;
    }

    await responseRef.set(updatedResponse, { merge: true });

    await logAuditEvent({
      action: 'EVENT_OUTCOME_MARKED',
      actorId: auth.uid,
      actorRole: role,
      targetId: responseId,
      details: { eventId, studentId, outcome, grade, pointsAwardResult },
    });

    return {
      success: true,
      response: updatedResponse,
      pointsAwarded: pointsAwardResult,
    };
  } catch (err) {
    await logFunctionError('markEventOutcome', err, { data, uid: auth.uid });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Failed to mark event outcome: ${err.message}`);
  }
});
