function SkeletonCard() {
  return (
    <li
      data-testid="skeleton-card"
      className="bg-surface rounded-xl shadow-sm p-3 flex items-center gap-3"
    >
      <div className="h-5 w-5 shrink-0 rounded bg-gray-200 animate-pulse" />
      <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
      <div className="shrink-0 w-12 h-3 bg-gray-200 rounded animate-pulse" />
    </li>
  );
}

export function LoadingState() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading tasks...</span>
      <ul className="flex flex-col gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ul>
    </div>
  );
}
