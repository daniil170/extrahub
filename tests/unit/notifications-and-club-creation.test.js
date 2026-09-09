import { describe, it, expect, beforeEach } from 'vitest';
import {
  createActivityRecord,
  devActivitiesStore,
  resetActivitiesStore,
  combineCatalogData,
  MOCK_ACTIVITY_GROUPS,
  MOCK_TEACHERS,
} from '../../src/features/catalog/api.js';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addNotification,
  resetNotificationsStore,
} from '../../src/features/notifications/api.js';

describe('Club Creation & Shared Catalog Store', () => {
  beforeEach(() => {
    resetActivitiesStore();
  });

  it('creates an activity with 5 syllabus modules and learning outcomes', async () => {
    const activityInput = {
      title: '3D-моделирование и FabLab',
      category: 'Технологии',
      description: 'Курс трёхмерного моделирования и прототипирования деталей на 3D-принтерах.',
      ageGroup: '11–16 лет',
      price: 28000,
      location: 'Кабинет 308',
      teacherName: 'Нурлан Садыков',
      syllabus: [
        { module: 'Модуль 1', title: 'Основы 3D', description: 'Интерфейс', hours: '6 ак. ч.' },
        { module: 'Модуль 2', title: 'САПР моделирование', description: 'Эскизы', hours: '8 ак. ч.' },
        { module: 'Модуль 3', title: 'Слайсинг', description: 'Подготовка к печати', hours: '8 ак. ч.' },
        { module: 'Модуль 4', title: 'Печать деталей', description: 'Калибровка', hours: '12 ак. ч.' },
        { module: 'Модуль 5', title: 'Финальный проект', description: 'Защита', hours: '6 ак. ч.' },
      ],
      learningOutcomes: [
        'Понимание пространственной геометрии',
        'Навыки работы в 3D редакторах',
        'Создание физических прототипов',
      ],
    };

    const res = await createActivityRecord(activityInput);
    expect(res.success).toBe(true);
    expect(res.activity).toBeDefined();
    expect(res.activity.title).toBe('3D-моделирование и FabLab');
    expect(res.activity.price).toBe(28000);
    expect(res.activity.syllabus).toHaveLength(5);
    expect(res.activity.learningOutcomes).toHaveLength(3);

    // Verify it is prepended to devActivitiesStore
    expect(devActivitiesStore[0].id).toBe(res.activity.id);

    // Verify catalog integration
    const combined = combineCatalogData(
      devActivitiesStore,
      MOCK_ACTIVITY_GROUPS,
      Object.values(MOCK_TEACHERS)
    );
    const found = combined.find((a) => a.id === res.activity.id);
    expect(found).toBeDefined();
    expect(found.title).toBe('3D-моделирование и FabLab');
    expect(found.totalCapacity).toBe(0); // No groups added yet
    expect(found.isFull).toBe(false);
  });

  it('defaults syllabus and outcomes when not explicitly provided', async () => {
    const minimalInput = {
      title: 'Астрономия и космос',
      description: 'Изучение звёздного неба и основ астрофизики.',
      price: 0,
    };

    const res = await createActivityRecord(minimalInput);
    expect(res.success).toBe(true);
    expect(res.activity.syllabus).toHaveLength(5);
    expect(res.activity.learningOutcomes.length).toBeGreaterThanOrEqual(3);
    expect(res.activity.price).toBe(0);
  });
});

describe('Notification Center Logic & Role Events', () => {
  beforeEach(() => {
    resetNotificationsStore();
  });

  it('fetches notifications tailored for student role sorted by sentAt newest first', async () => {
    const notifs = await fetchUserNotifications('student-1', 'student');
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs.every((n) => n.role === 'student' || n.userId === 'student-1')).toBe(true);

    // Check sorting newest first
    for (let i = 0; i < notifs.length - 1; i++) {
      const current = new Date(notifs[i].sentAt).getTime();
      const next = new Date(notifs[i + 1].sentAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('fetches notifications tailored for coordinator and admin roles', async () => {
    const coordNotifs = await fetchUserNotifications('coord-1', 'coordinator');
    expect(coordNotifs.some((n) => n.type === 'capacity_alert')).toBe(true);
    expect(coordNotifs.some((n) => n.type === 'hold_expired')).toBe(true);

    const adminNotifs = await fetchUserNotifications('admin-1', 'admin');
    expect(adminNotifs.length).toBeGreaterThanOrEqual(3);
  });

  it('marks a single notification as read', async () => {
    const listBefore = await fetchUserNotifications('student-1', 'student');
    const unread = listBefore.find((n) => !n.isRead);
    expect(unread).toBeDefined();

    await markNotificationAsRead(unread.id);

    const listAfter = await fetchUserNotifications('student-1', 'student');
    const updated = listAfter.find((n) => n.id === unread.id);
    expect(updated.isRead).toBe(true);
  });

  it('marks all notifications for a role as read', async () => {
    await markAllNotificationsAsRead('parent');
    const list = await fetchUserNotifications('parent-1', 'parent');
    expect(list.every((n) => n.isRead)).toBe(true);
  });

  it('adds a new notification dynamically and places it at the top', async () => {
    const newNotif = addNotification({
      role: 'student',
      type: 'hold_expiry',
      title: 'Срочное напоминание',
      text: 'До окончания холда осталось 2 часа!',
    });

    expect(newNotif.id).toBeDefined();
    expect(newNotif.isRead).toBe(false);

    const list = await fetchUserNotifications('student-1', 'student');
    expect(list[0].id).toBe(newNotif.id);
    expect(list[0].title).toBe('Срочное напоминание');
  });
});
