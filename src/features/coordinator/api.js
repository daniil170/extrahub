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
import { subscribeActivities, createActivityRecord } from '../catalog/api.js';
import { DEMO_WAITLIST, DEMO_STUDENTS } from '../../shared/data/demoData.js';

export { createActivityRecord };

export const MOCK_WAITLIST = DEMO_WAITLIST;
export const MOCK_STUDENTS_CATALOG = DEMO_STUDENTS;

export const MOCK_COORDINATOR_ENROLLMENTS = [
  // Robotics Group A (grp-1-1)
  {
    id: 'enr-c1',
    studentId: 'student-1',
    studentName: 'Александр Иванов',
    className: '7-Б класс',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
  },
  {
    id: 'enr-c2',
    studentId: 'student-2',
    studentName: 'София Иванова',
    className: '5-Б класс',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
  },
  {
    id: 'enr-c3',
    studentId: 'student-3',
    studentName: 'Дарья Смирнова',
    className: '7-А класс',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
  },
  {
    id: 'enr-c4',
    studentId: 'student-4',
    studentName: 'Илья Кузнецов',
    className: '8-В класс',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
  },
  {
    id: 'enr-c5',
    studentId: 'student-5',
    studentName: 'Максим Смирнов',
    className: '7-Б класс',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
  },
  {
    id: 'enr-c6',
    studentId: 'student-6',
    studentName: 'Екатерина Попова',
    className: '8-А класс',
    groupId: 'grp-1-1',
    activityId: 'act-1',
    status: 'active',
  },
  // Theater Main Troupe (grp-2-1)
  {
    id: 'enr-c7',
    studentId: 'student-1',
    studentName: 'Александр Иванов',
    className: '7-Б класс',
    groupId: 'grp-2-1',
    activityId: 'act-2',
    status: 'active',
  },
  {
    id: 'enr-c8',
    studentId: 'student-3',
    studentName: 'Дарья Смирнова',
    className: '7-А класс',
    groupId: 'grp-2-1',
    activityId: 'act-2',
    status: 'active',
  },
  {
    id: 'enr-c9',
    studentId: 'student-5',
    studentName: 'Максим Смирнов',
    className: '7-Б класс',
    groupId: 'grp-2-1',
    activityId: 'act-2',
    status: 'active',
  },
  // Chess (grp-3-1)
  {
    id: 'enr-c10',
    studentId: 'student-2',
    studentName: 'София Иванова',
    className: '5-Б класс',
    groupId: 'grp-3-1',
    activityId: 'act-3',
    status: 'active',
  },
  {
    id: 'enr-c11',
    studentId: 'student-6',
    studentName: 'Екатерина Попова',
    className: '8-А класс',
    groupId: 'grp-3-1',
    activityId: 'act-3',
    status: 'active',
  },
  // Volleyball (grp-4-1)
  {
    id: 'enr-c12',
    studentId: 'student-4',
    studentName: 'Илья Кузнецов',
    className: '8-В класс',
    groupId: 'grp-4-1',
    activityId: 'act-4',
    status: 'active',
  },
  // English Debates (grp-5-1)
  {
    id: 'enr-c13',
    studentId: 'student-2',
    studentName: 'София Иванова',
    className: '5-Б класс',
    groupId: 'grp-5-1',
    activityId: 'act-5',
    status: 'active',
  },
  {
    id: 'enr-c14',
    studentId: 'student-5',
    studentName: 'Максим Смирнов',
    className: '7-Б класс',
    groupId: 'grp-5-1',
    activityId: 'act-5',
    status: 'active',
  },
  // Math Olympiad (grp-6-1)
  {
    id: 'enr-c15',
    studentId: 'student-1',
    studentName: 'Александр Иванов',
    className: '7-Б класс',
    groupId: 'grp-6-1',
    activityId: 'act-6',
    status: 'active',
  },
  {
    id: 'enr-c16',
    studentId: 'student-4',
    studentName: 'Илья Кузнецов',
    className: '8-В класс',
    groupId: 'grp-6-1',
    activityId: 'act-6',
    status: 'active',
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
    amount: 25000,
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
    amount: 22000,
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
    amount: 25000,
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
    amount: 15000,
    status: 'pending',
    dueDate: '2026-09-20',
    paidAt: null,
    createdAt: '2026-09-05T09:00:00.000Z',
  },
];

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
    const acts = actsList || [];
    const grps = grpsList || [];
    const wlist = waitlistList || [];

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

  // Listen to local activity updates
  const unsubLocalActivities = subscribeActivities(() => {
    if (!actsList || actsList.length === 0) {
      emit();
    }
  });
  unsubs.push(unsubLocalActivities);

  try {
    const unsubActs = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snap) => {
        actsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Activities snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubActs);

    const unsubGrps = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snap) => {
        grpsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Groups snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubGrps);

    const unsubWlist = onSnapshot(
      collection(db, COLLECTIONS.WAITLIST),
      (snap) => {
        waitlistList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Waitlist snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubWlist);

    return () => unsubs.forEach((fn) => fn && fn());
  } catch (err) {
    console.error('subscribeCoordinatorOverview error:', err);
    emit();
    if (onError) onError(err);
    return () => unsubs.forEach((fn) => fn && fn());
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
    await updateDoc(docRef, { capacity: cap });
    return { success: true };
  } catch (err) {
    console.error('updateGroupCapacity error:', err);
    throw err;
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
    await setDoc(docRef, payload);
    return { success: true, id: newId };
  } catch (err) {
    console.error('createActivityGroup error:', err);
    throw err;
  }
}

/**
 * Subscribe to Payments and Billing in Coordinator module
 */
export function subscribeCoordinatorPayments(onUpdate, onError) {
  let paymentsList = null;
  let studentsList = null;
  let actsList = null;
  let grpsList = null;
  let enrsList = null;

  function emit() {
    const pays = paymentsList || [];
    const stds = studentsList || [];
    const acts = actsList || [];
    const grps = grpsList || [];
    const enrs = enrsList || [];

    const stdMap = {};
    stds.forEach((s) => {
      stdMap[s.id] = s;
    });

    const actMap = {};
    acts.forEach((a) => {
      actMap[a.id] = a;
    });

    const grpMap = {};
    grps.forEach((g) => {
      grpMap[g.id] = g;
    });

    const enrichedPayments = pays.map((p) => {
      const student = stdMap[p.studentId] || {};
      const activity = actMap[p.activityId] || {};
      const group = grpMap[p.groupId] || {};

      return {
        ...p,
        studentName: p.studentName || student.fullName || `Ученик (${p.studentId})`,
        className: p.className || student.className || '',
        activityTitle: p.activityTitle || activity.title || 'Кружок',
        groupName: p.groupName || group.name || '',
      };
    });

    onUpdate({
      payments: enrichedPayments,
      students: stds,
      activities: acts,
      groups: grps,
      enrollments: enrs,
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
      (err) => {
        console.error('Payments snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubPays);

    const unsubStds = onSnapshot(
      collection(db, COLLECTIONS.STUDENTS),
      (snap) => {
        studentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Students snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubStds);

    const unsubActs = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITIES),
      (snap) => {
        actsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Activities snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubActs);

    const unsubGrps = onSnapshot(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      (snap) => {
        grpsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Groups snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubGrps);

    const unsubEnrs = onSnapshot(
      collection(db, COLLECTIONS.ENROLLMENTS),
      (snap) => {
        enrsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => {
        console.error('Enrollments snapshot error:', err);
        emit();
      }
    );
    unsubs.push(unsubEnrs);

    return () => unsubs.forEach((fn) => fn && fn());
  } catch (err) {
    console.error('subscribeCoordinatorPayments error:', err);
    emit();
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Batch create payment invoices for all active students in an activity group
 */
export async function createGroupInvoicesRecord({
  groupId,
  activityId,
  amount,
  dueDate,
  periodTitle = 'Оплата за кружок',
  activeEnrollments = [],
}) {
  const matching = (activeEnrollments || []).filter((e) => e.groupId === groupId && e.status === 'active');

  if (matching.length === 0) {
    throw new Error('В выбранной группе нет активных зачисленных учеников для выставления счетов');
  }

  const newInvoices = matching.map((enr, i) => ({
    id: `pay-grp-${Date.now()}-${i}-${enr.studentId}`,
    groupId,
    groupName: enr.groupName || 'Основная группа',
    enrollmentId: enr.id,
    studentId: enr.studentId,
    studentName: enr.studentName || `Ученик (${enr.studentId})`,
    className: enr.className || '',
    activityId: activityId || enr.activityId,
    activityTitle: enr.activityTitle || 'Кружок',
    amount: Number(amount) || 0,
    periodTitle,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    paidAt: null,
    createdAt: new Date().toISOString(),
  }));

  try {
    const promises = newInvoices.map((inv) => {
      const docRef = doc(db, COLLECTIONS.PAYMENTS, inv.id);
      return setDoc(docRef, inv);
    });
    await Promise.all(promises);
    return {
      success: true,
      count: newInvoices.length,
      totalAmount: newInvoices.length * (Number(amount) || 0),
      invoices: newInvoices,
    };
  } catch (err) {
    console.error('createGroupInvoicesRecord error:', err);
    throw err;
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
    await setDoc(docRef, payload);
    return { success: true, id: newId };
  } catch (err) {
    console.error('createPaymentRecord error:', err);
    throw err;
  }
}

/**
 * Mark an existing invoice as paid offline
 */
export async function markPaymentAsPaid(paymentId) {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    await updateDoc(docRef, {
      status: 'paid',
      paidAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error('markPaymentAsPaid error:', err);
    throw err;
  }
}

/**
 * Cancel or delete an invoice
 */
export async function cancelPaymentRecord(paymentId) {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error('cancelPaymentRecord error:', err);
    throw err;
  }
}

