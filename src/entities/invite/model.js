/**
 * @typedef {'active' | 'accepted' | 'expired' | 'revoked'} ParentInviteStatus
 */

/**
 * @typedef {Object} ParentInvite
 * @property {string} id - Unique invite ID
 * @property {string} studentId - Student identifier
 * @property {string} enrollmentId - Associated enrollment ID
 * @property {string} token - Secure verification token
 * @property {ParentInviteStatus} status - Status of the parent invitation
 * @property {string} expiresAt - ISO date string for expiration
 * @property {string} createdAt - ISO date string
 */

/**
 * Factory function to create a ParentInvite entity
 * @param {Partial<ParentInvite>} data
 * @returns {ParentInvite}
 */
export function createParentInvite(data = {}) {
  return {
    id: data.id || '',
    studentId: data.studentId || '',
    enrollmentId: data.enrollmentId || '',
    token: data.token || '',
    status: data.status || 'active',
    expiresAt: data.expiresAt || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export const PARENT_INVITE_STATUS = {
  ACTIVE: 'active',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};
