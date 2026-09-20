import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

const MIN_BOSS_XP = 200;

export const createClubEvent = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to create events.');
  }

  const role = auth.token?.role || 'student';
  const isMaster = auth.token?.email === 'daniilivakin30@gmail.com' || auth.token?.isDemoMaster;
  
  if (!['teacher', 'coordinator', 'admin'].includes(role) && !isMaster) {
    throw new HttpsError('permission-denied', 'Only teachers and coordinators can create calendar events.');
  }

  const data = request.data || {};
  const title = (data.title || '').trim();
  if (!title) {
    throw new HttpsError('invalid-argument', 'Event title is required.');
  }

  if (!data.startTime || !data.endTime) {
    throw new HttpsError('invalid-argument', 'Valid start and end times are required.');
  }

  const isBossEvent = data.type === 'boss_event' || Boolean(data.isBossEvent);
  const type = data.type || (isBossEvent ? 'boss_event' : 'lesson');

  let xpReward = Number(data.xpReward) || 0;
  if (isBossEvent && xpReward < MIN_BOSS_XP) {
    xpReward = 300; // Default rewarding boss XP
  }

  let coinsReward = Number(data.coinsReward) || 0;
  if (isBossEvent && coinsReward === 0) {
    coinsReward = 50;
  }

  try {
    const eventRef = db.collection('clubEvents').doc();
    const now = new Date().toISOString();

    const eventPayload = {
      id: eventRef.id,
      title,
      description: (data.description || '').trim(),
      type,
      groupId: data.groupId || null,
      groupName: data.groupName || '',
      activityId: data.activityId || null,
      activityTitle: data.activityTitle || '',
      teacherId: data.teacherId || auth.uid,
      teacherName: data.teacherName || auth.token?.name || 'Преподаватель',
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      location: (data.location || '').trim() || 'Главный корпус',
      isBossEvent,
      xpReward,
      coinsReward,
      requiresRsvp: data.requiresRsvp !== undefined ? Boolean(data.requiresRsvp) : (isBossEvent || type === 'competition' || type === 'exam'),
      deadlineTime: data.deadlineTime ? new Date(data.deadlineTime).toISOString() : null,
      targetAudience: data.targetAudience || (data.groupId ? 'group' : 'all'),
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : null,
      createdBy: auth.uid,
      createdAt: now,
      updatedAt: now,
    };

    await eventRef.set(eventPayload);

    await logAuditEvent({
      action: 'CALENDAR_EVENT_CREATED',
      actorId: auth.uid,
      actorRole: role,
      targetId: eventRef.id,
      details: { title, type, isBossEvent, xpReward },
    });

    return { success: true, event: eventPayload };
  } catch (err) {
    await logFunctionError('createClubEvent', err, { data, uid: auth.uid });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Failed to create calendar event: ${err.message}`);
  }
});
