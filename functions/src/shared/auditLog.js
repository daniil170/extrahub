import { db } from '../config/firebase.js';

/**
 * Log an audit event to the auditLog collection in Firestore.
 * Supports both options object or positional parameters:
 * logAuditEvent(action, actorId, targetId, metadata, targetType, extraActorInfo)
 * or
 * logAuditEvent({ action, actorId, actorRole, actorName, targetId, targetType, metadata, timestamp })
 */
export async function logAuditEvent(
  actionOrOptions,
  actorIdArg,
  targetIdArg,
  metadataArg,
  targetTypeArg,
  extraActorInfoArg
) {
  try {
    let action;
    let actorId;
    let actorRole = null;
    let actorName = null;
    let targetId = null;
    let targetType = 'general';
    let metadata = {};
    let timestamp = new Date().toISOString();

    if (actionOrOptions && typeof actionOrOptions === 'object' && !Array.isArray(actionOrOptions)) {
      action = actionOrOptions.action;
      actorId = actionOrOptions.actorId;
      actorRole = actionOrOptions.actorRole || null;
      actorName = actionOrOptions.actorName || null;
      targetId = actionOrOptions.targetId || null;
      targetType = actionOrOptions.targetType || 'general';
      metadata = actionOrOptions.metadata || {};
      timestamp = actionOrOptions.timestamp || timestamp;
    } else {
      action = actionOrOptions;
      actorId = actorIdArg || null;
      targetId = targetIdArg || null;
      metadata = metadataArg || {};
      targetType = targetTypeArg || 'general';
      if (extraActorInfoArg) {
        actorRole = extraActorInfoArg.actorRole || null;
        actorName = extraActorInfoArg.actorName || null;
      }
    }

    if (!action) {
      console.warn('logAuditEvent skipped: missing action parameter');
      return null;
    }

    // Enrich actor info from Firestore if missing
    if (actorId && (!actorRole || !actorName)) {
      try {
        const userDoc = await db.collection('users').doc(actorId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (!actorRole) actorRole = userData.role || null;
          if (!actorName) actorName = userData.fullName || userData.email || null;
        }
      } catch {
        // Fallback gracefully
      }
    }

    const payload = {
      action: String(action),
      actorId: actorId ? String(actorId) : 'system',
      actorRole: actorRole ? String(actorRole) : (actorId ? 'user' : 'system'),
      actorName: actorName ? String(actorName) : (actorId ? `Пользователь (${actorId})` : 'Система'),
      targetId: targetId ? String(targetId) : null,
      targetType: String(targetType),
      metadata: metadata && typeof metadata === 'object' ? metadata : { raw: metadata },
      timestamp,
    };

    const docRef = await db.collection('auditLog').add(payload);
    return docRef.id;
  } catch (auditErr) {
    console.error('logAuditEvent failed:', auditErr.message);
    return null;
  }
}
