import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { MOCK_ACTIVITIES, MOCK_ACTIVITY_GROUPS } from '../catalog/api.js';

export const MOCK_WAITLIST = [
  {
    id: 'w-1',
    studentId: 'student-3',
    groupId: 'grp-1-2',
    position: 1,
    queuedAt: '2026-09-07T10:00:00.000Z',
  },
  {
    id: 'w-2',
    studentId: 'student-4',
    groupId: 'grp-2-1',
    position: 1,
    queuedAt: '2026-09-06T12:00:00.000Z',
  },
  {
    id: 'w-3',
    studentId: 'student-5',
    groupId: 'grp-2-1',
    position: 2,
    queuedAt: '2026-09-06T15:00:00.000Z',
  },
];

export const MOCK_STUDENTS_CATALOG = [
  {
    id: 'student-1',
    fullName: 'Александр Иванов',
    className: '7-Б класс',
    parentIds: ['dev-user-1'],
  },
  { id: 'student-2', fullName: 'София Иванова', className: '5-Б класс', parentIds: ['dev-user-1'] },
  { id: 'student-3', fullName: 'Дарья Смирнова', className: '7-А класс', parentIds: ['parent-2'] },
  { id: 'student-4', fullName: 'Илья Кузнецов', className: '8-В класс', parentIds: ['parent-3'] },
  { id: 'student-5', fullName: 'Максим Смирнов', className: '7-Б класс', parentIds: ['parent-4'] },
  {
    id: 'student-6',
    fullName: 'Екатерина Попова',
    className: '8-А класс',
    parentIds: ['parent-5'],
  },
];

export const MOCK_COORDINATOR_PAYMENTS = [
  {
    id: 'pay-101',
    enrollmentId: 'enr-1',
    studentId: 'student-1',
    studentName: 'Александр Иванов',
    className: '7-Б класс',
    activityId: 'act-1',
    activityTitle: 'Робототехника и Arduino',
    amount: 3500,
    status: 'paid',
    dueDate: '2026-09-15',
    paidAt: '2026-09-03T14:20:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'pay-102',
    enrollmentId: 'enr-2',
    studentId: 'student-2',
    studentName: 'София Иванова',
    className: '5-Б класс',
    activityId: 'act-5',
    activityTitle: 'Разговорный английский Debate Club',
    amount: 3200,
    status: 'pending',
    dueDate: '2026-09-25',
    paidAt: null,
    createdAt: '2026-09-02T11:00:00.000Z',
  },
  {
    id: 'pay-103',
    enrollmentId: 'enr-3',
    studentId: 'student-3',
    studentName: 'Дарья Смирнова',
    className: '7-А класс',
    activityId: 'act-1',
    activityTitle: 'Робототехника и Arduino',
    amount: 3500,
    status: 'overdue',
    dueDate: '2026-09-05',
    paidAt: null,
    createdAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'pay-104',
    enrollmentId: 'enr-4',
    studentId: 'student-4',
    studentName: 'Илья Кузнецов',
    className: '8-В класс',
    activityId: 'act-4',
    activityTitle: 'Школьный волейбол',
    amount: 1800,
    status: 'pending',
    dueDate: '2026-09-20',
    paidAt: null,
    createdAt: '2026-09-05T09:00:00.000Z',
  },
];

// In-memory dev storage to persist changes across UI sessions if Firestore is offline
let devGroupsStore = [...MOCK_ACTIVITY_GROUPS];
let devPaymentsStore = [...MOCK_COORDINATOR_PAYMENTS];

/**
 * Pure function to calculate school-wide capacity metrics
 */
export function calculateCapacityMetrics(groups = [], waitlistEntries = []) {
  const totalGroups = groups.length;
  const totalCapacity = groups.reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
  const totalEnrolled = groups.reduce((acc, g) => acc + (Number(g.enrolledCount) || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const fullGroupsCount = groups.filter(
    (g) =>
      (Number(g.enrolledCount) || 0) >= (Number(g.capacity) || 0) && (Number(g.capacity) || 0) > 0
  ).length;
  const totalWaitlistCount = waitlistEntries.length;

  return {
    totalGroups,
    totalCapacity,
    totalEnrolled,
    occupancyRate,
    fullGroupsCount,
    totalWaitlistCount,
  };
}

/**
 * Pure function to enrich groups with activity metadata, percentage and waitlist counts
 */
export function enrichGroupsWithActivity(groups = [], activities = [], waitlistEntries = []) {
  const actMap = {};
  activities.forEach((a) => {
    actMap[a.id] = a;
  });

  return groups.map((g) => {
    const act = actMap[g.activityId] || {};
    const capacity = Number(g.capacity) || 0;
    const enrolled = Number(g.enrolledCount) || 0;
    const percent = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
    const waitlistCount = waitlistEntries.filter((w) => w.groupId === g.id).length;

    let statusColor = 'var(--success)';
    if (percent >= 100) {
      statusColor = 'var(--danger)';
    } else if (percent >= 80) {
      statusColor = 'var(--warning)';
    }

    return {
      ...g,
      activityTitle: act.title || 'Кружок',
      category: act.category || 'Внеурочная деятельность',
      price: typeof act.price === 'number' ? act.price : 0,
      location: act.location || 'Школьный корпус',
      percent,
      waitlistCount,
      statusColor,
      isFull: percent >= 100,
    };
  });
}

/**
 * Pure function to generate invoices for a whole group
 */
export function generateGroupInvoices(
  groupId,
  activeEnrollments,
  amount,
  dueDate,
  activityId,
  activityTitle
) {
  const matching = (activeEnrollments || []).filter(
    (e) => e.groupId === groupId && e.status === 'active'
  );

  const nowStr = new Date().toISOString();
  return matching.map((enr, i) => ({
    id: `pay-gen-${Date.now()}-${i}`,
    enrollmentId: enr.id,
    studentId: enr.studentId,
    studentName: enr.studentName || `Ученик (${enr.studentId})`,
    className: enr.className || '',
    activityId: activityId || enr.activityId,
    activityTitle: activityTitle || 'Кружок',
    amount: Number(amount) || 0,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    paidAt: null,
    createdAt: nowStr,
  }));
}

/**
 * Subscribe to Coordinator Overview (Activities, Groups, Waitlist)
 */
export function subscribeCoordinatorOverview(onUpdate, onError) {
  let actsList = null;
  let grpsList = null;
  let waitlistList = null;

  function emit() {
    const acts = actsList && actsList.length > 0 ? actsList : MOCK_ACTIVITIES;
    const grps = grpsList && grpsList.length > 0 ? grpsList : devGroupsStore;
    const wlist = waitlistList && waitlistList.length > 0 ? waitlistList : MOCK_WAITLIST;

    const summary = {
      totalActivities: acts.length,
      ...calculateCapacityMetrics(grps, wlist),
    };

    const enrichedGroups = enrichGroupsWithActivity(grps, acts, wlist);

    onUpdate({
      summary,
      activities: acts,
      groups: enrichedGroups,
    });
  }

  const unsubs = [];

  try {
    const unsubActs = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snap) => {
        actsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubActs);

    const unsubGrps = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snap) => {
        grpsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubGrps);

    const unsubWlist = onSnapshot(
      collection(db, COLLECTIONS.WAITLIST),
      (snap) => {
        waitlistList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubWlist);

    return () => unsubs.forEach((fn) => fn && fn());
  } catch (err) {
    console.warn('subscribeCoordinatorOverview fallback to mock:', err.message);
    emit();
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Update capacity of an activity group
 */
export async function updateGroupCapacity(groupId, newCapacity, currentEnrolledCount) {
  const cap = Number(newCapacity);
  if (isNaN(cap) || cap < 1) {
    throw new Error('Вместимость должна быть не менее 1 места');
  }
  if (currentEnrolledCount !== undefined && cap < Number(currentEnrolledCount)) {
    throw new Error(
      'Новая вместимость не может быть меньше текущего количества записанных учеников'
    );
  }

  try {
    const docRef = doc(db, COLLECTIONS.ACTIVITY_GROUPS, groupId);
    const updatePromise = updateDoc(docRef, { capacity: cap });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 1000)
    );
    await Promise.race([updatePromise, timeoutPromise]);
    return { success: true };
  } catch (err) {
    console.warn('updateGroupCapacity fallback to mock store:', err.message);
    devGroupsStore = devGroupsStore.map((g) => (g.id === groupId ? { ...g, capacity: cap } : g));
    return { success: true, isDevMock: true };
  }
}

/**
 * Create a new group for an activity
 */
export async function createActivityGroup(groupData) {
  const newId = groupData.id || `grp-${Date.now()}`;
  const payload = {
    id: newId,
    activityId: groupData.activityId,
    name: groupData.name || 'Новая группа',
    capacity: Number(groupData.capacity) || 12,
    enrolledCount: 0,
    daysOfWeek: groupData.daysOfWeek || [1, 3],
    startTime: groupData.startTime || '15:30',
    endTime: groupData.endTime || '17:00',
    recurrence: 'weekly',
  };

  try {
    const docRef = doc(db, COLLECTIONS.ACTIVITY_GROUPS, newId);
    const setPromise = setDoc(docRef, payload);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 1000)
    );
    await Promise.race([setPromise, timeoutPromise]);
    return { success: true, id: newId };
  } catch (err) {
    console.warn('createActivityGroup fallback to mock store:', err.message);
    devGroupsStore = [...devGroupsStore, payload];
    return { success: true, id: newId, isDevMock: true };
  }
}

/**
 * Subscribe to Payments and Billing in Coordinator module
 */
export function subscribeCoordinatorPayments(onUpdate, onError) {
  let paymentsList = null;
  let studentsList = null;
  let actsList = null;

  function emit() {
    const pays = paymentsList && paymentsList.length > 0 ? paymentsList : devPaymentsStore;
    const stds = studentsList && studentsList.length > 0 ? studentsList : MOCK_STUDENTS_CATALOG;
    const acts = actsList && actsList.length > 0 ? actsList : MOCK_ACTIVITIES;

    const stdMap = {};
    stds.forEach((s) => {
      stdMap[s.id] = s;
    });

    const actMap = {};
    acts.forEach((a) => {
      actMap[a.id] = a;
    });

    const enrichedPayments = pays.map((p) => {
      const student = stdMap[p.studentId] || {};
      const activity = actMap[p.activityId] || {};

      return {
        ...p,
        studentName: p.studentName || student.fullName || `Ученик (${p.studentId})`,
        className: p.className || student.className || '',
        activityTitle: p.activityTitle || activity.title || 'Кружок',
      };
    });

    onUpdate({
      payments: enrichedPayments,
      students: stds,
      activities: acts,
    });
  }

  const unsubs = [];

  try {
    const unsubPays = onSnapshot(
      collection(db, COLLECTIONS.PAYMENTS),
      (snap) => {
        paymentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubPays);

    const unsubStds = onSnapshot(
      collection(db, COLLECTIONS.STUDENTS),
      (snap) => {
        studentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubStds);

    const unsubActs = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snap) => {
        actsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => emit()
    );
    unsubs.push(unsubActs);

    return () => unsubs.forEach((fn) => fn && fn());
  } catch (err) {
    console.warn('subscribeCoordinatorPayments fallback to mock:', err.message);
    emit();
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Create a single payment invoice
 */
export async function createPaymentRecord(paymentData) {
  const newId = paymentData.id || `pay-${Date.now()}`;
  const payload = {
    id: newId,
    enrollmentId: paymentData.enrollmentId || '',
    studentId: paymentData.studentId,
    studentName: paymentData.studentName || '',
    className: paymentData.className || '',
    activityId: paymentData.activityId,
    activityTitle: paymentData.activityTitle || '',
    amount: Number(paymentData.amount) || 0,
    status: 'pending',
    dueDate: paymentData.dueDate,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, newId);
    const setPromise = setDoc(docRef, payload);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 1000)
    );
    await Promise.race([setPromise, timeoutPromise]);
    return { success: true, id: newId };
  } catch (err) {
    console.warn('createPaymentRecord fallback to mock store:', err.message);
    devPaymentsStore = [payload, ...devPaymentsStore];
    return { success: true, id: newId, isDevMock: true };
  }
}

/**
 * Mark an existing invoice as paid offline
 */
export async function markPaymentAsPaid(paymentId) {
  const paidAtStr = new Date().toISOString();
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    const updatePromise = updateDoc(docRef, {
      status: 'paid',
      paidAt: serverTimestamp(),
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 1000)
    );
    await Promise.race([updatePromise, timeoutPromise]);
    return { success: true };
  } catch (err) {
    console.warn('markPaymentAsPaid fallback to mock store:', err.message);
    devPaymentsStore = devPaymentsStore.map((p) =>
      p.id === paymentId ? { ...p, status: 'paid', paidAt: paidAtStr } : p
    );
    return { success: true, isDevMock: true };
  }
}

/**
 * Cancel or delete an invoice
 */
export async function cancelPaymentRecord(paymentId) {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    const delPromise = deleteDoc(docRef);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 1000)
    );
    await Promise.race([delPromise, timeoutPromise]);
    return { success: true };
  } catch (err) {
    console.warn('cancelPaymentRecord fallback to mock store:', err.message);
    devPaymentsStore = devPaymentsStore.filter((p) => p.id !== paymentId);
    return { success: true, isDevMock: true };
  }
}
