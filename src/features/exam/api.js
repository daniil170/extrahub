import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createEnrollmentCall } from '../enrollment/api.js';

/**
 * Submit an exam application for student to join an olympic reserve or competitive group
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} [params.studentName]
 * @param {number|string} [params.className]
 * @param {string} params.groupId
 * @param {string} params.activityId
 * @param {string} [params.activityTitle]
 * @param {string} [params.groupName]
 */
export async function createExamApplicationRecord({
  studentId,
  studentName = 'Ученик',
  className = '',
  groupId,
  activityId,
  activityTitle = 'Олимпийский резерв',
  groupName = 'Основная группа',
}) {
  const newId = `exam-${Date.now()}-${studentId.slice(-6)}`;
  const now = new Date().toISOString();

  const payload = {
    id: newId,
    studentId,
    studentName,
    className,
    groupId,
    activityId,
    activityTitle,
    groupName,
    status: 'pending', // 'pending' | 'passed' | 'failed'
    appliedAt: now,
    decidedAt: null,
    decidedBy: null,
  };

  const docRef = doc(db, COLLECTIONS.EXAM_APPLICATIONS, newId);
  await setDoc(docRef, payload);

  return { success: true, application: payload };
}

/**
 * Realtime subscription to exam applications of a student
 * @param {string} studentId
 * @param {(applications: any[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeStudentExamApplications(studentId, onUpdate, onError) {
  if (!studentId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.EXAM_APPLICATIONS),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
      onUpdate(list);
    },
    (err) => {
      console.error('subscribeStudentExamApplications error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Realtime subscription to all exam applications for Coordinator
 * @param {(applications: any[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeCoordinatorExamApplications(onUpdate, onError) {
  const colRef = collection(db, COLLECTIONS.EXAM_APPLICATIONS);

  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
      onUpdate(list);
    },
    (err) => {
      console.error('subscribeCoordinatorExamApplications error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Decision maker on an exam application (Passed / Failed)
 * If passed, automatically calls createEnrollmentCall to enroll student into group!
 * @param {Object} params
 * @param {string} params.applicationId
 * @param {'passed' | 'failed'} params.decision
 * @param {string} params.studentId
 * @param {string} params.groupId
 * @param {string} [params.coordinatorId]
 */
export async function decideExamApplicationRecord({
  applicationId,
  decision,
  status,
  studentId,
  groupId,
  coordinatorId = 'coordinator-1',
}) {
  const now = new Date().toISOString();
  const outcome = decision || status;

  if (outcome === 'passed') {
    // 1. Create real enrollment in group
    let enrollmentResult;
    try {
      enrollmentResult = await createEnrollmentCall({ studentId, groupId });
    } catch (enrollErr) {
      console.error('Auto-enrollment after exam pass failed:', enrollErr);
      throw new Error(
        `Экзамен отмечен как сдан, но произошла ошибка зачисления: ${enrollErr.message}`,
        { cause: enrollErr }
      );
    }

    // 2. Update exam application status
    const docRef = doc(db, COLLECTIONS.EXAM_APPLICATIONS, applicationId);
    await updateDoc(docRef, {
      status: 'passed',
      decidedAt: now,
      decidedBy: coordinatorId,
      enrollmentId: enrollmentResult?.enrollmentId || null,
    });

    return { success: true, status: 'passed', enrollmentResult };
  }

  // If failed
  const docRef = doc(db, COLLECTIONS.EXAM_APPLICATIONS, applicationId);
  await updateDoc(docRef, {
    status: 'failed',
    decidedAt: now,
    decidedBy: coordinatorId,
  });

  return { success: true, status: 'failed' };
}
