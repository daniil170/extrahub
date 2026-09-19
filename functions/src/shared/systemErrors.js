import { db } from '../config/firebase.js';

/**
 * Sanitize input to strip sensitive fields (password, tokens, etc.)
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'object') return input || null;
  const sensitiveKeys = ['password', 'token', 'inviteToken', 'secret', 'customToken', 'apiKey'];
  const sanitized = {};
  for (const [key, val] of Object.entries(input)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = Array.isArray(val) ? val.map(sanitizeInput) : sanitizeInput(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Log callable function failure to systemErrors collection in Firestore
 * @param {Object} params
 * @param {string} params.functionName
 * @param {Error|any} params.error
 * @param {any} [params.request]
 * @param {any} [params.input]
 */
export async function logFunctionError({
  functionName,
  error,
  request,
  input,
}) {
  try {
    const errorMessage = error?.message || (typeof error === 'string' ? error : 'Неизвестная ошибка функции');
    const errorCode = error?.code || error?.status || 'internal';
    const userId = request?.auth?.uid || null;
    const userEmail = request?.auth?.token?.email || null;
    const userRole = request?.auth?.token?.role || null;
    const rawInput = input !== undefined ? input : request?.data;
    const sanitizedInput = sanitizeInput(rawInput);
    const stack = (error?.stack || '').slice(0, 1000);

    const errorPayload = {
      functionName: functionName || 'unknown',
      errorMessage: String(errorMessage).slice(0, 500),
      errorCode: String(errorCode),
      userId,
      userEmail,
      userRole,
      input: sanitizedInput || null,
      stack,
      timestamp: new Date().toISOString(),
      source: 'function',
      resolved: false,
    };

    await db.collection('systemErrors').add(errorPayload);
  } catch (logErr) {
    console.error(`Failed to log function error for ${functionName}:`, logErr.message);
  }
}
