import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { awardPoints, GAMIFICATION_CONFIG } from '../shared/gamification.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to grade an exam application and award gamification XP upon pass
 */
export const gradeExamApplication = onCall(async (request) => {
  try {
    const { applicationId, decision, score, maxScore = 100 } = request.data || {};

    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр applicationId обязателен');
    }
    if (!decision || !['passed', 'failed'].includes(decision)) {
      throw new HttpsError('invalid-argument', 'Параметр decision должен быть passed или failed');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;
    const userDoc = await db.collection('users').doc(callerUid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const isTeacher = userData.role === 'teacher' || userData.role === 'coordinator' || userData.role === 'admin';
    const isMaster = userData.isDemoMaster || userData.email === 'daniilivakin30@gmail.com';

    if (!isMaster && !isTeacher) {
      throw new HttpsError('permission-denied', 'Только преподаватель может оценивать экзамены');
    }

    const appRef = db.collection('examApplications').doc(applicationId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new HttpsError('not-found', 'Заявка на экзамен не найдена');
    }

    const appData = appDoc.data();
    const nowStr = new Date().toISOString();
    const numericScore = score !== null && score !== undefined ? Number(score) : null;
    const numericMaxScore = Number(maxScore) || 100;

    // Update exam application
    await appRef.update({
      status: decision,
      score: numericScore,
      maxScore: numericMaxScore,
      gradedBy: callerUid,
      gradedAt: nowStr,
    });

    let gamificationResult = null;

    // Award +100 XP upon passing
    if (decision === 'passed' && appData.studentId) {
      gamificationResult = await awardPoints({
        userId: appData.studentId,
        amount: GAMIFICATION_CONFIG.EXAM_PASS_XP,
        currencyType: 'xp',
        source: 'exam_pass',
        sourceRefId: applicationId,
        reason: `Успешная сдача вступительного экзамена «${appData.activityTitle || 'Олимпийский резерв'}»`,
        createdBy: callerUid,
        metadata: {
          applicationId,
          score: numericScore,
          maxScore: numericMaxScore,
          groupId: appData.groupId,
        },
      });
    }

    await logAuditEvent({
      action: 'exam.graded',
      actorId: callerUid,
      actorRole: 'teacher',
      targetId: applicationId,
      targetType: 'exam_application',
      metadata: {
        decision,
        score: numericScore,
        maxScore: numericMaxScore,
        studentId: appData.studentId,
        xpAwarded: decision === 'passed' ? GAMIFICATION_CONFIG.EXAM_PASS_XP : 0,
      },
    });

    return {
      success: true,
      applicationId,
      status: decision,
      score: numericScore,
      gamificationResult,
    };
  } catch (err) {
    console.error('gradeExamApplication error:', err);
    await logFunctionError({
      functionName: 'gradeExamApplication',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка проверки экзамена: ${err.message}`);
  }
});
