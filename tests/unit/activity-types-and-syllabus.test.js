import { describe, it, expect } from 'vitest';
import { createActivity } from '../../src/entities/activity/model.js';
import { combineCatalogData } from '../../src/features/catalog/api.js';

describe('Activity Types & Model Tests', () => {
  it('creates an activity with default type circle', () => {
    const act = createActivity({ title: 'Тестовый кружок' });
    expect(act.type).toBe('circle');
  });

  it('preserves club type when provided', () => {
    const act = createActivity({ title: 'Дебатный клуб', type: 'club' });
    expect(act.type).toBe('club');
  });

  it('preserves olympic_reserve type and subject when provided', () => {
    const act = createActivity({
      title: 'Олимпийский резерв: Математика',
      type: 'olympic_reserve',
      subject: 'Математика',
      requiresExam: true,
    });
    expect(act.type).toBe('olympic_reserve');
    expect(act.subject).toBe('Математика');
    expect(act.requiresExam).toBe(true);
  });

  it('correctly maps activity types in combineCatalogData', () => {
    const rawActivities = [
      { id: '1', title: 'Шахматы', type: 'circle' },
      { id: '2', title: 'Клуб дебатов', type: 'club' },
      { id: '3', title: 'Олимп Информатика', type: 'olympic_reserve', subject: 'Информатика' },
      { id: '4', title: 'Без типа' },
    ];
    const rawGroups = [
      { id: 'g1', activityId: '1', capacity: 15, enrolledCount: 5 },
      { id: 'g2', activityId: '2', capacity: 20, enrolledCount: 10 },
      { id: 'g3', activityId: '3', capacity: 12, enrolledCount: 12 },
    ];
    const rawTeachers = [{ id: 't1', fullName: 'Иван Иванов' }];

    const combined = combineCatalogData(rawActivities, rawGroups, rawTeachers);
    expect(combined).toHaveLength(4);
    expect(combined[0].type).toBe('circle');
    expect(combined[1].type).toBe('club');
    expect(combined[2].type).toBe('olympic_reserve');
    expect(combined[3].type).toBe('circle'); // Fallback to circle
  });

  it('handles optional syllabus gracefully', () => {
    const emptySyllabus = [];
    const filledSyllabus = [
      { module: 'Модуль 1', title: 'Введение', description: 'Основы', hours: '4 ак. ч.' },
    ];

    const hasEmptySyllabus = emptySyllabus.filter((m) => Boolean(m.title?.trim() || m.description?.trim())).length > 0;
    const hasFilledSyllabus = filledSyllabus.filter((m) => Boolean(m.title?.trim() || m.description?.trim())).length > 0;

    expect(hasEmptySyllabus).toBe(false);
    expect(hasFilledSyllabus).toBe(true);
  });
});
