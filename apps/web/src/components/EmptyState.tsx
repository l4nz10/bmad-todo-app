export function EmptyState() {
  return (
    <div className="text-center py-12">
      <h2 className="text-[0.9375rem] font-normal text-text-primary">
        No tasks yet
      </h2>
      <p className="text-xs font-normal text-text-muted mt-1">
        Type above to get started
      </p>
    </div>
  );
}
