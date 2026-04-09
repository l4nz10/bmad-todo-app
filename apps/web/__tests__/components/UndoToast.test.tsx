import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UndoToast } from '../../src/components/UndoToast.tsx';
import type { Todo } from '@bmad/shared';

// jsdom doesn't support pointer capture — stub it for Radix Toast
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

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

describe('UndoToast', () => {
  it('renders toast when deletedTodo is provided', () => {
    render(
      <UndoToast deletedTodo={deletedTodo} onUndo={() => {}} onDismiss={() => {}} />,
    );
    expect(screen.getByText('Task deleted')).toBeInTheDocument();
  });

  it('renders undo button', () => {
    render(
      <UndoToast deletedTodo={deletedTodo} onUndo={() => {}} onDismiss={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('does not render toast when deletedTodo is null', () => {
    render(
      <UndoToast deletedTodo={null} onUndo={() => {}} onDismiss={() => {}} />,
    );
    expect(screen.queryByText('Task deleted')).not.toBeInTheDocument();
  });

  it('calls onUndo when undo button is clicked', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(
      <UndoToast deletedTodo={deletedTodo} onUndo={onUndo} onDismiss={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('has toast viewport for positioning', () => {
    render(
      <UndoToast deletedTodo={deletedTodo} onUndo={() => {}} onDismiss={() => {}} />,
    );
    const viewport = screen.getByRole('region');
    expect(viewport).toBeInTheDocument();
  });
});
