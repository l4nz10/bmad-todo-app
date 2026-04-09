import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useDeleteTodo } from '../../src/hooks/useDeleteTodo.ts';
import { todoKeys } from '../../src/lib/queryKeys.ts';
import type { Todo } from '@bmad/shared';

const activeTodo: Todo = {
  id: 'todo-1',
  userId: 'default',
  text: 'Active task',
  completed: false,
  deleted: false,
  deletedAt: null,
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
};

const completedTodo: Todo = {
  id: 'todo-2',
  userId: 'default',
  text: 'Completed task',
  completed: true,
  deleted: false,
  deletedAt: null,
  createdAt: '2026-04-09T09:00:00.000Z',
  updatedAt: '2026-04-09T11:00:00.000Z',
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

describe('useDeleteTodo', () => {
  it('optimistically removes a todo from the cache', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo, completedTodo]);

    const deletedTodo: Todo = { ...activeTodo, deleted: true, deletedAt: '2026-04-09T12:00:00.000Z' };
    mockFetchResponse(200, { data: deletedTodo });

    const { result } = renderHook(() => useDeleteTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1' });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
      expect(cached).toBeDefined();
      expect(cached!.some((t) => t.id === 'todo-1')).toBe(false);
      expect(cached!.some((t) => t.id === 'todo-2')).toBe(true);
    });
  });

  it('optimistically removes a completed todo from the cache', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo, completedTodo]);

    const deletedTodo: Todo = { ...completedTodo, deleted: true, deletedAt: '2026-04-09T12:00:00.000Z' };
    mockFetchResponse(200, { data: deletedTodo });

    const { result } = renderHook(() => useDeleteTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-2' });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
      expect(cached).toBeDefined();
      expect(cached!.some((t) => t.id === 'todo-2')).toBe(false);
      expect(cached!.some((t) => t.id === 'todo-1')).toBe(true);
    });
  });

  it('rolls back the cache on mutation error', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo, completedTodo]);

    mockFetchResponse(500, { error: 'Server error', statusCode: 500 });

    const { result } = renderHook(() => useDeleteTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
    expect(cached).toBeDefined();
    expect(cached!.some((t) => t.id === 'todo-1')).toBe(true);
    expect(cached!).toHaveLength(2);
  });

  it('calls the API with correct method and URL', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo]);

    const deletedTodo: Todo = { ...activeTodo, deleted: true, deletedAt: '2026-04-09T12:00:00.000Z' };
    const fetchSpy = mockFetchResponse(200, { data: deletedTodo });

    const { result } = renderHook(() => useDeleteTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/todos/todo-1', {
      method: 'DELETE',
    });
  });
});
