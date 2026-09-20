/**
 * Calendar Events & Boss-Events Gamification Data Models
 * Supports regular lessons, exams, competitions, deadlines, and Boss-Events
 */

export const EVENT_TYPES = {
  LESSON: 'lesson',
  EXAM: 'exam',
  COMPETITION: 'competition',
  DEADLINE: 'deadline',
  BOSS_EVENT: 'boss_event',
};

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.LESSON]: 'Регулярное занятие',
  [EVENT_TYPES.EXAM]: 'Экзамен / Зачёт',
  [EVENT_TYPES.COMPETITION]: 'Хакатон / Турнир',
  [EVENT_TYPES.DEADLINE]: 'Дедлайн / Сдача работы',
  [EVENT_TYPES.BOSS_EVENT]: 'Специальное событие',
};

export const EVENT_TYPE_BADGES = {
  [EVENT_TYPES.LESSON]: { label: 'Занятие', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '#bfdbfe' },
  [EVENT_TYPES.EXAM]: { label: 'Экзамен', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', border: '#ddd6fe' },
  [EVENT_TYPES.COMPETITION]: { label: 'Турнир', bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '#fde68a' },
  [EVENT_TYPES.DEADLINE]: { label: 'Дедлайн', bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '#fecaca' },
  [EVENT_TYPES.BOSS_EVENT]: { label: 'Спец-событие', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', border: '#ddd6fe' },
};

export const RESPONSE_STATUS = {
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  TENTATIVE: 'tentative',
  PENDING: 'pending',
};

export const EVENT_OUTCOME = {
  ATTENDED: 'attended',
  ABSENT: 'absent',
  PENDING: 'pending',
};

export const BOSS_EVENT_CONFIG = {
  MIN_BOSS_XP: 200,
  DEFAULT_BOSS_XP: 300,
  DEFAULT_BOSS_COINS: 50,
};

/**
 * Creates a ClubEvent entity with normalized defaults
 * @param {Object} data
 * @returns {Object}
 */
export function createClubEvent(data = {}) {
  const isBoss = data.type === EVENT_TYPES.BOSS_EVENT || Boolean(data.isBossEvent);
  const type = data.type || (isBoss ? EVENT_TYPES.BOSS_EVENT : EVENT_TYPES.LESSON);
  
  let xpReward = Number(data.xpReward) || 0;
  if (isBoss && xpReward < BOSS_EVENT_CONFIG.MIN_BOSS_XP) {
    xpReward = BOSS_EVENT_CONFIG.DEFAULT_BOSS_XP;
  }

  let coinsReward = Number(data.coinsReward) || 0;
  if (isBoss && coinsReward === 0) {
    coinsReward = BOSS_EVENT_CONFIG.DEFAULT_BOSS_COINS;
  }

  const now = new Date().toISOString();

  return {
    id: data.id || '',
    title: (data.title || '').trim(),
    description: (data.description || '').trim(),
    type,
    groupId: data.groupId || null,
    groupName: data.groupName || '',
    activityId: data.activityId || null,
    activityTitle: data.activityTitle || '',
    teacherId: data.teacherId || '',
    teacherName: data.teacherName || '',
    startTime: data.startTime || now,
    endTime: data.endTime || now,
    location: (data.location || '').trim() || 'Главный корпус',
    isBossEvent: isBoss,
    xpReward,
    coinsReward,
    requiresRsvp: data.requiresRsvp !== undefined ? Boolean(data.requiresRsvp) : (isBoss || type === EVENT_TYPES.COMPETITION || type === EVENT_TYPES.EXAM),
    deadlineTime: data.deadlineTime || null,
    targetAudience: data.targetAudience || (data.groupId ? 'group' : 'all'),
    maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : null,
    isVirtual: Boolean(data.isVirtual),
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

/**
 * Creates an EventResponse entity for a student RSVP or attendance outcome
 * @param {Object} data
 * @returns {Object}
 */
export function createEventResponse(data = {}) {
  const now = new Date().toISOString();
  const eventId = data.eventId || '';
  const studentId = data.studentId || '';
  const id = data.id || `${eventId}_${studentId}`;

  return {
    id,
    eventId,
    studentId,
    studentName: data.studentName || '',
    status: data.status || RESPONSE_STATUS.PENDING, // 'accepted' | 'declined' | 'tentative' | 'pending'
    outcome: data.outcome || EVENT_OUTCOME.PENDING, // 'attended' | 'absent' | 'pending'
    grade: data.grade !== undefined && data.grade !== null ? data.grade : null,
    feedback: (data.feedback || '').trim(),
    respondedAt: data.respondedAt || (data.status && data.status !== RESPONSE_STATUS.PENDING ? now : null),
    gradedAt: data.gradedAt || (data.outcome && data.outcome !== EVENT_OUTCOME.PENDING ? now : null),
    gradedBy: data.gradedBy || null,
    awardedPoints: Boolean(data.awardedPoints),
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}
