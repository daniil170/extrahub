import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';

/**
 * Callable Cloud Function to update equipment issue status
 * (Take into work, resolve with resolution comment, or cancel)
 */
export const updateIssueStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется авторизация');
  }

  const { issueId, status, resolutionComment } = request.data || {};

  if (!issueId || typeof issueId !== 'string') {
    throw new HttpsError('invalid-argument', 'Параметр issueId обязателен');
  }

  const validStatuses = ['in_progress', 'resolved', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new HttpsError('invalid-argument', `Недопустимый статус: ${status}`);
  }

  if (status === 'resolved' && (!resolutionComment || typeof resolutionComment !== 'string' || resolutionComment.trim().length < 3)) {
    throw new HttpsError('invalid-argument', 'Для закрытия заявки необходимо указать комментарий о решении');
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
  const nowStr = new Date().toISOString();

  const updates = {
    updatedAt: nowStr,
    status,
  };

  if (status === 'in_progress') {
    if (callerRole !== 'technician' && callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Только техник или администратор могут взять заявку в работу');
    }
    updates.assignedTo = callerUid;
    updates.assignedToName = userData.fullName || 'Дежурный техник';
  } else if (status === 'resolved') {
    if (callerRole !== 'technician' && callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Только техник или администратор могут закрыть заявку');
    }
    updates.resolutionComment = resolutionComment.trim();
    updates.resolvedAt = nowStr;
    if (!issueData.assignedTo) {
      updates.assignedTo = callerUid;
      updates.assignedToName = userData.fullName || 'Дежурный техник';
    }
  } else if (status === 'cancelled') {
    const isOwner = issueData.reportedBy === callerUid;
    if (!isOwner && callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Только автор заявки или администратор могут отменить её');
    }
  }

  await issueRef.update(updates);

  // Send notification to author (teacher)
  try {
    const notifRef = db.collection('notifications').doc();
    const statusTitles = {
      in_progress: 'Заявка взята в работу 🛠️',
      resolved: 'Заявка успешно выполнена ✅',
      cancelled: 'Заявка отменена ❌',
    };

    const statusTexts = {
      in_progress: `Техник ${updates.assignedToName || 'школы'} приступил к выполнению заявки «${issueData.title}» (${issueData.location}).`,
      resolved: `Заявка «${issueData.title}» закрыта. Отчёт: "${updates.resolutionComment}".`,
      cancelled: `Заявка «${issueData.title}» была отменена.`,
    };

    await notifRef.set({
      id: notifRef.id,
      userId: issueData.reportedBy,
      role: 'teacher',
      type: `equipment_issue_${status}`,
      title: statusTitles[status] || 'Обновление заявки',
      text: statusTexts[status] || `Статус заявки изменен на: ${status}`,
      channel: 'push',
      isRead: false,
      sentAt: nowStr,
    });
  } catch (notifErr) {
    console.warn('Could not dispatch status notification to teacher:', notifErr.message);
  }

  return {
    success: true,
    issueId,
    status,
    updates,
  };
});
