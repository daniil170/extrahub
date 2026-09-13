import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

/**
 * Fetch schedule for student from Firestore
 * @param {string} studentId
 */
export async function fetchStudentSchedule(studentId) {
  if (!studentId) return [];
  try {
    // 1. Get active enrollments for student
    const enrQ = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('studentId', '==', studentId),
      where('status', '==', 'active')
    );
    const enrSnap = await getDocs(enrQ);
    if (enrSnap.empty) return [];

    const groupIds = Array.from(new Set(enrSnap.docs.map((d) => d.data().groupId).filter(Boolean)));

    // 2. Fetch activities
    const actsSnap = await getDocs(collection(db, COLLECTIONS.ACTIVITIES));
    const actMap = {};
    actsSnap.docs.forEach((d) => {
      actMap[d.id] = d.data();
    });

    // 3. Fetch groups
    const grpsSnap = await getDocs(collection(db, COLLECTIONS.ACTIVITY_GROUPS));
    const studentGroups = grpsSnap.docs
      .filter((d) => groupIds.includes(d.id))
      .map((d) => {
        const grp = d.data();
        const act = actMap[grp.activityId] || {};
        return {
          id: d.id,
          ...grp,
          activityTitle: act.title || 'Кружок',
          location: act.location || 'Школьный корпус',
          teacherName: act.teacherName || 'Преподаватель',
        };
      });

    return studentGroups;
  } catch (error) {
    console.error('Failed to fetch student schedule:', error);
    throw error;
  }
}

