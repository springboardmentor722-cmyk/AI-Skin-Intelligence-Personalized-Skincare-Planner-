"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useToggleRoutineStep } from "@/lib/hooks/use-toggle-routine-step";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];

interface RoutineChecklistCardProps {
  routines: RoutineRead[];
}

// docs/WIREFRAMES.md screen 3 "today's checklist / personalized routine (AM/PM steps)"
// — AM/PM only, by design; Weekly Care (Milestone 2) lives on the dedicated
// /routine screen, not this daily-checklist card. Check state is real, persisted
// state (Mongo routine_logs, backend/app/services/routines/service.py) — each
// step's `completed_today` comes straight from GET /api/v1/routine, and toggling
// (useToggleRoutineStep) POSTs to /routines/steps/{step_id}/log, not a client-only
// guess that resets on reload.
export function RoutineChecklistCard({ routines: allRoutines }: RoutineChecklistCardProps) {
  const toggleMutation = useToggleRoutineStep();
  const routines = allRoutines.filter((r) => r.routine_type === "AM" || r.routine_type === "PM");

  const toggle = (stepId: number, completed: boolean) =>
    toggleMutation.mutate({ stepId, completed });

  if (routines.length === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border p-6">
        <h3 className="font-heading text-on-surface text-lg font-semibold">Today&apos;s routine</h3>
        <p className="text-on-surface-variant mt-2 font-sans text-sm">
          Complete your skin profile to get a personalized AM/PM routine.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h3 className="font-heading text-on-surface mb-5 text-lg font-semibold">Today&apos;s routine</h3>
      <div className="flex flex-col gap-6">
        {routines.map((routine) => {
          const doneCount = routine.steps.filter((s) => s.completed_today).length;
          return (
            <div key={routine.routine_id}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                  {routine.routine_type === "AM" ? "Morning protocol" : "Evening protocol"}
                </p>
                <span className="text-on-surface-variant font-geist text-xs font-semibold">
                  {doneCount}/{routine.steps.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {routine.steps.map((step) => {
                  const isChecked = step.completed_today;
                  return (
                    <label
                      key={step.step_id}
                      className="group flex w-full cursor-pointer items-center gap-3 text-left"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggle(step.step_id, !isChecked)}
                        className="size-5 rounded-full border-2 border-on-surface/20 data-checked:border-secondary data-checked:bg-secondary group-hover:border-secondary"
                      />
                      <span
                        className={cn(
                          "font-sans text-sm",
                          isChecked && "text-on-surface-variant line-through"
                        )}
                      >
                        {step.step_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
