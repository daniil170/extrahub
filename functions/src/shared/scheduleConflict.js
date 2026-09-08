const DAY_NAMES = {
  1: 'понедельник',
  2: 'вторник',
  3: 'среду',
  4: 'четверг',
  5: 'пятницу',
  6: 'субботу',
  7: 'воскресенье',
};

/**
 * Converts HH:MM string to minutes from midnight
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {number} Minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Checks if two time intervals overlap on the same day
 * @param {string} startA - "HH:MM"
 * @param {string} endA - "HH:MM"
 * @param {string} startB - "HH:MM"
 * @param {string} endB - "HH:MM"
 * @returns {boolean} True if intervals overlap
 */
export function doIntervalsOverlap(startA, endA, startB, endB) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return aStart < bEnd && bStart < aEnd;
}

/**
 * Checks for schedule conflicts between a proposed group and existing active enrollments
 * @param {Object} targetGroup - Target activity group
 * @param {number[]} targetGroup.daysOfWeek - Days of week [1..7]
 * @param {string} targetGroup.startTime - "HH:MM"
 * @param {string} targetGroup.endTime - "HH:MM"
 * @param {Array<{ enrollment: Object, group: Object, activity: Object }>} existingItems - Active enrollments with group and activity info
 * @returns {{ hasConflict: boolean, conflictMessage?: string, conflictingActivity?: Object, conflictingGroup?: Object }}
 */
export function findScheduleConflict(targetGroup, existingItems = []) {
  const targetDays = new Set(targetGroup.daysOfWeek || []);

  for (const item of existingItems) {
    const existingGroup = item.group;
    if (!existingGroup) continue;

    // Check if groups share any days of the week
    const sharedDays = (existingGroup.daysOfWeek || []).filter((day) => targetDays.has(day));

    if (sharedDays.length > 0) {
      if (
        doIntervalsOverlap(
          targetGroup.startTime,
          targetGroup.endTime,
          existingGroup.startTime,
          existingGroup.endTime
        )
      ) {
        const dayName = DAY_NAMES[sharedDays[0]] || `день ${sharedDays[0]}`;
        const activityTitle = item.activity?.title || 'Другой кружок';
        const conflictMessage = `Накладка в расписании: пересекается с кружком "${activityTitle}" в ${dayName} (${existingGroup.startTime} - ${existingGroup.endTime})`;

        return {
          hasConflict: true,
          conflictMessage,
          conflictingActivity: item.activity,
          conflictingGroup: existingGroup,
          sharedDay: sharedDays[0],
        };
      }
    }
  }

  return { hasConflict: false };
}
