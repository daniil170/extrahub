import { httpsCallable } from 'firebase/functions';
import { functions } from '../../app/config/firebase.js';
import {
  COLLECTIONS,
  getDocuments,
  getDocument,
} from '../../shared/api/firebaseUtils.js';
import {
  DEMO_EQUIPMENT_ISSUES,
  DEMO_ISSUE_COMMENTS,
} from '../../shared/data/demoData.js';
import { addNotification } from '../notifications/api.js';
import {
  createEquipmentIssue,
  createIssueComment,
} from '../../entities/equipmentIssue/model.js';

const ISSUES_STORAGE_KEY = 'extrahub_equipment_issues_v2';
const COMMENTS_STORAGE_KEY = 'extrahub_equipment_comments_v2';

function getInitialIssues() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(ISSUES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [...DEMO_EQUIPMENT_ISSUES];
}

function getInitialComments() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return { ...DEMO_ISSUE_COMMENTS };
}

let devEquipmentIssuesStore = getInitialIssues();
let devIssueCommentsStore = getInitialComments();
const subscribers = new Set();

function persistStores() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(devEquipmentIssuesStore));
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(devIssueCommentsStore));
    } catch {
      // ignore
    }
  }
}

function notifySubscribers() {
  subscribers.forEach((sub) => {
    try {
      sub(devEquipmentIssuesStore);
    } catch (err) {
      console.error('Error in equipment issues subscriber:', err);
    }
  });
}

export function subscribeEquipmentIssues(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

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
 * Fetch equipment issues filtered by role and user
 * @param {Object} [params]
 * @param {string} [params.role]
 * @param {string} [params.userId]
 * @returns {Promise<import('../../entities/equipmentIssue/model.js').EquipmentIssue[]>}
 */
export async function fetchEquipmentIssues({ role = 'technician', userId = '' } = {}) {
  try {
    const fetchPromise = getDocuments(COLLECTIONS.EQUIPMENT_ISSUES);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 300)
    );
    const liveData = await Promise.race([fetchPromise, timeoutPromise]);
    if (liveData && liveData.length > 0) {
      if (role === 'teacher') {
        return sortIssues(liveData.filter((i) => i.reportedBy === userId));
      }
      return sortIssues(liveData);
    }
  } catch {
    // Fallback to reactive dev store
  }

  if (role === 'teacher') {
    return sortIssues(devEquipmentIssuesStore.filter((i) => i.reportedBy === userId));
  }
  return sortIssues(devEquipmentIssuesStore);
}

/**
 * Fetch a single issue by ID
 * @param {string} issueId
 */
export async function fetchIssueById(issueId) {
  try {
    const doc = await getDocument(COLLECTIONS.EQUIPMENT_ISSUES, issueId);
    if (doc) return doc;
  } catch {
    // fallback
  }
  return devEquipmentIssuesStore.find((i) => i.id === issueId) || null;
}

/**
 * Create a new equipment issue
 * @param {Object} issueData
 */
export async function createEquipmentIssueRecord(issueData) {
  try {
    const callable = httpsCallable(functions, 'createEquipmentIssue');
    const res = await callable(issueData);
    if (res?.data?.issue) {
      devEquipmentIssuesStore = [res.data.issue, ...devEquipmentIssuesStore];
      persistStores();
      notifySubscribers();
      return res.data.issue;
    }
  } catch (err) {
    console.warn('createEquipmentIssue Cloud Function unavailable, using dev simulation:', err.message);
  }

  const now = new Date().toISOString();
  const newIssue = createEquipmentIssue({
    ...issueData,
    id: `issue-${Date.now()}`,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  });

  devEquipmentIssuesStore = [newIssue, ...devEquipmentIssuesStore];
  persistStores();
  notifySubscribers();

  // Trigger role notification for technicians and admin
  const isUrgent = newIssue.priority === 'critical' || newIssue.priority === 'high';
  addNotification({
    role: 'technician',
    type: isUrgent ? 'equipment_critical' : 'equipment_issue_created',
    title: isUrgent ? `СРОЧНО: Поломка [${newIssue.title}]` : `Новая заявка: ${newIssue.title}`,
    text: `Кабинет: ${newIssue.location} | Приоритет: ${newIssue.priority}. Автор: ${newIssue.reportedByName || 'Преподаватель'}`,
    sentAt: now,
  });

  addNotification({
    role: 'admin',
    type: isUrgent ? 'equipment_critical' : 'equipment_issue_created',
    title: isUrgent ? `СРОЧНО: Поломка оборудования` : `Новая заявка на ремонт`,
    text: `Подана заявка «${newIssue.title}» в ${newIssue.location}.`,
    sentAt: now,
  });

  return newIssue;
}

/**
 * Update issue status (take into work, resolve with comment, or cancel)
 * @param {Object} params
 * @param {string} params.issueId
 * @param {'in_progress' | 'resolved' | 'cancelled'} params.status
 * @param {string} [params.resolutionComment]
 * @param {Object} [params.currentUser]
 */
export async function updateIssueStatusRecord({
  issueId,
  status,
  resolutionComment = '',
  currentUser = {},
}) {
  try {
    const callable = httpsCallable(functions, 'updateIssueStatus');
    const res = await callable({ issueId, status, resolutionComment });
    if (res?.data?.success) {
      // update local
      devEquipmentIssuesStore = devEquipmentIssuesStore.map((iss) =>
        iss.id === issueId ? { ...iss, ...res.data.updates, status } : iss
      );
      persistStores();
      notifySubscribers();
      return res.data;
    }
  } catch (err) {
    console.warn('updateIssueStatus Cloud Function unavailable, using dev simulation:', err.message);
  }

  const now = new Date().toISOString();
  let updatedIssue = null;

  devEquipmentIssuesStore = devEquipmentIssuesStore.map((iss) => {
    if (iss.id === issueId) {
      const updates = {
        ...iss,
        status,
        updatedAt: now,
      };

      if (status === 'in_progress') {
        updates.assignedTo = currentUser.id || 'technician-1';
        updates.assignedToName = currentUser.fullName || 'Дежурный техник';
      } else if (status === 'resolved') {
        updates.resolutionComment = resolutionComment.trim();
        updates.resolvedAt = now;
        if (!updates.assignedTo) {
          updates.assignedTo = currentUser.id || 'technician-1';
          updates.assignedToName = currentUser.fullName || 'Дежурный техник';
        }
      }

      updatedIssue = updates;
      return updates;
    }
    return iss;
  });

  persistStores();
  notifySubscribers();

  // Notify issue author (teacher)
  if (updatedIssue) {
    const statusTitles = {
      in_progress: 'Заявка взята в работу',
      resolved: 'Заявка успешно закрыта',
      cancelled: 'Заявка отменена',
    };

    const statusTexts = {
      in_progress: `Техник ${updatedIssue.assignedToName || 'школы'} приступил к ремонту «${updatedIssue.title}» (${updatedIssue.location}).`,
      resolved: `Заявка «${updatedIssue.title}» закрыта. Отчёт: "${updatedIssue.resolutionComment}".`,
      cancelled: `Заявка «${updatedIssue.title}» была отменена.`,
    };

    addNotification({
      userId: updatedIssue.reportedBy,
      role: 'teacher',
      type: `equipment_issue_${status}`,
      title: statusTitles[status] || 'Статус заявки изменен',
      text: statusTexts[status] || `Статус: ${status}`,
      sentAt: now,
    });
  }

  return { success: true, issue: updatedIssue };
}

/**
 * Add a comment to an issue
 * @param {Object} params
 * @param {string} params.issueId
 * @param {string} params.text
 * @param {Object} params.currentUser
 */
export async function addIssueCommentRecord({ issueId, text, currentUser = {} }) {
  try {
    const callable = httpsCallable(functions, 'addIssueComment');
    const res = await callable({ issueId, text });
    if (res?.data?.comment) {
      const comment = res.data.comment;
      const currentComments = devIssueCommentsStore[issueId] || [];
      devIssueCommentsStore = {
        ...devIssueCommentsStore,
        [issueId]: [...currentComments, comment],
      };
      persistStores();
      notifySubscribers();
      return comment;
    }
  } catch (err) {
    console.warn('addIssueComment Cloud Function unavailable, using dev simulation:', err.message);
  }

  const now = new Date().toISOString();
  const newComment = createIssueComment({
    id: `com-${Date.now()}`,
    issueId,
    authorId: currentUser.id || 'dev-user',
    authorName: currentUser.fullName || 'Пользователь',
    authorRole: currentUser.role || 'teacher',
    text: text.trim(),
    createdAt: now,
  });

  const currentComments = devIssueCommentsStore[issueId] || [];
  devIssueCommentsStore = {
    ...devIssueCommentsStore,
    [issueId]: [...currentComments, newComment],
  };

  // Bump issue updatedAt
  devEquipmentIssuesStore = devEquipmentIssuesStore.map((iss) =>
    iss.id === issueId ? { ...iss, updatedAt: now } : iss
  );

  persistStores();
  notifySubscribers();

  // Send notification to the other party
  const targetIssue = devEquipmentIssuesStore.find((i) => i.id === issueId);
  if (targetIssue) {
    const isTeacher = currentUser.role === 'teacher';
    addNotification({
      userId: isTeacher ? (targetIssue.assignedTo || '') : targetIssue.reportedBy,
      role: isTeacher ? 'technician' : 'teacher',
      type: 'equipment_comment',
      title: `Новое сообщение по заявке «${targetIssue.title}»`,
      text: `${newComment.authorName}: "${newComment.text.length > 80 ? newComment.text.substring(0, 77) + '...' : newComment.text}"`,
      sentAt: now,
    });
  }

  return newComment;
}

/**
 * Fetch all comments for a specific issue
 * @param {string} issueId
 */
export async function fetchIssueComments(issueId) {
  return devIssueCommentsStore[issueId] || [];
}

/**
 * Reset local store to default demo dataset
 */
export function resetEquipmentIssuesStore() {
  devEquipmentIssuesStore = [...DEMO_EQUIPMENT_ISSUES];
  devIssueCommentsStore = { ...DEMO_ISSUE_COMMENTS };
  persistStores();
  notifySubscribers();
}
