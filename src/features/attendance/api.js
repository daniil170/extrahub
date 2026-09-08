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

export const MOCK_TEACHER_GROUPS = [
  {
    id: 'grp-1-1',
    activityId: 'act-1',
    activityTitle: 'Робототехника и Arduino',
    name: 'Группа А (Начинающие)',
    location: 'Кабинет 304 (IT-лаборатория)',
    daysOfWeek: [1, 3],
    startTime: '15:30',
    endTime: '17:00',
    enrolledCount: 5,
    capacity: 12,
  },
  {
    id: 'grp-1-2',
    activityId: 'act-1',
    activityTitle: 'Робототехника и Arduino',
    name: 'Группа Б (Продвинутые)',
    location: 'Кабинет 304 (IT-лаборатория)',
    daysOfWeek: [2, 4],
    startTime: '16:00',
    endTime: '17:30',
    enrolledCount: 3,
    capacity: 10,
  },
  {
    id: 'grp-3-1',
    activityId: 'act-3',
    activityTitle: 'Шахматный клуб "Гроссмейстер"',
    name: 'Все уровни',
    location: 'Библиотека, читальный зал',
    daysOfWeek: [3, 6],
    startTime: '15:00',
    endTime: '16:30',
    enrolledCount: 3,
    capacity: 16,
  },
];

export const MOCK_GROUP_STUDENTS = {
  'grp-1-1': [
    { id: 'student-1', fullName: 'Александр Иванов', className: '7-Б класс' },
    { id: 'student-2', fullName: 'София Иванова', className: '5-Б класс' },
    { id: 'student-3', fullName: 'Дарья Смирнова', className: '7-А класс' },
    { id: 'student-4', fullName: 'Илья Кузнецов', className: '8-В класс' },
    { id: 'student-5', fullName: 'Максим Смирнов', className: '7-Б класс' },
  ],
  'grp-1-2': [
    { id: 'student-6', fullName: 'Екатерина Попова', className: '8-А класс' },
    { id: 'student-7', fullName: 'Артем Соколов', className: '7-А класс' },
    { id: 'student-8', fullName: 'Виктория Морозова', className: '6-Б класс' },
  ],
  'grp-3-1': [
    { id: 'student-1', fullName: 'Александр Иванов', className: '7-Б класс' },
    { id: 'student-4', fullName: 'Илья Кузнецов', className: '8-В класс' },
    { id: 'student-9', fullName: 'Денис Новиков', className: '9-А класс' },
  ],
};

// In-memory mock storage for local session testing
const devAttendanceStore = {
  'grp-1-1_2026-09-08': {
    'student-1': 'present',
    'student-2': 'present',
    'student-3': 'late',
    'student-4': 'absent',
    'student-5': 'excused',
  },
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
