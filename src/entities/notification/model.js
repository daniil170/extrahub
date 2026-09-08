/**
 * @typedef {'push' | 'email'} NotificationChannel
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique notification ID
 * @property {string} userId - Target recipient User ID
 * @property {string} type - Event category (e.g. 'parent_approval_request', 'enrollment_confirmed', 'attendance_alert')
 * @property {string} text - Message body
 * @property {NotificationChannel} channel - Delivery channel
 * @property {boolean} isRead - Read state
 * @property {string} sentAt - ISO date string
 */

/**
 * Factory function to create a Notification entity
 * @param {Partial<Notification>} data
 * @returns {Notification}
 */
export function createNotification(data = {}) {
  return {
    id: data.id || '',
    userId: data.userId || '',
    type: data.type || 'system',
    text: data.text || '',
    channel: data.channel || 'push',
    isRead: typeof data.isRead === 'boolean' ? data.isRead : false,
    sentAt: data.sentAt || new Date().toISOString(),
  };
}

export const NOTIFICATION_CHANNELS = {
  PUSH: 'push',
  EMAIL: 'email',
};
