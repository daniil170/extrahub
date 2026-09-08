import { describe, it, expect } from 'vitest';
import {
  calculateCapacityMetrics,
  enrichGroupsWithActivity,
  generateGroupInvoices,
  createGroupInvoicesRecord,
  markPaymentAsPaid,
  updateGroupCapacity,
  MOCK_COORDINATOR_PAYMENTS,
} from '../../src/features/coordinator/api.js';
import { formatCurrency } from '../../src/shared/utils/index.js';

describe('Coordinator Management & Billing Logic', () => {
  describe('formatCurrency', () => {
    it('formats amounts in Kazakhstani Tenge (₸) by default', () => {
      expect(formatCurrency(25000)).toBe('25\u00A0000 ₸');
      expect(formatCurrency(0)).toBe('0 ₸');
      expect(formatCurrency(150000)).toBe('150\u00A0000 ₸');
    });
  });

  describe('calculateCapacityMetrics', () => {
    it('calculates total capacity, enrolled count, occupancy rate and full groups correctly', () => {
      const testGroups = [
        { id: 'g1', capacity: 20, enrolledCount: 20 }, // 100% (full)
        { id: 'g2', capacity: 20, enrolledCount: 16 }, // 80%
        { id: 'g3', capacity: 10, enrolledCount: 4 }, // 40%
      ];
      const testWaitlist = [
        { id: 'w1', groupId: 'g1' },
        { id: 'w2', groupId: 'g1' },
        { id: 'w3', groupId: 'g2' },
      ];

      const metrics = calculateCapacityMetrics(testGroups, testWaitlist);

      expect(metrics.totalGroups).toBe(3);
      expect(metrics.totalCapacity).toBe(50);
      expect(metrics.totalEnrolled).toBe(40);
      expect(metrics.occupancyRate).toBe(80); // 40 / 50 = 80%
      expect(metrics.fullGroupsCount).toBe(1); // g1
      expect(metrics.totalWaitlistCount).toBe(3);
    });

    it('handles empty groups and waitlists safely without dividing by zero', () => {
      const metrics = calculateCapacityMetrics([], []);
      expect(metrics.totalGroups).toBe(0);
      expect(metrics.totalCapacity).toBe(0);
      expect(metrics.totalEnrolled).toBe(0);
      expect(metrics.occupancyRate).toBe(0);
      expect(metrics.fullGroupsCount).toBe(0);
      expect(metrics.totalWaitlistCount).toBe(0);
    });
  });

  describe('enrichGroupsWithActivity', () => {
    it('enriches groups with activity metadata, waitlist counts and occupancy color codes', () => {
      const testGroups = [
        { id: 'g1', activityId: 'act-1', name: 'Группа 1', capacity: 10, enrolledCount: 10 },
        { id: 'g2', activityId: 'act-1', name: 'Группа 2', capacity: 10, enrolledCount: 8 },
        { id: 'g3', activityId: 'act-2', name: 'Группа 3', capacity: 10, enrolledCount: 5 },
      ];
      const testActivities = [
        {
          id: 'act-1',
          title: 'Робототехника',
          category: 'Техническое',
          price: 3500,
          location: 'Кабинет 101',
        },
        {
          id: 'act-2',
          title: 'Шахматы',
          category: 'Интеллектуальное',
          price: 0,
          location: 'Кабинет 202',
        },
      ];
      const testWaitlist = [
        { id: 'w1', groupId: 'g1' },
        { id: 'w2', groupId: 'g1' },
      ];

      const enriched = enrichGroupsWithActivity(testGroups, testActivities, testWaitlist);

      expect(enriched).toHaveLength(3);

      // g1: 100% full -> danger color, waitlist = 2
      expect(enriched[0].activityTitle).toBe('Робототехника');
      expect(enriched[0].percent).toBe(100);
      expect(enriched[0].isFull).toBe(true);
      expect(enriched[0].waitlistCount).toBe(2);
      expect(enriched[0].statusColor).toBe('var(--danger)');

      // g2: 80% -> warning color, waitlist = 0
      expect(enriched[1].percent).toBe(80);
      expect(enriched[1].isFull).toBe(false);
      expect(enriched[1].statusColor).toBe('var(--warning)');
      expect(enriched[1].waitlistCount).toBe(0);

      // g3: 50% -> success color
      expect(enriched[2].activityTitle).toBe('Шахматы');
      expect(enriched[2].percent).toBe(50);
      expect(enriched[2].statusColor).toBe('var(--success)');
    });
  });

  describe('generateGroupInvoices', () => {
    it('generates individual pending invoices for active students in a group', () => {
      const activeEnrollments = [
        {
          id: 'enr-1',
          groupId: 'grp-1',
          studentId: 'std-1',
          studentName: 'Иван',
          className: '5-А',
          status: 'active',
        },
        {
          id: 'enr-2',
          groupId: 'grp-1',
          studentId: 'std-2',
          studentName: 'Анна',
          className: '5-Б',
          status: 'active',
        },
        {
          id: 'enr-3',
          groupId: 'grp-1',
          studentId: 'std-3',
          studentName: 'Петр',
          className: '5-А',
          status: 'cancelled',
        },
        {
          id: 'enr-4',
          groupId: 'grp-2',
          studentId: 'std-4',
          studentName: 'Олег',
          className: '6-А',
          status: 'active',
        },
      ];

      const invoices = generateGroupInvoices(
        'grp-1',
        activeEnrollments,
        3000,
        '2026-09-30',
        'act-robot',
        'Робототехника'
      );

      expect(invoices).toHaveLength(2); // Only active students in grp-1
      expect(invoices[0].studentId).toBe('std-1');
      expect(invoices[0].amount).toBe(3000);
      expect(invoices[0].status).toBe('pending');
      expect(invoices[0].dueDate).toBe('2026-09-30');
      expect(invoices[0].activityTitle).toBe('Робототехника');

      expect(invoices[1].studentId).toBe('std-2');
      expect(invoices[1].amount).toBe(3000);
    });
  });

  describe('updateGroupCapacity', () => {
    it('rejects capacity lower than current enrolled count', async () => {
      await expect(updateGroupCapacity('grp-1-1', 5, 12)).rejects.toThrow(
        'Новая вместимость не может быть меньше текущего количества записанных учеников'
      );
    });

    it('accepts capacity equal or greater than enrolled count', async () => {
      const res = await updateGroupCapacity('grp-1-1', 20, 12);
      expect(res.success).toBe(true);
    });
  });

  describe('markPaymentAsPaid', () => {
    it('updates payment status to paid with timestamp', async () => {
      const initialPayment = MOCK_COORDINATOR_PAYMENTS[1]; // pay-102 (status: pending)
      expect(initialPayment.status).toBe('pending');

      const res = await markPaymentAsPaid('pay-102');
      expect(res.success).toBe(true);
    });
  });

  describe('createGroupInvoicesRecord', () => {
    it('creates batch invoices for all active students in a group and calculates total amount in Tenge', async () => {
      const activeEnrollments = [
        {
          id: 'e1',
          groupId: 'grp-test',
          studentId: 's1',
          studentName: 'Александр',
          className: '7-Б',
          status: 'active',
        },
        {
          id: 'e2',
          groupId: 'grp-test',
          studentId: 's2',
          studentName: 'София',
          className: '5-Б',
          status: 'active',
        },
        {
          id: 'e3',
          groupId: 'grp-test',
          studentId: 's3',
          studentName: 'Дарья',
          className: '7-А',
          status: 'cancelled',
        },
      ];

      const res = await createGroupInvoicesRecord({
        groupId: 'grp-test',
        activityId: 'act-1',
        amount: 25000,
        dueDate: '2026-10-15',
        periodTitle: 'Октябрь 2026',
        activeEnrollments,
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(2);
      expect(res.totalAmount).toBe(50000); // 2 * 25 000 ₸
      expect(res.invoices).toHaveLength(2);
      expect(res.invoices[0].amount).toBe(25000);
      expect(res.invoices[0].periodTitle).toBe('Октябрь 2026');
      expect(res.invoices[0].status).toBe('pending');
    });

    it('rejects group invoicing if there are no active students in the group', async () => {
      await expect(
        createGroupInvoicesRecord({
          groupId: 'grp-empty',
          activityId: 'act-1',
          amount: 25000,
          activeEnrollments: [],
        })
      ).rejects.toThrow(
        'В выбранной группе нет активных зачисленных учеников для выставления счетов'
      );
    });
  });
});
