import { describe, it, expect } from 'vitest';
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  RESPONSE_STATUS,
  EVENT_OUTCOME,
  BOSS_EVENT_CONFIG,
  createClubEvent,
  createEventResponse,
} from '../../src/entities/calendarEvent/model.js';
import {
  generateVirtualLessons,
  formatDateKey,
  combineDateAndTime,
} from '../../src/features/calendar/virtualLessons.js';
import {
  formatIcsDate,
  escapeIcsText,
  generateIcsContent,
} from '../../src/features/calendar/icsExport.js';

describe('Gamification Calendar, Boss-Events, Heatmap & iCal — Unit Tests', () => {
  describe('1. Data Models & Factory Functions', () => {
    it('creates regular lesson club event with standard defaults', () => {
      const ev = createClubEvent({
        title: 'Урок программирования',
        type: EVENT_TYPES.LESSON,
        groupId: 'grp-1',
        startTime: '2026-09-21T15:30:00.000Z',
        endTime: '2026-09-21T17:00:00.000Z',
      });

      expect(ev.title).toBe('Урок программирования');
      expect(ev.type).toBe('lesson');
      expect(ev.isBossEvent).toBe(false);
      expect(ev.xpReward).toBe(0);
      expect(ev.requiresRsvp).toBe(false);
    });

    it('enforces minimum 200 XP reward on Boss-Events', () => {
      const bossEvent1 = createClubEvent({
        title: 'Битва с Боссом: Финал робототехники',
        type: EVENT_TYPES.BOSS_EVENT,
        xpReward: 50, // lower than min 200
      });

      expect(bossEvent1.isBossEvent).toBe(true);
      expect(bossEvent1.xpReward).toBeGreaterThanOrEqual(BOSS_EVENT_CONFIG.MIN_BOSS_XP);
      expect(bossEvent1.xpReward).toBe(300); // Default boss reward
      expect(bossEvent1.coinsReward).toBe(50);
      expect(bossEvent1.requiresRsvp).toBe(true);
    });

    it('preserves custom high XP reward for Boss-Events when above 200', () => {
      const bossEvent2 = createClubEvent({
        title: 'Гранд-Финал Хакатона',
        type: EVENT_TYPES.BOSS_EVENT,
        xpReward: 500,
        coinsReward: 100,
      });

      expect(bossEvent2.isBossEvent).toBe(true);
      expect(bossEvent2.xpReward).toBe(500);
      expect(bossEvent2.coinsReward).toBe(100);
    });

    it('creates EventResponse with composite ID and initial pending status', () => {
      const resp = createEventResponse({
        eventId: 'event-101',
        studentId: 'student-99',
        studentName: 'Иван Иванов',
        status: RESPONSE_STATUS.ACCEPTED,
      });

      expect(resp.id).toBe('event-101_student-99');
      expect(resp.status).toBe('accepted');
      expect(resp.outcome).toBe('pending');
      expect(resp.respondedAt).toBeDefined();
      expect(resp.awardedPoints).toBe(false);
    });
  });

  describe('2. Virtual Lesson Generator (Zero-doc On-The-Fly Schedule)', () => {
    it('generates correct recurring virtual lessons across a week range', () => {
      const mockGroups = [
        {
          id: 'grp-robotics',
          name: 'Робототехника Группа 1',
          activityId: 'act-robotics',
          daysOfWeek: [1, 3], // Mon (1), Wed (3)
          startTime: '15:30',
          endTime: '17:00',
          room: 'Лаборатория 204',
        },
      ];

      const activitiesMap = {
        'act-robotics': { id: 'act-robotics', title: 'Робототехника и ИИ', teacherName: 'Алексей Иванов' },
      };

      // Monday 2026-09-21 to Sunday 2026-09-27
      const startDate = '2026-09-21';
      const endDate = '2026-09-27';

      const lessons = generateVirtualLessons({
        groups: mockGroups,
        startDate,
        endDate,
        activitiesMap,
      });

      // Mon 21 Sep and Wed 23 Sep -> exactly 2 lessons
      expect(lessons).toHaveLength(2);
      expect(lessons[0].id).toContain('virtual_grp-robotics_2026-09-21');
      expect(lessons[0].isVirtual).toBe(true);
      expect(lessons[0].activityTitle).toBe('Робототехника и ИИ');
      expect(lessons[0].location).toBe('Лаборатория 204');
      expect(lessons[1].id).toContain('virtual_grp-robotics_2026-09-23');
    });

    it('returns empty array when groups array is empty or dates are invalid', () => {
      expect(generateVirtualLessons({ groups: [], startDate: '2026-09-01', endDate: '2026-09-07' })).toEqual([]);
      expect(generateVirtualLessons({ groups: [{ id: '1', daysOfWeek: [1] }], startDate: 'invalid', endDate: 'invalid' })).toEqual([]);
    });

    it('formats date key properly as YYYY-MM-DD', () => {
      const d = new Date(2026, 8, 20); // Month is 0-indexed (8 = Sep)
      expect(formatDateKey(d)).toBe('2026-09-20');
    });

    it('combines date and HH:mm correctly', () => {
      const d = new Date('2026-09-21T00:00:00.000Z');
      const combined = combineDateAndTime(d, '16:45');
      const parsed = new Date(combined);
      expect(parsed.getHours()).toBe(16);
      expect(parsed.getMinutes()).toBe(45);
    });
  });

  describe('3. RFC 5545 iCalendar (.ics) Export', () => {
    it('formats dates in compliant UTC YYYYMMDDTHHMMSSZ format', () => {
      const d = new Date('2026-09-21T15:30:00.000Z');
      const icsDate = formatIcsDate(d);
      expect(icsDate).toBe('20260921T153000Z');
    });

    it('escapes special characters (semicolons, commas, backslashes, newlines)', () => {
      const raw = 'Строка 1;\nСтрока 2, с запятой \\ слэшем';
      const escaped = escapeIcsText(raw);
      expect(escaped).toContain('\\;');
      expect(escaped).toContain('\\,');
      expect(escaped).toContain('\\\\');
      expect(escaped).toContain('\\n');
    });

    it('generates valid VCALENDAR payload with Boss-Event tags and XP notes', () => {
      const events = [
        createClubEvent({
          id: 'ev-boss-1',
          title: 'Финальный Босс: Защита Робота',
          description: 'Финальное состязание роботов перед жюри',
          type: EVENT_TYPES.BOSS_EVENT,
          isBossEvent: true,
          xpReward: 350,
          coinsReward: 60,
          teacherName: 'Алексей Иванов',
          startTime: '2026-09-25T16:00:00.000Z',
          endTime: '2026-09-25T18:00:00.000Z',
          location: 'Актовый Зал',
        }),
      ];

      const ics = generateIcsContent(events, 'ExtraHub Календарь');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:⚔️ [БОСС-СОБЫТИЕ] Финальный Босс: Защита Робота');
      expect(ics).toContain('UID:ev-boss-1@extrahub.school');
      expect(ics).toContain('+350 XP');
      expect(ics).toContain('+60 монет');
      expect(ics).toContain('LOCATION:Актовый Зал');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });

  describe('4. Boss-Event RSVP & Outcomes Logic Simulation', () => {
    it('correctly simulates RSVP acceptance and teacher grading outcome with points award', () => {
      const event = createClubEvent({
        id: 'boss-exam-1',
        title: 'Супер-Турнир по Шахматам',
        type: EVENT_TYPES.BOSS_EVENT,
        xpReward: 400,
        coinsReward: 80,
      });

      // 1. Student RSVPs
      const studentRsvp = createEventResponse({
        eventId: event.id,
        studentId: 'student-42',
        studentName: 'Мария Смирнова',
        status: RESPONSE_STATUS.ACCEPTED,
      });

      expect(studentRsvp.status).toBe('accepted');
      expect(studentRsvp.outcome).toBe('pending');
      expect(studentRsvp.awardedPoints).toBe(false);

      // 2. Teacher grades victory outcome
      const gradedOutcome = {
        ...studentRsvp,
        outcome: EVENT_OUTCOME.ATTENDED,
        grade: '1 Место (Победа)',
        feedback: 'Блестящая тактика в эндшпиле!',
        awardedPoints: true,
        gradedAt: new Date().toISOString(),
      };

      expect(gradedOutcome.outcome).toBe('attended');
      expect(gradedOutcome.awardedPoints).toBe(true);
      expect(event.xpReward).toBe(400);
      expect(event.coinsReward).toBe(80);
    });
  });
});
