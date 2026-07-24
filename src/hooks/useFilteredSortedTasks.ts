import { useMemo } from 'react';
import { TaskWithStarred } from '../types';

/**
 * Custom hook to filter and sort tasks based on search queries, category filters,
 * completion status, and sorting preferences.
 * Separates core business logic from UI components.
 */
export function useFilteredSortedTasks(
  tasks: TaskWithStarred[],
  searchQuery: string,
  categoryId: string | null,
  statusFilter: 'all' | 'open' | 'completed',
  sortBy: 'due_date' | 'created_at' | 'title',
  sortOrder: 'asc' | 'desc'
): TaskWithStarred[] {
  return useMemo(() => {
    if (!tasks) return [];

    // 1. Filter Logic
    let result = tasks;

    // Search query filter (matches title and description case-insensitively)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryId) {
      result = result.filter((task) => task.category_id === categoryId);
    }

    // Completion status filter
    if (statusFilter === 'open') {
      result = result.filter((task) => task.status === 'open');
    } else if (statusFilter === 'completed') {
      result = result.filter((task) => task.status === 'done');
    }

    // 2. Sort Logic
    return [...result].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'due_date') {
        const timeA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const timeB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        comparison = timeA - timeB;
      } else if (sortBy === 'created_at') {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        comparison = timeB - timeA; // default newest first for created_at
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      // Reverse comparison if order is descending
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, searchQuery, categoryId, statusFilter, sortBy, sortOrder]);
}
