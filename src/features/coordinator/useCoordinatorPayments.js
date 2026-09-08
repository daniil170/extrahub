import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeCoordinatorPayments,
  createPaymentRecord,
  createGroupInvoicesRecord,
  markPaymentAsPaid,
  cancelPaymentRecord,
} from './api.js';

export function useCoordinatorPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroupId, setFilterGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Processing & Feedback state
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Create Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState('group'); // 'group' | 'single'
  const [preselectedGroupId, setPreselectedGroupId] = useState(null);

  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => setActionSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCoordinatorPayments(
      (data) => {
        setPayments(data.payments);
        setStudents(data.students);
        setActivities(data.activities);
        setGroups(data.groups || []);
        setEnrollments(data.enrollments || []);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered payments by search, status, and group
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
      }
      if (filterGroupId !== 'all' && p.groupId !== filterGroupId) {
        return false;
      }
      if (q) {
        const studentMatch = (p.studentName || '').toLowerCase().includes(q);
        const classMatch = (p.className || '').toLowerCase().includes(q);
        const actMatch = (p.activityTitle || '').toLowerCase().includes(q);
        const grpMatch = (p.groupName || '').toLowerCase().includes(q);
        if (!studentMatch && !classMatch && !actMatch && !grpMatch) return false;
      }
      return true;
    });
  }, [payments, filterStatus, filterGroupId, searchQuery]);

  // Financial statistics
  const stats = useMemo(() => {
    let pendingAmount = 0;
    let paidAmount = 0;
    let overdueAmount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.status === 'paid') {
        paidAmount += amt;
      } else if (p.status === 'overdue') {
        overdueAmount += amt;
        overdueCount += 1;
      } else if (p.status === 'pending') {
        pendingAmount += amt;
        pendingCount += 1;
      }
    });

    return {
      pendingAmount,
      paidAmount,
      overdueAmount,
      pendingCount,
      overdueCount,
      totalPayments: payments.length,
    };
  }, [payments]);

  const openCreateModal = useCallback((mode = 'group', groupId = null) => {
    setCreateModalMode(mode);
    setPreselectedGroupId(groupId);
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    if (isProcessing) return;
    setCreateModalOpen(false);
    setPreselectedGroupId(null);
  }, [isProcessing]);

  // Create single invoice
  const createSingleInvoice = useCallback(
    async ({ studentId, activityId, amount, dueDate, periodTitle }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const student = students.find((s) => s.id === studentId);
        const activity = activities.find((a) => a.id === activityId);

        const res = await createPaymentRecord({
          studentId,
          studentName: student?.fullName || '',
          className: student?.className || '',
          activityId,
          activityTitle: activity?.title || '',
          amount: Number(amount),
          dueDate,
          periodTitle: periodTitle || 'Оплата за кружок',
        });

        // Optimistically add to local payments
        const newRecord = {
          id: res.id,
          studentId,
          studentName: student?.fullName || `Ученик (${studentId})`,
          className: student?.className || '',
          activityId,
          activityTitle: activity?.title || 'Кружок',
          amount: Number(amount),
          dueDate,
          periodTitle: periodTitle || 'Оплата за кружок',
          status: 'pending',
          paidAt: null,
          createdAt: new Date().toISOString(),
        };
        setPayments((prev) => [newRecord, ...prev]);

        setActionSuccess('Счёт успешно выставлен!');
        setCreateModalOpen(false);
      } catch (err) {
        console.error('Failed to create single invoice:', err);
        setError(err.message || 'Ошибка создания счёта');
      } finally {
        setIsProcessing(false);
      }
    },
    [students, activities]
  );

  // Create group invoices batch
  const createGroupInvoices = useCallback(
    async ({ groupId, activityId, amount, dueDate, periodTitle }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const res = await createGroupInvoicesRecord({
          groupId,
          activityId,
          amount: Number(amount),
          dueDate,
          periodTitle,
          activeEnrollments: enrollments,
        });

        if (res.invoices && res.invoices.length > 0) {
          setPayments((prev) => [...res.invoices, ...prev]);
        }

        const formattedTotal = Number(res.totalAmount).toLocaleString('ru-RU');
        setActionSuccess(
          `Успешно сформировано ${res.count} счетов для группы на сумму ${formattedTotal} ₸!`
        );
        setCreateModalOpen(false);
      } catch (err) {
        console.error('Failed to create group invoices:', err);
        setError(err.message || 'Ошибка формирования счетов группы');
      } finally {
        setIsProcessing(false);
      }
    },
    [enrollments]
  );

  // Mark invoice as paid offline
  const markAsPaid = useCallback(async (paymentId) => {
    setIsProcessing(true);
    setError(null);
    try {
      await markPaymentAsPaid(paymentId);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: 'paid', paidAt: new Date().toISOString() } : p
        )
      );
      setActionSuccess('Оплата успешно зафиксирована!');
    } catch (err) {
      console.error('Failed to mark payment as paid:', err);
      setError(err.message || 'Ошибка обновления статуса оплаты');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Cancel/delete erroneous invoice
  const cancelInvoice = useCallback(async (paymentId) => {
    setIsProcessing(true);
    setError(null);
    try {
      await cancelPaymentRecord(paymentId);
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setActionSuccess('Счёт успешно аннулирован.');
    } catch (err) {
      console.error('Failed to cancel payment:', err);
      setError(err.message || 'Ошибка отмены счёта');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    payments,
    filteredPayments,
    students,
    activities,
    groups,
    enrollments,
    stats,
    loading,
    error,
    isProcessing,
    actionSuccess,
    // Filters
    filterStatus,
    setFilterStatus,
    filterGroupId,
    setFilterGroupId,
    searchQuery,
    setSearchQuery,
    // Modal & Actions
    createModalOpen,
    createModalMode,
    preselectedGroupId,
    openCreateModal,
    closeCreateModal,
    createSingleInvoice,
    createGroupInvoices,
    markAsPaid,
    cancelInvoice,
  };
}
