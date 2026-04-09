import { useQuery } from '@tanstack/react-query';
import type { Todo, ApiResponse } from '@bmad/shared';
import { apiGet } from '../lib/apiClient.ts';
import { todoKeys } from '../lib/queryKeys.ts';

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: async () => {
      const response = await apiGet<ApiResponse<Todo[]>>('/todos');
      return response.data;
    },
  });
}
