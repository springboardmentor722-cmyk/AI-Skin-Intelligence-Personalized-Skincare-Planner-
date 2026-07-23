import { Check, ChevronRight, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface RoutineChainStep {
  key: string | number;
  icon: LucideIcon;
  label: string;
  done: boolean;
}

interface RoutineChainProps extends WidgetStateProps {
  steps?: RoutineChainStep[];
  period: "AM" | "PM";
}

// Horizontal chain of circular step icons joined by arrows, with a green check
// badge on completed steps (UI_SPEC.md §4.1 "Today's Routine").
export function RoutineChain({
  state = "ready",
  steps,
  period,
  emptyIcon,
  emptyMessage = "No routine steps yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
}: RoutineChainProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="size-10 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} />;
  if (state === "empty" || !steps || steps.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
        {period === "AM" ? "Morning Routine" : "Evening Routine"}
      </p>
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2",
                    step.done ? "border-success bg-success/10" : "border-border"
                  )}
                >
                  <step.icon className="size-4" strokeWidth={1.75} />
                </div>
                {step.done && (
                  <span className="bg-success absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full text-white">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>
              <span className="max-w-16 truncate text-center text-[11px]">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="text-muted-foreground mx-1 size-4 shrink-0" strokeWidth={1.75} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
