import { useQuery } from '@tanstack/react-query';
import type { Todo, ApiResponse } from '@bmad/shared';
import { apiGet } from '../lib/apiClient.ts';
import { trashKeys } from '../lib/queryKeys.ts';

export function useTrashTodos() {
  return useQuery({
    queryKey: trashKeys.all,
    queryFn: async () => {
      const response = await apiGet<ApiResponse<Todo[]>>('/trash');
      return response.data;
    },
  });
}
