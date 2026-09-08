import { useState, useEffect, useMemo } from 'react';
import { subscribeCatalog } from './api.js';

/**
 * Filter matcher for grade and age groups
 */
function matchesAgeFilter(activityAgeGroup, filterValue) {
  if (!filterValue || filterValue === 'all') return true;
  const str = String(activityAgeGroup || '').toLowerCase();
  if (filterValue === '1-4') {
    return (
      str.includes('1–4') ||
      str.includes('1-4') ||
      str.includes('1–10') ||
      str.includes('1–11') ||
      str.includes('7') ||
      str.includes('8')
    );
  }
  if (filterValue === '5-8') {
    return (
      str.includes('5–8') ||
      str.includes('5-8') ||
      str.includes('5–10') ||
      str.includes('6–11') ||
      str.includes('10') ||
      str.includes('11') ||
      str.includes('12') ||
      str.includes('13') ||
      str.includes('14')
    );
  }
  if (filterValue === '9-11') {
    return (
      str.includes('9–11') ||
      str.includes('9-11') ||
      str.includes('6–11') ||
      str.includes('7–11') ||
      str.includes('1–11') ||
      str.includes('15') ||
      str.includes('16') ||
      str.includes('17')
    );
  }
  return true;
}

/**
 * Filter matcher for day of week
 */
function matchesDayFilter(groups, dayValue) {
  if (!dayValue || dayValue === 'all') return true;
  const targetDay = Number(dayValue);
  return (groups || []).some((g) => (g.daysOfWeek || []).includes(targetDay));
}

export function useCatalog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dayOfWeek, setDayOfWeek] = useState('all');
  const [ageGroup, setAgeGroup] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // 250ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Subscribe to real-time catalog changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCatalog(
      (data) => {
        setActivities(data);
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

  // Compute unique categories
  const categories = useMemo(() => {
    const set = new Set();
    activities.forEach((act) => {
      if (act.category) set.add(act.category);
    });
    return Array.from(set);
  }, [activities]);

  // Filter activities across all active criteria
  const filteredActivities = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return activities.filter((act) => {
      // 1. Search by title or description
      if (query) {
        const titleMatch = (act.title || '').toLowerCase().includes(query);
        const descMatch = (act.description || '').toLowerCase().includes(query);
        const teacherMatch = (act.teacherName || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !teacherMatch) return false;
      }

      // 2. Category
      if (category !== 'all' && act.category !== category) {
        return false;
      }

      // 3. Day of week
      if (!matchesDayFilter(act.groups, dayOfWeek)) {
        return false;
      }

      // 4. Age / grade
      if (!matchesAgeFilter(act.ageGroup, ageGroup)) {
        return false;
      }

      // 5. Only available spots
      if (onlyAvailable && act.remainingSpots <= 0) {
        return false;
      }

      return true;
    });
  }, [activities, debouncedSearch, category, dayOfWeek, ageGroup, onlyAvailable]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    category !== 'all' ||
    dayOfWeek !== 'all' ||
    ageGroup !== 'all' ||
    onlyAvailable;

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCategory('all');
    setDayOfWeek('all');
    setAgeGroup('all');
    setOnlyAvailable(false);
  };

  return {
    activities,
    filteredActivities,
    categories,
    loading,
    error,
    // Filters
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    dayOfWeek,
    setDayOfWeek,
    ageGroup,
    setAgeGroup,
    onlyAvailable,
    setOnlyAvailable,
    hasActiveFilters,
    resetFilters,
  };
}
