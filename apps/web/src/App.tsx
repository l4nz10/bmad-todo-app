import { InputCard } from './components/InputCard.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { useTodos } from './hooks/useTodos.ts';

export function App() {
  const { data: todos } = useTodos();
  const isEmpty = !todos || todos.length === 0;

  return (
    <div className="min-h-screen bg-bg">
      <main className="sm:mx-auto sm:max-w-[640px] px-4 py-6 md:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-text-primary mb-6">bmad</h1>
        <div className="flex flex-col gap-4">
          <InputCard />
          {isEmpty && <EmptyState />}
        </div>
      </main>
    </div>
  );
}
