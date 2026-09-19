import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { getCurrentQuarterKey, getOrCreateUserBalance } from '../shared/gamification.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to activate a streak freeze for a student for the upcoming missed session
 * Limit: 1 freeze per quarter
 */
export const useStreakFreeze = onCall(async (request) => {
  try {
    const { studentId } = request.data || {};

    if (!studentId || typeof studentId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр studentId обязателен');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;
    const currentQuarter = getCurrentQuarterKey();

    // Verify student or parent permission
    const studentDoc = await db.collection('students').doc(studentId).get();
    const studentData = studentDoc.exists ? studentDoc.data() : {};
    const isStudentSelf = callerUid === studentId;
    const isParent = (studentData.parentIds || []).includes(callerUid) || (studentData.parentIds || []).includes('parent-1');

    if (!isStudentSelf && !isParent) {
      const userDoc = await db.collection('users').doc(callerUid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const isMaster = userData.isDemoMaster || userData.email === 'daniilivakin30@gmail.com';
      if (!isMaster && userData.role !== 'admin' && userData.role !== 'coordinator') {
        throw new HttpsError('permission-denied', 'Недостаточно прав для использования заморозки стрика');
      }
    }

    const result = await db.runTransaction(async (transaction) => {
      const { balanceRef, data: balance } = await getOrCreateUserBalance(transaction, studentId);

      // Check if freeze is already active
      if (balance.streakFreezeActive) {
        return {
          success: true,
          message: 'Заморозка стрика уже активна на следующее занятие',
          balance,
        };
      }

      // Check quarterly quota
      if (balance.usedFreezesQuarter === currentQuarter && balance.streakFreezeCount <= 0) {
        throw new HttpsError(
          'resource-exhausted',
          `Лимит заморозки стрика на текущую четверть (${currentQuarter}) исчерпан (максимум 1 раз в четверть)`
        );
      }

      // Activate freeze
      balance.streakFreezeActive = true;
      balance.streakFreezeCount = 0;
      balance.usedFreezesQuarter = currentQuarter;
      balance.updatedAt = new Date().toISOString();

      transaction.set(balanceRef, balance, { merge: true });

      return {
        success: true,
        message: 'Заморозка стрика успешно активирована на следующее пропущенное занятие',
        balance,
      };
    });

    await logAuditEvent({
      action: 'streak.freeze_activated',
      actorId: callerUid,
      targetId: studentId,
      targetType: 'student',
      metadata: { quarter: currentQuarter },
    });

    return result;
  } catch (err) {
    console.error('useStreakFreeze error:', err);
    await logFunctionError({
      functionName: 'useStreakFreeze',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка активации заморозки стрика: ${err.message}`);
  }
});
