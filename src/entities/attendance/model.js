/**
 * @typedef {'present' | 'absent' | 'late' | 'excused'} AttendanceStatus
 */

/**
 * @typedef {Object} Attendance
 * @property {string} id - Unique attendance record ID
 * @property {string} [enrollmentId] - Enrollment identifier
 * @property {string} studentId - Student identifier
 * @property {string} groupId - ActivityGroup identifier
 * @property {string} date - Date string (YYYY-MM-DD)
 * @property {AttendanceStatus} status - Student status for this session
 * @property {string} markedBy - User ID of teacher/staff who marked attendance
 * @property {string} [teacherComment] - Optional note/comment from the teacher
 * @property {string} [updatedAt] - ISO date string or timestamp
 */

/**
 * Factory function to create an Attendance entity
 * @param {Partial<Attendance>} data
 * @returns {Attendance}
 */
export function createAttendance(data = {}) {
  return {
    id: data.id || '',
    enrollmentId: data.enrollmentId || '',
    studentId: data.studentId || '',
    groupId: data.groupId || '',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'present',
    markedBy: data.markedBy || '',
    teacherComment: data.teacherComment || '',
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};
