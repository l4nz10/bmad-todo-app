import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { InputCard } from './components/InputCard.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { LoadingState } from './components/LoadingState.tsx';
import { ErrorState } from './components/ErrorState.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { SectionHeader } from './components/SectionHeader.tsx';
import { UndoToast } from './components/UndoToast.tsx';
import { TrashButton } from './components/TrashButton.tsx';
import { TrashDialog } from './components/TrashDialog.tsx';
import { useTodos } from './hooks/useTodos.ts';
import { useCreateTodo } from './hooks/useCreateTodo.ts';
import { useToggleTodo } from './hooks/useToggleTodo.ts';
import { useDeleteTodo } from './hooks/useDeleteTodo.ts';
import { useRestoreTodo } from './hooks/useRestoreTodo.ts';
import { useTrashTodos } from './hooks/useTrashTodos.ts';
import type { Todo } from '@bmad/shared';

export function App() {
  const { data: todos, isLoading, isError, refetch } = useTodos();
  const createTodo = useCreateTodo();
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();
  const undoRestore = useRestoreTodo();
  const trashRestore = useRestoreTodo();
  const { data: trashTodos } = useTrashTodos();
  const [announcement, setAnnouncement] = useState({ text: '', key: 0 });
  const [pendingUndo, setPendingUndo] = useState<Todo | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const trashButtonRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement>(null);
  const wasLoadingRef = useRef(false);

  const activeTodos = todos?.filter((t) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t) => t.completed) ?? [];
  const isEmpty = activeTodos.length === 0 && completedTodos.length === 0;

  const handleCreateTodo = (text: string) => {
    createTodo.mutate({
      id: crypto.randomUUID(),
      text,
    });
  };

  const announce = useCallback((text: string) => {
    setAnnouncement((prev) => ({ text, key: prev.key + 1 }));
  }, []);

  const handleToggleTodo = (id: string) => {
    if (toggleTodo.isPending) return;
    const todo = todos?.find((t) => t.id === id);
    if (!todo) return;
    const newCompleted = !todo.completed;
    toggleTodo.mutate(
      { id, completed: newCompleted },
      {
        onSuccess: () => {
          announce(newCompleted ? 'Task completed' : 'Task reactivated');
        },
        onError: () => {
          announce('Action failed. Please try again.');
        },
      },
    );
  };

  const handleDeleteTodo = (id: string) => {
    if (deleteTodo.isPending) return;
    const todoToDelete = todos?.find((t) => t.id === id);
    deleteTodo.mutate(
      { id },
      {
        onSuccess: () => {
          if (todoToDelete) {
            setPendingUndo(todoToDelete);
          }
          announce('Task deleted');
        },
        onError: () => {
          announce('Action failed. Please try again.');
        },
      },
    );
  };

  const handleUndo = () => {
    if (!pendingUndo || undoRestore.isPending) return;
    const todoId = pendingUndo.id;
    undoRestore.mutate(
      { id: todoId },
      {
        onSuccess: () => {
          setPendingUndo(null);
          announce('Task restored');
        },
        onError: () => {
          announce('Action failed. Please try again.');
        },
      },
    );
  };

  const handleToastDismiss = () => {
    setPendingUndo(null);
  };

  const handleTrashRestore = (id: string) => {
    if (trashRestore.isPending) return;
    trashRestore.mutate(
      { id },
      {
        onSuccess: () => {
          announce('Task restored');
        },
        onError: () => {
          announce('Action failed. Please try again.');
        },
      },
    );
  };

  useEffect(() => {
    if (trashOpen && trashTodos && trashTodos.length === 0) {
      setTrashOpen(false);
    }
  }, [trashOpen, trashTodos]);

  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
    } else if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      if (isError) {
        announce("Couldn't load your tasks");
      } else if (todos) {
        announce('Tasks loaded');
      }
    }
  }, [isLoading, isError, todos, announce]);

  useEffect(() => {
    if (!announcement.text) return;
    const timer = setTimeout(() => setAnnouncement({ text: '', key: 0 }), 1000);
    return () => clearTimeout(timer);
  }, [announcement.key]);

  return (
    <div className="min-h-screen bg-bg">
      <main className="sm:mx-auto sm:max-w-[640px] px-4 py-6 md:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-text-primary mb-6">bmad</h1>
        <div className="flex flex-col gap-4">
          <InputCard onSubmit={handleCreateTodo} disabled={createTodo.isPending} />
          {isLoading && <LoadingState />}
          {isError && <ErrorState onRetry={refetch} />}
          {!isLoading && !isError && (
            <>
              {activeTodos.length > 0 && (
                <section>
                  <SectionHeader label="Active" />
                  <ul className="flex flex-col gap-4 mt-2">
                    {activeTodos.map((todo) => (
                      <TaskCard key={todo.id} todo={todo} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} />
                    ))}
                  </ul>
                </section>
              )}
              {completedTodos.length > 0 && (
                <section>
                  <SectionHeader label="Completed" />
                  <ul className="flex flex-col gap-4 mt-2">
                    {completedTodos.map((todo) => (
                      <TaskCard key={todo.id} todo={todo} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} />
                    ))}
                  </ul>
                </section>
              )}
              {isEmpty && <EmptyState />}
            </>
          )}
        </div>
        <div role="status" aria-live="polite" className="sr-only">
          {announcement.text}
        </div>
      </main>
      <div className="sm:mx-auto sm:max-w-[640px] px-4">
        <TrashButton ref={trashButtonRef} count={trashTodos?.length ?? 0} onClick={() => setTrashOpen(true)} />
      </div>
      <TrashDialog open={trashOpen} onOpenChange={(open) => {
        setTrashOpen(open);
        if (!open) {
          requestAnimationFrame(() => trashButtonRef.current?.focus());
        }
      }} trashedTodos={trashTodos ?? []} onRestore={handleTrashRestore} />
      <UndoToast deletedTodo={pendingUndo} onUndo={handleUndo} onDismiss={handleToastDismiss} />
    </div>
  );
}
