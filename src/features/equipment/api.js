import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { functions, db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

/**
 * Priority weighting for sorting: critical > high > medium > low
 */
const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    // 1. Critical first
    const weightDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;
    // 2. Newest first
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Fetch equipment issues filtered by role and user from real Firestore
 * @param {Object} [params]
 * @param {string} [params.role]
 * @param {string} [params.userId]
 * @returns {Promise<import('../../entities/equipmentIssue/model.js').EquipmentIssue[]>}
 */
export async function fetchEquipmentIssues({ role = 'technician', userId = '' } = {}) {
  const colRef = collection(db, COLLECTIONS.EQUIPMENT_ISSUES);
  let q = colRef;
  if (role === 'teacher' && userId) {
    q = query(colRef, where('reportedBy', '==', userId));
  }
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return sortIssues(list);
}

/**
 * Fetch a single issue by ID from Firestore
 * @param {string} issueId
 */
export async function fetchIssueById(issueId) {
  const docRef = doc(db, COLLECTIONS.EQUIPMENT_ISSUES, issueId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a new equipment issue via Cloud Function
 * @param {Object} issueData
 */
export async function createEquipmentIssueRecord(issueData) {
  const callable = httpsCallable(functions, 'createEquipmentIssue');
  const res = await callable(issueData);
  if (!res?.data?.issue) {
    throw new Error('Не удалось создать заявку на ремонт оборудования');
  }
  return res.data.issue;
}

/**
 * Update issue status via Cloud Function
 * @param {Object} params
 * @param {string} params.issueId
 * @param {'in_progress' | 'resolved' | 'cancelled'} params.status
 * @param {string} [params.resolutionComment]
 */
export async function updateIssueStatusRecord({ issueId, status, resolutionComment = '' }) {
  const callable = httpsCallable(functions, 'updateIssueStatus');
  const res = await callable({ issueId, status, resolutionComment });
  if (!res?.data?.success) {
    throw new Error('Не удалось обновить статус заявки');
  }
  return res.data;
}

/**
 * Add a comment to an issue via Cloud Function
 * @param {Object} params
 * @param {string} params.issueId
 * @param {string} params.text
 */
export async function addIssueCommentRecord({ issueId, text }) {
  const callable = httpsCallable(functions, 'addIssueComment');
  const res = await callable({ issueId, text });
  if (!res?.data?.comment) {
    throw new Error('Не удалось отправить комментарий к заявке');
  }
  return res.data.comment;
}

/**
 * Fetch all comments for a specific issue from Firestore subcollection
 * @param {string} issueId
 */
export async function fetchIssueComments(issueId) {
  try {
    const commentsRef = collection(db, COLLECTIONS.EQUIPMENT_ISSUES, issueId, 'comments');
    const snap = await getDocs(query(commentsRef, orderBy('createdAt', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching issue comments:', err);
    return [];
  }
}

/**
 * Real-time subscription to equipment issues in Firestore
 */
export function subscribeEquipmentIssues(callback) {
  const colRef = collection(db, COLLECTIONS.EQUIPMENT_ISSUES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const liveData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sortIssues(liveData));
    },
    (error) => {
      console.error('Equipment issues subscription error:', error);
    }
  );
}

/**
 * Reset local store helper (kept for interface compatibility)
 */
export function resetEquipmentIssuesStore() {
  // No-op on real backend
}

