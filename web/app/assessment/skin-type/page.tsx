"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, RotateCw, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/lib/assessment/context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// Same 5 skin types as the Skin Profile screen (real GET /api/v1/skin-types, not a
// hand-typed list) — the wireframe's own per-type blurb/image kept for visual fidelity.
const TYPE_META: Record<string, { blurb: string; body: string; image: string }> = {
  Normal: {
    blurb: "Balanced & even",
    body: "Feels hydrated and elastic without excess oil.",
    image: "/images/assessment/skin-type-normal.jpg",
  },
  Dry: {
    blurb: "Tight & matte",
    body: "May feel flaky or tight, especially after washing.",
    image: "/images/assessment/skin-type-dry.jpg",
  },
  Oily: {
    blurb: "Shiny & porous",
    body: "Presence of shine and enlarged pores across the face.",
    image: "/images/assessment/skin-type-oily.jpg",
  },
  Combination: {
    blurb: "Mixed zones",
    body: "Oily T-zone (forehead/nose) with dry or normal cheeks.",
    image: "/images/assessment/skin-type-combination.jpg",
  },
  Sensitive: {
    blurb: "Reactive & thin",
    body: "Prone to redness, itching, or burning sensations.",
    image: "/images/assessment/skin-type-sensitive.jpg",
  },
};

export default function AssessmentSkinTypePage() {
  const { state, update } = useAssessment();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["skin-types"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/skin-types");
      return data ?? [];
    },
  });

  return (
    <AssessmentShell
      step={2}
      backHref="/assessment/basics"
      continueHref="/assessment/concerns"
      onContinue={() => {
        if (!state.skinTypeId) {
          setError("Select your skin type to continue.");
          return false;
        }
        setError(null);
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
            <div key={i} className="bg-muted h-64 animate-pulse rounded-xl" />
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {(query.data ?? []).map((type) => {
            const meta = TYPE_META[type.skin_type_name];
            const selected = state.skinTypeId === type.skin_type_id;
            return (
              <button
                key={type.skin_type_id}
                type="button"
                onClick={() => {
                  update({ skinTypeId: type.skin_type_id, skinTypeName: type.skin_type_name });
                  setError(null);
                }}
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
                {meta && (
                  <div className="relative mb-4 size-24 overflow-hidden rounded-full">
                    <Image src={meta.image} alt={type.skin_type_name} fill sizes="96px" className="object-cover" />
                  </div>
                )}
                <h3 className="font-heading text-on-surface text-lg font-semibold">
                  {type.skin_type_name}
                </h3>
                {meta && (
                  <>
                    <p className="text-secondary font-geist mt-1 mb-3 text-xs font-semibold tracking-[0.05em] uppercase">
                      {meta.blurb}
                    </p>
                    <p className="text-on-surface-variant font-sans text-xs">{meta.body}</p>
                  </>
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
