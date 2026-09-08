import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';

export const MOCK_TEACHERS = {
  'teacher-1': { id: 'teacher-1', fullName: 'Михаил Сергеевич Петров' },
  'teacher-2': { id: 'teacher-2', fullName: 'Елена Викторовна Соколова' },
  'teacher-3': { id: 'teacher-3', fullName: 'Дмитрий Анатольевич Смирнов' },
  'teacher-4': { id: 'teacher-4', fullName: 'Сергей Иванович Кузнецов' },
  'teacher-5': { id: 'teacher-5', fullName: 'Анна Владимировна Морозова' },
  'teacher-6': { id: 'teacher-6', fullName: 'Ольга Николаевна Васильева' },
};

export const MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Робототехника и Arduino',
    category: 'Технологии',
    description:
      'Основы схемотехники, программирование микроконтроллеров и конструирование роботов.',
    teacherId: 'teacher-1',
    ageGroup: '10–14 лет (5–8 класс)',
    price: 3500,
    location: 'Кабинет 304 (IT-лаборатория)',
  },
  {
    id: 'act-2',
    title: 'Театральная студия "Маска"',
    category: 'Искусство',
    description:
      'Развитие сценической речи, актёрское мастерство и постановка школьных спектаклей.',
    teacherId: 'teacher-2',
    ageGroup: '7–16 лет (1–10 класс)',
    price: 2500,
    location: 'Актовый зал',
  },
  {
    id: 'act-3',
    title: 'Шахматный клуб "Гроссмейстер"',
    category: 'Интеллект',
    description:
      'Тактика и стратегия шахматной игры, решение этюдов и участие в городских турнирах.',
    teacherId: 'teacher-3',
    ageGroup: '7–17 лет (1–11 класс)',
    price: 0,
    location: 'Библиотека, читальный зал',
  },
  {
    id: 'act-4',
    title: 'Школьный волейбол',
    category: 'Спорт',
    description:
      'Командная спортивная секция, отработка подачи и приёма мяча, физическая подготовка.',
    teacherId: 'teacher-4',
    ageGroup: '12–17 лет (6–11 класс)',
    price: 1800,
    location: 'Большой спортивный зал',
  },
  {
    id: 'act-5',
    title: 'Разговорный английский Debate Club',
    category: 'Языки',
    description:
      'Практика живого английского языка, участие в дебатах, расширение словарного запаса.',
    teacherId: 'teacher-5',
    ageGroup: '11–16 лет (5–10 класс)',
    price: 3200,
    location: 'Кабинет 214',
  },
  {
    id: 'act-6',
    title: 'Олимпиадная математика',
    category: 'Наука',
    description:
      'Нестандартные задачи, логика, комбинаторика и подготовка к Всероссийской олимпиаде.',
    teacherId: 'teacher-6',
    ageGroup: '8–12 лет (2–6 класс)',
    price: 2800,
    location: 'Кабинет 108',
  },
];

export const MOCK_ACTIVITY_GROUPS = [
  // Робототехника (2 группы: одна со свободными местами, вторая заполнена)
  {
    id: 'grp-1-1',
    activityId: 'act-1',
    name: 'Группа А (Начинающие)',
    capacity: 12,
    enrolledCount: 8,
    daysOfWeek: [1, 3], // Пн, Ср
    startTime: '15:30',
    endTime: '17:00',
  },
  {
    id: 'grp-1-2',
    activityId: 'act-1',
    name: 'Группа Б (Продвинутые)',
    capacity: 10,
    enrolledCount: 10, // Full
    daysOfWeek: [2, 4], // Вт, Чт
    startTime: '16:00',
    endTime: '17:30',
  },
  // Театр (1 группа, полностью заполнена -> проверка waitlist)
  {
    id: 'grp-2-1',
    activityId: 'act-2',
    name: 'Основная труппа',
    capacity: 15,
    enrolledCount: 15, // Fully booked!
    daysOfWeek: [2, 5], // Вт, Пт
    startTime: '16:00',
    endTime: '18:00',
  },
  // Шахматы (1 группа)
  {
    id: 'grp-3-1',
    activityId: 'act-3',
    name: 'Все уровни',
    capacity: 16,
    enrolledCount: 11,
    daysOfWeek: [3, 6], // Ср, Сб
    startTime: '15:00',
    endTime: '16:30',
  },
  // Волейбол (1 группа)
  {
    id: 'grp-4-1',
    activityId: 'act-4',
    name: 'Сборная секция',
    capacity: 14,
    enrolledCount: 9,
    daysOfWeek: [1, 4], // Пн, Чт
    startTime: '17:00',
    endTime: '18:30',
  },
  // Английский (1 группа)
  {
    id: 'grp-5-1',
    activityId: 'act-5',
    name: 'English Debates Group',
    capacity: 10,
    enrolledCount: 4,
    daysOfWeek: [2, 5], // Вт, Пт
    startTime: '15:00',
    endTime: '16:30',
  },
  // Олимпиадная математика (1 группа)
  {
    id: 'grp-6-1',
    activityId: 'act-6',
    name: 'Младшая лига',
    capacity: 12,
    enrolledCount: 9,
    daysOfWeek: [1, 5], // Пн, Пт
    startTime: '16:30',
    endTime: '18:00',
  },
];

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
export function subscribeCatalog(onUpdate, onError) {
  let activitiesData = null;
  let groupsData = null;
  let teachersData = null;

  function pushCombined() {
    const acts = activitiesData && activitiesData.length > 0 ? activitiesData : MOCK_ACTIVITIES;
    const grps = groupsData && groupsData.length > 0 ? groupsData : MOCK_ACTIVITY_GROUPS;
    const tchrs =
      teachersData && teachersData.length > 0 ? teachersData : Object.values(MOCK_TEACHERS);

    const enriched = combineCatalogData(acts, grps, tchrs);
    onUpdate(enriched);
  }

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
      unsubActivities();
      unsubGroups();
      unsubUsers();
    };
  } catch (error) {
    console.warn('Firestore subscription failed, falling back to mock catalog:', error.message);
    pushCombined();
    if (onError) onError(error);
    return () => {};
  }
}
