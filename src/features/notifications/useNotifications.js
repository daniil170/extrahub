import { useState, useEffect, useCallback } from 'react';
import { fetchUserNotifications, markNotificationAsRead } from './api.js';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await fetchUserNotifications(userId);
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  return { notifications, loading, error, markAsRead, refresh: loadNotifications };
}
