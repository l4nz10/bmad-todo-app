import * as Dialog from '@radix-ui/react-dialog';
import type { Todo } from '@bmad/shared';
import { TRASH_TTL_DAYS } from '../constants.ts';

interface TrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trashedTodos: Todo[];
  onRestore: (id: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function formatDate(isoString: string): string {
  return dateFormatter.format(new Date(isoString));
}

function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRASH_TTL_DAYS - elapsed);
}

function daysRemainingLabel(deletedAt: string): string {
  const days = daysRemaining(deletedAt);
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function TrashDialog({ open, onOpenChange, trashedTodos, onRestore }: TrashDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl shadow-lg p-6 w-[calc(100%-2rem)] max-w-[480px] max-h-[80vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-semibold text-text-primary mb-4">
            Trash
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 min-h-10 min-w-10 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </Dialog.Close>
          {trashedTodos.length === 0 ? (
            <p className="text-text-secondary text-sm italic">No items in trash</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {trashedTodos.map((todo) => (
                <li key={todo.id} className="bg-bg rounded-xl p-3 flex items-center gap-3">
                  <span className="flex-1 text-[0.9375rem] text-text-primary min-w-0 break-words">
                    {todo.text}
                  </span>
                  <span className="shrink-0 text-xs text-text-secondary">
                    {todo.deletedAt ? formatDate(todo.deletedAt) : ''}
                    {todo.deletedAt ? ` · ${daysRemainingLabel(todo.deletedAt)}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestore(todo.id)}
                    aria-label={`Restore "${todo.text}"`}
                    className="shrink-0 min-h-12 px-4 text-sm font-medium text-accent underline hover:text-accent/80 transition-colors duration-150"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
