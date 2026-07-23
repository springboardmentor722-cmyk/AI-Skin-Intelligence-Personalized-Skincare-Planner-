import { getScoreBand } from "@/lib/score-components";
import { Skeleton } from "@/components/ui/skeleton";

interface ScoreChipProps {
  state?: "ready" | "loading";
  value?: number;
  max?: number;
}

// Small pill used in recent-assessment lists and table cells (UI_SPEC.md §5) —
// value + auto-derived Good/Fair/Poor label + tint, colour never the only signal.
export function ScoreChip({ state = "ready", value, max = 100 }: ScoreChipProps) {
  if (state === "loading" || value == null) return <Skeleton className="h-5 w-16 rounded-full" />;

  const band = getScoreBand(value);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
      style={{ background: `color-mix(in srgb, ${band.colorVar} 12%, transparent)`, color: band.colorVar }}
    >
      {Math.round(value)}/{max} · {band.label}
    </span>
  );
}
