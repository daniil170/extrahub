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
 * @property {number} [className] - Grade number (1-11)
 * @property {number} [shift] - Shift number (1 or 2)
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
    className: data.className ? Number(data.className) : undefined,
    shift: data.shift ? Number(data.shift) : undefined,
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
