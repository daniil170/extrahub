import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';
import { shuffleArray, splitIntoGroups, LEAGUE_CONSTANTS } from '../shared/leagues.js';
import { logAuditEvent } from '../shared/auditLog.js';
import { logFunctionError } from '../shared/systemErrors.js';

/**
 * Callable Cloud Function to create a new competitive Season and initialize all students into Bronze divisions
 */
export const createSeason = onCall(async (request) => {
  try {
    const { name, startDate, endDate } = request.data || {};

    if (!name || typeof name !== 'string') {
      throw new HttpsError('invalid-argument', 'Название сезона обязательно');
    }
    if (!startDate || !endDate) {
      throw new HttpsError('invalid-argument', 'Даты начала и окончания сезона обязательны');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется аутентификация');
    }

    const callerUid = request.auth.uid;
    const userDoc = await db.collection('users').doc(callerUid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const isAdmin = userData.role === 'admin' || userData.role === 'coordinator';
    const isMaster = userData.isDemoMaster || userData.email === 'daniilivakin30@gmail.com';

    if (!isAdmin && !isMaster) {
      throw new HttpsError('permission-denied', 'Только администратор может создавать новые сезоны');
    }

    const nowStr = new Date().toISOString();
    const seasonId = `season-${Date.now()}`;

    // 1. Mark any currently active season as completed
    const activeSeasonsSnap = await db
      .collection('seasons')
      .where('status', '==', 'active')
      .get();

    const batch = db.batch();

    activeSeasonsSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        status: 'completed',
        finalizedAt: nowStr,
      });
    });

    // 2. Create new Season document
    const seasonRef = db.collection('seasons').doc(seasonId);
    batch.set(seasonRef, {
      id: seasonId,
      name: name.trim(),
      startDate,
      endDate,
      status: 'active',
      createdAt: nowStr,
      finalizedAt: null,
      createdBy: callerUid,
    });

    // 3. Fetch all active students
    const studentsSnap = await db.collection('students').get();
    let studentIds = [];

    if (!studentsSnap.empty) {
      studentIds = studentsSnap.docs.map((d) => d.id);
    }

    // Default student IDs for demo if collection is small/empty
    const fallbackIds = [
      'student-1',
      'student-2',
      'student-3',
      'student-demo-1',
      'student-demo-2',
      'student-demo-3',
      'student-demo-4',
      'student-demo-5',
      'student-demo-6',
    ];

    fallbackIds.forEach((id) => {
      if (!studentIds.includes(id)) {
        studentIds.push(id);
      }
    });

    // 4. Shuffle and chunk into Bronze groups
    const shuffledStudents = shuffleArray(studentIds);
    const groups = splitIntoGroups(shuffledStudents, LEAGUE_CONSTANTS.MAX_GROUP_SIZE);

    const divisionsCreated = [];

    groups.forEach((groupStudents, groupIndex) => {
      const groupNumber = groupIndex + 1;
      const divisionId = `${seasonId}_bronze_group_${groupNumber}`;
      const divisionRef = db.collection('leagueDivisions').doc(divisionId);

      batch.set(divisionRef, {
        id: divisionId,
        seasonId,
        rank: 'bronze',
        groupNumber,
        name: `Бронзовая лига • Группа ${groupNumber}`,
        createdAt: nowStr,
      });

      divisionsCreated.push({
        divisionId,
        groupNumber,
        studentCount: groupStudents.length,
      });

      // Create membership for each student in this group
      groupStudents.forEach((studentId) => {
        const membershipDocId = `${seasonId}_${studentId}`;
        const memberRef = db.collection('leagueMemberships').doc(membershipDocId);

        batch.set(memberRef, {
          id: membershipDocId,
          seasonId,
          divisionId,
          rank: 'bronze',
          groupNumber,
          userId: studentId,
          xpEarnedThisSeason: 0,
          pseudonym: '',
          useRealName: true,
          updatedAt: nowStr,
        });
      });
    });

    await batch.commit();

    await logAuditEvent({
      action: 'league.season_created',
      actorId: callerUid,
      actorRole: userData.role || 'admin',
      targetId: seasonId,
      targetType: 'season',
      metadata: {
        name,
        startDate,
        endDate,
        divisionsCount: divisionsCreated.length,
        studentsCount: studentIds.length,
      },
    });

    return {
      success: true,
      seasonId,
      name,
      divisionsCreated,
      totalStudentsEnrolled: studentIds.length,
    };
  } catch (err) {
    console.error('createSeason error:', err);
    await logFunctionError({
      functionName: 'createSeason',
      error: err,
      request,
    });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Ошибка создания сезона: ${err.message}`);
  }
});
