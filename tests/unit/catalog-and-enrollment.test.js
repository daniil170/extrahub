import { describe, it, expect } from 'vitest';
import {
  combineCatalogData,
  MOCK_ACTIVITIES,
  MOCK_ACTIVITY_GROUPS,
  MOCK_TEACHERS,
} from '../../src/features/catalog/api.js';

describe('Catalog & Capacity Logic', () => {
  it('combines activities with their activity groups and teachers', () => {
    const combined = combineCatalogData(
      MOCK_ACTIVITIES,
      MOCK_ACTIVITY_GROUPS,
      Object.values(MOCK_TEACHERS)
    );

    expect(combined).toHaveLength(MOCK_ACTIVITIES.length);

    // Find Robotics activity
    const robotics = combined.find((a) => a.id === 'act-1');
    expect(robotics).toBeDefined();
    expect(robotics.teacherName).toBe('Михаил Сергеевич Петров');
    expect(robotics.groups).toHaveLength(2);

    // Total capacity = 12 + 10 = 22, enrolled = 8 + 10 = 18, remaining = 4
    expect(robotics.totalCapacity).toBe(22);
    expect(robotics.totalEnrolled).toBe(18);
    expect(robotics.remainingSpots).toBe(4);
    expect(robotics.isFull).toBe(false);
  });

  it('correctly marks full activity with isFull = true and remainingSpots = 0', () => {
    const combined = combineCatalogData(
      MOCK_ACTIVITIES,
      MOCK_ACTIVITY_GROUPS,
      Object.values(MOCK_TEACHERS)
    );

    // Find Theater studio which is fully booked (15/15)
    const theater = combined.find((a) => a.id === 'act-2');
    expect(theater).toBeDefined();
    expect(theater.totalCapacity).toBe(15);
    expect(theater.totalEnrolled).toBe(15);
    expect(theater.remainingSpots).toBe(0);
    expect(theater.isFull).toBe(true);
  });

  it('handles activity with no groups gracefully', () => {
    const customActivity = [
      {
        id: 'act-new',
        title: 'Новый кружок',
        category: 'Наука',
        teacherId: 'teacher-1',
      },
    ];

    const result = combineCatalogData(customActivity, [], Object.values(MOCK_TEACHERS));
    expect(result[0].totalCapacity).toBe(0);
    expect(result[0].totalEnrolled).toBe(0);
    expect(result[0].remainingSpots).toBe(0);
    expect(result[0].isFull).toBe(false);
    expect(result[0].groups).toEqual([]);
    expect(result[0].teacherName).toBe('Михаил Сергеевич Петров');
  });
});
