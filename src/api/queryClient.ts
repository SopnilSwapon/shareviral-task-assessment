import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours cache retention
      staleTime: 1000 * 60 * 5, // 5 minutes fresh time
      refetchOnWindowFocus: false, // Handled manually or via focus events in mobile
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'OFFLINE_QUERY_CACHE',
  throttleTime: 1000,
});
