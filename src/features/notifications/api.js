import { getDocuments, updateDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

import { DEMO_NOTIFICATIONS } from '../../shared/data/demoData.js';

const STORAGE_KEY = 'extrahub_notifications_v4';

const ROLE_NOTIFICATIONS = DEMO_NOTIFICATIONS;

function getAllInitialNotifications() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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

  // Flatten all role arrays
  const all = Object.values(ROLE_NOTIFICATIONS).flat();
  return all;
}

let devNotificationsStore = getAllInitialNotifications();
const listeners = new Set();

function persistStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devNotificationsStore));
    } catch {
      // ignore
    }
  }
}

function notifySubscribers() {
  listeners.forEach((listener) => {
    try {
      listener(devNotificationsStore);
    } catch (err) {
      console.error('Error in notifications listener:', err);
    }
  });
}

export function subscribeNotifications(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Fetch notifications for user / role
 * @param {string} userId
 * @param {string} [role]
 */
export async function fetchUserNotifications(userId, role = 'student') {
  try {
    const fetchPromise = getDocuments(COLLECTIONS.NOTIFICATIONS);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 300)
    );
    const data = await Promise.race([fetchPromise, timeoutPromise]);
    const userNotifs = data.filter((n) => n.userId === userId || n.role === role);
    if (userNotifs.length > 0) return userNotifs;
  } catch {
    // Graceful offline fallback
  }

  const roleList = devNotificationsStore.filter(
    (n) => n.role === role || n.userId === userId
  );

  return roleList.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
}

/**
 * Mark a specific notification as read
 * @param {string} notificationId
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const updatePromise = updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
      isRead: true,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 300)
    );
    await Promise.race([updatePromise, timeoutPromise]);
  } catch {
    // ignore
  }

  devNotificationsStore = devNotificationsStore.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  persistStore();
  notifySubscribers();
  return { success: true };
}

/**
 * Mark all notifications as read for a given role or user
 * @param {string} [role]
 * @param {string} [userId]
 */
export async function markAllNotificationsAsRead(role, userId) {
  devNotificationsStore = devNotificationsStore.map((n) => {
    if ((role && n.role === role) || (userId && n.userId === userId) || (!role && !userId)) {
      return { ...n, isRead: true };
    }
    return n;
  });

  persistStore();
  notifySubscribers();
  return { success: true };
}

/**
 * Add a new notification programmatically (e.g. from app actions)
 * @param {Object} notif
 */
export function addNotification(notif) {
  const newNotif = {
    id: notif.id || `notif-${Date.now()}`,
    role: notif.role || 'student',
    type: notif.type || 'system_notice',
    title: notif.title || 'Новое уведомление',
    text: notif.text || '',
    isRead: false,
    sentAt: notif.sentAt || new Date().toISOString(),
  };

  devNotificationsStore = [newNotif, ...devNotificationsStore];
  persistStore();
  notifySubscribers();
  return newNotif;
}

/**
 * Reset notifications store to defaults
 */
export function resetNotificationsStore() {
  devNotificationsStore = Object.values(ROLE_NOTIFICATIONS).flat();
  persistStore();
  notifySubscribers();
}
