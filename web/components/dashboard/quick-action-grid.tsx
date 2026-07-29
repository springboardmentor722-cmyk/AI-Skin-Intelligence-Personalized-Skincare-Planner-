import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface QuickAction {
  key: string;
  icon: LucideIcon;
  label: string;
  href: string;
}

interface QuickActionGridProps extends WidgetStateProps {
  actions?: QuickAction[];
}

// Square icon-above-label tiles — Admin's "Quick Actions" and the User sidebar's
// Quick Actions content shape share this anatomy (UI_SPEC.md §4.4/§5).
export function QuickActionGrid({
  state = "ready",
  actions,
  emptyIcon,
  emptyMessage = "No quick actions yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: QuickActionGridProps) {
  if (state === "loading") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !actions || actions.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className="border-border hover:bg-muted flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center transition-colors"
        >
          <action.icon className="text-primary size-5" strokeWidth={1.75} />
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
