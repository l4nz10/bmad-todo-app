import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from '../lib/queryKeys.ts';
import { apiPost } from '../lib/apiClient.ts';
import type { Todo, CreateTodoRequest, ApiResponse } from '@bmad/shared';

const DRAFT_STORAGE_KEY = 'bmad_draft';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTodo: CreateTodoRequest) =>
      apiPost<ApiResponse<Todo>>('/todos', newTodo),

    onMutate: async (newTodo: CreateTodoRequest) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });

      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);

      queryClient.setQueryData<Todo[]>(todoKeys.all, (old) => {
        const optimisticTodo: Todo = {
          id: newTodo.id,
          userId: 'default',
          text: newTodo.text,
          completed: false,
          deleted: false,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [optimisticTodo, ...(old ?? [])];
      });

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // localStorage unavailable — ignore
      }

      return { previous };
    },

    onError: (
      _err: Error,
      _newTodo: CreateTodoRequest,
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
