import { useState, useEffect, useCallback } from 'react';
import {
  fetchStudentEnrollments,
  requestEnrollment,
  approveEnrollment,
  cancelEnrollment,
} from './api.js';

export function useEnrollment(studentId) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(Boolean(studentId));
  const [error, setError] = useState(null);

  const loadEnrollments = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await fetchStudentEnrollments(studentId);
      setEnrollments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const handleEnroll = async (groupId) => {
    const newEnr = await requestEnrollment({ studentId, groupId });
    setEnrollments((prev) => [...prev, newEnr]);
    return newEnr;
  };

  const handleApprove = async (enrollmentId, parentId) => {
    await approveEnrollment(enrollmentId, parentId);
    await loadEnrollments();
  };

  const handleCancel = async (enrollmentId) => {
    await cancelEnrollment(enrollmentId);
    await loadEnrollments();
  };

  return {
    enrollments,
    loading,
    error,
    refresh: loadEnrollments,
    enroll: handleEnroll,
    approve: handleApprove,
    cancel: handleCancel,
  };
}
