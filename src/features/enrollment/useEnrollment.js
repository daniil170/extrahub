import { useState, useCallback, useContext } from 'react';
import { AuthContext } from '../auth/context.js';
import { createEnrollmentCall } from './api.js';

// Default mock students for parent or coordinator testing
export const MOCK_STUDENTS = [
  { id: 'student-1', fullName: 'Александр Иванов', className: '8А класс' },
  { id: 'student-2', fullName: 'София Иванова', className: '5Б класс' },
  { id: 'student-3', fullName: 'Максим Смирнов', className: '9В класс' },
];

export function useEnrollment() {
  const { user } = useContext(AuthContext) || {};

  const [isOpen, setIsOpen] = useState(false);
  const [activeActivity, setActiveActivity] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  /**
   * Open the enrollment modal for a selected activity
   */
  const openEnrollment = useCallback(
    (activity) => {
      setActiveActivity(activity);
      setConflictError(null);
      setGeneralError(null);
      setEnrollmentResult(null);

      // Pick default group (prefer one with available spots)
      const groups = activity.groups || [];
      const availableGroup = groups.find(
        (g) => (Number(g.enrolledCount) || 0) < (Number(g.capacity) || 0)
      );
      setSelectedGroupId(availableGroup?.id || groups[0]?.id || '');

      // Pick default student based on current user role
      if (user?.role === 'student') {
        setSelectedStudentId(user.id);
      } else if (user?.role === 'parent') {
        setSelectedStudentId(MOCK_STUDENTS[0].id);
      } else {
        setSelectedStudentId(user?.id || MOCK_STUDENTS[0].id);
      }

      setIsOpen(true);
    },
    [user]
  );

  /**
   * Close modal and reset state
   */
  const closeEnrollment = useCallback(() => {
    setIsOpen(false);
    setActiveActivity(null);
    setEnrollmentResult(null);
    setConflictError(null);
    setGeneralError(null);
  }, []);

  /**
   * Submit enrollment request to Cloud Functions
   */
  const submitEnrollment = useCallback(async () => {
    if (!selectedGroupId || !selectedStudentId) {
      setGeneralError('Пожалуйста, выберите группу и ученика');
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);
    setGeneralError(null);

    try {
      const result = await createEnrollmentCall({
        studentId: selectedStudentId,
        groupId: selectedGroupId,
      });
      setEnrollmentResult(result);
    } catch (err) {
      console.error('Enrollment error:', err);
      // Check if error is a schedule conflict from Cloud Functions
      const msg = err.message || '';
      if (
        msg.includes('Конфликт расписания') ||
        msg.includes('пересекается') ||
        err.code === 'failed-precondition' ||
        err.code === 'functions/failed-precondition'
      ) {
        setConflictError(msg || 'Обнаружено пересечение расписания с уже существующей записью');
      } else {
        setGeneralError(msg || 'Не удалось завершить запись. Попробуйте снова.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedGroupId, selectedStudentId]);

  return {
    isOpen,
    activeActivity,
    selectedGroupId,
    setSelectedGroupId,
    selectedStudentId,
    setSelectedStudentId,
    isSubmitting,
    enrollmentResult,
    conflictError,
    generalError,
    openEnrollment,
    closeEnrollment,
    submitEnrollment,
    userRole: user?.role,
  };
}
