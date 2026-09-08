import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token string for parent invites
 * @param {number} [bytes=24]
 * @returns {string} Hexadecimal token string
 */
export function generateInviteToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Calculates hold expiration timestamp (default 24 hours from now)
 * @param {number} [hours=24]
 * @returns {Date}
 */
export function calculateHoldExpiration(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
