import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { functions, db } from '../../app/config/firebase.js';

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
 * Fetch invite details (staff or parent) using secure callable Cloud Function
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
 * Approve enrollment via parent invite token
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
 * Reject enrollment via parent invite token
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

/**
 * Create a staff invite (Coordinator or Teacher)
 * @param {Object} params
 * @param {'coordinator' | 'teacher'} params.targetRole
 * @param {string} [params.email]
 * @param {string} [params.activityId]
 */
export async function createStaffInviteCall({ targetRole, email, activityId }) {
  try {
    const callable = httpsCallable(functions, 'createStaffInvite');
    const res = await callable({ targetRole, email, activityId });
    return res.data;
  } catch (err) {
    console.error('createStaffInvite error:', err);
    throw err;
  }
}

/**
 * Register a staff account using an invite token
 * @param {Object} params
 * @param {string} params.inviteToken
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 */
export async function registerViaInviteCall({ inviteToken, email, password, fullName }) {
  try {
    const callable = httpsCallable(functions, 'registerViaInvite');
    const res = await callable({ inviteToken, email, password, fullName });
    return res.data;
  } catch (err) {
    console.error('registerViaInvite error:', err);
    throw err;
  }
}

/**
 * Register a student account with @pifagorschool.kz domain check
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 * @param {string} [params.className]
 */
export async function registerStudentCall({ email, password, fullName, className }) {
  try {
    const callable = httpsCallable(functions, 'registerStudent');
    const res = await callable({ email, password, fullName, className });
    return res.data;
  } catch (err) {
    console.error('registerStudent error:', err);
    throw err;
  }
}

/**
 * Fetch list of staff invites from Firestore
 */
export async function fetchStaffInvites() {
  try {
    const q = query(collection(db, 'invites'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    if (err.code !== 'permission-denied') {
      console.error('fetchStaffInvites error:', err);
    }
    return [];
  }
}
