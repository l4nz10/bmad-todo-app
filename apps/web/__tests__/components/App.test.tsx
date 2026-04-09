import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../../src/App.tsx';
import type { Todo, ApiResponse } from '@bmad/shared';

const mockTodos: Todo[] = [
  {
    id: 'uuid-1',
    userId: 'default',
    text: 'First task',
    completed: false,
    deleted: false,
    deletedAt: null,
    createdAt: '2026-04-09T10:00:00.000Z',
    updatedAt: '2026-04-09T10:00:00.000Z',
  },
  {
    id: 'uuid-2',
    userId: 'default',
    text: 'Second task',
    completed: false,
    deleted: false,
    deletedAt: null,
    createdAt: '2026-04-09T11:00:00.000Z',
    updatedAt: '2026-04-09T11:00:00.000Z',
  },
];

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return { queryClient, ...render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  ) };
}

function mockFetchWithTodos(todos: Todo[]) {
  const response: ApiResponse<Todo[]> = { data: todos, meta: { count: todos.length } };
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the app title', () => {
    mockFetchWithTodos([]);
    renderWithProviders();
    expect(screen.getByRole('heading', { level: 1, name: 'bmad' })).toBeInTheDocument();
  });

  it('renders the InputCard with placeholder', () => {
    mockFetchWithTodos([]);
    renderWithProviders();
    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
  });

  it('uses a main element for semantic structure', () => {
    mockFetchWithTodos([]);
    renderWithProviders();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no todos are loaded', () => {
    mockFetchWithTodos([]);
    renderWithProviders();
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('applies responsive container classes', () => {
    mockFetchWithTodos([]);
    const { container } = renderWithProviders();
    const main = container.querySelector('main');
    expect(main?.className).toContain('sm:max-w-[640px]');
    expect(main?.className).toContain('sm:mx-auto');
  });

  it('renders active todos as TaskCards when data loads', async () => {
    mockFetchWithTodos(mockTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('renders the Active section header when todos exist', async () => {
    mockFetchWithTodos(mockTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /active/i })).toBeInTheDocument();
    });
  });

  it('hides empty state when todos exist', async () => {
    mockFetchWithTodos(mockTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument();
  });

  it('renders task list as a semantic ul element', async () => {
    mockFetchWithTodos(mockTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('creates a new task when user types and presses Enter', async () => {
    const user = userEvent.setup();
    const createdTodos: Todo[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as { id: string; text: string };
        const newTodo: Todo = {
          id: body.id,
          userId: 'default',
          text: body.text,
          completed: false,
          deleted: false,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        createdTodos.push(newTodo);
        return new Response(JSON.stringify({ data: newTodo }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // GET request — return all created todos so refetch works
      const response: ApiResponse<Todo[]> = { data: [...createdTodos], meta: { count: createdTodos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    const input = screen.getByPlaceholderText('Add a task...');
    await user.type(input, 'My new task');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('My new task')).toBeInTheDocument();
    });

    expect(input).toHaveValue('');
  });
});
