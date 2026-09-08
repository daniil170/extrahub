import { useState, useEffect } from 'react';
import { fetchStudentSchedule } from './api.js';

export function useSchedule(studentId) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchStudentSchedule(studentId);
        if (isMounted) setSchedule(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  return { schedule, loading, error };
}
