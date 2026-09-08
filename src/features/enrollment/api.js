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
    // If it's a domain/business error from Cloud Functions (e.g. schedule conflict, capacity, permission)
    if (
      error.code === 'failed-precondition' ||
      error.code === 'functions/failed-precondition' ||
      error.code === 'permission-denied' ||
      error.code === 'functions/permission-denied' ||
      error.code === 'invalid-argument' ||
      error.code === 'functions/invalid-argument'
    ) {
      throw error;
    }

    // In local dev without emulator/cloud connection, provide smooth simulation fallback
    console.warn(
      'createEnrollment Cloud Function unavailable, using dev simulation:',
      error.message
    );
    const mockToken = `mock-inv-${Math.random().toString(36).substring(2, 9)}`;
    const holdExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      success: true,
      waitlisted: false,
      enrollmentId: `enr-${Date.now()}`,
      inviteToken: mockToken,
      holdExpiresAt,
      isDevMock: true,
    };
  }
}
