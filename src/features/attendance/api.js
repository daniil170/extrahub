import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

import {
  DEMO_STUDENTS,
  DEMO_ATTENDANCE_HISTORY,
} from '../../shared/data/demoData.js';

export const MOCK_TEACHER_GROUPS = [
  {
    id: 'grp-1-1',
    activityId: 'act-1',
    activityTitle: 'Робототехника и микроэлектроника Arduino',
    name: 'Группа А (Начинающие)',
    location: 'Кабинет 304 (IT-лаборатория)',
    daysOfWeek: [1, 3],
    startTime: '15:30',
    endTime: '17:00',
    enrolledCount: 8,
    capacity: 12,
  },
  {
    id: 'grp-1-2',
    activityId: 'act-1',
    activityTitle: 'Робототехника и микроэлектроника Arduino',
    name: 'Группа Б (Продвинутые)',
    location: 'Кабинет 304 (IT-лаборатория)',
    daysOfWeek: [2, 4],
    startTime: '16:00',
    endTime: '17:30',
    enrolledCount: 10,
    capacity: 10,
  },
];

export const MOCK_GROUP_STUDENTS = {
  'grp-1-1': DEMO_STUDENTS,
  'grp-1-2': DEMO_STUDENTS.slice(2, 8),
};

// In-memory mock storage pre-filled with 3 weeks of realistic school attendance
const devAttendanceStore = {
  ...DEMO_ATTENDANCE_HISTORY,
};

/**
 * Fetch groups taught by the teacher
 * @param {string} teacherId
 */
export async function fetchTeacherGroups(teacherId) {
  try {
    // 1. Find activities for teacher with quick timeout
    const actsQ = query(
      collection(db, COLLECTIONS.ACTIVITIES),
      where('teacherId', '==', teacherId)
    );
    const getDocsPromise = getDocs(actsQ);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 800)
    );
    const actsSnap = await Promise.race([getDocsPromise, timeoutPromise]);

    if (actsSnap.empty) {
      return MOCK_TEACHER_GROUPS;
    }

    const activityIds = actsSnap.docs.map((d) => d.id);
    const actMap = {};
    actsSnap.docs.forEach((d) => {
      actMap[d.id] = d.data();
    });

    // 2. Find groups for these activities
    const grpsSnapPromise = getDocs(collection(db, COLLECTIONS.ACTIVITY_GROUPS));
    const grpsSnap = await Promise.race([grpsSnapPromise, timeoutPromise]);
    const teacherGroups = grpsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => activityIds.includes(g.activityId))
      .map((g) => ({
        ...g,
        activityTitle: actMap[g.activityId]?.title || 'Кружок',
        location: actMap[g.activityId]?.location || 'Школьный корпус',
      }));

    return teacherGroups.length > 0 ? teacherGroups : MOCK_TEACHER_GROUPS;
  } catch (err) {
    console.warn('fetchTeacherGroups fallback to mock:', err.message);
    return MOCK_TEACHER_GROUPS;
  }
}

/**
 * Fetch active students in group
 * @param {string} groupId
 */
export async function fetchGroupStudents(groupId) {
  try {
    const enrQ = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('groupId', '==', groupId),
      where('status', '==', 'active')
    );
    const getDocsPromise = getDocs(enrQ);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 800)
    );
    const enrSnap = await Promise.race([getDocsPromise, timeoutPromise]);

    if (enrSnap.empty) {
      return MOCK_GROUP_STUDENTS[groupId] || MOCK_GROUP_STUDENTS['grp-1-1'];
    }

    const studentIds = enrSnap.docs.map((d) => d.data().studentId);
    const studentsSnapPromise = getDocs(collection(db, COLLECTIONS.STUDENTS));
    const studentsSnap = await Promise.race([studentsSnapPromise, timeoutPromise]);
    const studentsMap = {};
    studentsSnap.docs.forEach((d) => {
      studentsMap[d.id] = d.data();
    });

    return studentIds.map((sid) => ({
      id: sid,
      fullName: studentsMap[sid]?.fullName || `Ученик (${sid})`,
      className: studentsMap[sid]?.className || '',
    }));
  } catch (err) {
    console.warn('fetchGroupStudents fallback to mock:', err.message);
    return MOCK_GROUP_STUDENTS[groupId] || MOCK_GROUP_STUDENTS['grp-1-1'];
  }
}

/**
 * Fetch existing attendance records for group and date
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
    const getDocsPromise = getDocs(attQ);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection timeout')), 1000)
    );
    const snap = await Promise.race([getDocsPromise, timeoutPromise]);

    const map = {};
    if (!snap.empty) {
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.studentId && data.status) {
          map[data.studentId] = data.status;
        }
      });
      return map;
    }

    // Check in-memory mock storage
    const devKey = `${groupId}_${date}`;
    if (devAttendanceStore[devKey]) {
      return { ...devAttendanceStore[devKey] };
    }

    return {};
  } catch (err) {
    console.warn('fetchAttendanceMap fallback to mock:', err.message);
    const devKey = `${groupId}_${date}`;
    return devAttendanceStore[devKey] ? { ...devAttendanceStore[devKey] } : {};
  }
}

/**
 * Save group attendance records with batch write
 * @param {Object} params
 * @param {string} params.groupId
 * @param {string} params.date
 * @param {Record<string, string>} params.attendanceMap
 * @param {string} params.teacherId
 */
export async function saveAttendanceBatch({ groupId, date, attendanceMap, teacherId }) {
  try {
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
          markedBy: teacherId || 'dev-teacher',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    const commitPromise = batch.commit();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection timeout')), 1000)
    );
    await Promise.race([commitPromise, timeoutPromise]);
    return { success: true };
  } catch (err) {
    console.warn('saveAttendanceBatch fallback to local storage:', err.message);
    const devKey = `${groupId}_${date}`;
    devAttendanceStore[devKey] = { ...attendanceMap };
    return { success: true, isDevMock: true };
  }
}
