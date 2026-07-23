import { getScoreBand } from "@/lib/score-components";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

interface ScoreRingProps extends WidgetStateProps {
  value?: number;
  max?: number;
  size?: number;
  /** The score ring's signature smiley centre (UI_SPEC.md §4.1) — only the User
   * hero card wants it; table/chip-context rings don't. */
  showFace?: boolean;
}

// Radial gauge — docs/DESIGN.md's Skin Score Ring, reused for the hero card, table
// cells, and score chips (UI_SPEC.md §5). Colour comes from the existing
// success/warning/error tokens via getScoreBand (P1), never a hard-coded hex.
export function ScoreRing({
  state = "ready",
  value,
  max = 100,
  size = 96,
  showFace = false,
  emptyIcon,
  emptyMessage = "No score yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
}: ScoreRingProps) {
  if (state === "loading") return <Skeleton className="rounded-full" style={{ width: size, height: size }} />;
  if (state === "error") return <WidgetError message={errorMessage} />;
  if (state === "empty" || value == null) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const band = getScoreBand(value);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border)" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={band.colorVar}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {showFace && <span className="text-2xl leading-none">{value >= 75 ? "🙂" : value >= 60 ? "😐" : "🙁"}</span>}
        <span className={cn("font-mono font-bold tabular-nums", showFace ? "text-lg" : "text-xl")}>
          {Math.round(value)}
        </span>
        <span className="text-muted-foreground text-[10px]">/{max}</span>
      </div>
    </div>
  );
}
