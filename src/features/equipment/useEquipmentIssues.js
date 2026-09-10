import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import {
  fetchEquipmentIssues,
  createEquipmentIssueRecord,
  updateIssueStatusRecord,
  addIssueCommentRecord,
  fetchIssueComments,
  subscribeEquipmentIssues,
} from './api.js';

/**
 * Custom hook to manage equipment breakdown issues for teacher, technician, and admin
 */
export function useEquipmentIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEquipmentIssues({
        role: user.role,
        userId: user.id,
      });
      setIssues(data);
    } catch (err) {
      console.error('Failed to load equipment issues:', err);
      setError('Не удалось загрузить заявки на ремонт оборудования');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeEquipmentIssues(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Actions
  const handleCreateIssue = useCallback(
    async ({ title, description, location, category, priority, photoUrl }) => {
      if (!user) throw new Error('Требуется авторизация');
      const newIssue = await createEquipmentIssueRecord({
        title,
        description,
        location,
        category,
        priority,
        photoUrl,
        reportedBy: user.id,
        reportedByName: user.fullName || 'Преподаватель',
      });
      return newIssue;
    },
    [user]
  );

  const handleTakeIntoWork = useCallback(
    async (issueId) => {
      if (!user) throw new Error('Требуется авторизация');
      return await updateIssueStatusRecord({
        issueId,
        status: 'in_progress',
        currentUser: user,
      });
    },
    [user]
  );

  const handleResolveIssue = useCallback(
    async (issueId, resolutionComment) => {
      if (!user) throw new Error('Требуется авторизация');
      if (!resolutionComment || resolutionComment.trim().length === 0) {
        throw new Error('Укажите комментарий о решении проблемы');
      }
      return await updateIssueStatusRecord({
        issueId,
        status: 'resolved',
        resolutionComment,
        currentUser: user,
      });
    },
    [user]
  );

  const handleCancelIssue = useCallback(
    async (issueId, resolutionComment = '') => {
      if (!user) throw new Error('Требуется авторизация');
      return await updateIssueStatusRecord({
        issueId,
        status: 'cancelled',
        resolutionComment,
        currentUser: user,
      });
    },
    [user]
  );

  const handleAddComment = useCallback(
    async (issueId, text) => {
      if (!user) throw new Error('Требуется авторизация');
      return await addIssueCommentRecord({
        issueId,
        text,
        currentUser: user,
      });
    },
    [user]
  );

  const handleGetComments = useCallback(async (issueId) => {
    return await fetchIssueComments(issueId);
  }, []);

  // Filtered issues list
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== 'all' && issue.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = issue.title?.toLowerCase().includes(query);
        const matchDesc = issue.description?.toLowerCase().includes(query);
        const matchLoc = issue.location?.toLowerCase().includes(query);
        const matchAuthor = issue.reportedByName?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLoc && !matchAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [issues, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalOpen = issues.filter((i) => i.status === 'new' || i.status === 'in_progress').length;
    const criticalCount = issues.filter((i) => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'cancelled').length;
    const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
    const resolvedIssues = issues.filter((i) => i.status === 'resolved');
    const resolvedCount = resolvedIssues.length;

    let avgHours = 2.4;
    if (resolvedIssues.length > 0) {
      const totalHours = resolvedIssues.reduce((acc, curr) => {
        if (curr.resolvedAt && curr.createdAt) {
          const diffMs = new Date(curr.resolvedAt) - new Date(curr.createdAt);
          const hours = Math.max(0.5, diffMs / (1000 * 60 * 60));
          return acc + hours;
        }
        return acc + 3;
      }, 0);
      avgHours = (totalHours / resolvedIssues.length).toFixed(1);
    }

    return {
      totalOpen,
      criticalCount,
      inProgressCount,
      resolvedCount,
      avgResolutionHours: `${avgHours} ч.`,
    };
  }, [issues]);

  const resetFilters = useCallback(() => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  }, []);

  return {
    issues: filteredIssues,
    allIssues: issues,
    loading,
    error,
    stats,
    filters: {
      status: statusFilter,
      priority: priorityFilter,
      category: categoryFilter,
      search: searchQuery,
    },
    setStatusFilter,
    setPriorityFilter,
    setCategoryFilter,
    setSearchQuery,
    resetFilters,
    createIssue: handleCreateIssue,
    takeIntoWork: handleTakeIntoWork,
    resolveIssue: handleResolveIssue,
    cancelIssue: handleCancelIssue,
    addComment: handleAddComment,
    getComments: handleGetComments,
    reload: loadData,
  };
}
