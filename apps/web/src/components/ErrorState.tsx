interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="text-center py-12">
      <h2 className="text-[0.9375rem] font-normal text-text-primary">
        Couldn't load your tasks
      </h2>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-12 px-4 text-sm font-medium text-accent underline hover:text-accent/80 transition-colors duration-150"
      >
        Retry
      </button>
    </div>
  );
}
