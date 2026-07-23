import { AlertCircle, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// Shared by every Milestone 2 P3 widget (web/components/dashboard/, web/components/
// charts/) — "every widget ships loading/empty/error states" (MILESTONE_2_MASTER_PROMPT.md
// P3), implemented as one `state` prop per widget rather than three separate exports
// per widget (14 widgets x 3 states would otherwise be 42 exports for the same three
// shapes). Loading skeletons stay widget-specific (each one matches its own real
// geometry) — only Empty/Error are shared here.
export type WidgetState = "ready" | "loading" | "empty" | "error";

export interface WidgetStateProps {
  /** Defaults to "ready" — the widget renders its real content. */
  state?: WidgetState;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  errorMessage?: string;
}

export function WidgetEmpty({
  icon: Icon = AlertCircle,
  message = "Nothing here yet.",
  actionLabel,
  actionHref,
}: {
  icon?: LucideIcon;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Empty className="min-h-40 p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && actionHref && (
        <EmptyContent>
          <Button size="sm" render={<a href={actionHref} />}>
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function WidgetError({ message = "Couldn't load this." }: { message?: string }) {
  return (
    <Empty className="min-h-40 p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertCircle strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle className="text-destructive">Something went wrong</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
