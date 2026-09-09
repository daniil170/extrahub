import { getDocuments, updateDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

const STORAGE_KEY = 'extrahub_notifications_v3';

const ROLE_NOTIFICATIONS = {
  student: [
    {
      id: 'notif-s1',
      role: 'student',
      type: 'hold_expiry',
      title: 'Истекает срок бронирования',
      text: 'Осталось 4 часа действия бронирования в кружок «Робототехника и Arduino». Напомните родителям подтвердить участие.',
      isRead: false,
      sentAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
    },
    {
      id: 'notif-s2',
      role: 'student',
      type: 'waitlist_promotion',
      title: 'Освободилось место в кружке!',
      text: 'Отличные новости! Для вас освободилось место в группе «Шахматный клуб (Основная группа)». Подтвердите запись до 20:00.',
      isRead: false,
      sentAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    },
    {
      id: 'notif-s3',
      role: 'student',
      type: 'attendance_alert',
      title: 'Посещение отмечено',
      text: 'Ваше посещение занятия «Робототехника и Arduino» отмечено преподавателем: «Присутствовал».',
      isRead: true,
      sentAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    },
    {
      id: 'notif-s4',
      role: 'student',
      type: 'catalog_new',
      title: 'Новый кружок в каталоге',
      text: 'В каталоге открыта запись на новое направление: «Разговорный английский Debate Club»!',
      isRead: true,
      sentAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 days ago
    },
  ],
  parent: [
    {
      id: 'notif-p1',
      role: 'parent',
      type: 'parent_approval',
      title: 'Требуется подтверждение записи',
      text: 'Александр забронировал место в кружке «Робототехника и Arduino». Пожалуйста, подтвердите участие (осталось 18 часов).',
      isRead: false,
      sentAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-p2',
      role: 'parent',
      type: 'invoice_created',
      title: 'Выставлен счёт на оплату',
      text: 'Выставлен счёт за сентябрь: «Разговорный английский Debate Club» на сумму 22 000 ₸. Срок оплаты: до 25 сентября.',
      isRead: false,
      sentAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-p3',
      role: 'parent',
      type: 'payment_confirmed',
      title: 'Оплата подтверждена',
      text: 'Оплата за кружок «Робототехника и Arduino» (25 000 ₸) успешно получена и подтверждена координатором школы.',
      isRead: true,
      sentAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-p4',
      role: 'parent',
      type: 'attendance_alert',
      title: 'Посещаемость ребёнка',
      text: 'Александр присутствовал на занятии «Робототехника и Arduino» сегодня в 15:30 (кабинет 304).',
      isRead: true,
      sentAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    },
  ],
  teacher: [
    {
      id: 'notif-t1',
      role: 'teacher',
      type: 'attendance_journal',
      title: 'Журнал посещаемости готов',
      text: 'Журнал посещаемости на сегодня сформирован для группы «Робототехника — Группа А (5-8 кл.)». Не забудьте отметить присутствующих.',
      isRead: false,
      sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-t2',
      role: 'teacher',
      type: 'student_enrolled',
      title: 'Новый ученик в группе',
      text: 'Новый ученик Дарья Смирнова зачислена в группу «Робототехника — Группа А». Контакты родителей добавлены в карточку.',
      isRead: false,
      sentAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-t3',
      role: 'teacher',
      type: 'waitlist_update',
      title: 'Лист ожидания пополнился',
      text: 'В лист ожидания вашей группы по «Шахматам» добавлен 1 ученик (текущая очередь: 3 чел.).',
      isRead: true,
      sentAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    },
  ],
  coordinator: [
    {
      id: 'notif-c1',
      role: 'coordinator',
      type: 'capacity_alert',
      title: 'Заполнение группы 100%',
      text: 'Группа «Робототехника — Группа Б» заполнена на 100% (15/15 мест). 2 ученика в листе ожидания — рекомендуется открыть доп. группу.',
      isRead: false,
      sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-c2',
      role: 'coordinator',
      type: 'hold_expired',
      title: 'Истёк 24-часовой холд',
      text: 'Истёк срок бронирования ученика Максим Смирнов. Место в кружке автоматически освобождено для следующего кандидата.',
      isRead: false,
      sentAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-c3',
      role: 'coordinator',
      type: 'offline_payment',
      title: 'Поступил платёж за кружок',
      text: 'Поступил офлайн-платеж от родителя Софии Ивановой (22 000 ₸). Требуется подтверждение в биллинге.',
      isRead: false,
      sentAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-c4',
      role: 'coordinator',
      type: 'waitlist_promoted',
      title: 'Продвижение в листе ожидания',
      text: 'Ученик Илья Кузнецов автоматически перемещен на 1-е место в очереди группы «Школьный волейбол».',
      isRead: true,
      sentAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  ],
  admin: [
    {
      id: 'notif-a1',
      role: 'admin',
      type: 'capacity_alert',
      title: 'Сводный мониторинг вместимости',
      text: 'Заполненность секций школы достигла 88%. 4 учебные группы полностью укомплектованы на 100%.',
      isRead: false,
      sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-a2',
      role: 'admin',
      type: 'invoice_created',
      title: 'Финансовый аудит за сентябрь',
      text: 'Собрано 85 000 ₸ из 120 000 ₸ выставленных счетов за кружки. 1 платёж находится в статусе «Просрочено».',
      isRead: false,
      sentAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-a3',
      role: 'admin',
      type: 'system_notice',
      title: 'Открыта новая школьная секция',
      text: 'Координатор успешно создал кружок «3D-моделирование и прототипирование» в корпусе IT-лаборатории.',
      isRead: true,
      sentAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-a4',
      role: 'admin',
      type: 'system_notice',
      title: 'Синхронизация данных школы',
      text: 'Журналы посещаемости и реестр учеников синхронизированы без ошибок.',
      isRead: true,
      sentAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ],
};

function getAllInitialNotifications() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // Flatten all role arrays
  const all = Object.values(ROLE_NOTIFICATIONS).flat();
  return all;
}

let devNotificationsStore = getAllInitialNotifications();
const listeners = new Set();

function persistStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devNotificationsStore));
    } catch {
      // ignore
    }
  }
}

function notifySubscribers() {
  listeners.forEach((listener) => {
    try {
      listener(devNotificationsStore);
    } catch (err) {
      console.error('Error in notifications listener:', err);
    }
  });
}

export function subscribeNotifications(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Fetch notifications for user / role
 * @param {string} userId
 * @param {string} [role]
 */
export async function fetchUserNotifications(userId, role = 'student') {
  try {
    const fetchPromise = getDocuments(COLLECTIONS.NOTIFICATIONS);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 300)
    );
    const data = await Promise.race([fetchPromise, timeoutPromise]);
    const userNotifs = data.filter((n) => n.userId === userId || n.role === role);
    if (userNotifs.length > 0) return userNotifs;
  } catch (error) {
    // Graceful offline fallback
  }

  const roleList = devNotificationsStore.filter(
    (n) => n.role === role || n.userId === userId
  );

  return roleList.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
}

/**
 * Mark a specific notification as read
 * @param {string} notificationId
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const updatePromise = updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
      isRead: true,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 300)
    );
    await Promise.race([updatePromise, timeoutPromise]);
  } catch {
    // ignore
  }

  devNotificationsStore = devNotificationsStore.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  persistStore();
  notifySubscribers();
  return { success: true };
}

/**
 * Mark all notifications as read for a given role or user
 * @param {string} [role]
 * @param {string} [userId]
 */
export async function markAllNotificationsAsRead(role, userId) {
  devNotificationsStore = devNotificationsStore.map((n) => {
    if ((role && n.role === role) || (userId && n.userId === userId) || (!role && !userId)) {
      return { ...n, isRead: true };
    }
    return n;
  });

  persistStore();
  notifySubscribers();
  return { success: true };
}

/**
 * Add a new notification programmatically (e.g. from app actions)
 * @param {Object} notif
 */
export function addNotification(notif) {
  const newNotif = {
    id: notif.id || `notif-${Date.now()}`,
    role: notif.role || 'student',
    type: notif.type || 'system_notice',
    title: notif.title || 'Новое уведомление',
    text: notif.text || '',
    isRead: false,
    sentAt: notif.sentAt || new Date().toISOString(),
  };

  devNotificationsStore = [newNotif, ...devNotificationsStore];
  persistStore();
  notifySubscribers();
  return newNotif;
}

/**
 * Reset notifications store to defaults
 */
export function resetNotificationsStore() {
  devNotificationsStore = Object.values(ROLE_NOTIFICATIONS).flat();
  persistStore();
  notifySubscribers();
}
