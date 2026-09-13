import { httpsCallable } from 'firebase/functions';
import { functions } from '../../app/config/firebase.js';

export const MOCK_FALLBACK_INVITE = {
  valid: true,
  invite: {
    id: 'inv-sample-123',
    token: 'test-token',
    status: 'active',
    expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
  },
  student: {
    id: 'stud-1',
    fullName: 'Александр Иванов',
    className: '8А класс',
  },
  activity: {
    id: 'act-1',
    title: 'Робототехника и Arduino',
    description: 'Основы схемотехники, программирование микроконтроллеров и сборка роботов.',
    price: 3500,
    location: 'Кабинет 304 (IT-лаборатория)',
    category: 'Технологии',
  },
  group: {
    id: 'grp-1-1',
    daysOfWeek: [1, 3],
    startTime: '15:30',
    endTime: '17:00',
  },
  teacher: {
    fullName: 'Михаил Сергеевич Петров',
  },
  paymentTerms: {
    amount: 3500,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

/**
 * Fetch parent invite details using secure callable Cloud Function
 * @param {string} token
 */
export async function fetchInviteDetails(token) {
  try {
    const callable = httpsCallable(functions, 'getInviteDetails');
    const res = await callable({ token, inviteToken: token });
    return res.data;
  } catch (err) {
    console.error('getInviteDetails error:', err);
    throw err;
  }
}

/**
 * Approve enrollment via token
 * @param {string} token
 */
export async function approveInviteCall(token) {
  try {
    const callable = httpsCallable(functions, 'approveEnrollment');
    const res = await callable({ token, inviteToken: token });
    return res.data;
  } catch (err) {
    console.error('approveEnrollment error:', err);
    throw err;
  }
}

/**
 * Reject enrollment via token
 * @param {string} token
 */
export async function rejectInviteCall(token) {
  try {
    const callable = httpsCallable(functions, 'rejectEnrollment');
    const res = await callable({ token, inviteToken: token });
    return res.data;
  } catch (err) {
    console.error('rejectEnrollment error:', err);
    throw err;
  }
}

