import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';

/**
 * Callable Cloud Function to append a discussion comment to an equipment issue
 */
export const addIssueComment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется авторизация');
  }

  const { issueId, text } = request.data || {};

  if (!issueId || typeof issueId !== 'string') {
    throw new HttpsError('invalid-argument', 'Параметр issueId обязателен');
  }
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Текст сообщения не может быть пустым');
  }

  const issueRef = db.collection('equipmentIssues').doc(issueId);
  const issueDoc = await issueRef.get();

  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Заявка на ремонт не найдена');
  }

  const issueData = issueDoc.data();
  const callerUid = request.auth.uid;
  const userDoc = await db.collection('users').doc(callerUid).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const callerRole = userData.role || request.auth.token?.role || '';

  const isOwner = issueData.reportedBy === callerUid;
  const isTechnicianOrAdmin = callerRole === 'technician' || callerRole === 'admin';

  if (!isOwner && !isTechnicianOrAdmin) {
    throw new HttpsError('permission-denied', 'Недостаточно прав для комментирования заявки');
  }

  const nowStr = new Date().toISOString();
  const commentRef = issueRef.collection('comments').doc();

  const commentData = {
    id: commentRef.id,
    issueId,
    authorId: callerUid,
    authorName: userData.fullName || (isTechnicianOrAdmin ? 'Техническая служба' : 'Преподаватель'),
    authorRole: callerRole,
    text: text.trim(),
    createdAt: nowStr,
  };

  await commentRef.set(commentData);

  // Update parent issue updatedAt
  await issueRef.update({ updatedAt: nowStr });

  // Send notification to the opposing party
  try {
    const notifRef = db.collection('notifications').doc();
    const isFromTeacher = isOwner;

    const targetUserId = isFromTeacher ? (issueData.assignedTo || null) : issueData.reportedBy;
    const targetRole = isFromTeacher ? 'technician' : 'teacher';

    await notifRef.set({
      id: notifRef.id,
      userId: targetUserId || '',
      role: targetRole,
      type: 'equipment_issue_comment',
      title: `Новое сообщение по заявке «${issueData.title}»`,
      text: `${commentData.authorName}: "${commentData.text.length > 80 ? commentData.text.substring(0, 77) + '...' : commentData.text}"`,
      channel: 'push',
      isRead: false,
      sentAt: nowStr,
    });
  } catch (notifErr) {
    console.warn('Could not dispatch comment notification:', notifErr.message);
  }

  return {
    success: true,
    comment: commentData,
  };
});
