import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from '../lib/queryKeys.ts';
import { apiPatch } from '../lib/apiClient.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiPatch<ApiResponse<Todo>>(`/todos/${id}`, { completed }),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });

      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);

      queryClient.setQueryData<Todo[]>(todoKeys.all, (old) =>
        (old ?? []).map((t) =>
          t.id === id ? { ...t, completed, updatedAt: new Date().toISOString() } : t
        )
      );

      return { previous };
    },

    onError: (
      _err: Error,
      _vars: { id: string; completed: boolean },
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
