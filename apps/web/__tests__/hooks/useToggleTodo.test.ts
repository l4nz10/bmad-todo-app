import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useToggleTodo } from '../../src/hooks/useToggleTodo.ts';
import { todoKeys } from '../../src/lib/queryKeys.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

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

describe('useToggleTodo', () => {
  it('optimistically toggles a todo to completed in the cache', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo, completedTodo]);

    const toggledTodo: Todo = { ...activeTodo, completed: true, updatedAt: '2026-04-09T12:00:00.000Z' };
    mockFetchResponse(200, { data: toggledTodo });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1', completed: true });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
      expect(cached).toBeDefined();
      expect(cached!.some((t) => t.id === 'todo-1' && t.completed === true)).toBe(true);
    });
  });

  it('optimistically toggles a todo back to active in the cache', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo, completedTodo]);

    const reactivatedTodo: Todo = { ...completedTodo, completed: false, updatedAt: '2026-04-09T12:00:00.000Z' };
    mockFetchResponse(200, { data: reactivatedTodo });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-2', completed: false });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
      expect(cached).toBeDefined();
      expect(cached!.some((t) => t.id === 'todo-2' && t.completed === false)).toBe(true);
    });
  });

  it('rolls back the cache on mutation error', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo]);

    mockFetchResponse(500, { error: 'Server error', statusCode: 500 });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1', completed: true });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
    if (cached) {
      expect(cached.some((t) => t.id === 'todo-1' && t.completed === false)).toBe(true);
    }
  });

  it('calls the API with correct payload', async () => {
    queryClient.setQueryData(todoKeys.all, [activeTodo]);

    const toggledTodo: Todo = { ...activeTodo, completed: true, updatedAt: '2026-04-09T12:00:00.000Z' };
    const fetchSpy = mockFetchResponse(200, { data: toggledTodo });

    const { result } = renderHook(() => useToggleTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'todo-1', completed: true });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/todos/todo-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
  });
});
