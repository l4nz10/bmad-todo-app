import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../../src/App.tsx';
import type { Todo, ApiResponse } from '@bmad/shared';

// jsdom doesn't support pointer capture — stub for Radix Toast
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

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

const mixedTodos: Todo[] = [
  ...mockTodos,
  {
    id: 'uuid-3',
    userId: 'default',
    text: 'Done task',
    completed: true,
    deleted: false,
    deletedAt: null,
    createdAt: '2026-04-09T08:00:00.000Z',
    updatedAt: '2026-04-09T12:00:00.000Z',
  },
];

const onlyCompletedTodos: Todo[] = [
  {
    id: 'uuid-4',
    userId: 'default',
    text: 'Only completed',
    completed: true,
    deleted: false,
    deletedAt: null,
    createdAt: '2026-04-09T08:00:00.000Z',
    updatedAt: '2026-04-09T12:00:00.000Z',
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

function mockFetchWithTodos(todos: Todo[], trashedTodos: Todo[] = []) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : '';
    if (url.includes('/api/trash')) {
      const response: ApiResponse<Todo[]> = { data: trashedTodos, meta: { count: trashedTodos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const response: ApiResponse<Todo[]> = { data: todos, meta: { count: todos.length } };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
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

  it('shows empty state when no todos are loaded', async () => {
    mockFetchWithTodos([]);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
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

    const lists = screen.getAllByRole('list');
    expect(lists[0].tagName).toBe('UL');
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

  it('renders completed section when completed todos exist', async () => {
    mockFetchWithTodos(mixedTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Done task')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 2, name: /completed/i })).toBeInTheDocument();
  });

  it('does not render completed section when no completed todos exist', async () => {
    mockFetchWithTodos(mockTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { level: 2, name: /completed/i })).not.toBeInTheDocument();
  });

  it('renders both Active and Completed section headers with mixed todos', async () => {
    mockFetchWithTodos(mixedTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /active/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 2, name: /completed/i })).toBeInTheDocument();
  });

  it('shows empty state only when no tasks at all exist', async () => {
    mockFetchWithTodos(onlyCompletedTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Only completed')).toBeInTheDocument();
    });

    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument();
  });

  it('toggles a task from active to completed when checkbox is clicked', async () => {
    const user = userEvent.setup();
    let todos = [...mockTodos];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const url = typeof _input === 'string' ? _input : '';
      if (init?.method === 'PATCH') {
        const body = JSON.parse(init.body as string) as { completed: boolean };
        const id = url.split('/').pop()!;
        todos = todos.map((t) => t.id === id ? { ...t, completed: body.completed, updatedAt: new Date().toISOString() } : t);
        const updated = todos.find((t) => t.id === id)!;
        return new Response(JSON.stringify({ data: updated }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /completed/i })).toBeInTheDocument();
    });
  });

  it('removes a task when delete button is clicked', async () => {
    const user = userEvent.setup();
    let todos = [...mockTodos];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const url = typeof _input === 'string' ? _input : '';
      if (init?.method === 'DELETE') {
        const id = url.split('/').pop()!;
        const deleted = todos.find((t) => t.id === id)!;
        todos = todos.filter((t) => t.id !== id);
        return new Response(JSON.stringify({ data: { ...deleted, deleted: true, deletedAt: new Date().toISOString() } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete "First task"/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('First task')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('shows empty state after deleting the last task', async () => {
    const user = userEvent.setup();
    const singleTodo: Todo[] = [{
      id: 'uuid-solo',
      userId: 'default',
      text: 'Only task',
      completed: false,
      deleted: false,
      deletedAt: null,
      createdAt: '2026-04-09T10:00:00.000Z',
      updatedAt: '2026-04-09T10:00:00.000Z',
    }];
    let todos = [...singleTodo];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') {
        const deleted = { ...todos[0], deleted: true, deletedAt: new Date().toISOString() };
        todos = [];
        return new Response(JSON.stringify({ data: deleted }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Only task')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete "Only task"/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Only task')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('announces error when delete fails', async () => {
    const user = userEvent.setup();
    let todos = [...mockTodos];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') {
        return new Response(JSON.stringify({ error: 'Server error', statusCode: 500 }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete "First task"/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Action failed. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByText('First task')).toBeInTheDocument();
  });

  it('shows loading state while initial fetch is pending', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders();

    const loadingRegion = container.querySelector('[aria-busy="true"]');
    expect(loadingRegion).toBeInTheDocument();
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('shows InputCard during loading state', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    renderWithProviders();

    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load your tasks");
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows InputCard during error state', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
  });

  it('replaces error state with task list after successful retry', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount <= 1) {
        return new Response(JSON.stringify({ error: 'Server error', statusCode: 500 }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...mockTodos], meta: { count: mockTodos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces "Tasks loaded" via aria-live after successful fetch', async () => {
    mockFetchWithTodos(mockTodos);
    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    const liveRegion = container.querySelector('[aria-live="polite"][role="status"]');
    expect(liveRegion).toHaveTextContent('Tasks loaded');
  });

  it('announces error via aria-live after failed fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const liveRegion = container.querySelector('[aria-live="polite"][role="status"]');
    expect(liveRegion).toHaveTextContent("Couldn't load your tasks");
  });

  it('re-shows error state when retry also fails', async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Server error', statusCode: 500 }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your tasks");
  });

  it('has an aria-live region for screen reader announcements', async () => {
    mockFetchWithTodos(mockTodos);
    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    const liveRegion = container.querySelector('[aria-live="polite"][role="status"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('shows undo toast after deleting a task', async () => {
    const user = userEvent.setup();
    let todos = [...mockTodos];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') {
        const url = typeof _input === 'string' ? _input : '';
        const id = url.split('/').pop()!;
        const deleted = todos.find((t) => t.id === id)!;
        todos = todos.filter((t) => t.id !== id);
        return new Response(JSON.stringify({ data: { ...deleted, deleted: true, deletedAt: new Date().toISOString() } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete "First task"/i }));

    await waitFor(() => {
      expect(screen.getByText('Task deleted')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('restores task when undo is clicked', async () => {
    const user = userEvent.setup();
    const originalTodos = [...mockTodos];
    let todos = [...mockTodos];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const url = typeof _input === 'string' ? _input : '';
      if (init?.method === 'DELETE') {
        const id = url.split('/').pop()!;
        const deleted = todos.find((t) => t.id === id)!;
        todos = todos.filter((t) => t.id !== id);
        return new Response(JSON.stringify({ data: { ...deleted, deleted: true, deletedAt: new Date().toISOString() } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (init?.method === 'PATCH' && url.includes('/trash/') && url.includes('/restore')) {
        todos = [...originalTodos];
        const id = url.split('/trash/')[1].split('/restore')[0];
        const restored = originalTodos.find((t) => t.id === id)!;
        return new Response(JSON.stringify({ data: restored }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete "First task"/i }));

    await waitFor(() => {
      expect(screen.getByText('Task deleted')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /undo/i }));

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });
  });

  it('announces "Task restored" after undo', async () => {
    const user = userEvent.setup();
    let todos = [...mockTodos];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const url = typeof _input === 'string' ? _input : '';
      if (init?.method === 'DELETE') {
        const id = url.split('/').pop()!;
        const deleted = todos.find((t) => t.id === id)!;
        todos = todos.filter((t) => t.id !== id);
        return new Response(JSON.stringify({ data: { ...deleted, deleted: true, deletedAt: new Date().toISOString() } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (init?.method === 'PATCH' && url.includes('/trash/') && url.includes('/restore')) {
        todos = [...mockTodos];
        const restored = mockTodos[0];
        return new Response(JSON.stringify({ data: restored }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...todos], meta: { count: todos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete "First task"/i }));

    await waitFor(() => {
      expect(screen.getByText('Task deleted')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /undo/i }));

    await waitFor(() => {
      const liveRegion = container.querySelector('[aria-live="polite"][role="status"]');
      expect(liveRegion).toHaveTextContent('Task restored');
    });
  });

  it('shows trash button with count when trashed items exist', async () => {
    const trashedTodos: Todo[] = [{
      id: 'trash-1',
      userId: 'default',
      text: 'Trashed task',
      completed: false,
      deleted: true,
      deletedAt: new Date().toISOString(),
      createdAt: '2026-04-09T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }];

    mockFetchWithTodos(mockTodos, trashedTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trash, 1 item/i })).toBeInTheDocument();
    });
  });

  it('hides trash button when no trashed items', async () => {
    mockFetchWithTodos(mockTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /trash/i })).not.toBeInTheDocument();
  });

  it('opens trash dialog when trash button is clicked', async () => {
    const user = userEvent.setup();
    const trashedTodos: Todo[] = [{
      id: 'trash-1',
      userId: 'default',
      text: 'Trashed task',
      completed: false,
      deleted: true,
      deletedAt: new Date().toISOString(),
      createdAt: '2026-04-09T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }];

    mockFetchWithTodos(mockTodos, trashedTodos);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trash, 1 item/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /trash, 1 item/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Trashed task')).toBeInTheDocument();
    });
  });

  it('restores task from trash dialog', async () => {
    const user = userEvent.setup();
    let trashedTodos: Todo[] = [{
      id: 'trash-1',
      userId: 'default',
      text: 'Trashed task',
      completed: false,
      deleted: true,
      deletedAt: new Date().toISOString(),
      createdAt: '2026-04-09T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : '';
      if (init?.method === 'PATCH' && url.includes('/trash/') && url.includes('/restore')) {
        trashedTodos = [];
        const restored = { ...trashedTodos[0], deleted: false, deletedAt: null };
        return new Response(JSON.stringify({ data: restored }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/api/trash')) {
        const response: ApiResponse<Todo[]> = { data: [...trashedTodos], meta: { count: trashedTodos.length } };
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const response: ApiResponse<Todo[]> = { data: [...mockTodos], meta: { count: mockTodos.length } };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trash, 1 item/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /trash, 1 item/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /restore "Trashed task"/i }));

    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live="polite"][role="status"]');
      expect(liveRegion).toHaveTextContent('Task restored');
    });
  });
});
