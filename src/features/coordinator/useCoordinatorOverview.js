import { useState, useEffect, useCallback } from 'react';
import { subscribeCoordinatorOverview, updateGroupCapacity, createActivityGroup } from './api.js';

export function useCoordinatorOverview() {
  const [summary, setSummary] = useState({
    totalActivities: 0,
    totalGroups: 0,
    totalCapacity: 0,
    totalEnrolled: 0,
    occupancyRate: 0,
    fullGroupsCount: 0,
    totalWaitlistCount: 0,
  });
  const [activities, setActivities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Capacity Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create Group Modal State
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Feedback Notification
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => setActionSuccess(null), 2500);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCoordinatorOverview(
      (data) => {
        setSummary(data.summary);
        setActivities(data.activities);
        setGroups(data.groups);
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

  const openEditCapacity = useCallback((group) => {
    setSelectedGroup(group);
    setEditModalOpen(true);
  }, []);

  const closeEditCapacity = useCallback(() => {
    if (isUpdating) return;
    setEditModalOpen(false);
    setSelectedGroup(null);
  }, [isUpdating]);

  const saveCapacity = useCallback(
    async (newCapacity) => {
      if (!selectedGroup) return;
      setIsUpdating(true);
      try {
        await updateGroupCapacity(selectedGroup.id, newCapacity, selectedGroup.enrolledCount);
        // Optimistically update local group capacity
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroup.id
              ? {
                  ...g,
                  capacity: Number(newCapacity),
                  percent:
                    Number(newCapacity) > 0
                      ? Math.round((g.enrolledCount / Number(newCapacity)) * 100)
                      : 0,
                  isFull: (g.enrolledCount || 0) >= Number(newCapacity),
                }
              : g
          )
        );
        setActionSuccess('Лимит мест успешно обновлён!');
        setEditModalOpen(false);
        setSelectedGroup(null);
      } catch (err) {
        console.error('Failed to update capacity:', err);
        setError(err.message || 'Ошибка обновления лимита мест');
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedGroup]
  );

  const openCreateGroup = useCallback((activity) => {
    setSelectedActivity(activity);
    setCreateGroupModalOpen(true);
  }, []);

  const closeCreateGroup = useCallback(() => {
    if (isCreatingGroup) return;
    setCreateGroupModalOpen(false);
    setSelectedActivity(null);
  }, [isCreatingGroup]);

  const saveNewGroup = useCallback(async (groupData) => {
    setIsCreatingGroup(true);
    try {
      await createActivityGroup(groupData);
      setActionSuccess('Новая группа успешно создана!');
      setCreateGroupModalOpen(false);
      setSelectedActivity(null);
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err.message || 'Ошибка создания группы');
    } finally {
      setIsCreatingGroup(false);
    }
  }, []);

  return {
    summary,
    activities,
    groups,
    loading,
    error,
    actionSuccess,
    // Capacity Modal
    editModalOpen,
    selectedGroup,
    isUpdating,
    openEditCapacity,
    closeEditCapacity,
    saveCapacity,
    // Create Group Modal
    createGroupModalOpen,
    selectedActivity,
    isCreatingGroup,
    openCreateGroup,
    closeCreateGroup,
    saveNewGroup,
  };
}
