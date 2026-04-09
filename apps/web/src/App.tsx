import { InputCard } from './components/InputCard.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { SectionHeader } from './components/SectionHeader.tsx';
import { useTodos } from './hooks/useTodos.ts';
import { useCreateTodo } from './hooks/useCreateTodo.ts';

export function App() {
  const { data: todos } = useTodos();
  const createTodo = useCreateTodo();

  const activeTodos = todos?.filter((t) => !t.completed) ?? [];

  const handleCreateTodo = (text: string) => {
    createTodo.mutate({
      id: crypto.randomUUID(),
      text,
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <main className="sm:mx-auto sm:max-w-[640px] px-4 py-6 md:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-text-primary mb-6">bmad</h1>
        <div className="flex flex-col gap-4">
          <InputCard onSubmit={handleCreateTodo} disabled={createTodo.isPending} />
          {activeTodos.length > 0 ? (
            <section>
              <SectionHeader label="Active" />
              <ul className="flex flex-col gap-4 mt-2">
                {activeTodos.map((todo) => (
                  <TaskCard key={todo.id} todo={todo} />
                ))}
              </ul>
            </section>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
