import { useState, useEffect, useCallback } from 'react';
import { InputCard } from './components/InputCard.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { SectionHeader } from './components/SectionHeader.tsx';
import { useTodos } from './hooks/useTodos.ts';
import { useCreateTodo } from './hooks/useCreateTodo.ts';
import { useToggleTodo } from './hooks/useToggleTodo.ts';

export function App() {
  const { data: todos } = useTodos();
  const createTodo = useCreateTodo();
  const toggleTodo = useToggleTodo();
  const [announcement, setAnnouncement] = useState({ text: '', key: 0 });

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
          {activeTodos.length > 0 && (
            <section>
              <SectionHeader label="Active" />
              <ul className="flex flex-col gap-4 mt-2">
                {activeTodos.map((todo) => (
                  <TaskCard key={todo.id} todo={todo} onToggle={handleToggleTodo} />
                ))}
              </ul>
            </section>
          )}
          {completedTodos.length > 0 && (
            <section>
              <SectionHeader label="Completed" />
              <ul className="flex flex-col gap-4 mt-2">
                {completedTodos.map((todo) => (
                  <TaskCard key={todo.id} todo={todo} onToggle={handleToggleTodo} />
                ))}
              </ul>
            </section>
          )}
          {isEmpty && <EmptyState />}
        </div>
        <div role="status" aria-live="polite" className="sr-only">
          {announcement.text}
        </div>
      </main>
    </div>
  );
}
