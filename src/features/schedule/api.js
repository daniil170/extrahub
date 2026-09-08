import { getDocuments, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

const MOCK_SCHEDULE = [
  {
    id: 'sch-1',
    activityTitle: 'Робототехника и Arduino',
    dayOfWeek: 1, // Понедельник
    startTime: '15:30',
    endTime: '17:00',
    location: 'Кабинет 304',
    teacherName: 'Михаил Петров',
  },
  {
    id: 'sch-2',
    activityTitle: 'Шахматный клуб "Гроссмейстер"',
    dayOfWeek: 3, // Среда
    startTime: '16:00',
    endTime: '17:30',
    location: 'Библиотека',
    teacherName: 'Анна Смирнова',
  },
  {
    id: 'sch-3',
    activityTitle: 'Робототехника и Arduino',
    dayOfWeek: 5, // Пятница
    startTime: '15:30',
    endTime: '17:00',
    location: 'Кабинет 304',
    teacherName: 'Михаил Петров',
  },
];

/**
 * Fetch schedule for student
 * @param {string} studentId
 */
export async function fetchStudentSchedule(studentId) {
  try {
    const groups = await getDocuments(COLLECTIONS.ACTIVITY_GROUPS);
    return groups.length > 0 ? groups : MOCK_SCHEDULE;
  } catch (error) {
    console.warn('Using mock schedule:', error.message);
    return MOCK_SCHEDULE;
  }
}
