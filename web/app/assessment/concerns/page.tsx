"use client";

import { useQuery } from "@tanstack/react-query";
import { RotateCw, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { datasetForConcernName } from "@/lib/assessment/datasets";
import { useAssessment } from "@/lib/assessment/context";
import { concernsStepSchema, firstStepError } from "@/lib/schemas/assessment";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// Milestone 2 P8 (MILESTONE 2.docx §"1. In-Built Visual Dataset & Wizard UI") — Step
// 2: multi-select cards driven by the P6 dataset, checkbox semantics, at least one
// required to advance. Severity is no longer set here — it moved to its own step
// (/assessment/severity) per the doc's own 4-step sequence (type -> concerns ->
// intensity sliders -> lifestyle), so this page is selection-only, no cap on count.
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
    setError(null);
    // 5/10 default severity — "sensible default", refined on the next step's sliders.
    update({ priorities: [...state.priorities, { concernId, concernName, severity: 5 }] });
  };

  return (
    <AssessmentShell
      step={3}
      backHref="/assessment/skin-type"
      continueHref="/assessment/severity"
      onContinue={() => {
        const message = firstStepError(concernsStepSchema, { priorities: state.priorities });
        setError(message);
        return message === null;
      }}
    >
      <div className="mb-6">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          What are your concerns?
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          Select any skin conditions or concerns you&apos;d like to address during this
          assessment.
        </p>
      </div>
      {query.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {(query.data ?? []).map((concern) => {
            const dataset = datasetForConcernName(concern.concern_name);
            const selected = isSelected(concern.concern_id);
            return (
              <button
                key={concern.concern_id}
                type="button"
                role="checkbox"
                aria-checked={selected}
                aria-label={concern.concern_name}
                onClick={() => toggleConcern(concern.concern_id, concern.concern_name)}
                className={cn(
                  "border-border bg-card flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all",
                  selected && "border-secondary bg-secondary/5"
                )}
              >
                {dataset && (
                  <div className="relative mb-1 size-14 overflow-hidden rounded-full">
                    <Image
                      src={dataset.image_url}
                      alt={concern.concern_name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                )}
                <span
                  className={cn(
                    "font-geist text-xs font-semibold tracking-[0.05em] uppercase",
                    selected ? "text-secondary" : "text-on-surface"
                  )}
                >
                  {concern.concern_name}
                </span>
                {dataset && (
                  <p className="text-on-surface-variant font-sans text-[11px]">
                    {dataset.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="text-destructive mt-3 text-xs">{error}</p>}
    </AssessmentShell>
  );
}
