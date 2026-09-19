import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../api/firebaseUtils.js';

const recentErrorsCache = new Map();
const DEDUPLICATION_INTERVAL_MS = 10000;

/**
 * Safely retrieve current user from local storage cache if available
 */
function getCachedUserInfo() {
  if (typeof window === 'undefined') return { userId: null, userRole: null };
  try {
    const cached = localStorage.getItem('extrahub_auth_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        userId: parsed?.id || null,
        userRole: parsed?.role || null,
      };
    }
  } catch {
    // Ignore cache parse errors
  }
  return { userId: null, userRole: null };
}

/**
 * Log a client-side error to Firestore systemErrors collection
 * @param {Object} params
 * @param {string} [params.message]
 * @param {Error|any} [params.error]
 * @param {string} [params.route]
 * @param {string} [params.userId]
 * @param {string} [params.userRole]
 * @param {any} [params.componentStack]
 */
export async function logClientError({
  message,
  error,
  route,
  userId,
  userRole,
  componentStack,
} = {}) {
  try {
    const errorMessage =
      message ||
      error?.message ||
      (typeof error === 'string' ? error : 'Неизвестная ошибка на клиенте');

    const currentRoute =
      route ||
      (typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/');

    // Deduplication check
    const dedupKey = `${errorMessage}_${currentRoute}`;
    const now = Date.now();
    const lastLogged = recentErrorsCache.get(dedupKey);
    if (lastLogged && now - lastLogged < DEDUPLICATION_INTERVAL_MS) {
      return null;
    }
    recentErrorsCache.set(dedupKey, now);

    // Clean old deduplication cache entries
    if (recentErrorsCache.size > 50) {
      for (const [k, ts] of recentErrorsCache.entries()) {
        if (now - ts > DEDUPLICATION_INTERVAL_MS) {
          recentErrorsCache.delete(k);
        }
      }
    }

    const cachedUser = getCachedUserInfo();
    const effectiveUserId = userId || cachedUser.userId || null;
    const effectiveUserRole = userRole || cachedUser.userRole || null;

    let rawStack = error?.stack || componentStack || '';
    if (typeof rawStack !== 'string') {
      rawStack = String(rawStack);
    }
    const truncatedStack = rawStack.slice(0, 1000);

    const errorPayload = {
      message: String(errorMessage).slice(0, 500),
      stack: truncatedStack,
      route: currentRoute,
      userId: effectiveUserId,
      userRole: effectiveUserRole,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : 'unknown',
      timestamp: new Date().toISOString(),
      source: 'client',
      resolved: false,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.SYSTEM_ERRORS), errorPayload);
    return docRef.id;
  } catch (loggingErr) {
    // Silent fail in console to never crash the app due to telemetry
    console.warn('System telemetry client logging error:', loggingErr?.message || loggingErr);
    return null;
  }
}

/**
 * Initialize window.onerror and unhandledrejection global listeners
 */
export function setupGlobalErrorLogging() {
  if (typeof window === 'undefined') return;

  // Prevent multiple bindings
  if (window.__extrahub_error_logging_initialized__) return;
  window.__extrahub_error_logging_initialized__ = true;

  window.onerror = function (eventOrMessage, source, lineno, colno, error) {
    const message =
      typeof eventOrMessage === 'string'
        ? eventOrMessage
        : eventOrMessage?.message || 'Uncaught window error';

    logClientError({
      message: `${message} (${source || 'unknown'}:${lineno || 0}:${colno || 0})`,
      error,
      route: window.location.pathname,
    });
    return false; // Let default browser console logging proceed
  };

  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
        ? reason
        : 'Unhandled Promise Rejection';

    logClientError({
      message: `[Promise] ${message}`,
      error: reason instanceof Error ? reason : new Error(String(reason)),
      route: window.location.pathname,
    });
  });
}
