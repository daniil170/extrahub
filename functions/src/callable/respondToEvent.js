import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

export const respondToEvent = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to RSVP to an event.');
  }

  const data = request.data || {};
  const eventId = data.eventId;
  const studentId = data.studentId || auth.uid;
  const status = data.status; // 'accepted' | 'declined' | 'tentative'

  if (!eventId) {
    throw new HttpsError('invalid-argument', 'Event ID is required.');
  }

  if (!['accepted', 'declined', 'tentative'].includes(status)) {
    throw new HttpsError('invalid-argument', 'Invalid RSVP status.');
  }

  try {
    const eventDoc = await db.collection('clubEvents').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Calendar event not found.');
    }

    const responseId = `${eventId}_${studentId}`;
    const responseRef = db.collection('eventResponses').doc(responseId);
    const existing = await responseRef.get();
    const now = new Date().toISOString();

    const responsePayload = {
      id: responseId,
      eventId,
      studentId,
      studentName: data.studentName || auth.token?.name || 'Ученик',
      status,
      outcome: existing.exists ? (existing.data().outcome || 'pending') : 'pending',
      grade: existing.exists ? (existing.data().grade || null) : null,
      feedback: existing.exists ? (existing.data().feedback || '') : '',
      respondedAt: now,
      updatedAt: now,
    };

    if (!existing.exists) {
      responsePayload.createdAt = now;
      responsePayload.awardedPoints = false;
    }

    await responseRef.set(responsePayload, { merge: true });

    await logAuditEvent({
      action: 'EVENT_RSVP_UPDATED',
      actorId: auth.uid,
      targetId: responseId,
      details: { eventId, studentId, status },
    });

    return { success: true, response: responsePayload };
  } catch (err) {
    await logFunctionError('respondToEvent', err, { data, uid: auth.uid });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Failed to RSVP to event: ${err.message}`);
  }
});
