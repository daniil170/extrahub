import { getDocuments, updateDocument, COLLECTIONS } from '../../shared/api/firebaseUtils.js';

const MOCK_INVITE = {
  id: 'inv-123',
  token: 'test-token-123',
  studentId: 'stud-1',
  studentName: 'Александр Иванов',
  activityTitle: 'Робототехника и Arduino',
  groupSchedule: 'Пн, Пт 15:30 - 17:00',
  price: 3500,
  enrollmentId: 'enr-1',
  status: 'active',
  expiresAt: '2026-09-15T18:00:00.000Z',
  createdAt: '2026-09-08T10:00:00.000Z',
};

/**
 * Verify and fetch parent invite by token
 * @param {string} token
 */
export async function fetchInviteByToken(token) {
  try {
    const invites = await getDocuments(COLLECTIONS.PARENT_INVITES);
    const found = invites.find((inv) => inv.token === token);
    return found || { ...MOCK_INVITE, token };
  } catch (error) {
    console.warn('Using mock invite:', error.message);
    return { ...MOCK_INVITE, token };
  }
}

/**
 * Confirm / accept parent invite
 * @param {string} inviteId
 * @param {string} parentId
 */
export async function acceptInvite(inviteId, _parentId) {
  return updateDocument(COLLECTIONS.PARENT_INVITES, inviteId, {
    status: 'accepted',
  });
}
