import { EVENT_TYPES, createClubEvent } from '../../entities/calendarEvent/model.js';

/**
 * Format a Date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build ISO datetime string from Date and HH:mm time string
 * @param {Date} date
 * @param {string} timeStr - e.g. "15:30"
 * @returns {string}
 */
export function combineDateAndTime(date, timeStr = '15:00') {
  const [hours, minutes] = (timeStr || '15:00').split(':').map((v) => Number(v) || 0);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

/**
 * Parse Date or date string to local Date object at midnight
 * @param {Date|string} d
 * @param {boolean} [isEnd=false]
 * @returns {Date}
 */
export function parseToLocalDate(d, isEnd = false) {
  if (!d) return new Date(NaN);
  if (d instanceof Date) {
    const res = new Date(d);
    if (isEnd) res.setHours(23, 59, 59, 999);
    else res.setHours(0, 0, 0, 0);
    return res;
  }
  const str = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, day] = str.split('-').map(Number);
    return isEnd ? new Date(y, m - 1, day, 23, 59, 59, 999) : new Date(y, m - 1, day, 0, 0, 0, 0);
  }
  const parsed = new Date(d);
  if (isEnd) parsed.setHours(23, 59, 59, 999);
  else parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/**
 * Generates virtual regular lesson events on the fly for active student/teacher groups
 * over a specified date range without polluting Firestore database documents.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.groups - Array of activityGroup objects
 * @param {Date|string} params.startDate - Range start
 * @param {Date|string} params.endDate - Range end
 * @param {Record<string, any>} [params.activitiesMap={}] - Map of activityId -> activity
 * @returns {Array<Object>}
 */
export function generateVirtualLessons({
  groups = [],
  startDate,
  endDate,
  activitiesMap = {},
}) {
  if (!Array.isArray(groups) || groups.length === 0) return [];

  const start = parseToLocalDate(startDate, false);
  const end = parseToLocalDate(endDate, true);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const virtualEvents = [];
  const current = new Date(start);

  while (current <= end) {
    // ISO Day: 1 = Monday, ..., 7 = Sunday
    const jsDay = current.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    const dateKey = formatDateKey(current);

    for (const group of groups) {
      if (!group || !Array.isArray(group.daysOfWeek)) continue;

      if (group.daysOfWeek.includes(isoDay)) {
        const act = activitiesMap[group.activityId] || {};
        const startTimeIso = combineDateAndTime(current, group.startTime || '15:30');
        const endTimeIso = combineDateAndTime(current, group.endTime || '17:00');

        const lesson = createClubEvent({
          id: `virtual_${group.id}_${dateKey}`,
          title: group.name ? `${act.title ? act.title + ' — ' : ''}${group.name}` : (act.title || 'Регулярное занятие'),
          description: act.description || `Плановое занятие в группе "${group.name || ''}"`,
          type: EVENT_TYPES.LESSON,
          groupId: group.id,
          groupName: group.name || 'Основная группа',
          activityId: group.activityId || act.id || null,
          activityTitle: act.title || group.name || 'Секция',
          teacherId: group.teacherId || act.teacherId || '',
          teacherName: group.teacherName || act.teacherName || 'Преподаватель',
          startTime: startTimeIso,
          endTime: endTimeIso,
          location: group.room || act.room || act.location || 'Кабинет занятий',
          isBossEvent: false,
          xpReward: 50,
          coinsReward: 10,
          requiresRsvp: false,
          isVirtual: true,
        });

        virtualEvents.push(lesson);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return virtualEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
