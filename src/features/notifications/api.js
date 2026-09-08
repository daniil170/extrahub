import { getDocuments, updateDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'parent_approval_request',
    text: 'Родителю отправлено приглашение для подтверждения записи в кружок Робототехники.',
    channel: 'push',
    isRead: false,
    sentAt: '2026-09-08T12:00:00.000Z',
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'attendance_alert',
    text: 'Ваше посещение занятия по Шахматам отмечено (Присутствовал).',
    channel: 'push',
    isRead: true,
    sentAt: '2026-09-07T16:00:00.000Z',
  },
];

/**
 * Fetch notifications for user
 * @param {string} userId
 */
export async function fetchUserNotifications(userId) {
  try {
    const data = await getDocuments(COLLECTIONS.NOTIFICATIONS);
    const userNotifs = data.filter((n) => n.userId === userId);
    return userNotifs.length > 0 ? userNotifs : MOCK_NOTIFICATIONS;
  } catch (error) {
    console.warn('Using mock notifications:', error.message);
    return MOCK_NOTIFICATIONS;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId
 */
export async function markNotificationAsRead(notificationId) {
  return updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
    isRead: true,
  });
}
