import { useState, useEffect, useCallback } from 'react';
import {
  subscribeCoordinatorOverview,
  updateGroupCapacity,
  createActivityGroup,
  createActivityRecord,
  deleteActivityGroupRecord,
  deleteActivityRecord,
  deleteBatchGroupsRecord,
} from './api.js';

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

  // Create Activity Modal State
  const [createActivityModalOpen, setCreateActivityModalOpen] = useState(false);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  const openCreateActivity = useCallback(() => {
    setCreateActivityModalOpen(true);
  }, []);

  const closeCreateActivity = useCallback(() => {
    if (isCreatingActivity) return;
    setCreateActivityModalOpen(false);
  }, [isCreatingActivity]);

  // Multi-Selection State
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const toggleSelectGroup = useCallback((groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const selectAllGroups = useCallback(() => {
    setSelectedGroupIds(groups.map((g) => g.id));
  }, [groups]);

  const clearSelection = useCallback(() => {
    setSelectedGroupIds([]);
  }, []);

  const isGroupSelected = useCallback(
    (groupId) => selectedGroupIds.includes(groupId),
    [selectedGroupIds]
  );

  // Deletion Modal and Action State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const promptDeleteGroup = useCallback((group) => {
    setDeleteTarget({
      type: 'single',
      groupId: group.id,
      activityId: group.activityId,
      title: `${group.activityTitle} (${group.name})`,
    });
    setDeleteModalOpen(true);
  }, []);

  const promptDeleteActivity = useCallback((activity) => {
    setDeleteTarget({
      type: 'activity',
      activityId: activity.id,
      title: activity.title,
    });
    setDeleteModalOpen(true);
  }, []);

  const promptDeleteBatch = useCallback(() => {
    if (selectedGroupIds.length === 0) return;
    setDeleteTarget({
      type: 'batch',
      groupIds: [...selectedGroupIds],
      count: selectedGroupIds.length,
      title: `выбранные секции (${selectedGroupIds.length} шт.)`,
    });
    setDeleteModalOpen(true);
  }, [selectedGroupIds]);

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    try {
      if (deleteTarget.type === 'single') {
        await deleteActivityGroupRecord(deleteTarget.groupId, deleteTarget.activityId);
        setSelectedGroupIds((prev) => prev.filter((id) => id !== deleteTarget.groupId));
        setActionSuccess(`Группа «${deleteTarget.title}» удалена из базы данных`);
      } else if (deleteTarget.type === 'activity') {
        await deleteActivityRecord(deleteTarget.activityId);
        setActionSuccess(`Кружок «${deleteTarget.title}» удален из базы данных`);
      } else if (deleteTarget.type === 'batch') {
        await deleteBatchGroupsRecord(deleteTarget.groupIds);
        setSelectedGroupIds([]);
        setActionSuccess(`Удалено из базы данных: ${deleteTarget.count} групп`);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.message || 'Ошибка удаления из базы данных');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const saveNewActivity = useCallback(async (activityData, initialGroupData) => {
    setIsCreatingActivity(true);
    try {
      const res = await createActivityRecord(activityData);
      if (initialGroupData && res.activity?.id) {
        await createActivityGroup({
          ...initialGroupData,
          activityId: res.activity.id,
        });
      }
      setActionSuccess('Новый кружок успешно создан и опубликован!');
      setCreateActivityModalOpen(false);
    } catch (err) {
      console.error('Failed to create activity:', err);
      setError(err.message || 'Ошибка создания кружка');
    } finally {
      setIsCreatingActivity(false);
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
    // Create Activity Modal
    createActivityModalOpen,
    isCreatingActivity,
    openCreateActivity,
    closeCreateActivity,
    saveNewActivity,
    // Multi-Selection
    selectedGroupIds,
    toggleSelectGroup,
    selectAllGroups,
    clearSelection,
    isGroupSelected,
    // Deletion
    deleteModalOpen,
    deleteTarget,
    isDeleting,
    promptDeleteGroup,
    promptDeleteActivity,
    promptDeleteBatch,
    closeDeleteModal,
    confirmDelete,
  };
}
