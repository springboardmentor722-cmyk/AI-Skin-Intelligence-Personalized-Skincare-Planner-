import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface StateCardProps {
  icon: LucideIcon;
  title?: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "destructive";
  className?: string;
}

// Shared "nothing to show" surface — covers both the query-error-with-retry and the
// empty-with-CTA states that used to be five near-identical hand-rolled <div> blocks
// across the app (dashboard, recommendations, progress, assessment skin-type/concerns).
// Built on shadcn's official Empty primitive (components/ui/empty.tsx) instead of a
// bespoke one, per this repo's "don't reinvent a component that already exists"
// convention. Solid border (not Empty's own dashed default) to match this app's
// Diagnostic Module card convention (docs/DESIGN.md — data-adjacent surfaces stay
// solid; glass is chrome-only, ADR-008), every other token unchanged.
export function StateCard({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: StateCardProps) {
  return (
    <Empty className={cn("border-border bg-card rounded-2xl border border-solid p-10", className)}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            "rounded-full",
            tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"
          )}
        >
          <Icon className="size-6" strokeWidth={1.5} />
        </EmptyMedia>
        {title && <EmptyTitle className="text-base">{title}</EmptyTitle>}
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
