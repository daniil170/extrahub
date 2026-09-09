import { useState, useEffect, useCallback } from 'react';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeNotifications,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUserNotifications(userId, role);
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadNotifications();

    // Subscribe to store mutations
    const unsubscribe = subscribeNotifications(() => {
      loadNotifications();
    });

    return () => unsubscribe();
  }, [loadNotifications]);

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
