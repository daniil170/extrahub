import { httpsCallable } from 'firebase/functions';
import { functions } from '../../app/config/firebase.js';

/**
 * Record an audit log entry from client-side actions.
 * Calls the secure backend callable function `logClientAudit`.
 * 
 * @param {Object} params
 * @param {string} params.action - e.g. 'activity.created', 'exam.graded', 'payment.status_changed'
 * @param {string} [params.targetId] - ID of affected entity
 * @param {string} [params.targetType] - 'activity' | 'group' | 'exam' | 'payment' | 'user'
 * @param {Object} [params.metadata] - Extra details
 */
export async function recordClientAudit({ action, targetId, targetType, metadata }) {
  try {
    const callable = httpsCallable(functions, 'logClientAudit');
    const result = await callable({
      action,
      targetId: targetId ? String(targetId) : null,
      targetType: targetType || 'client_action',
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
    return result.data;
  } catch (err) {
    // Non-blocking telemetry warning
    console.warn('Could not record client audit event:', err?.message || err);
    return null;
  }
}
