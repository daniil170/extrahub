import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

import {
  DEMO_TEACHERS,
  DEMO_ACTIVITIES,
  DEMO_ACTIVITY_GROUPS,
} from '../../shared/data/demoData.js';

export const MOCK_TEACHERS = DEMO_TEACHERS;
export const MOCK_ACTIVITIES = DEMO_ACTIVITIES;
export const MOCK_ACTIVITY_GROUPS = DEMO_ACTIVITY_GROUPS;

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
      MOCK_TEACHERS[act.teacherId]?.fullName ||
      act.teacherName ||
      'Преподаватель школы';

    return {
      ...act,
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
 * Subscribe to real-time activities and activityGroups from Firestore,
 * with graceful fallback to mock data when Firestore collections are empty or offline.
 * @param {(activities: any[]) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
const ACTIVITIES_STORAGE_KEY = 'extrahub_dev_activities';

function getInitialActivities() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [...MOCK_ACTIVITIES];
}

export let devActivitiesStore = getInitialActivities();
const activityListeners = new Set();

export function notifyActivitiesChanged() {
  activityListeners.forEach((listener) => {
    try {
      listener(devActivitiesStore);
    } catch (err) {
      console.error('Error in activity listener:', err);
    }
  });
}

export function subscribeActivities(callback) {
  activityListeners.add(callback);
  return () => activityListeners.delete(callback);
}

/**
 * Reset activities store to default mocks (useful for testing or resetting demo state)
 */
export function resetActivitiesStore() {
  devActivitiesStore = [...MOCK_ACTIVITIES];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  notifyActivitiesChanged();
}

/**
 * Create a new Activity record (saves to Firestore or dev local storage)
 * @param {Object} activityData
 */
export async function createActivityRecord(activityData) {
  const newId = activityData.id || `act-custom-${Date.now()}`;
  const record = {
    id: newId,
    title: (activityData.title || '').trim(),
    category: activityData.category || 'Общее развитие',
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
    syllabus:
      Array.isArray(activityData.syllabus) && activityData.syllabus.length > 0
        ? activityData.syllabus
        : [
            {
              module: 'Модуль 1',
              title: 'Введение и основы направления',
              description: 'Знакомство с предметом, базовые понятия, инструменты и правила безопасности.',
              hours: '6 ак. ч.',
            },
            {
              module: 'Модуль 2',
              title: 'Практические навыки и упражнения',
              description: 'Погружение в практическую деятельность и выполнение базовых упражнений.',
              hours: '8 ак. ч.',
            },
            {
              module: 'Модуль 3',
              title: 'Углубленная индивидуальная работа',
              description: 'Решение комплексных задач и разбор прикладных кейсов.',
              hours: '10 ак. ч.',
            },
            {
              module: 'Модуль 4',
              title: 'Командный проект',
              description: 'Разработка собственного группового или индивидуального проекта под кураторством педагога.',
              hours: '12 ак. ч.',
            },
            {
              module: 'Модуль 5',
              title: 'Итоговая демонстрация и защита',
              description: 'Презентация и защита результатов родителям, подведение итогов и вручение сертификатов.',
              hours: '6 ак. ч.',
            },
          ],
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, COLLECTIONS.ACTIVITIES, newId);
    const setPromise = setDoc(docRef, record);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 300)
    );
    await Promise.race([setPromise, timeoutPromise]);
  } catch (err) {
    console.warn('createActivityRecord fallback to dev storage:', err.message);
  }

  // Prepend to store so newly created appears immediately at the top
  devActivitiesStore = [record, ...devActivitiesStore.filter((a) => a.id !== newId)];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(devActivitiesStore));
    } catch {
      // ignore
    }
  }
  notifyActivitiesChanged();

  return { success: true, activity: record };
}

/**
 * Subscribe to real-time activities and activityGroups from Firestore,
 * with graceful fallback to mock data when Firestore collections are empty or offline.
 * @param {(activities: any[]) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeCatalog(onUpdate, onError) {
  let activitiesData = null;
  let groupsData = null;
  let teachersData = null;

  function pushCombined() {
    const acts = activitiesData && activitiesData.length > 0 ? activitiesData : devActivitiesStore;
    const grps = groupsData && groupsData.length > 0 ? groupsData : MOCK_ACTIVITY_GROUPS;
    const tchrs =
      teachersData && teachersData.length > 0 ? teachersData : Object.values(MOCK_TEACHERS);

    const enriched = combineCatalogData(acts, grps, tchrs);
    onUpdate(enriched);
  }

  // Also react immediately to local activity store changes (e.g. newly created activity)
  const unsubLocal = subscribeActivities(() => {
    if (!activitiesData || activitiesData.length === 0) {
      pushCombined();
    }
  });

  try {
    const unsubActivities = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snapshot) => {
        activitiesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        pushCombined();
      },
      (err) => {
        console.warn('Activities subscription fallback:', err.message);
        pushCombined();
      }
    );

    const unsubGroups = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snapshot) => {
        groupsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        pushCombined();
      },
      (err) => {
        console.warn('Groups subscription fallback:', err.message);
        pushCombined();
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snapshot) => {
        teachersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        pushCombined();
      },
      (err) => {
        console.warn('Teachers subscription fallback:', err.message);
        pushCombined();
      }
    );

    return () => {
      unsubLocal();
      unsubActivities();
      unsubGroups();
      unsubUsers();
    };
  } catch (error) {
    console.warn('Firestore subscription failed, falling back to mock catalog:', error.message);
    pushCombined();
    if (onError) onError(error);
    return () => {
      unsubLocal();
    };
  }
}
