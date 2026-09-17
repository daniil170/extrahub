import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_WEIGHT, ATTENDANCE_WEIGHT } from '../../src/features/coordinator/AnalyticsTab.jsx';
import { exportToExcel } from '../../src/shared/utils/excelExport.js';
import * as XLSX from 'xlsx';

describe('Admin Teachers & Leaderboard Rankings Logic', () => {
  describe('Leaderboard Scoring Constants and Metrics', () => {
    it('has configurable weights for achievements and attendance', () => {
      expect(ACHIEVEMENT_WEIGHT).toBe(10);
      expect(ATTENDANCE_WEIGHT).toBe(1);
    });

    it('correctly calculates combined score for students', () => {
      const calculateScore = (achievementsCount, attendanceRate) => {
        return Math.round((achievementsCount * ACHIEVEMENT_WEIGHT) + (attendanceRate * ATTENDANCE_WEIGHT));
      };

      // Student with 3 achievements and 100% attendance
      expect(calculateScore(3, 100)).toBe(130);

      // Student with 0 achievements and 95% attendance
      expect(calculateScore(0, 95)).toBe(95);

      // Student with 1 achievement and 80% attendance
      expect(calculateScore(1, 80)).toBe(90);
    });

    it('ranks students descending by score', () => {
      const students = [
        { id: 's1', fullName: 'Alice', score: 95 },
        { id: 's2', fullName: 'Bob', score: 130 },
        { id: 's3', fullName: 'Charlie', score: 110 },
      ];

      const sorted = [...students].sort((a, b) => b.score - a.score);
      expect(sorted[0].fullName).toBe('Bob');
      expect(sorted[1].fullName).toBe('Charlie');
      expect(sorted[2].fullName).toBe('Alice');
    });

    it('ranks teachers descending by average attendance rate', () => {
      const teachers = [
        { id: 't1', fullName: 'Teacher 1', avgAttendanceRate: 85 },
        { id: 't2', fullName: 'Teacher 2', avgAttendanceRate: 94 },
        { id: 't3', fullName: 'Teacher 3', avgAttendanceRate: 89 },
      ];

      const sorted = [...teachers].sort((a, b) => b.avgAttendanceRate - a.avgAttendanceRate);
      expect(sorted[0].fullName).toBe('Teacher 2');
      expect(sorted[1].fullName).toBe('Teacher 3');
      expect(sorted[2].fullName).toBe('Teacher 1');
    });
  });

  describe('Excel Export Utility (SheetJS)', () => {
    it('exports exportToExcel as a callable function', () => {
      expect(typeof exportToExcel).toBe('function');
    });

    it('generates valid workbook and worksheet with proper columns and numbers', () => {
      const sampleData = [
        {
          '№': 1,
          'ФИО': 'Алихан Сейткали',
          'Класс': '7-А',
          'Балл': 130,
          'Посещаемость (%)': 100,
        },
        {
          '№': 2,
          'ФИО': 'Амина Сейткали',
          'Класс': '5-Б',
          'Балл': 120,
          'Посещаемость (%)': 98,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      expect(ws).toBeDefined();

      // Check that numeric fields are numbers
      expect(ws['A2'].v).toBe(1);
      expect(ws['A2'].t).toBe('n');
      expect(ws['D2'].v).toBe(130);
      expect(ws['D2'].t).toBe('n');
      expect(ws['E2'].v).toBe(100);
      expect(ws['E2'].t).toBe('n');

      // Check header row in Russian
      expect(ws['B1'].v).toBe('ФИО');
      expect(ws['C1'].v).toBe('Класс');
      expect(ws['D1'].v).toBe('Балл');

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Рейтинг');
      expect(wb.SheetNames).toContain('Рейтинг');
    });
  });
});
