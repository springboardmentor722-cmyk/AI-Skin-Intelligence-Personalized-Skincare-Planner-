export function SkeletonLine({ width = "100%" }) {
  return (
    <div
      className="h-3 rounded-pill bg-white/60 animate-pulse"
      style={{ width }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <div className="w-8 h-8 rounded-full bg-white/60 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonLine width="40%" />
        <SkeletonLine width="25%" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass p-4 flex flex-col gap-2">
      <SkeletonLine width="50%" />
      <SkeletonLine width="70%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="flex flex-col divide-y divide-ink-primary/5">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
