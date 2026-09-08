import {
  getDocuments,
  setDocument,
  COLLECTIONS,
} from '../../shared/api/firebaseUtils.js';
import { createAttendance } from '../../entities/attendance/model.js';

const MOCK_ATTENDANCE = [
  {
    id: 'att-1',
    enrollmentId: 'enr-1',
    date: '2026-09-01',
    status: 'present',
    markedBy: 'teacher-1',
    teacherComment: 'Отличная работа на уроке',
  },
  {
    id: 'att-2',
    enrollmentId: 'enr-1',
    date: '2026-09-04',
    status: 'present',
    markedBy: 'teacher-1',
    teacherComment: '',
  },
  {
    id: 'att-3',
    enrollmentId: 'enr-1',
    date: '2026-09-08',
    status: 'late',
    markedBy: 'teacher-1',
    teacherComment: 'Опоздание на 10 минут',
  },
];

/**
 * Fetch attendance list for an enrollment
 * @param {string} enrollmentId
 */
export async function fetchAttendanceByEnrollment(enrollmentId) {
  try {
    const data = await getDocuments(COLLECTIONS.ATTENDANCE);
    const filtered = data.filter((item) => item.enrollmentId === enrollmentId);
    return filtered.length > 0 ? filtered : MOCK_ATTENDANCE;
  } catch (error) {
    console.warn('Using mock attendance:', error.message);
    return MOCK_ATTENDANCE;
  }
}

/**
 * Mark student attendance
 * @param {Partial<import('../../entities/attendance/model.js').Attendance>} attendanceData
 */
export async function markAttendance(attendanceData) {
  const record = createAttendance({
    id: attendanceData.id || `att-${Date.now()}`,
    ...attendanceData,
  });
  await setDocument(COLLECTIONS.ATTENDANCE, record.id, record);
  return record;
}
