import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../app/config/firebase.js';
import { updateDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

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
 * Call cancelEnrollment Cloud Function with direct Firestore fallback
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
    console.warn('cancelEnrollment Cloud Function failed, attempting direct Firestore update fallback:', error);
    try {
      const nowStr = new Date().toISOString();
      await updateDocument(COLLECTIONS.ENROLLMENTS, enrollmentId, {
        status: 'cancelled',
        cancelledAt: nowStr,
        cancelledBy: auth.currentUser?.uid || 'parent',
      });
      return { success: true, status: 'cancelled' };
    } catch (fsErr) {
      console.error('Direct Firestore cancel failed:', fsErr);
      const message = error.message || fsErr.message || 'Ошибка отмены записи';
      throw new Error(message, { cause: fsErr });
    }
  }
}


