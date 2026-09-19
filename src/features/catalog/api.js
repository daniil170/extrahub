import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { recordClientAudit } from '../../shared/services/auditLogger.js';

/**
 * Merge raw activities, groups, and teachers into ready-to-display activity models
 */
export function combineCatalogData(rawActivities, rawGroups, rawTeachers) {
  const teacherMap = {};
  (rawTeachers || []).forEach((t) => {
    if (t?.id) teacherMap[t.id] = t.fullName || t.name;
  });

  const groupsByActivity = {};
  (rawGroups || []).forEach((g) => {
    if (!groupsByActivity[g.activityId]) {
      groupsByActivity[g.activityId] = [];
    }
    groupsByActivity[g.activityId].push(g);
  });

  return (rawActivities || []).map((act) => {
    const groups = groupsByActivity[act.id] || [];
    const totalCapacity = groups.reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
    const totalEnrolled = groups.reduce((acc, g) => acc + (Number(g.enrolledCount) || 0), 0);
    const remainingSpots = Math.max(0, totalCapacity - totalEnrolled);
    const isFull = totalCapacity > 0 && totalEnrolled >= totalCapacity;

    const teacherName =
      teacherMap[act.teacherId] ||
      act.teacherName ||
      'Преподаватель школы';

    return {
      ...act,
      type: act.type === 'olympic_reserve' ? 'olympic_reserve' : act.type === 'club' ? 'club' : 'circle',
      subject: act.subject || '',
      allowedClasses: Array.isArray(act.allowedClasses) ? act.allowedClasses.map(Number) : [],
      allowedShifts: Array.isArray(act.allowedShifts) ? act.allowedShifts.map(Number) : [1, 2],
      requiresExam: Boolean(act.requiresExam),
      groups,
      teacherName,
      totalCapacity,
      totalEnrolled,
      remainingSpots,
      isFull,
    };
  });
}

/**
 * Create a new Activity record (saves directly to Firestore)
 * @param {Object} activityData
 */
export async function createActivityRecord(activityData) {
  const newId = activityData.id || `act-custom-${Date.now()}`;
  const record = {
    id: newId,
    title: (activityData.title || '').trim(),
    category: activityData.category || 'Общее развитие',
    type:
      activityData.type === 'olympic_reserve'
        ? 'olympic_reserve'
        : activityData.type === 'club'
        ? 'club'
        : 'circle',
    subject: activityData.subject ? String(activityData.subject).trim() : '',
    allowedClasses: Array.isArray(activityData.allowedClasses)
      ? activityData.allowedClasses.map(Number)
      : [7, 8, 9, 10, 11],
    allowedShifts: Array.isArray(activityData.allowedShifts)
      ? activityData.allowedShifts.map(Number)
      : [1, 2],
    requiresExam: Boolean(activityData.requiresExam),
    description: (activityData.description || '').trim(),
    teacherId: activityData.teacherId || `teacher-${Date.now()}`,
    teacherName: activityData.teacherName || 'Преподаватель школы',
    teacherBio:
      activityData.teacherBio ||
      `${activityData.teacherName || 'Преподаватель'} — опытный педагог школы и куратор направления.`,
    ageGroup: activityData.ageGroup || '7–17 лет',
    price:
      typeof activityData.price === 'number' ? activityData.price : Number(activityData.price) || 0,
    location: activityData.location || 'Школьный корпус',
    targetAudience:
      activityData.targetAudience ||
      'Для учеников, желающих углубить знания и освоить практические навыки.',
    requirements:
      activityData.requirements ||
      'Все учебные материалы, инвентарь и оборудование предоставляются школой.',
    learningOutcomes:
      Array.isArray(activityData.learningOutcomes) && activityData.learningOutcomes.length > 0
        ? activityData.learningOutcomes
        : [
            'Освоение базовых и продвинутых навыков по программе курса',
            'Развитие творческого, аналитического и проектного мышления',
            'Опыт командного взаимодействия и публичной презентации результатов',
          ],
    syllabus: Array.isArray(activityData.syllabus) ? activityData.syllabus : [],
    createdAt: new Date().toISOString(),
  };

  const docRef = doc(db, COLLECTIONS.ACTIVITIES, newId);
  await setDoc(docRef, record);

  recordClientAudit({
    action: 'activity.created',
    targetId: newId,
    targetType: 'activity',
    metadata: {
      title: record.title,
      category: record.category,
      price: record.price,
      teacherId: record.teacherId,
    },
  });

  return { success: true, activity: record };
}

/**
 * Subscribe to real-time activities and activityGroups from Firestore
 * @param {(activities: any[]) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeCatalog(onUpdate, onError) {
  let activitiesData = [];
  let groupsData = [];

  function pushCombined() {
    const enriched = combineCatalogData(activitiesData, groupsData, []);
    onUpdate(enriched);
  }

  const unsubActivities = onSnapshot(
    collection(db, COLLECTIONS.ACTIVITIES),
    (snapshot) => {
      activitiesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      pushCombined();
    },
    (err) => {
      console.error('Activities subscription error:', err);
      if (onError) onError(err);
    }
  );

  const unsubGroups = onSnapshot(
    collection(db, COLLECTIONS.ACTIVITY_GROUPS),
    (snapshot) => {
      groupsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      pushCombined();
    },
    (err) => {
      console.error('Groups subscription error:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubActivities();
    unsubGroups();
  };
}

