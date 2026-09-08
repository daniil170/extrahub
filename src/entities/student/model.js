/**
 * @typedef {Object} Student
 * @property {string} id - Unique identifier
 * @property {string} fullName - Full name of the student
 * @property {string} className - School class/grade (e.g., "7-B")
 * @property {string} [birthDate] - ISO date string (YYYY-MM-DD)
 * @property {string[]} parentIds - Array of parent User IDs
 * @property {string} schoolId - Associated school identifier
 */

/**
 * Factory function to create a Student entity
 * @param {Partial<Student>} data
 * @returns {Student}
 */
export function createStudent(data = {}) {
  return {
    id: data.id || '',
    fullName: data.fullName || '',
    className: data.className || '',
    birthDate: data.birthDate || '',
    parentIds: Array.isArray(data.parentIds) ? [...data.parentIds] : [],
    schoolId: data.schoolId || '',
  };
}
