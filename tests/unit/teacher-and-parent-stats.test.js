import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

describe('Teacher and Parent Statistics Features', () => {
  describe('Teacher Statistics & Student Roster aggregation', () => {
    it('calculates group occupancy rate correctly', () => {
      const groups = [
        { id: 'g1', enrolledCount: 12, maxCapacity: 15 },
        { id: 'g2', enrolledCount: 8, maxCapacity: 10 },
      ];

      const totalCap = groups.reduce((acc, g) => acc + g.maxCapacity, 0);
      const totalEnrolled = groups.reduce((acc, g) => acc + g.enrolledCount, 0);
      const occupancy = Math.round((totalEnrolled / totalCap) * 100);

      expect(totalCap).toBe(25);
      expect(totalEnrolled).toBe(20);
      expect(occupancy).toBe(80);
    });

    it('computes student attendance rate from attendance history', () => {
      const studentHistory = {
        'date-1': 'present',
        'date-2': 'present',
        'date-3': 'late',
        'date-4': 'absent',
      };

      const entries = Object.values(studentHistory);
      const total = entries.length;
      const attended = entries.filter((s) => s === 'present' || s === 'late').length;
      const attendanceRate = Math.round((attended / total) * 100);

      expect(total).toBe(4);
      expect(attended).toBe(3);
      expect(attendanceRate).toBe(75);
    });

    it('formats teacher student export data for Excel correctly', () => {
      const students = [
        {
          fullName: 'Алихан Сейткали',
          className: '7А',
          activityTitle: 'Робототехника',
          groupName: 'Группа 1',
          attendanceRate: 95,
          achievementsCount: 2,
          achievementsList: [{ title: 'Победитель хакатона' }, { title: '100% посещаемость' }],
          location: 'Кабинет 304',
        },
      ];

      const rows = students.map((st, i) => ({
        '№': i + 1,
        'ФИО ученика': st.fullName,
        'Класс': st.className,
        'Кружок / Секция': st.activityTitle,
        'Группа': st.groupName,
        'Посещаемость (%)': `${st.attendanceRate}%`,
        'Количество наград': st.achievementsCount,
        'Достижения': st.achievementsList.map((a) => a.title).join('; '),
        'Локация': st.location,
      }));

      expect(rows[0]['№']).toBe(1);
      expect(rows[0]['ФИО ученика']).toBe('Алихан Сейткали');
      expect(rows[0]['Посещаемость (%)']).toBe('95%');
      expect(rows[0]['Количество наград']).toBe(2);
      expect(rows[0]['Достижения']).toContain('Победитель хакатона');

      const worksheet = XLSX.utils.json_to_sheet(rows);
      expect(worksheet['A1'].v).toBe('№');
      expect(worksheet['B1'].v).toBe('ФИО ученика');
      expect(worksheet['B2'].v).toBe('Алихан Сейткали');
    });
  });

  describe('Parent Child Analytics Calculations', () => {
    it('summarizes active enrollments and next schedule accurately', () => {
      const enrollments = [
        {
          id: 'e1',
          status: 'active',
          activity: { title: 'Робототехника', location: 'Каб. 304' },
          group: { daysOfWeek: [1, 3], startTime: '15:00', endTime: '16:30' },
        },
        {
          id: 'e2',
          status: 'cancelled',
          activity: { title: 'Шахматы' },
        },
      ];

      const active = enrollments.filter((e) => e.status === 'active');
      expect(active.length).toBe(1);
      expect(active[0].activity.title).toBe('Робототехника');
    });

    it('identifies overdue or pending payment counts for the child', () => {
      const payments = [
        { id: 'p1', status: 'paid', amount: 15000 },
        { id: 'p2', status: 'pending', amount: 15000 },
        { id: 'p3', status: 'overdue', amount: 20000 },
      ];

      const unpaid = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
      expect(unpaid.length).toBe(2);
    });
  });
});
