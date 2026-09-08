/**
 * @typedef {Object} Achievement
 * @property {string} id - Unique achievement record ID
 * @property {string} studentId - Student recipient ID
 * @property {string} activityId - Related activity ID
 * @property {string} title - Achievement title (e.g., "Robotics Champion", "100% Attendance")
 * @property {string} description - Detailed reason or accomplishment
 * @property {string} badgeIcon - Icon name, emoji or image URL
 * @property {string} issuedBy - User ID of issuing teacher/staff
 * @property {string} createdAt - ISO date string
 */

/**
 * Factory function to create an Achievement entity
 * @param {Partial<Achievement>} data
 * @returns {Achievement}
 */
export function createAchievement(data = {}) {
  return {
    id: data.id || '',
    studentId: data.studentId || '',
    activityId: data.activityId || '',
    title: data.title || '',
    description: data.description || '',
    badgeIcon: data.badgeIcon || '🏆',
    issuedBy: data.issuedBy || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}
