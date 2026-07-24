import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import Fetch, { IResult } from '../utils/fetch';

interface UseAppMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<IResult<TData>, unknown, TVariables>, 'mutationFn'> {
  method: string;
  url: string | ((variables: TVariables) => string);
  silent?: boolean;
  multipart?: boolean;
}

export function useAppMutation<TData, TVariables = void>({
  method,
  url,
  silent = false,
  multipart = false,
  ...options
}: UseAppMutationOptions<TData, TVariables>) {
  return useMutation({
    mutationFn: (variables: TVariables) => {
      const resolvedUrl = typeof url === 'function' ? url(variables) : url;
      // In PostgREST DELETE request: do not send request body
      // For POST/PATCH requests: the variables are passed as the request body
      const body = method === 'DELETE' ? undefined : variables;

      return Fetch<TData>({
        method,
        url: resolvedUrl,
        body,
        multipart,
        silent,
      });
    },
    ...options,
  } as any) as UseMutationResult<IResult<TData>, unknown, TVariables>;
}
