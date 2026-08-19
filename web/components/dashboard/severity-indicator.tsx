import { getSeverityBand, type SeverityTier } from "@/lib/severity-band";
import { cn } from "@/lib/utils";

type PercentTone = "low" | "mid" | "good";

export type SeverityIndicatorProps =
  | { mode: "tier"; rating: number; label: string }
  | { mode: "percent"; value: number; label: string; tone: PercentTone };

const TIER_BAR_CLASS: Record<SeverityTier, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-error",
};

const TIER_FILL_PERCENT: Record<SeverityTier, number> = {
  low: 33,
  medium: 66,
  high: 100,
};

const PERCENT_TONE_CLASS: Record<PercentTone, string> = {
  low: "bg-error",
  mid: "bg-warning",
  good: "bg-success",
};

// Text label is the primary, always-rendered a11y signal (docs brief §19: never
// color-only). The bar is `aria-hidden` — decorative reinforcement of what the
// label already states in words.
export function SeverityIndicator(props: SeverityIndicatorProps) {
  const fillPercent =
    props.mode === "tier" ? TIER_FILL_PERCENT[getSeverityBand(props.rating).tier] : Math.max(0, Math.min(100, props.value));
  const barClass = props.mode === "tier" ? TIER_BAR_CLASS[getSeverityBand(props.rating).tier] : PERCENT_TONE_CLASS[props.tone];

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">{props.label}</p>
      <div aria-hidden="true" className="bg-surface-container h-1.5 w-full overflow-hidden rounded-full">
        <div className={cn("h-full rounded-full transition-[width]", barClass)} style={{ width: `${fillPercent}%` }} />
      </div>
    </div>
  );
}
