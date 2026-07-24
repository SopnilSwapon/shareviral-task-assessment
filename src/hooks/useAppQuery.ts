import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import Fetch from '../utils/fetch';

interface UseAppQueryOptions<TQueryFnData, TError, TData>
  extends Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey' | 'queryFn'> {
  queryKey: unknown[];
  url: string;
}

export function useAppQuery<TQueryFnData, TError = unknown, TData = TQueryFnData>({
  queryKey,
  url,
  enabled,
  ...options
}: UseAppQueryOptions<TQueryFnData, TError, TData>) {
  return useQuery({
    queryKey,
    queryFn: () =>
      Fetch<TQueryFnData>({
        method: 'GET',
        url,
      }).then((res) => res.data),
    enabled,
    ...options,
  } as any) as UseQueryResult<TData, TError>;
}
