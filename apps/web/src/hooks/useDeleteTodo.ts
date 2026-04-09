import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from '../lib/queryKeys.ts';
import { apiDelete } from '../lib/apiClient.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiDelete<ApiResponse<Todo>>(`/todos/${id}`),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);

      queryClient.setQueryData<Todo[]>(todoKeys.all, (old) =>
        (old ?? []).filter((t) => t.id !== id)
      );

      return { previous };
    },

    onError: (
      _err: Error,
      _vars: { id: string },
      context: { previous: Todo[] | undefined } | undefined,
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}
