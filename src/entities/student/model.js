/**
 * @typedef {Object} Student
 * @property {string} id - Unique identifier
 * @property {string} fullName - Full name of the student
 * @property {string|number} className - School class/grade (e.g. 8 or "8-B")
 * @property {number} [shift] - Shift number (1 or 2)
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
    className: data.className !== undefined ? data.className : '',
    shift: data.shift ? Number(data.shift) : 1,
    birthDate: data.birthDate || '',
    parentIds: Array.isArray(data.parentIds) ? [...data.parentIds] : [],
    schoolId: data.schoolId || '',
  };
}
