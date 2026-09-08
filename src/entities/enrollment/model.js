/**
 * @typedef {'pending_parent_approval' | 'active' | 'waitlist' | 'cancelled' | 'cancelled_by_timeout'} EnrollmentStatus
 */

/**
 * @typedef {Object} Enrollment
 * @property {string} id - Unique enrollment ID
 * @property {string} studentId - Student identifier
 * @property {string} groupId - ActivityGroup identifier
 * @property {EnrollmentStatus} status - Status of the enrollment
 * @property {string} [holdExpiresAt] - ISO date string for reservation hold window
 * @property {string} [parentApprovedAt] - ISO date string when parent confirmed
 * @property {string} [approvedByParentId] - User ID of approving parent
 * @property {string} enrolledAt - ISO date string when requested/created
 * @property {string} [cancelledAt] - ISO date string when cancelled
 */

/**
 * Factory function to create an Enrollment entity
 * @param {Partial<Enrollment>} data
 * @returns {Enrollment}
 */
export function createEnrollment(data = {}) {
  return {
    id: data.id || '',
    studentId: data.studentId || '',
    groupId: data.groupId || '',
    status: data.status || 'pending_parent_approval',
    holdExpiresAt: data.holdExpiresAt || '',
    parentApprovedAt: data.parentApprovedAt || '',
    approvedByParentId: data.approvedByParentId || '',
    enrolledAt: data.enrolledAt || new Date().toISOString(),
    cancelledAt: data.cancelledAt || '',
  };
}

export const ENROLLMENT_STATUS = {
  PENDING_PARENT_APPROVAL: 'pending_parent_approval',
  ACTIVE: 'active',
  WAITLIST: 'waitlist',
  CANCELLED: 'cancelled',
  CANCELLED_BY_TIMEOUT: 'cancelled_by_timeout',
};
