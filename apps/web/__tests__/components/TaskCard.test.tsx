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

const completedTodo: Todo = {
  ...mockTodo,
  completed: true,
  updatedAt: '2026-04-09T12:00:00.000Z',
};

function renderTaskCard(props: { todo?: Todo; onDelete?: (id: string) => void; onToggle?: (id: string) => void } = {}) {
  return render(
    <ul>
      <TaskCard todo={props.todo ?? mockTodo} onDelete={props.onDelete} onToggle={props.onToggle} />
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

  it('renders an enabled unchecked checkbox for active todo', () => {
    renderTaskCard();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeEnabled();
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

  it('renders checked checkbox for completed todo', () => {
    renderTaskCard({ todo: completedTodo });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('applies opacity-60 to completed todo', () => {
    renderTaskCard({ todo: completedTodo });
    const li = screen.getByRole('listitem');
    expect(li.className).toContain('opacity-60');
  });

  it('does not apply opacity-60 to active todo', () => {
    renderTaskCard();
    const li = screen.getByRole('listitem');
    expect(li.className).not.toContain('opacity-60');
  });

  it('applies strikethrough to completed todo text', () => {
    renderTaskCard({ todo: completedTodo });
    const textSpan = screen.getByText('Buy groceries');
    expect(textSpan.className).toContain('line-through');
    expect(textSpan.className).toContain('text-text-secondary');
  });

  it('uses primary text color for active todo', () => {
    renderTaskCard();
    const textSpan = screen.getByText('Buy groceries');
    expect(textSpan.className).toContain('text-text-primary');
    expect(textSpan.className).not.toContain('line-through');
  });

  it('shows "Mark as complete" aria-label for active todo checkbox', () => {
    renderTaskCard();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Mark "Buy groceries" as complete');
  });

  it('shows "Mark as active" aria-label for completed todo checkbox', () => {
    renderTaskCard({ todo: completedTodo });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Mark "Buy groceries" as active');
  });

  it('calls onToggle with todo id when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderTaskCard({ onToggle });

    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('test-uuid-1234');
  });
});
