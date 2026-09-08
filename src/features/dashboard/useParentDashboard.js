import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { subscribeDashboardData, MOCK_CHILDREN } from './api.js';
import { cancelEnrollmentCall } from '../enrollment/api.js';

export function useParentDashboard(initialStudentId) {
  const { user } = useAuth();
  const role = user?.role || 'parent';

  const [children, setChildren] = useState(() =>
    role === 'student'
      ? [{ id: user?.id || 'student-1', fullName: user?.fullName || 'Ученик', className: '' }]
      : MOCK_CHILDREN
  );

  const [activeStudentId, setActiveStudentId] = useState(
    initialStudentId || (role === 'student' ? user?.id || 'student-1' : 'student-1')
  );

  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingEnrollment, setCancellingEnrollment] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Adjust activeStudentId if user role changes or children load
  useEffect(() => {
    if (role === 'student') {
      setActiveStudentId(user?.id || 'student-1');
    }
  }, [role, user?.id]);

  // Subscribe to real-time data for the current activeStudentId
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeDashboardData(
      {
        userId: user?.id || 'dev-user-1',
        role,
        studentId: activeStudentId,
      },
      (data) => {
        setChildren(data.children);
        setEnrollments(data.enrollments);
        setPayments(data.payments);
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
  }, [user?.id, role, activeStudentId]);

  const openCancelModal = useCallback((enrollment) => {
    setCancellingEnrollment(enrollment);
    setCancelError(null);
    setCancelModalOpen(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    if (isCancelling) return;
    setCancelModalOpen(false);
    setCancellingEnrollment(null);
    setCancelError(null);
  }, [isCancelling]);

  const confirmCancel = useCallback(async () => {
    if (!cancellingEnrollment) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelEnrollmentCall({ enrollmentId: cancellingEnrollment.id });

      // Optimistically update local enrollments
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === cancellingEnrollment.id
            ? { ...e, status: 'cancelled', cancelledAt: new Date().toISOString() }
            : e
        )
      );

      setToastMessage('Запись успешно отменена. Место передано следующему в очереди.');
      setCancelModalOpen(false);
      setCancellingEnrollment(null);
    } catch (err) {
      console.error('Cancel enrollment failed:', err);
      setCancelError(err.message || 'Не удалось отменить запись. Попробуйте снова.');
    } finally {
      setIsCancelling(false);
    }
  }, [cancellingEnrollment]);

  return {
    children,
    activeStudentId,
    setActiveStudentId,
    enrollments,
    payments,
    loading,
    error,
    // Cancellation
    cancelModalOpen,
    cancellingEnrollment,
    isCancelling,
    cancelError,
    toastMessage,
    openCancelModal,
    closeCancelModal,
    confirmCancel,
    role,
  };
}
