import { CheckCircle2, type LucideIcon, XCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface StatusTile {
  key: string;
  icon: LucideIcon;
  label: string;
  status: string;
  healthy?: boolean;
}

interface StatusTileGridProps extends WidgetStateProps {
  tiles?: StatusTile[];
}

// Admin's "System Health" mini status tiles (UI_SPEC.md §4.4) — a healthy/unhealthy
// glyph is always paired with the status word, colour is never the only signal.
export function StatusTileGrid({
  state = "ready",
  tiles,
  emptyIcon,
  emptyMessage = "No status data yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
}: StatusTileGridProps) {
  if (state === "loading") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} />;
  if (state === "empty" || !tiles || tiles.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((tile) => {
        const StatusIcon = tile.healthy ?? true ? CheckCircle2 : XCircle;
        return (
          <div key={tile.key} className="border-border flex items-center gap-2 rounded-lg border p-3">
            <tile.icon className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{tile.label}</p>
              <p
                className={`flex items-center gap-1 text-xs ${(tile.healthy ?? true) ? "text-success" : "text-error"}`}
              >
                <StatusIcon className="size-3" strokeWidth={2} />
                {tile.status}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
