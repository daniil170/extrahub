/**
 * @typedef {Object} Waitlist
 * @property {string} id - Unique waitlist entry ID
 * @property {string} studentId - Student identifier
 * @property {string} groupId - ActivityGroup identifier
 * @property {number} position - Queue position index (1-based)
 * @property {string} queuedAt - ISO date string when added to queue
 */

/**
 * Factory function to create a Waitlist entity
 * @param {Partial<Waitlist>} data
 * @returns {Waitlist}
 */
export function createWaitlist(data = {}) {
  return {
    id: data.id || '',
    studentId: data.studentId || '',
    groupId: data.groupId || '',
    position: typeof data.position === 'number' ? data.position : 1,
    queuedAt: data.queuedAt || new Date().toISOString(),
  };
}
