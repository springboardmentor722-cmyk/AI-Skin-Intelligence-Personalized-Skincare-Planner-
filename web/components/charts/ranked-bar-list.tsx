import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface RankedBarItem {
  key: string;
  label: string;
  percent: number;
  count?: number;
}

interface RankedBarListProps extends WidgetStateProps {
  items?: RankedBarItem[];
  showCount?: boolean;
}

// Horizontal ranked bars — "Top Skin Concerns" everywhere it appears (UI_SPEC.md
// §4.2/§4.3/§4.4). Track uses --primary (the existing app's brand token, not the
// screenshots' violet literal) at reduced opacity.
export function RankedBarList({
  state = "ready",
  items,
  showCount = false,
  emptyIcon,
  emptyMessage = "Nothing to rank yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: RankedBarListProps) {
  if (state === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !items || items.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.label}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {showCount && item.count != null ? `${item.count} (${item.percent}%)` : `${item.percent}%`}
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, item.percent))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
