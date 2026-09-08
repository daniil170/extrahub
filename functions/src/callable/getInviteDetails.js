import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase.js';

/**
 * Callable Cloud Function to safely fetch invite details for parent landing page
 * Does not require parent authentication, but validates token and prevents leaking extraneous data.
 */
export const getInviteDetails = onCall(async (request) => {
  const inviteToken = request.data?.inviteToken || request.data?.token;

  if (!inviteToken || typeof inviteToken !== 'string') {
    throw new HttpsError('invalid-argument', 'Параметр inviteToken или token обязателен');
  }

  const inviteQuery = await db
    .collection('parentInvites')
    .where('token', '==', inviteToken)
    .limit(1)
    .get();

  if (inviteQuery.empty) {
    throw new HttpsError('not-found', 'Приглашение не найдено');
  }

  const inviteDoc = inviteQuery.docs[0];
  const invite = inviteDoc.data();

  if (invite.status !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      `Приглашение не активно (статус: ${invite.status})`
    );
  }

  const now = new Date();
  const expiresAt = new Date(invite.expiresAt);
  if (expiresAt <= now) {
    throw new HttpsError('failed-precondition', 'Срок действия приглашения истёк');
  }

  // Fetch related student
  const studentDoc = await db.collection('students').doc(invite.studentId).get();
  const student = studentDoc.exists ? studentDoc.data() : { fullName: 'Ученик', className: '' };

  // Fetch enrollment
  const enrollmentDoc = await db.collection('enrollments').doc(invite.enrollmentId).get();
  if (!enrollmentDoc.exists) {
    throw new HttpsError('not-found', 'Запись в секцию не найдена');
  }
  const enrollment = enrollmentDoc.data();

  // Fetch activity group
  const groupDoc = await db.collection('activityGroups').doc(enrollment.groupId).get();
  const group = groupDoc.exists ? groupDoc.data() : {};

  // Fetch activity
  const activityId = group.activityId || enrollment.activityId;
  const activityDoc = await db.collection('activities').doc(activityId).get();
  const activity = activityDoc.exists ? activityDoc.data() : { title: 'Кружок', price: 0 };

  // Fetch teacher name
  const teacherId = activity.teacherId || group.teacherId;
  let teacherName = 'Преподаватель школы';
  if (teacherId) {
    const teacherDoc = await db.collection('users').doc(teacherId).get();
    if (teacherDoc.exists && teacherDoc.data().fullName) {
      teacherName = teacherDoc.data().fullName;
    }
  }

  // Calculate payment terms: due date 7 days from enrollment
  const enrolledDate = enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : new Date();
  const dueDate = new Date(enrolledDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    valid: true,
    invite: {
      id: inviteDoc.id,
      token: inviteToken,
      status: invite.status,
      expiresAt: invite.expiresAt,
    },
    student: {
      id: invite.studentId,
      fullName: student.fullName,
      className: student.className,
    },
    activity: {
      id: activityId,
      title: activity.title,
      description: activity.description || '',
      price: typeof activity.price === 'number' ? activity.price : 0,
      location: activity.location || group.location || 'Школьный корпус',
      category: activity.category || 'Внеурочная деятельность',
    },
    group: {
      id: enrollment.groupId,
      daysOfWeek: group.daysOfWeek || [],
      startTime: group.startTime || '15:00',
      endTime: group.endTime || '16:30',
    },
    teacher: {
      fullName: teacherName,
    },
    paymentTerms: {
      amount: activity.price || 0,
      dueDate: dueDate.toISOString(),
    },
  };
});
