import {
  getDocument,
  getDocuments,
  setDocument,
  updateDocument,
  COLLECTIONS,
} from '../../shared/api/firebaseUtils.js';
import { createEnrollment } from '../../entities/enrollment/model.js';

/**
 * Fetch enrollments by student ID
 * @param {string} studentId
 * @returns {Promise<import('../../entities/enrollment/model.js').Enrollment[]>}
 */
export async function fetchStudentEnrollments(studentId) {
  try {
    const all = await getDocuments(COLLECTIONS.ENROLLMENTS);
    return all.filter((e) => e.studentId === studentId);
  } catch (error) {
    console.warn('Using mock student enrollments:', error.message);
    return [];
  }
}

/**
 * Create a new enrollment request
 * @param {Partial<import('../../entities/enrollment/model.js').Enrollment>} data
 */
export async function requestEnrollment(data) {
  const enrollment = createEnrollment({
    id: data.id || `enr-${Date.now()}`,
    ...data,
  });
  await setDocument(COLLECTIONS.ENROLLMENTS, enrollment.id, enrollment);
  return enrollment;
}

/**
 * Approve enrollment by parent
 * @param {string} enrollmentId
 * @param {string} parentId
 */
export async function approveEnrollment(enrollmentId, parentId) {
  return updateDocument(COLLECTIONS.ENROLLMENTS, enrollmentId, {
    status: 'active',
    parentApprovedAt: new Date().toISOString(),
    approvedByParentId: parentId,
  });
}

/**
 * Cancel enrollment
 * @param {string} enrollmentId
 */
export async function cancelEnrollment(enrollmentId) {
  return updateDocument(COLLECTIONS.ENROLLMENTS, enrollmentId, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });
}
