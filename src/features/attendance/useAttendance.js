import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  fetchTeacherGroups,
  fetchGroupStudents,
  fetchAttendanceMap,
  saveAttendanceBatch,
} from './api.js';

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useAttendance(initialGroupId, initialDate) {
  const { user } = useAuth();
  const teacherId = user?.id || 'teacher-1';

  const [teacherGroups, setTeacherGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayString());
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Auto-dismiss save notification after 2.5s
  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => setSaveSuccess(false), 2500);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  // 1. Load teacher groups on mount or when teacherId changes
  useEffect(() => {
    let isMounted = true;
    async function loadGroups() {
      try {
        setLoading(true);
        const groups = await fetchTeacherGroups(teacherId);
        if (isMounted) {
          setTeacherGroups(groups);
          setSelectedGroupId((prev) => prev || groups[0]?.id || '');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGroups();
    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  // 2. Load group students and existing attendance when selectedGroupId or selectedDate changes
  useEffect(() => {
    if (!selectedGroupId) return;

    let isMounted = true;
    async function loadStudentsAndAttendance() {
      try {
        setLoading(true);
        setError(null);

        const [studentsList, existingMap] = await Promise.all([
          fetchGroupStudents(selectedGroupId),
          fetchAttendanceMap(selectedGroupId, selectedDate),
        ]);

        if (isMounted) {
          setStudents(studentsList);

          // Fill initial map: use existing status, or default to 'present'
          const initialMap = {};
          studentsList.forEach((st) => {
            initialMap[st.id] = existingMap[st.id] || 'present';
          });
          setAttendanceMap(initialMap);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudentsAndAttendance();

    return () => {
      isMounted = false;
    };
  }, [selectedGroupId, selectedDate]);

  // Set status for a specific student
  const setStatus = useCallback((studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  }, []);

  // Mark all students in the group with the given status
  const markAll = useCallback((status = 'present') => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = status;
      });
      return next;
    });
  }, []);

  // Save attendance batch
  const saveAttendance = useCallback(async () => {
    if (!selectedGroupId || !selectedDate) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await saveAttendanceBatch({
        groupId: selectedGroupId,
        date: selectedDate,
        attendanceMap,
        teacherId,
      });
      setSaveSuccess(true);
    } catch (err) {
      console.error('Save attendance failed:', err);
      setError(err.message || 'Не удалось сохранить посещаемость');
    } finally {
      setIsSaving(false);
    }
  }, [selectedGroupId, selectedDate, attendanceMap, teacherId]);

  return {
    teacherGroups,
    selectedGroupId,
    setSelectedGroupId,
    selectedDate,
    setSelectedDate,
    students,
    attendanceMap,
    setStatus,
    markAll,
    saveAttendance,
    loading,
    isSaving,
    saveSuccess,
    error,
  };
}
