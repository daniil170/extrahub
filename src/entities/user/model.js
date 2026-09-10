/**
 * @typedef {'student' | 'parent' | 'teacher' | 'coordinator' | 'admin' | 'technician'} UserRole
 */

/**
 * @typedef {'active' | 'inactive' | 'suspended'} UserStatus
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} fullName - Full name of the user
 * @property {UserRole} role - Role in the system
 * @property {string} email - Email address
 * @property {string} [phone] - Phone number
 * @property {UserStatus} status - Account status
 * @property {string} [createdAt] - ISO date string
 */

/**
 * Factory function to create a User entity
 * @param {Partial<User>} data
 * @returns {User}
 */
export function createUser(data = {}) {
  return {
    id: data.id || '',
    fullName: data.fullName || '',
    role: data.role || 'student',
    email: data.email || '',
    phone: data.phone || '',
    status: data.status || 'active',
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export const USER_ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER: 'teacher',
  COORDINATOR: 'coordinator',
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
};
