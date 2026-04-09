import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../../src/components/TaskCard.tsx';
import type { Todo } from '@bmad/shared';

const mockTodo: Todo = {
  id: 'test-uuid-1234',
  userId: 'default',
  text: 'Buy groceries',
  completed: false,
  deleted: false,
  deletedAt: null,
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
};

function renderTaskCard(props: { todo?: Todo; onDelete?: (id: string) => void } = {}) {
  return render(
    <ul>
      <TaskCard todo={props.todo ?? mockTodo} onDelete={props.onDelete} />
    </ul>,
  );
}

describe('TaskCard', () => {
  it('renders the task text', () => {
    renderTaskCard();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('renders the formatted timestamp', () => {
    renderTaskCard();
    expect(screen.getByText('Apr 9')).toBeInTheDocument();
  });

  it('renders a time element with dateTime attribute', () => {
    renderTaskCard();
    const timeEl = screen.getByText('Apr 9').closest('time');
    expect(timeEl).toHaveAttribute('datetime', '2026-04-09T10:00:00.000Z');
  });

  it('renders a disabled checkbox', () => {
    renderTaskCard();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
  });

  it('renders a delete button with aria-label', () => {
    renderTaskCard();
    const deleteBtn = screen.getByRole('button', { name: 'Delete "Buy groceries"' });
    expect(deleteBtn).toBeInTheDocument();
  });

  it('calls onDelete with todo id when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderTaskCard({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Delete "Buy groceries"' }));
    expect(onDelete).toHaveBeenCalledWith('test-uuid-1234');
  });

  it('renders as a list item element', () => {
    renderTaskCard();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThanOrEqual(1);
  });

  it('applies card styling classes', () => {
    renderTaskCard();
    const li = screen.getByRole('listitem');
    expect(li.className).toContain('bg-surface');
    expect(li.className).toContain('rounded-xl');
    expect(li.className).toContain('shadow-sm');
  });

  it('has hover shadow class for desktop', () => {
    renderTaskCard();
    const li = screen.getByRole('listitem');
    expect(li.className).toContain('lg:hover:shadow-md');
  });

  it('delete button has minimum touch target size', () => {
    renderTaskCard();
    const deleteBtn = screen.getByRole('button', { name: 'Delete "Buy groceries"' });
    expect(deleteBtn.className).toContain('min-h-12');
    expect(deleteBtn.className).toContain('min-w-12');
  });

  it('renders task-card class for animation', () => {
    renderTaskCard();
    const li = screen.getByRole('listitem');
    expect(li.className).toContain('task-card');
  });
});
