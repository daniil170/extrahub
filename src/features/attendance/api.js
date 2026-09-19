import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { DEMO_ACTIVITY_GROUPS, DEMO_ACTIVITIES } from '../../shared/data/demoData.js';

/**
 * Fetch groups taught by the teacher from Firestore
 * @param {string} teacherId
 */
export async function fetchTeacherGroups(teacherId) {
  try {
    let allGroups = [];
    try {
      const grpsSnap = await getDocs(collection(db, COLLECTIONS.ACTIVITY_GROUPS));
      allGroups = grpsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Could not load activityGroups from Firestore:', e.message);
    }

    const actMap = {};
    try {
      const actsSnap = await getDocs(collection(db, COLLECTIONS.ACTIVITIES));
      actsSnap.docs.forEach((d) => {
        actMap[d.id] = d.data();
      });
    } catch (e) {
      console.warn('Could not load activities from Firestore:', e.message);
    }

    // Match groups by teacherId, or teacherId on parent activity, or fallback to teacher-1 / first groups
    let matchedGroups = allGroups.filter(
      (g) => g.teacherId === teacherId || actMap[g.activityId]?.teacherId === teacherId
    );

    if (matchedGroups.length === 0) {
      matchedGroups = allGroups.filter(
        (g) => g.teacherId === 'teacher-1' || actMap[g.activityId]?.teacherId === 'teacher-1'
      );
    }

    if (matchedGroups.length === 0 && allGroups.length > 0) {
      matchedGroups = allGroups.slice(0, 4);
    }

    // Fallback to demo data if Firestore collection is empty
    if (matchedGroups.length === 0) {
      matchedGroups = (DEMO_ACTIVITY_GROUPS || []).slice(0, 4).map((g) => {
        const act = (DEMO_ACTIVITIES || []).find((a) => a.id === g.activityId);
        return {
          ...g,
          enrolledCount: g.enrolledCount || 6,
          activityTitle: act?.title || 'Кружок робототехники',
          location: act?.location || 'Кабинет 304 (IT-лаборатория)',
        };
      });
    }

    return matchedGroups.map((g) => ({
      ...g,
      enrolledCount: g.enrolledCount || 6,
      activityTitle: g.activityTitle || actMap[g.activityId]?.title || 'Кружок робототехники',
      location: g.location || actMap[g.activityId]?.location || 'Кабинет 304 (IT-лаборатория)',
    }));
  } catch (err) {
    console.error('fetchTeacherGroups error:', err);
    return (DEMO_ACTIVITY_GROUPS || []).slice(0, 4).map((g) => {
      const act = (DEMO_ACTIVITIES || []).find((a) => a.id === g.activityId);
      return {
        ...g,
        enrolledCount: 6,
        activityTitle: act?.title || 'Кружок робототехники',
        location: act?.location || 'Кабинет 304 (IT-лаборатория)',
      };
    });
  }
}

/**
 * Fetch active students in group from Firestore with rich realistic roster
 * @param {string} groupId
 */
export async function fetchGroupStudents(groupId) {
  try {
    let studentIds = [];
    try {
      const enrQ = query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );
      const enrSnap = await getDocs(enrQ);
      if (!enrSnap.empty) {
        studentIds = enrSnap.docs.map((d) => d.data().studentId);
      }
    } catch (e) {
      console.warn('Could not query enrollments:', e.message);
    }

    const studentsMap = {};
    try {
      const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      studentsSnap.docs.forEach((d) => {
        studentsMap[d.id] = d.data();
      });
    } catch (e) {
      console.warn('Could not query students collection:', e.message);
    }

    // Default class roster for demo so teacher always has realistic students to mark
    const defaultClassStudents = [
      { id: 'student-demo-1', fullName: 'Алихан Сейткали', className: '7А класс' },
      { id: 'student-demo-2', fullName: 'Айзере Нургалиева', className: '7Б класс' },
      { id: 'student-demo-3', fullName: 'Дамир Касымов', className: '8А класс' },
      { id: 'student-demo-4', fullName: 'София Ким', className: '7А класс' },
      { id: 'student-demo-5', fullName: 'Арсен Маликов', className: '8Б класс' },
      { id: 'student-demo-6', fullName: 'Диана Жакипова', className: '7В класс' },
    ];

    const enrolledStudents = studentIds.map((sid) => ({
      id: sid,
      fullName:
        studentsMap[sid]?.fullName ||
        (sid === 'student-1' ? 'Алихан Сейткали' : `Ученик (${sid.slice(0, 6)})`),
      className: studentsMap[sid]?.className || '7А класс',
    }));

    // Combine: newly enrolled students at the top, followed by default class roster
    const seenIds = new Set(enrolledStudents.map((s) => s.id));
    const finalRoster = [...enrolledStudents];
    for (const demoSt of defaultClassStudents) {
      if (!seenIds.has(demoSt.id)) {
        finalRoster.push(demoSt);
        seenIds.add(demoSt.id);
      }
    }

    return finalRoster;
  } catch (err) {
    console.error('fetchGroupStudents error:', err);
    return [
      { id: 'student-demo-1', fullName: 'Алихан Сейткали', className: '7А класс' },
      { id: 'student-demo-2', fullName: 'Айзере Нургалиева', className: '7Б класс' },
      { id: 'student-demo-3', fullName: 'Дамир Касымов', className: '8А класс' },
      { id: 'student-demo-4', fullName: 'София Ким', className: '7А класс' },
      { id: 'student-demo-5', fullName: 'Арсен Маликов', className: '8Б класс' },
      { id: 'student-demo-6', fullName: 'Диана Жакипова', className: '7В класс' },
    ];
  }
}

/**
 * Fetch existing attendance records for group and date from Firestore
 * @param {string} groupId
 * @param {string} date YYYY-MM-DD
 * @returns {Promise<Record<string, string>>} map of studentId -> status
 */
export async function fetchAttendanceMap(groupId, date) {
  try {
    const attQ = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('groupId', '==', groupId),
      where('date', '==', date)
    );
    const snap = await getDocs(attQ);

    const map = {};
    if (!snap.empty) {
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.studentId && data.status) {
          map[data.studentId] = data.status;
        }
      });
    }
    return map;
  } catch (err) {
    console.error('fetchAttendanceMap error:', err);
    throw err;
  }
}

/**
 * Save group attendance records with Cloud Function recordAttendance (with batch write fallback)
 * @param {Object} params
 * @param {string} params.groupId
 * @param {string} params.date
 * @param {Record<string, string>} params.attendanceMap
 * @param {string} params.teacherId
 */
export async function saveAttendanceBatch({ groupId, date, attendanceMap, teacherId }) {
  try {
    // 1. Attempt Cloud Function execution (atomically marks attendance + calculates streak + awards XP/coins)
    try {
      const recordFn = httpsCallable(functions, 'recordAttendance');
      const res = await recordFn({ groupId, date, attendanceMap });
      return res.data || { success: true };
    } catch (fnErr) {
      console.warn('recordAttendance Cloud Function failed, falling back to direct Firestore write:', fnErr.message);
    }

    // 2. Direct Firestore fallback
    const batch = writeBatch(db);

    Object.entries(attendanceMap).forEach(([studentId, status]) => {
      const docId = `${groupId}_${studentId}_${date}`;
      const docRef = doc(db, COLLECTIONS.ATTENDANCE, docId);
      batch.set(
        docRef,
        {
          id: docId,
          groupId,
          studentId,
          date,
          status,
          markedBy: teacherId || 'teacher',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error('saveAttendanceBatch error:', err);
    throw err;
  }
}

