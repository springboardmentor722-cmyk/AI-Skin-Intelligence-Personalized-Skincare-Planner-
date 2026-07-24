"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, RotateCw, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { datasetForSkinTypeName } from "@/lib/assessment/datasets";
import { useAssessment } from "@/lib/assessment/context";
import { firstStepError, skinTypeStepSchema } from "@/lib/schemas/assessment";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// Milestone 2 P8 (MILESTONE 2.docx §"1. In-Built Visual Dataset & Wizard UI") — Step
// 1: single-select visual cards driven by the P6 dataset (SVG + title + description),
// matched against the real GET /api/v1/skin-types row by `backend_enum`. Radio
// semantics with a card presentation: one roving tab stop, arrow keys move both focus
// and selection (a11y — WAI-ARIA radiogroup pattern), selected state shown by both a
// ring/checkmark and the "Selected" label, not colour alone.
export default function AssessmentSkinTypePage() {
  const { state, update } = useAssessment();
  const [error, setError] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const query = useQuery({
    queryKey: ["skin-types"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/skin-types");
      return data ?? [];
    },
  });

  const types = query.data ?? [];

  const select = (skinTypeId: number, skinTypeName: string) => {
    update({ skinTypeId, skinTypeName });
    setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = (index + dir + types.length) % types.length;
    const type = types[next];
    if (type) {
      select(type.skin_type_id, type.skin_type_name);
      cardRefs.current[next]?.focus();
    }
  };

  return (
    <AssessmentShell
      step={2}
      backHref="/assessment/basics"
      continueHref="/assessment/concerns"
      onContinue={() => {
        const message = firstStepError(skinTypeStepSchema, { skinTypeId: state.skinTypeId });
        setError(message);
        return message === null;
      }}
    >
      <div className="mb-10 text-center">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          Define your skin type
        </h1>
        <p className="text-on-surface-variant mx-auto mt-2 max-w-xl font-sans">
          Our AI uses this baseline to calibrate its diagnostic model for your unique skin
          chemistry.
        </p>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          title="Couldn't load skin types"
          description="We couldn't reach the server. Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : (
        <div role="radiogroup" aria-label="Skin type" className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {types.map((type, i) => {
            const dataset = datasetForSkinTypeName(type.skin_type_name);
            const selected = state.skinTypeId === type.skin_type_id;
            return (
              <button
                key={type.skin_type_id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={type.skin_type_name}
                tabIndex={selected || (!state.skinTypeId && i === 0) ? 0 : -1}
                onClick={() => select(type.skin_type_id, type.skin_type_name)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "border-border bg-card relative flex flex-col items-center rounded-xl border p-5 text-center transition-all",
                  selected && "border-secondary ring-secondary/20 ring-2"
                )}
              >
                {selected && (
                  <span className="bg-secondary text-secondary-foreground absolute top-3 right-3 rounded-full p-1">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                )}
                {dataset && (
                  <div className="relative mb-4 size-24 overflow-hidden rounded-full">
                    <Image
                      src={dataset.image_url}
                      alt={type.skin_type_name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="font-heading text-on-surface text-lg font-semibold">
                  {type.skin_type_name}
                </h3>
                {dataset && (
                  <p className="text-on-surface-variant mt-1 font-sans text-xs">
                    {dataset.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="text-destructive mt-3 text-center text-xs">{error}</p>}
    </AssessmentShell>
  );
}
