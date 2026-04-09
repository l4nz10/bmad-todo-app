import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useRestoreTodo } from '../../src/hooks/useRestoreTodo.ts';
import { todoKeys } from '../../src/lib/queryKeys.ts';
import type { Todo } from '@bmad/shared';

const deletedTodo: Todo = {
  id: 'todo-1',
  userId: 'default',
  text: 'Deleted task',
  completed: false,
  deleted: true,
  deletedAt: '2026-04-09T12:00:00.000Z',
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T12:00:00.000Z',
};

let queryClient: QueryClient;

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  queryClient.clear();
});

function mockFetchResponse(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('useRestoreTodo', () => {
  it('calls the restore API with correct method and URL', async () => {
    const restoredTodo: Todo = { ...deletedTodo, deleted: false, deletedAt: null };
    const fetchSpy = mockFetchResponse(200, { data: restoredTodo });

    const { result } = renderHook(() => useRestoreTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/trash/todo-1/restore', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  });

  it('invalidates todo cache on success', async () => {
    queryClient.setQueryData(todoKeys.all, []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const restoredTodo: Todo = { ...deletedTodo, deleted: false, deletedAt: null };
    mockFetchResponse(200, { data: restoredTodo });

    const { result } = renderHook(() => useRestoreTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: todoKeys.all });
  });

  it('surfaces error on mutation failure', async () => {
    mockFetchResponse(404, { error: 'Todo not found or not deleted', statusCode: 404 });

    const { result } = renderHook(() => useRestoreTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'nonexistent' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Todo not found or not deleted');
  });
});
