import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useTrashTodos } from '../../src/hooks/useTrashTodos.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

const trashedTodo: Todo = {
  id: 'trash-1',
  userId: 'default',
  text: 'Trashed task',
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
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  queryClient.clear();
});

describe('useTrashTodos', () => {
  it('fetches and returns trashed todos', async () => {
    const response: ApiResponse<Todo[]> = { data: [trashedTodo], meta: { count: 1 } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useTrashTodos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([trashedTodo]);
  });

  it('returns empty array when no trashed items', async () => {
    const response: ApiResponse<Todo[]> = { data: [], meta: { count: 0 } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useTrashTodos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
