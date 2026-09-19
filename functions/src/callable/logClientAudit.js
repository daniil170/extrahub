import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to securely record client-initiated audit events.
 * Only authenticated users can trigger audit log entries.
 */
export const logClientAudit = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация для записи аудита');
    }

    const { action, targetId, targetType, metadata } = request.data || {};

    if (!action || typeof action !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр action обязателен');
    }

    const callerUid = request.auth.uid;
    const callerClaims = request.auth.token || {};
    let callerRole = callerClaims.role || null;
    let callerName = callerClaims.name || null;

    if (!callerRole || !callerName) {
      try {
        const userDoc = await db.collection('users').doc(callerUid).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          callerRole = callerRole || uData.role || 'user';
          callerName = callerName || uData.fullName || uData.email || 'Пользователь';
        }
      } catch {
        // Fallback to defaults
      }
    }

    const logId = await logAuditEvent({
      action: action.trim(),
      actorId: callerUid,
      actorRole: callerRole || 'user',
      actorName: callerName || 'Пользователь',
      targetId: targetId ? String(targetId) : null,
      targetType: targetType ? String(targetType) : 'client_action',
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      timestamp: new Date().toISOString(),
    });

    return { success: true, logId };
  } catch (err) {
    await logFunctionError({
      functionName: 'logClientAudit',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка записи журнала аудита: ${err.message}`);
  }
});
