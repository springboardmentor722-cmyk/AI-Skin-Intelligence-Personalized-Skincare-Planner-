import { Check } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, computePercent } from "@/lib/utils";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface ChecklistTask {
  key: string | number;
  label: string;
  done: boolean;
}

interface ChecklistStripProps extends WidgetStateProps {
  tasks?: ChecklistTask[];
  /** Pure callback — this widget never persists a toggle itself (P3 guardrail: no
   * widget fetches its own data). The caller (the user dashboard,
   * useToggleRoutineStep()) owns the actual mutation. */
  onToggle?: (key: string | number) => void;
}

// Daily Checklist strip (UI_SPEC.md §4.1 row 4) — progress bar + a horizontal row
// of checkbox chips.
export function ChecklistStrip({
  state = "ready",
  tasks,
  onToggle,
  emptyIcon,
  emptyMessage = "No tasks yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: ChecklistStripProps) {
  if (state === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-2 w-full" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !tasks || tasks.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {doneCount} / {tasks.length} tasks completed
        </span>
        <span className="text-muted-foreground tabular-nums">
          {computePercent(doneCount, tasks.length)}%
        </span>
      </div>
      <Progress value={computePercent(doneCount, tasks.length)} />
      <div className="flex flex-wrap gap-2">
        {tasks.map((task) => (
          <button
            key={task.key}
            type="button"
            aria-pressed={task.done}
            onClick={() => onToggle?.(task.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              task.done
                ? "border-success/30 bg-success/10 text-success"
                : "border-border text-muted-foreground"
            )}
          >
            {task.done && <Check className="size-3.5" strokeWidth={2} />}
            {task.label}
          </button>
        ))}
      </div>
    </div>
  );
}
