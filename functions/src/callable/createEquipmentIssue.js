import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';

/**
 * Callable Cloud Function to create an equipment breakdown issue
 */
export const createEquipmentIssue = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется авторизация');
  }

  const { title, description, location, category, priority, photoUrl } = request.data || {};

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    throw new HttpsError('invalid-argument', 'Название поломки должно содержать не менее 3 символов');
  }
  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    throw new HttpsError('invalid-argument', 'Описание должно содержать подробные сведения (от 5 символов)');
  }
  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Укажите кабинет или местоположение оборудования');
  }

  const validCategories = ['furniture', 'hardware', 'plumbing', 'electrical', 'other'];
  const issueCategory = validCategories.includes(category) ? category : 'other';

  const validPriorities = ['low', 'medium', 'high', 'critical'];
  const issuePriority = validPriorities.includes(priority) ? priority : 'medium';

  const callerUid = request.auth.uid;
  const userDoc = await db.collection('users').doc(callerUid).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const callerRole = userData.role || request.auth.token?.role || 'teacher';

  if (callerRole !== 'teacher' && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Только преподаватели и администраторы могут создавать заявки');
  }

  const nowStr = new Date().toISOString();
  const issueRef = db.collection('equipmentIssues').doc();

  const issueData = {
    id: issueRef.id,
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    category: issueCategory,
    priority: issuePriority,
    status: 'new',
    reportedBy: callerUid,
    reportedByName: userData.fullName || 'Преподаватель',
    assignedTo: null,
    assignedToName: null,
    photoUrl: photoUrl || null,
    createdAt: nowStr,
    updatedAt: nowStr,
    resolvedAt: null,
    resolutionComment: null,
  };

  await issueRef.set(issueData);

  // Notify technicians and administrators
  try {
    const techUsersSnap = await db
      .collection('users')
      .where('role', 'in', ['technician', 'admin'])
      .get();

    const isUrgent = issuePriority === 'critical' || issuePriority === 'high';
    const notifTitle = isUrgent
      ? `🚨 СРОЧНО: Новая заявка [${issueData.title}]`
      : `Новая заявка: ${issueData.title}`;

    const batch = db.batch();
    techUsersSnap.docs.forEach((tDoc) => {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        id: notifRef.id,
        userId: tDoc.id,
        role: tDoc.data().role || 'technician',
        type: 'equipment_issue_created',
        title: notifTitle,
        text: `Кабинет: ${issueData.location} | Приоритет: ${issuePriority}. Сообщил: ${issueData.reportedByName}`,
        channel: 'push',
        isRead: false,
        sentAt: nowStr,
      });
    });

    await batch.commit();
  } catch (notifErr) {
    console.warn('Could not dispatch notifications to technicians:', notifErr.message);
  }

  return {
    success: true,
    issue: issueData,
  };
});
