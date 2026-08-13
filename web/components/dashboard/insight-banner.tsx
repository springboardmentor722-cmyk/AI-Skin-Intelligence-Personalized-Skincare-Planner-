import Link from "next/link";
import { Sparkles, Stethoscope } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

interface InsightBannerProps extends WidgetStateProps {
  variant: "tip" | "clinical";
  title: string;
  lines?: string[];
  actionLabel?: string;
  actionHref?: string;
}

// Full-width tinted banner — "AI Skin Insights" lead panel (user), "Consultant Tip"
// (1 line), "AI Clinical Insights" (2 lines) (UI_SPEC.md §4.1/§4.2/§4.3). Uses
// --primary-container, the app's existing soft-tint token, never the screenshots'
// literal violet.
export function InsightBanner({
  state = "ready",
  variant,
  title,
  lines,
  actionLabel,
  actionHref,
  emptyIcon,
  emptyMessage = "No insights yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: InsightBannerProps) {
  // `--primary-container` is a dark-navy tint even in light mode (globals.css) —
  // WidgetEmpty/WidgetError's description text hardcodes `text-muted-foreground`,
  // tuned for the near-white `bg-card`/`bg-background` every other caller uses.
  // Overriding the CSS var locally (rather than touching the shared component)
  // repoints it to the on-primary-container token this banner already uses for
  // its own text, without affecting any other WidgetEmpty/WidgetError caller.
  const mutedOverride = "[--muted-foreground:var(--on-primary-container)]";
  if (state === "loading") return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (state === "error") {
    return (
      <div className={`bg-primary-container rounded-2xl p-5 ${mutedOverride}`}>
        <WidgetError message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }
  if (state === "empty" || !lines || lines.length === 0) {
    return (
      <div className={`bg-primary-container rounded-2xl p-5 ${mutedOverride}`}>
        <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />
      </div>
    );
  }

  const Icon = variant === "clinical" ? Stethoscope : Sparkles;

  return (
    <div className="bg-primary-container flex items-start justify-between gap-4 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Icon className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
        <div>
          <p className="text-on-primary-container font-semibold">{title}</p>
          {lines.map((line, i) => (
            <p key={i} className="text-on-primary-container text-sm opacity-90">
              {line}
            </p>
          ))}
        </div>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-primary text-primary-foreground shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
