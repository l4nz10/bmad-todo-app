import * as Toast from '@radix-ui/react-toast';
import type { Todo } from '@bmad/shared';
import { TOAST_DURATION_MS } from '../constants.ts';

interface UndoToastProps {
  deletedTodo: Todo | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ deletedTodo, onUndo, onDismiss }: UndoToastProps) {
  return (
    <Toast.Provider duration={TOAST_DURATION_MS}>
      <Toast.Root
        key={deletedTodo?.id}
        className="undo-toast bg-surface rounded-xl shadow-lg p-4 flex items-center justify-between gap-3"
        open={!!deletedTodo}
        onOpenChange={(open) => {
          if (!open) onDismiss();
        }}
      >
        <Toast.Title className="text-xs text-text-primary">
          Task deleted
        </Toast.Title>
        <Toast.Action altText="Undo deletion" asChild>
          <button
            type="button"
            onClick={onUndo}
            className="min-h-12 px-4 text-sm font-medium text-accent underline hover:text-accent/80 transition-colors duration-150"
          >
            Undo
          </button>
        </Toast.Action>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 left-0 right-0 p-4 md:left-auto md:right-4 md:bottom-4 md:max-w-[420px] z-50" />
    </Toast.Provider>
  );
}
