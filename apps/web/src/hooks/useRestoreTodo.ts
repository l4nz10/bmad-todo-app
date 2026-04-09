import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys, trashKeys } from '../lib/queryKeys.ts';
import { apiPatch } from '../lib/apiClient.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

export function useRestoreTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiPatch<ApiResponse<Todo>>(`/trash/${id}/restore`, {}),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    },
  });
}
