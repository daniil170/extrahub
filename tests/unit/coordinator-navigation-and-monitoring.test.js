import { describe, it, expect } from 'vitest';
import { calculateCapacityMetrics, enrichGroupsWithActivity } from '../../src/features/coordinator/api.js';

describe('Coordinator Navigation & Monitoring Logic', () => {
  it('calculates capacity metrics accurately including full groups and occupancy rate', () => {
    const mockGroups = [
      { id: 'g1', capacity: 15, enrolledCount: 15 },
      { id: 'g2', capacity: 10, enrolledCount: 8 },
      { id: 'g3', capacity: 12, enrolledCount: 0 },
    ];
    const mockWaitlist = [
      { id: 'w1', groupId: 'g1' },
      { id: 'w2', groupId: 'g1' },
    ];

    const metrics = calculateCapacityMetrics(mockGroups, mockWaitlist);

    expect(metrics.totalGroups).toBe(3);
    expect(metrics.totalCapacity).toBe(37);
    expect(metrics.totalEnrolled).toBe(23);
    expect(metrics.occupancyRate).toBe(Math.round((23 / 37) * 100)); // 62%
    expect(metrics.fullGroupsCount).toBe(1);
    expect(metrics.totalWaitlistCount).toBe(2);
  });

  it('enriches groups with activity details, percentages, and waitlist counts', () => {
    const mockGroups = [
      { id: 'g1', activityId: 'act-1', capacity: 20, enrolledCount: 16, daysOfWeek: [1, 3], startTime: '15:00', endTime: '16:30' },
      { id: 'g2', activityId: 'act-2', capacity: 10, enrolledCount: 10, daysOfWeek: [2, 4], startTime: '16:00', endTime: '17:30' },
    ];
    const mockActivities = [
      { id: 'act-1', title: 'Робототехника', category: 'Технологии', price: 15000, location: 'Каб. 204' },
      { id: 'act-2', title: 'Дебатный клуб', category: 'Лидерство', price: 0, location: 'Актовый зал' },
    ];
    const mockWaitlist = [
      { id: 'w1', groupId: 'g2' },
    ];

    const enriched = enrichGroupsWithActivity(mockGroups, mockActivities, mockWaitlist);

    expect(enriched).toHaveLength(2);
    expect(enriched[0].activityTitle).toBe('Робототехника');
    expect(enriched[0].percent).toBe(80);
    expect(enriched[0].isFull).toBe(false);

    expect(enriched[1].activityTitle).toBe('Дебатный клуб');
    expect(enriched[1].percent).toBe(100);
    expect(enriched[1].isFull).toBe(true);
    expect(enriched[1].waitlistCount).toBe(1);
  });
});
