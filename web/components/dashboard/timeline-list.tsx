import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface TimelineItem {
  key: string | number;
  title: string;
  subtitle: string;
  avatarUrl?: string;
  avatarInitials?: string;
  calendarLabel?: string;
  trailingLabel?: string;
  trailingTone?: "neutral" | "warning" | "danger";
}

interface TimelineListProps extends WidgetStateProps {
  items?: TimelineItem[];
  leading: "avatar" | "calendar-tile";
  trailing: "chip" | "pill" | "chevron";
}

const TONE_CLASSES: Record<NonNullable<TimelineItem["trailingTone"]>, string> = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning",
  danger: "bg-error/10 text-error",
};

// Recent assessments / upcoming follow-ups / activity feed — same anatomy, three
// different leading/trailing combinations (UI_SPEC.md §5).
export function TimelineList({
  state = "ready",
  items,
  leading,
  trailing,
  emptyIcon,
  emptyMessage = "Nothing to show yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: TimelineListProps) {
  if (state === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
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
        <li key={item.key} className="flex items-center gap-3">
          {leading === "avatar" ? (
            <Avatar className="size-9 shrink-0">
              {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.title} />}
              <AvatarFallback className="text-xs">{item.avatarInitials}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold">
              {item.calendarLabel}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="text-muted-foreground truncate text-xs">{item.subtitle}</p>
          </div>
          {trailing === "chevron" ? (
            <ChevronRight className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
          ) : (
            item.trailingLabel && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${TONE_CLASSES[item.trailingTone ?? "neutral"]}`}
              >
                {item.trailingLabel}
              </span>
            )
          )}
        </li>
      ))}
    </ul>
  );
}
