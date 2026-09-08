import { useState, useEffect, useCallback } from 'react';
import { fetchAttendanceByEnrollment, markAttendance } from './api.js';

export function useAttendance(enrollmentId) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(Boolean(enrollmentId));
  const [error, setError] = useState(null);

  const loadAttendance = useCallback(async () => {
    if (!enrollmentId) return;
    try {
      setLoading(true);
      const data = await fetchAttendanceByEnrollment(enrollmentId);
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const recordAttendance = async (data) => {
    const newRecord = await markAttendance({ enrollmentId, ...data });
    setRecords((prev) => [...prev, newRecord]);
    return newRecord;
  };

  return { records, loading, error, recordAttendance, refresh: loadAttendance };
}
