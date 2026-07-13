"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];

interface RoutineChecklistCardProps {
  routines: RoutineRead[];
}

// docs/WIREFRAMES.md screen 3 "today's checklist / personalized routine (AM/PM steps)".
// Check state is real, persisted state (Milestone 2's Mongo routine_logs collection,
// backend/app/services/routines/service.py) — each step's `completed_today` comes
// straight from GET /routines/me, and toggling POSTs to
// /routines/steps/{step_id}/log, not a client-only guess that resets on reload.
export function RoutineChecklistCard({ routines }: RoutineChecklistCardProps) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: number; completed: boolean }) => {
      const { error } = await api.POST("/api/v1/routines/steps/{step_id}/log", {
        params: { path: { step_id: stepId } },
        body: { completed },
      });
      if (error) throw new Error("Couldn't save that step.");
    },
    onMutate: async ({ stepId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["routines", "me"] });
      const previous = queryClient.getQueryData<RoutineRead[]>(["routines", "me"]);
      queryClient.setQueryData<RoutineRead[]>(["routines", "me"], (current) =>
        current?.map((routine) => ({
          ...routine,
          steps: routine.steps.map((step) =>
            step.step_id === stepId ? { ...step, completed_today: completed } : step
          ),
        }))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["routines", "me"], context.previous);
      }
    },
  });

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
