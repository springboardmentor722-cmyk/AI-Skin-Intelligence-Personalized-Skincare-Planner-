"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];

interface RoutineChecklistCardProps {
  routines: RoutineRead[];
}

// docs/WIREFRAMES.md screen 3 "today's checklist / personalized routine (AM/PM steps)".
// Check state is client-side only, reset on reload — no `checklist_step_done` persistence
// exists anywhere in the documented schema (routines has no completion-tracking table),
// which is exactly why the Scoring service stubs `routine_adherence` (PROGRESS.md) rather
// than computing it from real data. This card is honest about that: it's today's plan,
// not a saved log.
export function RoutineChecklistCard({ routines }: RoutineChecklistCardProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (stepId: number) => setChecked((prev) => ({ ...prev, [stepId]: !prev[stepId] }));

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
      <div className="space-y-6">
        {routines.map((routine) => {
          const doneCount = routine.steps.filter((s) => checked[s.step_id]).length;
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
              <div className="space-y-2.5">
                {routine.steps.map((step) => {
                  const isChecked = !!checked[step.step_id];
                  return (
                    <button
                      key={step.step_id}
                      type="button"
                      onClick={() => toggle(step.step_id)}
                      className="group flex w-full items-center gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isChecked
                            ? "bg-secondary border-secondary text-secondary-foreground"
                            : "border-on-surface/20 group-hover:border-secondary"
                        )}
                      >
                        {isChecked && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          "font-sans text-sm",
                          isChecked && "text-on-surface-variant line-through"
                        )}
                      >
                        {step.step_name}
                      </span>
                    </button>
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
