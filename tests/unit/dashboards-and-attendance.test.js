import { describe, it, expect } from 'vitest';
import { enrichEnrollments, MOCK_ENROLLMENTS } from '../../src/features/dashboard/api.js';
import {
  MOCK_ACTIVITIES,
  MOCK_ACTIVITY_GROUPS,
  MOCK_TEACHERS,
} from '../../src/features/catalog/api.js';
import { fetchAttendanceMap, saveAttendanceBatch } from '../../src/features/attendance/api.js';
import { cancelEnrollmentCall } from '../../src/features/enrollment/api.js';

describe('Dashboard & Attendance Logic', () => {
  describe('enrichEnrollments', () => {
    it('correctly associates enrollments with activities, groups, and teachers', () => {
      const enriched = enrichEnrollments(
        MOCK_ENROLLMENTS,
        MOCK_ACTIVITIES,
        MOCK_ACTIVITY_GROUPS,
        Object.values(MOCK_TEACHERS)
      );

      expect(enriched).toHaveLength(MOCK_ENROLLMENTS.length);

      const enr1 = enriched.find((e) => e.id === 'enr-1');
      expect(enr1).toBeDefined();
      expect(enr1.activity.title).toBe('Робототехника и Arduino');
      expect(enr1.group.name).toBe('Группа А (Начинающие)');
      expect(enr1.teacherName).toBe('Михаил Сергеевич Петров');
      expect(enr1.status).toBe('active');
    });

    it('handles missing activities and groups gracefully with defaults', () => {
      const customEnrollment = [
        {
          id: 'enr-orphan',
          studentId: 'student-99',
          groupId: 'grp-missing',
          activityId: 'act-missing',
          status: 'pending_parent_approval',
        },
      ];

      const enriched = enrichEnrollments(customEnrollment, [], [], []);
      expect(enriched[0].activity.title).toBe('Школьный кружок');
      expect(enriched[0].group.name).toBe('Основная группа');
      expect(enriched[0].teacherName).toBe('Преподаватель школы');
    });
  });

  describe('Attendance batch save and map retrieval', () => {
    it('saves and reads attendance status map including all 4 statuses', async () => {
      const testGroupId = 'grp-test-1';
      const testDate = '2026-09-08';
      const statusMap = {
        'student-1': 'present',
        'student-2': 'absent',
        'student-3': 'late',
        'student-4': 'excused',
      };

      const saveRes = await saveAttendanceBatch({
        groupId: testGroupId,
        date: testDate,
        attendanceMap: statusMap,
        teacherId: 'teacher-1',
      });

      expect(saveRes.success).toBe(true);

      const retrievedMap = await fetchAttendanceMap(testGroupId, testDate);
      expect(retrievedMap['student-1']).toBe('present');
      expect(retrievedMap['student-2']).toBe('absent');
      expect(retrievedMap['student-3']).toBe('late');
      expect(retrievedMap['student-4']).toBe('excused');
    });
  });

  describe('cancelEnrollmentCall', () => {
    it('simulates cancellation response cleanly in development mode', async () => {
      const res = await cancelEnrollmentCall({ enrollmentId: 'enr-123' });
      expect(res).toBeDefined();
      expect(res.success).toBe(true);
    });
  });
});
