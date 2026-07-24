import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  starredTaskIds: string[];
  toggleStarredTask: (id: string) => void;
  removeStarredTask: (id: string) => void;

  searchQuery: string;
  categoryId: string | null;
  statusFilter: 'all' | 'open' | 'completed';
  sortBy: 'due_date' | 'created_at' | 'title';
  sortOrder: 'asc' | 'desc';

  setSearchQuery: (query: string) => void;
  setCategoryId: (id: string | null) => void;
  setStatusFilter: (filter: 'all' | 'open' | 'completed') => void;
  setSortBy: (sortBy: 'due_date' | 'created_at' | 'title') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  lastSyncTimestamp: number | null;
  setLastSyncTimestamp: (timestamp: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      starredTaskIds: [],
      toggleStarredTask: (id) =>
        set((state) => {
          const isStarred = state.starredTaskIds.includes(id);
          return {
            starredTaskIds: isStarred
              ? state.starredTaskIds.filter((tId) => tId !== id)
              : [...state.starredTaskIds, id],
          };
        }),
      removeStarredTask: (id) =>
        set((state) => ({
          starredTaskIds: state.starredTaskIds.filter((tId) => tId !== id),
        })),

      searchQuery: '',
      categoryId: null,
      statusFilter: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',

      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryId: (id) => set({ categoryId: id }),
      setStatusFilter: (filter) => set({ statusFilter: filter }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),

      isOnline: true,
      setIsOnline: (online) => set({ isOnline: online }),
      lastSyncTimestamp: null,
      setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
    }),
    {
      name: 'task-manager-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        starredTaskIds: state.starredTaskIds,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
    }
  )
);
