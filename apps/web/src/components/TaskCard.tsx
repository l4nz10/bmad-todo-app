import type { Todo } from '@bmad/shared';

interface TaskCardProps {
  todo: Todo;
  onDelete?: (id: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function formatDate(isoString: string): string {
  return dateFormatter.format(new Date(isoString));
}

export function TaskCard({ todo, onDelete }: TaskCardProps) {
  return (
    <li className="task-card bg-surface rounded-xl shadow-sm p-3 flex items-center gap-3 transition-shadow duration-150 ease-out lg:hover:shadow-md">
      <input
        type="checkbox"
        checked={false}
        disabled
        aria-label={`Mark "${todo.text}" as complete`}
        className="h-5 w-5 shrink-0 rounded border-border accent-accent cursor-not-allowed opacity-60"
      />
      <span className="flex-1 text-[0.9375rem] font-normal text-text-primary min-w-0 break-words">
        {todo.text}
      </span>
      <time
        dateTime={todo.createdAt}
        className="shrink-0 text-xs font-normal text-text-secondary"
      >
        {formatDate(todo.createdAt)}
      </time>
      <button
        type="button"
        onClick={() => onDelete?.(todo.id)}
        aria-label={`Delete "${todo.text}"`}
        className="shrink-0 min-h-12 min-w-12 flex items-center justify-center text-text-muted hover:text-danger transition-colors duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </li>
  );
}
