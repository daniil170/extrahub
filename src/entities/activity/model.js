/**
 * @typedef {Object} Activity
 * @property {string} id - Unique activity identifier
 * @property {string} title - Name of the club / section
 * @property {string} category - Category (e.g. "Sports", "Arts", "Science", "Robotics")
 * @property {string} description - Detailed description
 * @property {string} teacherId - User ID of the instructor/teacher
 * @property {string} ageGroup - Target age or grades range (e.g., "10-14" or "5-8 grades")
 * @property {number} price - Monthly or seasonal price (0 if free)
 * @property {string} location - Room number, gym, or facility name
 * @property {'club' | 'olympic_reserve'} [type='club'] - Type of activity
 * @property {string} [subject] - Subject if type === 'olympic_reserve' (e.g. "Математика", "Информатика")
 * @property {number[]} [allowedClasses] - Allowed school grades (e.g. [7, 8, 9])
 * @property {number[]} [allowedShifts] - Allowed shifts (1 and/or 2)
 * @property {boolean} [requiresExam=false] - Whether an entrance exam is required
 */

/**
 * @typedef {Object} ActivityGroup
 * @property {string} id - Unique group identifier
 * @property {string} activityId - Parent activity ID
 * @property {number} capacity - Maximum student capacity
 * @property {number} enrolledCount - Current number of active enrollments
 * @property {number[]} daysOfWeek - Array of day numbers (1 = Mon, 7 = Sun)
 * @property {string} startTime - HH:MM format (e.g., "15:30")
 * @property {string} endTime - HH:MM format (e.g., "17:00")
 * @property {'weekly' | 'biweekly' | 'custom'} recurrence - Recurrence schedule
 * @property {string} [seasonStart] - ISO date string
 * @property {string} [seasonEnd] - ISO date string
 */

/**
 * Factory function to create an Activity entity
 * @param {Partial<Activity>} data
 * @returns {Activity}
 */
export function createActivity(data = {}) {
  return {
    id: data.id || '',
    title: data.title || '',
    category: data.category || '',
    description: data.description || '',
    teacherId: data.teacherId || '',
    ageGroup: data.ageGroup || '',
    price: typeof data.price === 'number' ? data.price : 0,
    location: data.location || '',
    type: data.type === 'olympic_reserve' ? 'olympic_reserve' : 'club',
    subject: data.subject || '',
    allowedClasses: Array.isArray(data.allowedClasses) ? data.allowedClasses.map(Number) : [],
    allowedShifts: Array.isArray(data.allowedShifts)
      ? data.allowedShifts.map(Number)
      : [1, 2],
    requiresExam: Boolean(data.requiresExam),
  };
}

/**
 * Factory function to create an ActivityGroup entity
 * @param {Partial<ActivityGroup>} data
 * @returns {ActivityGroup}
 */
export function createActivityGroup(data = {}) {
  return {
    id: data.id || '',
    activityId: data.activityId || '',
    capacity: typeof data.capacity === 'number' ? data.capacity : 15,
    enrolledCount: typeof data.enrolledCount === 'number' ? data.enrolledCount : 0,
    daysOfWeek: Array.isArray(data.daysOfWeek) ? [...data.daysOfWeek] : [],
    startTime: data.startTime || '15:00',
    endTime: data.endTime || '16:30',
    recurrence: data.recurrence || 'weekly',
    seasonStart: data.seasonStart || '',
    seasonEnd: data.seasonEnd || '',
  };
}
