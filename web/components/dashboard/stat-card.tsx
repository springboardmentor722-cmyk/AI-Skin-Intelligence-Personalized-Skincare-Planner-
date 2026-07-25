import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Minus, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export type StatTint = "primary" | "success" | "info" | "warning" | "danger" | "tertiary";

// Maps a semantic tint name onto existing app tokens via opacity, never a raw
// screenshot hex (MILESTONE_2_MASTER_PROMPT.md §1a) — no new CSS custom properties.
const TINT_CLASSES: Record<StatTint, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-secondary/10 text-secondary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-error/10 text-error",
  tertiary: "bg-tertiary/10 text-tertiary",
};

const DELTA_CLASSES: Record<"up" | "down" | "neutral", string> = {
  up: "text-success",
  down: "text-error",
  neutral: "text-muted-foreground",
};

const DELTA_ICON = { up: ArrowUp, down: ArrowDown, neutral: Minus } as const;

interface StatCardProps extends WidgetStateProps {
  label: string;
  value?: string | number;
  delta?: { label: string; direction: "up" | "down" | "neutral" };
  icon: LucideIcon;
  tint?: StatTint;
  /** "icon-right" (User's big-value cards) or "icon-left-circular" (consultant/
   * derma/admin's label-above-value cards) — UI_SPEC.md §4.2 note, both real. */
  layout?: "icon-right" | "icon-left-circular";
  footerLink?: { label: string; href: string };
  /** ADR-023 fixture cards (admin Platform Revenue/System Uptime) pass a "Sample
   * data" badge here so they're never visually indistinguishable from the real
   * KPI cards beside them. */
  badge?: ReactNode;
}

export function StatCard({
  state = "ready",
  label,
  value,
  delta,
  icon: Icon,
  tint = "primary",
  layout = "icon-right",
  footerLink,
  badge,
  emptyIcon,
  emptyMessage = "No data yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: StatCardProps) {
  if (state === "loading") {
    return (
      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <WidgetError message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }
  if (state === "empty" || value == null) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <WidgetEmpty icon={emptyIcon ?? Icon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />
      </div>
    );
  }

  const DeltaIcon = delta ? DELTA_ICON[delta.direction] : null;

  if (layout === "icon-left-circular") {
    return (
      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
        <div className={cn("flex size-10 items-center justify-center rounded-full", TINT_CLASSES[tint])}>
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          {badge}
        </div>
        <p className="font-mono text-2xl font-bold tabular-nums">{value}</p>
        <StatCardFooter delta={delta} DeltaIcon={DeltaIcon} footerLink={footerLink} />
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div className={cn("flex size-9 items-center justify-center rounded-lg", TINT_CLASSES[tint])}>
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono text-3xl font-bold tabular-nums">{value}</p>
      <StatCardFooter delta={delta} DeltaIcon={DeltaIcon} footerLink={footerLink} />
    </div>
  );
}

function StatCardFooter({
  delta,
  DeltaIcon,
  footerLink,
}: {
  delta?: StatCardProps["delta"];
  DeltaIcon: LucideIcon | null;
  footerLink?: StatCardProps["footerLink"];
}) {
  if (footerLink) {
    return (
      <Link href={footerLink.href} className="text-secondary inline-flex items-center gap-1 text-xs font-medium hover:underline">
        {footerLink.label}
        <ArrowRight className="size-3" strokeWidth={1.75} />
      </Link>
    );
  }
  if (delta && DeltaIcon) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", DELTA_CLASSES[delta.direction])}>
        <DeltaIcon className="size-3" strokeWidth={2} />
        {delta.label}
      </span>
    );
  }
  return null;
}
