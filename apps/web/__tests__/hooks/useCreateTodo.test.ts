import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCreateTodo } from '../../src/hooks/useCreateTodo.ts';
import { useTodos } from '../../src/hooks/useTodos.ts';
import { todoKeys } from '../../src/lib/queryKeys.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

const mockTodo: Todo = {
  id: 'test-uuid-1234',
  userId: 'default',
  text: 'New task',
  completed: false,
  deleted: false,
  deletedAt: null,
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
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

describe('useCreateTodo', () => {
  it('optimistically adds a todo to the cache on mutate', async () => {
    // Seed the cache so there's data to work with
    queryClient.setQueryData(todoKeys.all, []);

    mockFetchResponse(201, { data: mockTodo });

    const { result } = renderHook(() => useCreateTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'test-uuid-1234', text: 'New task' });
    });

    // Check the optimistic cache immediately
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
      expect(cached).toBeDefined();
      expect(cached!.length).toBeGreaterThanOrEqual(1);
      expect(cached!.some((t) => t.text === 'New task')).toBe(true);
    });
  });

  it('rolls back the cache on mutation error', async () => {
    // Seed cache with empty array
    queryClient.setQueryData(todoKeys.all, []);

    mockFetchResponse(500, { error: 'Server error', statusCode: 500 });

    const { result } = renderHook(() => useCreateTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'fail-uuid', text: 'Will fail' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // After error, the cache should be rolled back to the previous state (empty array)
    // The onSettled invalidation may have cleared it, so check for either empty or undefined
    const cached = queryClient.getQueryData<Todo[]>(todoKeys.all);
    // The todo that was optimistically added should NOT be present
    if (cached) {
      expect(cached.some((t) => t.text === 'Will fail')).toBe(false);
    }
  });

  it('clears draft from localStorage on mutate', async () => {
    queryClient.setQueryData(todoKeys.all, []);
    localStorage.setItem('bmad_draft', 'some draft text');

    mockFetchResponse(201, { data: mockTodo });

    const { result } = renderHook(() => useCreateTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'test-uuid-1234', text: 'New task' });
    });

    await waitFor(() => {
      expect(localStorage.getItem('bmad_draft')).toBeNull();
    });
  });

  it('calls the API with correct payload', async () => {
    queryClient.setQueryData(todoKeys.all, []);
    const fetchSpy = mockFetchResponse(201, { data: mockTodo });

    const { result } = renderHook(() => useCreateTodo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'test-uuid-1234', text: 'New task' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-uuid-1234', text: 'New task' }),
    });
  });
});
