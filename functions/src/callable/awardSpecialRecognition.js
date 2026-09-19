import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { GAMIFICATION_CONFIG, getOrCreateUserBalance } from '../shared/gamification.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function for teachers to award special recognition (XP) to students
 * Limit: Max 5 recognitions per group per calendar day
 */
export const awardSpecialRecognition = onCall(async (request) => {
  try {
    const { studentId, groupId, amount, reason } = request.data || {};

    if (!studentId || typeof studentId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр studentId обязателен');
    }
    if (!groupId || typeof groupId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр groupId обязателен');
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0 || numericAmount > 500) {
      throw new HttpsError('invalid-argument', 'Укажите корректную сумму награды (от 1 до 500 XP)');
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      throw new HttpsError('invalid-argument', 'Укажите причину награды (не менее 3 символов)');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;
    const userDoc = await db.collection('users').doc(callerUid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const isMaster = userData.isDemoMaster || userData.email === 'daniilivakin30@gmail.com';
    const isTeacher = userData.role === 'teacher' || userData.role === 'coordinator' || userData.role === 'admin';

    if (!isMaster && !isTeacher) {
      throw new HttpsError('permission-denied', 'Только преподаватели могут выдавать кураторские награды');
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowStr = now.toISOString();

    // Check daily rate limit for this group
    const todayLedgerSnap = await db
      .collection('pointsLedger')
      .where('source', '==', 'teacher_reward')
      .where('metadata.groupId', '==', groupId)
      .where('metadata.date', '==', todayStr)
      .get();

    const usedToday = todayLedgerSnap.size;
    if (usedToday >= GAMIFICATION_CONFIG.MAX_TEACHER_DAILY_REWARDS) {
      throw new HttpsError(
        'resource-exhausted',
        `Превышен дневной лимит кураторских наград для этой группы (${GAMIFICATION_CONFIG.MAX_TEACHER_DAILY_REWARDS} из ${GAMIFICATION_CONFIG.MAX_TEACHER_DAILY_REWARDS} на сегодня уже использовано)`
      );
    }

    // Award XP
    const ledgerDocId = `ledger_${studentId}_teacher_reward_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ledgerRef = db.collection('pointsLedger').doc(ledgerDocId);

    const result = await db.runTransaction(async (transaction) => {
      const { balanceRef, data: balance } = await getOrCreateUserBalance(transaction, studentId);

      balance.xpPoints = (balance.xpPoints || 0) + numericAmount;
      balance.updatedAt = nowStr;

      transaction.set(ledgerRef, {
        id: ledgerDocId,
        userId: studentId,
        amount: numericAmount,
        currencyType: 'xp',
        source: 'teacher_reward',
        sourceRefId: ledgerDocId,
        reason: reason.trim(),
        createdBy: callerUid,
        createdAt: nowStr,
        metadata: {
          groupId,
          date: todayStr,
          awardedByRole: userData.role || 'teacher',
        },
      });

      transaction.set(balanceRef, balance, { merge: true });

      return {
        success: true,
        awardedXP: numericAmount,
        remainingToday: GAMIFICATION_CONFIG.MAX_TEACHER_DAILY_REWARDS - (usedToday + 1),
        balance,
      };
    });

    await logAuditEvent({
      action: 'gamification.teacher_recognition_awarded',
      actorId: callerUid,
      actorRole: 'teacher',
      targetId: studentId,
      targetType: 'student',
      metadata: { groupId, amount: numericAmount, reason: reason.trim(), date: todayStr },
    });

    return result;
  } catch (err) {
    console.error('awardSpecialRecognition error:', err);
    await logFunctionError({
      functionName: 'awardSpecialRecognition',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка выдачи награды: ${err.message}`);
  }
});
