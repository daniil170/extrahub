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


/**
 * Fetch groups taught by the teacher from Firestore
 * @param {string} teacherId
 */
export async function fetchTeacherGroups(teacherId) {
  try {
    // 1. Find activities for teacher
    const actsQ = query(
      collection(db, COLLECTIONS.ACTIVITIES),
      where('teacherId', '==', teacherId)
    );
    const actsSnap = await getDocs(actsQ);

    if (actsSnap.empty) {
      return [];
    }

    const activityIds = actsSnap.docs.map((d) => d.id);
    const actMap = {};
    actsSnap.docs.forEach((d) => {
      actMap[d.id] = d.data();
    });

    // 2. Find groups for these activities
    const grpsSnap = await getDocs(collection(db, COLLECTIONS.ACTIVITY_GROUPS));
    const teacherGroups = grpsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => activityIds.includes(g.activityId))
      .map((g) => ({
        ...g,
        activityTitle: actMap[g.activityId]?.title || 'Кружок',
        location: actMap[g.activityId]?.location || 'Школьный корпус',
      }));

    return teacherGroups;
  } catch (err) {
    console.error('fetchTeacherGroups error:', err);
    throw err;
  }
}

/**
 * Fetch active students in group from Firestore
 * @param {string} groupId
 */
export async function fetchGroupStudents(groupId) {
  try {
    const enrQ = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('groupId', '==', groupId),
      where('status', '==', 'active')
    );
    const enrSnap = await getDocs(enrQ);

    if (enrSnap.empty) {
      return [];
    }

    const studentIds = enrSnap.docs.map((d) => d.data().studentId);
    const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
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
    console.error('fetchGroupStudents error:', err);
    throw err;
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
 * Save group attendance records with batch write to Firestore
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

