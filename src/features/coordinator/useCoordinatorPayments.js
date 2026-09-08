import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeCoordinatorPayments,
  createPaymentRecord,
  markPaymentAsPaid,
  cancelPaymentRecord,
} from './api.js';

export function useCoordinatorPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Processing & Feedback state
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Create Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => setActionSuccess(null), 2500);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCoordinatorPayments(
      (data) => {
        setPayments(data.payments);
        setStudents(data.students);
        setActivities(data.activities);
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

  // Filtered payments by search and status
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
      }
      if (q) {
        const studentMatch = (p.studentName || '').toLowerCase().includes(q);
        const classMatch = (p.className || '').toLowerCase().includes(q);
        const actMatch = (p.activityTitle || '').toLowerCase().includes(q);
        if (!studentMatch && !classMatch && !actMatch) return false;
      }
      return true;
    });
  }, [payments, filterStatus, searchQuery]);

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

  const openCreateModal = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    if (isProcessing) return;
    setCreateModalOpen(false);
  }, [isProcessing]);

  // Create single invoice
  const createSingleInvoice = useCallback(
    async ({ studentId, activityId, amount, dueDate }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const student = students.find((s) => s.id === studentId);
        const activity = activities.find((a) => a.id === activityId);

        await createPaymentRecord({
          studentId,
          studentName: student?.fullName || '',
          className: student?.className || '',
          activityId,
          activityTitle: activity?.title || '',
          amount: Number(amount),
          dueDate,
        });

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
    stats,
    loading,
    error,
    isProcessing,
    actionSuccess,
    // Filters
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    // Modal & Actions
    createModalOpen,
    openCreateModal,
    closeCreateModal,
    createSingleInvoice,
    markAsPaid,
    cancelInvoice,
  };
}
