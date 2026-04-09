import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashDialog } from '../../src/components/TrashDialog.tsx';
import type { Todo } from '@bmad/shared';

// jsdom doesn't support pointer capture — stub for Radix Dialog
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

const now = new Date();
const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

const trashedTodos: Todo[] = [
  {
    id: 'trash-1',
    userId: 'default',
    text: 'Recently deleted task',
    completed: false,
    deleted: true,
    deletedAt: oneDayAgo,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: oneDayAgo,
  },
  {
    id: 'trash-2',
    userId: 'default',
    text: 'Older deleted task',
    completed: true,
    deleted: true,
    deletedAt: fiveDaysAgo,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: fiveDaysAgo,
  },
];

describe('TrashDialog', () => {
  it('renders trashed items when open', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    expect(screen.getByText('Recently deleted task')).toBeInTheDocument();
    expect(screen.getByText('Older deleted task')).toBeInTheDocument();
  });

  it('renders dialog title "Trash"', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    expect(screen.getByText('Trash')).toBeInTheDocument();
  });

  it('calls onRestore when restore button is clicked', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={onRestore} />,
    );

    await user.click(screen.getByRole('button', { name: /restore "Recently deleted task"/i }));
    expect(onRestore).toHaveBeenCalledWith('trash-1');
  });

  it('shows days remaining for each item', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    expect(screen.getByText(/6 days left/)).toBeInTheDocument();
    expect(screen.getByText(/2 days left/)).toBeInTheDocument();
  });

  it('shows empty state when no trashed items', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={[]} onRestore={() => {}} />,
    );
    expect(screen.getByText('No items in trash')).toBeInTheDocument();
  });

  it('has close button', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TrashDialog open={false} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    expect(screen.queryByText('Trash')).not.toBeInTheDocument();
  });

  it('has accessible dialog title', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Trash').tagName).toBe('H2');
  });

  it('has accessible restore button labels', () => {
    render(
      <TrashDialog open={true} onOpenChange={() => {}} trashedTodos={trashedTodos} onRestore={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /restore "Recently deleted task"/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore "Older deleted task"/i })).toBeInTheDocument();
  });
});
