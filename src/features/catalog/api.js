import { getDocuments, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

// Sample fallback data for initial architecture exploration
const MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Робототехника и Arduino',
    category: 'Технологии',
    description: 'Основы схемотехники, программирование микроконтроллеров и сборка роботов.',
    teacherId: 'teacher-1',
    ageGroup: '10-15 лет',
    price: 3500,
    location: 'Кабинет 304',
  },
  {
    id: 'act-2',
    title: 'Театральная студия "Маска"',
    category: 'Искусство',
    description: 'Развитие ораторского мастерства, сценическая речь и постановка спектаклей.',
    teacherId: 'teacher-2',
    ageGroup: '7-16 лет',
    price: 2500,
    location: 'Актовый зал',
  },
  {
    id: 'act-3',
    title: 'Шахматный клуб "Гроссмейстер"',
    category: 'Интеллект',
    description: 'Стратегия и тактика шахматных партий, участие в школьных турнирах.',
    teacherId: 'teacher-3',
    ageGroup: '6-17 лет',
    price: 0,
    location: 'Библиотека',
  },
];

/**
 * Fetch list of activities from Firestore or mock fallback
 * @returns {Promise<import('../../entities/activity/model.js').Activity[]>}
 */
export async function fetchActivities() {
  try {
    const data = await getDocuments(COLLECTIONS.ACTIVITIES);
    return data.length > 0 ? data : MOCK_ACTIVITIES;
  } catch (error) {
    console.warn('Using mock activities (Firebase not connected yet):', error.message);
    return MOCK_ACTIVITIES;
  }
}

/**
 * Fetch activity groups
 * @param {string} activityId
 * @returns {Promise<import('../../entities/activity/model.js').ActivityGroup[]>}
 */
export async function fetchActivityGroups(activityId) {
  try {
    const groups = await getDocuments(COLLECTIONS.ACTIVITY_GROUPS);
    return groups.filter((g) => g.activityId === activityId);
  } catch (error) {
    console.warn('Using mock groups:', error.message);
    return [];
  }
}
