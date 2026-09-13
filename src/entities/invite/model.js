/**
 * @typedef {'active' | 'accepted' | 'expired' | 'revoked'} InviteStatus
 * @typedef {'parent' | 'coordinator' | 'teacher'} InviteTargetRole
 */

/**
 * @typedef {Object} Invite
 * @property {string} id - Unique invite ID
 * @property {string} token - Secure verification token
 * @property {InviteTargetRole} targetRole - Role for the invited user
 * @property {string|null} [email] - Specific restricted email if defined
 * @property {string|null} [relatedEntityId] - studentId for parent, activityId for teacher
 * @property {InviteStatus} status - Status of the invitation
 * @property {string} expiresAt - ISO date string for expiration
 * @property {string} createdBy - User UID who created the invite
 * @property {string} createdAt - ISO date string
 */

/**
 * Unified factory function for Invitations (Parent, Coordinator, Teacher)
 * @param {Partial<Invite>} data
 * @returns {Invite}
 */
export function createInvite(data = {}) {
  return {
    id: data.id || '',
    token: data.token || '',
    targetRole: data.targetRole || 'parent',
    email: data.email ? String(data.email).trim().toLowerCase() : null,
    relatedEntityId: data.relatedEntityId || data.studentId || data.activityId || null,
    status: data.status || 'active',
    expiresAt: data.expiresAt || '',
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Legacy compatibility factory for ParentInvite
 * @param {Partial<Invite>} data
 */
export function createParentInvite(data = {}) {
  return createInvite({
    ...data,
    targetRole: 'parent',
    relatedEntityId: data.studentId || data.relatedEntityId,
  });
}

export const INVITE_STATUS = {
  ACTIVE: 'active',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

export const PARENT_INVITE_STATUS = INVITE_STATUS;
