import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

const listeners = new Set();

export function subscribeNotifications(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Realtime Firestore subscription for user notifications
 * @param {string} userId
 * @param {(notifications: any[]) => void} callback
 */
export function subscribeUserNotifications(userId, callback) {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)));
      },
      (err) => {
        if (err.code !== 'permission-denied') {
          console.warn('Notifications subscription warning:', err);
        }
      }
    );
  } catch (err) {
    if (err.code !== 'permission-denied') {
      console.warn('Failed to subscribe user notifications:', err);
    }
    return () => {};
  }
}

/**
 * Fetch notifications for user from Firestore
 * @param {string} userId
 * @param {string} [_role]
 */
export async function fetchUserNotifications(userId, _role = 'student') {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return [];
  }
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  } catch (err) {
    if (err.code !== 'permission-denied') {
      console.warn('Failed to fetch user notifications:', err);
    }
    return [];
  }
}

/**
 * Mark a specific notification as read in Firestore
 * @param {string} notificationId
 */
export async function markNotificationAsRead(notificationId) {
  if (!auth.currentUser) return { success: true };
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(docRef, { isRead: true });
    return { success: true };
  } catch (err) {
    if (err.code === 'permission-denied') {
      return { success: true };
    }
    console.error('Failed to mark notification as read:', err);
    throw err;
  }
}

/**
 * Mark all notifications as read for a given user in Firestore
 * @param {string} [_role]
 * @param {string} [userId]
 */
export async function markAllNotificationsAsRead(_role, userId) {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return { success: true };
  }
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return { success: true };

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
    return { success: true };
  } catch (err) {
    if (err.code === 'permission-denied') {
      return { success: true };
    }
    console.error('Failed to mark all notifications as read:', err);
    throw err;
  }
}

/**
 * Add a notification programmatically
 * @param {Object} notif
 */
export function addNotification(notif) {
  // Can be used for transient client triggers
  return notif;
}

export function resetNotificationsStore() {
  // No-op on real backend
}

