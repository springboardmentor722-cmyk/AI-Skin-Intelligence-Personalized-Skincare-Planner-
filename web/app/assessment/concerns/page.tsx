"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListChecks, RotateCw, TriangleAlert, X } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessment, type AssessmentConcernPriority } from "@/lib/assessment/context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const SEVERITIES: AssessmentConcernPriority["severity"][] = ["mild", "moderate", "severe"];
const MAX_PRIORITIES = 3;

// web/designs/wireframes/assessment-step-3-concerns.html — same 10 real skin_concerns
// as the Skin Profile screen (GET /api/v1/skin-concerns), not the wireframe's own
// smaller, differently-named list. Priority ranking is click-to-add/remove (in
// selection order) rather than the wireframe's drag-to-reorder — same end result
// without pulling in a drag-and-drop dependency for one interaction.
export default function AssessmentConcernsPage() {
  const { state, update } = useAssessment();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["skin-concerns"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/skin-concerns");
      return data ?? [];
    },
  });

  const isSelected = (concernId: number) =>
    state.priorities.some((p) => p.concernId === concernId);

  const toggleConcern = (concernId: number, concernName: string) => {
    if (isSelected(concernId)) {
      update({ priorities: state.priorities.filter((p) => p.concernId !== concernId) });
      return;
    }
    if (state.priorities.length >= MAX_PRIORITIES) {
      setError(`You can rank up to ${MAX_PRIORITIES} priorities — remove one to add another.`);
      return;
    }
    setError(null);
    update({
      priorities: [...state.priorities, { concernId, concernName, severity: "moderate" }],
    });
  };

  const setSeverity = (concernId: number, severity: AssessmentConcernPriority["severity"]) => {
    update({
      priorities: state.priorities.map((p) =>
        p.concernId === concernId ? { ...p, severity } : p
      ),
    });
  };

  return (
    <AssessmentShell
      step={3}
      backHref="/assessment/skin-type"
      continueHref="/assessment/lifestyle"
      onContinue={() => {
        if (state.priorities.length === 0) {
          setError("Select at least one concern to continue.");
          return false;
        }
      }}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="mb-6">
            <h1 className="font-heading text-on-surface text-3xl font-bold">
              What are your concerns?
            </h1>
            <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
              Select any skin conditions or concerns you&apos;d like to address during this
              assessment. Pick up to {MAX_PRIORITIES}.
            </p>
          </div>
          {query.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <StateCard
              tone="destructive"
              icon={TriangleAlert}
              title="Couldn't load skin concerns"
              description="We couldn't reach the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => query.refetch()}>
                  <RotateCw className="size-4" strokeWidth={1.5} />
                  Retry
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(query.data ?? []).map((concern) => {
                const selected = isSelected(concern.concern_id);
                return (
                  <button
                    key={concern.concern_id}
                    type="button"
                    onClick={() => toggleConcern(concern.concern_id, concern.concern_name)}
                    className={cn(
                      "border-border bg-card flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all",
                      selected && "border-secondary bg-secondary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "font-geist text-xs font-semibold tracking-[0.05em] uppercase",
                        selected ? "text-secondary" : "text-on-surface"
                      )}
                    >
                      {concern.concern_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {error && <p className="text-destructive mt-3 text-xs">{error}</p>}
        </section>

        <aside className="lg:col-span-5">
          <div className="border-border bg-card sticky top-32 rounded-2xl border p-6">
            <h2 className="font-heading text-on-surface text-lg font-semibold">
              Your priorities
            </h2>
            <p className="text-on-surface-variant font-geist mb-4 text-xs font-semibold tracking-[0.05em] uppercase">
              Ranked by selection order
            </p>
            {state.priorities.length === 0 ? (
              <div className="border-border rounded-xl border-2 border-dashed p-10 text-center">
                <ListChecks className="text-on-surface-variant/40 mx-auto mb-3 size-8" strokeWidth={1.5} />
                <p className="text-on-surface-variant font-sans text-sm">
                  Selected concerns will appear here for ranking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.priorities.map((priority, i) => (
                  <div key={priority.concernId} className="border-border bg-background rounded-xl border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-secondary/40 font-heading text-xl font-bold">
                          {i + 1}
                        </span>
                        <span className="font-sans text-sm font-semibold">
                          {priority.concernName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleConcern(priority.concernId, priority.concernName)}
                        aria-label={`Remove ${priority.concernName}`}
                        className="text-on-surface-variant hover:text-destructive"
                      >
                        <X className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className="text-on-surface-variant font-geist mb-1.5 text-[11px] font-semibold tracking-[0.05em] uppercase">
                      Severity
                    </p>
                    <div className="bg-muted flex gap-1 rounded-full p-1">
                      {SEVERITIES.map((severity) => (
                        <button
                          key={severity}
                          type="button"
                          onClick={() => setSeverity(priority.concernId, severity)}
                          className={cn(
                            "font-geist flex-1 rounded-full py-1.5 text-[10px] font-semibold tracking-[0.05em] uppercase transition-colors",
                            priority.severity === severity
                              ? "bg-secondary text-secondary-foreground"
                              : "text-on-surface-variant"
                          )}
                        >
                          {severity}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </AssessmentShell>
  );
}
