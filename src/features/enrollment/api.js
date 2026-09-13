import { httpsCallable } from 'firebase/functions';
import { functions } from '../../app/config/firebase.js';

/**
 * Call createEnrollment Cloud Function
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} params.groupId
 * @returns {Promise<{ success: boolean, waitlisted: boolean, enrollmentId?: string, inviteToken?: string, holdExpiresAt?: string, position?: number }>}
 */
export async function createEnrollmentCall({ studentId, groupId }) {
  try {
    const callable = httpsCallable(functions, 'createEnrollment');
    const result = await callable({ studentId, groupId });
    return result.data;
  } catch (error) {
    const message = error.message || 'Ошибка записи на секцию';
    console.error('createEnrollment failed:', error);
    throw new Error(message, { cause: error });
  }
}

/**
 * Call cancelEnrollment Cloud Function
 * @param {Object} params
 * @param {string} params.enrollmentId
 * @returns {Promise<{ success: boolean }>}
 */
export async function cancelEnrollmentCall({ enrollmentId }) {
  try {
    const callable = httpsCallable(functions, 'cancelEnrollment');
    const result = await callable({ enrollmentId });
    return result.data;
  } catch (error) {
    const message = error.message || 'Ошибка отмены записи';
    console.error('cancelEnrollment failed:', error);
    throw new Error(message, { cause: error });
  }
}

