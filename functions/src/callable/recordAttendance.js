import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import {
  GAMIFICATION_CONFIG,
  calculateStreakMultiplier,
  getCurrentQuarterKey,
  getOrCreateUserBalance,
} from '../shared/gamification.js';
import { incrementSeasonalLeagueXP } from '../shared/leagues.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to save attendance batch and process gamification rewards atomically
 */
export const recordAttendance = onCall(async (request) => {
  try {
    const { groupId, date, attendanceMap } = request.data || {};

    if (!groupId || typeof groupId !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр groupId обязателен');
    }
    if (!date || typeof date !== 'string') {
      throw new HttpsError('invalid-argument', 'Параметр date обязателен');
    }
    if (!attendanceMap || typeof attendanceMap !== 'object') {
      throw new HttpsError('invalid-argument', 'Параметр attendanceMap обязателен');
    }

    const callerUid = request.auth?.uid || 'teacher-1';
    const nowStr = new Date().toISOString();

    // Verify teacher or coordinator role
    let isAuthorized = true;
    if (request.auth) {
      const userDoc = await db.collection('users').doc(callerUid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const role = userData.role;
      const isMaster = userData.isDemoMaster || userData.email === 'daniilivakin30@gmail.com';
      if (!isMaster && role !== 'teacher' && role !== 'coordinator' && role !== 'admin') {
        throw new HttpsError('permission-denied', 'Недостаточно прав для отметки посещаемости');
      }
    }

    // Fetch activity group info for logging & reason descriptions
    const groupDoc = await db.collection('activityGroups').doc(groupId).get();
    const groupData = groupDoc.exists ? groupDoc.data() : {};
    let activityTitle = 'Кружок';
    if (groupData.activityId) {
      const actDoc = await db.collection('activities').doc(groupData.activityId).get();
      if (actDoc.exists) {
        activityTitle = actDoc.data().title || 'Кружок';
      }
    }

    const results = {};

    // Process each student's attendance & gamification
    for (const [studentId, status] of Object.entries(attendanceMap)) {
      const attendanceDocId = `${groupId}_${studentId}_${date}`;
      const attendanceRef = db.collection('attendance').doc(attendanceDocId);

      const studentResult = await db.runTransaction(async (transaction) => {
        // 1. Read existing attendance record
        const attDoc = await transaction.get(attendanceRef);
        const prevAttendanceData = attDoc.exists ? attDoc.data() : null;
        const previousStatus = prevAttendanceData?.status;

        // 2. Read existing user balance
        const { balanceRef, data: balance } = await getOrCreateUserBalance(transaction, studentId);

        // 3. Prepare ledger doc IDs for idempotency
        const xpLedgerDocId = `ledger_${studentId}_attendance_xp_${attendanceDocId}`;
        const coinLedgerDocId = `ledger_${studentId}_attendance_coin_${attendanceDocId}`;
        const xpLedgerRef = db.collection('pointsLedger').doc(xpLedgerDocId);
        const coinLedgerRef = db.collection('pointsLedger').doc(coinLedgerDocId);

        const [xpLedgerDoc, coinLedgerDoc] = await Promise.all([
          transaction.get(xpLedgerRef),
          transaction.get(coinLedgerRef),
        ]);

        let xpAwarded = 0;
        let coinsAwarded = 0;

        // 4. Update attendance document
        transaction.set(
          attendanceRef,
          {
            id: attendanceDocId,
            groupId,
            studentId,
            date,
            status,
            markedBy: callerUid,
            updatedAt: nowStr,
          },
          { merge: true }
        );

        // 5. Calculate Streak & Rewards
        if (status === 'present' || status === 'late') {
          // Check if points have already been awarded for this specific attendance
          const alreadyAwarded = xpLedgerDoc.exists || coinLedgerDoc.exists;

          if (!alreadyAwarded) {
            // New attendance session: increment streak if previous wasn't a broken streak
            const isNewDate = balance.lastAttendedDate !== date;
            if (isNewDate) {
              balance.currentStreak = (balance.currentStreak || 0) + 1;
              balance.longestStreak = Math.max(balance.longestStreak || 0, balance.currentStreak);
              balance.lastAttendedDate = date;
            }

            // Calculate multiplier for milestone streak (4, 8, 12 weeks)
            balance.xpMultiplier = calculateStreakMultiplier(balance.currentStreak);

            const baseXP = GAMIFICATION_CONFIG.ATTENDANCE_XP;
            xpAwarded = Math.round(baseXP * balance.xpMultiplier);
            coinsAwarded = GAMIFICATION_CONFIG.ATTENDANCE_COINS;

            balance.xpPoints = (balance.xpPoints || 0) + xpAwarded;
            balance.coins = (balance.coins || 0) + coinsAwarded;
            balance.updatedAt = nowStr;

            // Increment active season league membership XP
            await incrementSeasonalLeagueXP(transaction, { userId: studentId, xpAmount: xpAwarded });

            const streakNotice =
              balance.xpMultiplier > 1.0
                ? ` (бонус за серию ${balance.currentStreak} нед.: x${balance.xpMultiplier})`
                : '';

            // Write XP ledger
            transaction.set(xpLedgerRef, {
              id: xpLedgerDocId,
              userId: studentId,
              amount: xpAwarded,
              currencyType: 'xp',
              source: 'attendance',
              sourceRefId: attendanceDocId,
              reason: `Посещение занятия «${activityTitle}»${streakNotice}`,
              createdBy: callerUid,
              createdAt: nowStr,
              metadata: { groupId, date, status, streak: balance.currentStreak },
            });

            // Write Coin ledger
            transaction.set(coinLedgerRef, {
              id: coinLedgerDocId,
              userId: studentId,
              amount: coinsAwarded,
              currencyType: 'coin',
              source: 'attendance',
              sourceRefId: attendanceDocId,
              reason: `Посещение занятия «${activityTitle}»`,
              createdBy: callerUid,
              createdAt: nowStr,
              metadata: { groupId, date, status },
            });
          }
        } else if (status === 'absent') {
          // Absent: streak resets to 0
          balance.currentStreak = 0;
          balance.xpMultiplier = 1.0;
          balance.updatedAt = nowStr;
        } else if (status === 'excused') {
          // Excused absence:
          if (balance.streakFreezeActive) {
            // Freeze is consumed to preserve current streak
            balance.streakFreezeActive = false;
            balance.streakFreezeCount = Math.max(0, (balance.streakFreezeCount || 1) - 1);
            balance.usedFreezesQuarter = getCurrentQuarterKey();
            balance.updatedAt = nowStr;
          } else {
            // If no freeze was active, streak resets on absence
            balance.currentStreak = 0;
            balance.xpMultiplier = 1.0;
            balance.updatedAt = nowStr;
          }
        }

        // 6. Save updated balance
        transaction.set(balanceRef, balance, { merge: true });

        return {
          studentId,
          status,
          xpAwarded,
          coinsAwarded,
          currentStreak: balance.currentStreak,
          xpMultiplier: balance.xpMultiplier,
        };
      });

      results[studentId] = studentResult;
    }

    // Audit log
    await logAuditEvent({
      action: 'attendance.recorded_with_gamification',
      actorId: callerUid,
      actorRole: 'teacher',
      targetId: `${groupId}_${date}`,
      targetType: 'attendance_batch',
      metadata: { groupId, date, studentCount: Object.keys(attendanceMap).length },
    });

    return {
      success: true,
      groupId,
      date,
      results,
    };
  } catch (err) {
    console.error('recordAttendance error:', err);
    await logFunctionError({
      functionName: 'recordAttendance',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка сохранения посещаемости: ${err.message}`);
  }
});
