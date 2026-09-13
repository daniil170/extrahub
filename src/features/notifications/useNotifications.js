import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../app/config/firebase.js';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeNotifications,
  subscribeUserNotifications,
} from './api.js';

/**
 * Hook to manage user notifications for a given user object or userId + role
 * @param {Object|string} userOrId
 * @param {string} [roleFallback]
 */
export function useNotifications(userOrId, roleFallback) {
  const userId = typeof userOrId === 'object' ? userOrId?.id : userOrId;
  const role = typeof userOrId === 'object' ? userOrId?.role : roleFallback || 'student';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchUserNotifications(userId, role);
      setNotifications(data);
    } catch (err) {
      if (err.code !== 'permission-denied') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadNotifications();

    // Subscribe to store mutations
    const unsubscribeStore = subscribeNotifications(() => {
      loadNotifications();
    });

    // Realtime Firestore subscription when authenticated
    const unsubscribeFirestore = subscribeUserNotifications(userId, (liveData) => {
      setNotifications(liveData);
    });

    // Re-check when Firebase Auth changes (e.g. login/logout)
    const unsubscribeAuth = onAuthStateChanged(auth, () => {
      loadNotifications();
    });

    return () => {
      unsubscribeStore();
      unsubscribeFirestore();
      unsubscribeAuth();
    };
  }, [userId, loadNotifications]);

  const markAsRead = useCallback(
    async (notificationId) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      await markNotificationAsRead(notificationId);
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsAsRead(role, userId);
  }, [role, userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
