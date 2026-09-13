import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import { createActivityRecord } from '../catalog/api.js';

export { createActivityRecord };

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
 * Delete a single activity group from Firestore.
 * Also deletes the parent activity if no other groups remain.
 * @param {string} groupId
 * @param {string} [activityId]
 */
export async function deleteActivityGroupRecord(groupId, activityId) {
  try {
    const groupRef = doc(db, COLLECTIONS.ACTIVITY_GROUPS, groupId);
    await deleteDoc(groupRef);

    if (activityId) {
      const grpQ = query(
        collection(db, COLLECTIONS.ACTIVITY_GROUPS),
        where('activityId', '==', activityId)
      );
      const snap = await getDocs(grpQ);
      const remaining = snap.docs.filter((d) => d.id !== groupId);
      if (remaining.length === 0) {
        const actRef = doc(db, COLLECTIONS.ACTIVITIES, activityId);
        await deleteDoc(actRef);
      }
    }
    return { success: true };
  } catch (err) {
    console.error('deleteActivityGroupRecord error:', err);
    throw err;
  }
}

/**
 * Delete an entire activity and all of its groups from Firestore
 * @param {string} activityId
 */
export async function deleteActivityRecord(activityId) {
  try {
    const batch = writeBatch(db);

    const grpQ = query(
      collection(db, COLLECTIONS.ACTIVITY_GROUPS),
      where('activityId', '==', activityId)
    );
    const snap = await getDocs(grpQ);
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
    });

    const actRef = doc(db, COLLECTIONS.ACTIVITIES, activityId);
    batch.delete(actRef);

    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error('deleteActivityRecord error:', err);
    throw err;
  }
}

/**
 * Batch delete multiple activity groups and clean up empty activities
 * @param {string[]} groupIds
 * @param {string[]} [activityIds]
 */
export async function deleteBatchGroupsRecord(groupIds = [], activityIds = []) {
  try {
    const batch = writeBatch(db);

    groupIds.forEach((gId) => {
      const gRef = doc(db, COLLECTIONS.ACTIVITY_GROUPS, gId);
      batch.delete(gRef);
    });

    activityIds.forEach((aId) => {
      const aRef = doc(db, COLLECTIONS.ACTIVITIES, aId);
      batch.delete(aRef);
    });

    await batch.commit();

    // Clean up empty activities that now have 0 groups left
    const remainingGrps = await getDocs(collection(db, COLLECTIONS.ACTIVITY_GROUPS));
    const activeActivityIds = new Set(remainingGrps.docs.map((d) => d.data().activityId));

    const allActs = await getDocs(collection(db, COLLECTIONS.ACTIVITIES));
    const cleanupBatch = writeBatch(db);
    let cleanupCount = 0;

    allActs.docs.forEach((d) => {
      if (!activeActivityIds.has(d.id)) {
        cleanupBatch.delete(d.ref);
        cleanupCount++;
      }
    });

    if (cleanupCount > 0) {
      await cleanupBatch.commit();
    }

    return { success: true };
  } catch (err) {
    console.error('deleteBatchGroupsRecord error:', err);
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

