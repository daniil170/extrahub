import {
  DEMO_EQUIPMENT_ISSUES,
  DEMO_ISSUE_COMMENTS,
} from '../../shared/data/demoData.js';
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
  subscribers.forEach((callback) => {
    try {
      callback([...devEquipmentIssuesStore]);
    } catch (err) {
      console.error('Error in equipment subscriber:', err);
    }
  });
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
    const weightDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Fetch equipment issues filtered by role and user from local demo store
 * @param {Object} [params]
 * @param {string} [params.role]
 * @param {string} [params.userId]
 * @returns {Promise<import('../../entities/equipmentIssue/model.js').EquipmentIssue[]>}
 */
export async function fetchEquipmentIssues({ role = 'technician', userId = '' } = {}) {
  if (role === 'teacher' && userId) {
    return sortIssues(devEquipmentIssuesStore.filter((i) => i.reportedBy === userId));
  }
  return sortIssues(devEquipmentIssuesStore);
}

/**
 * Fetch a single issue by ID from local demo store
 * @param {string} issueId
 */
export async function fetchIssueById(issueId) {
  return devEquipmentIssuesStore.find((i) => i.id === issueId) || null;
}

/**
 * Create a new equipment issue in demo store
 * @param {Object} issueData
 */
export async function createEquipmentIssueRecord(issueData) {
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

  return newIssue;
}

/**
 * Update issue status in demo store (take into work, resolve with comment, or cancel)
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

  return { success: true, issue: updatedIssue };
}

/**
 * Add a comment to an issue in demo store
 * @param {Object} params
 * @param {string} params.issueId
 * @param {string} params.text
 * @param {Object} [params.currentUser]
 */
export async function addIssueCommentRecord({ issueId, text, currentUser = {} }) {
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

  return newComment;
}

/**
 * Fetch all comments for a specific issue from demo store
 * @param {string} issueId
 */
export async function fetchIssueComments(issueId) {
  return devIssueCommentsStore[issueId] || [];
}

/**
 * Real-time subscription to local demo equipment store
 * @param {(issues: any[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeEquipmentIssues(callback) {
  subscribers.add(callback);
  // Send initial data immediately
  try {
    callback(sortIssues(devEquipmentIssuesStore));
  } catch (err) {
    console.error('Error sending initial equipment issues:', err);
  }
  return () => {
    subscribers.delete(callback);
  };
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
