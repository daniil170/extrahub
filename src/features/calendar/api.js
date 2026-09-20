import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  setDoc,
  doc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createClubEvent, createEventResponse, EVENT_TYPES } from '../../entities/calendarEvent/model.js';

/**
 * Real-time subscription to school and club events
 * @param {Function} callback
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function subscribeClubEvents(callback, onError) {
  try {
    const q = collection(db, COLLECTIONS.CLUB_EVENTS);
    return onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((d) => createClubEvent({ id: d.id, ...d.data() }));
        callback(events);
      },
      (err) => {
        console.warn('subscribeClubEvents warning:', err.message);
        if (onError) onError(err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('subscribeClubEvents error:', err.message);
    if (onError) onError(err);
    callback([]);
    return () => {};
  }
}

/**
 * Real-time subscription to a student's event responses
 * @param {string} studentId
 * @param {Function} callback
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function subscribeStudentEventResponses(studentId, callback, onError) {
  if (!studentId) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.EVENT_RESPONSES),
      where('studentId', '==', studentId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const responses = snapshot.docs.map((d) => createEventResponse({ id: d.id, ...d.data() }));
        callback(responses);
      },
      (err) => {
        console.warn('subscribeStudentEventResponses warning:', err.message);
        if (onError) onError(err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('subscribeStudentEventResponses error:', err.message);
    if (onError) onError(err);
    callback([]);
    return () => {};
  }
}

/**
 * Real-time subscription to all event responses (for teachers/admins)
 * @param {Function} callback
 * @param {Function} [onError]
 * @returns {Function} unsubscribe
 */
export function subscribeAllEventResponses(callback, onError) {
  try {
    const q = collection(db, COLLECTIONS.EVENT_RESPONSES);
    return onSnapshot(
      q,
      (snapshot) => {
        const responses = snapshot.docs.map((d) => createEventResponse({ id: d.id, ...d.data() }));
        callback(responses);
      },
      (err) => {
        console.warn('subscribeAllEventResponses warning:', err.message);
        if (onError) onError(err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('subscribeAllEventResponses error:', err.message);
    if (onError) onError(err);
    callback([]);
    return () => {};
  }
}

/**
 * Helper hook / runner for createClubEvent callable
 */
export async function createClubEventCall(eventData) {
  try {
    const fn = httpsCallable(functions, 'createClubEvent');
    const result = await fn(eventData);
    return result.data;
  } catch (err) {
    console.warn('createClubEvent callable fallback to direct firestore:', err.message);
    // Direct Firestore fallback for demo/offline resilience
    const newDocRef = doc(collection(db, COLLECTIONS.CLUB_EVENTS));
    const normalized = createClubEvent({ ...eventData, id: newDocRef.id });
    await setDoc(newDocRef, normalized);
    return { success: true, event: normalized };
  }
}

/**
 * Helper hook / runner for respondToEvent callable
 */
export async function respondToEventCall({ eventId, studentId, studentName, status }) {
  try {
    const fn = httpsCallable(functions, 'respondToEvent');
    const result = await fn({ eventId, studentId, studentName, status });
    return result.data;
  } catch (err) {
    console.warn('respondToEvent callable fallback:', err.message);
    const responseId = `${eventId}_${studentId}`;
    const normalized = createEventResponse({
      id: responseId,
      eventId,
      studentId,
      studentName,
      status,
    });
    await setDoc(doc(db, COLLECTIONS.EVENT_RESPONSES, responseId), normalized, { merge: true });
    return { success: true, response: normalized };
  }
}

/**
 * Helper hook / runner for markEventOutcome callable
 */
export async function markEventOutcomeCall({ eventId, studentId, studentName, outcome, grade, feedback }) {
  try {
    const fn = httpsCallable(functions, 'markEventOutcome');
    const result = await fn({ eventId, studentId, studentName, outcome, grade, feedback });
    return result.data;
  } catch (err) {
    console.warn('markEventOutcome callable fallback:', err.message);
    const responseId = `${eventId}_${studentId}`;
    const normalized = createEventResponse({
      id: responseId,
      eventId,
      studentId,
      studentName,
      outcome,
      grade,
      feedback,
      awardedPoints: outcome === 'attended',
    });
    await setDoc(doc(db, COLLECTIONS.EVENT_RESPONSES, responseId), normalized, { merge: true });
    return { success: true, response: normalized };
  }
}
