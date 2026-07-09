"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, BadgeCheck } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { useAssessment, type AssessmentState } from "@/lib/assessment/context";
import { api } from "@/lib/api";
import { assessmentToLifestyleLogPayload, assessmentToSkinProfilePayload } from "@/lib/assessment/save";

const SEVERITY_VALUE: Record<string, number> = { mild: 3, moderate: 6, severe: 9 };
const SLEEP_QUALITY_VALUE: Record<string, number> = {
  "Restful, uninterrupted": 9,
  "Occasional waking": 6,
  "Frequent insomnia": 3,
};
const SUN_EXPOSURE_VALUE: Record<AssessmentState["sunExposure"], number> = {
  indoor: 9,
  occasional: 6,
  outdoor: 3,
  intense: 1,
};

// No Skin Assessment backend exists yet (ADR-007-stubbed, not built — PROGRESS.md), so
// this is a deterministic client-side estimate computed from the wizard's own answers,
// using the *same* weighted formula the real backend uses for the Skin Health Score
// (docs/AI_ML.md) — not a real AI call, but not a random placeholder either.
function computeResults(state: AssessmentState) {
  const meanSeverity =
    state.priorities.length > 0
      ? state.priorities.reduce((sum, p) => sum + SEVERITY_VALUE[p.severity], 0) /
        state.priorities.length
      : 0;
  const skinCondition = Math.max(0, 100 - meanSeverity * 10);

  const stressScore = ((10 - state.stressLevel) / 9) * 100;
  const sunScore = (SUN_EXPOSURE_VALUE[state.sunExposure] / 9) * 100;
  const lifestyle = (stressScore + sunScore) / 2;

  const durationScore =
    state.sleepHours >= 7 && state.sleepHours <= 9
      ? 100
      : state.sleepHours < 7
        ? Math.max(0, 100 - (7 - state.sleepHours) * 20)
        : Math.max(0, 100 - (state.sleepHours - 9) * 20);
  const qualityScore = ((SLEEP_QUALITY_VALUE[state.sleepQuality] ?? 6) / 10) * 100;
  const sleep = durationScore * 0.6 + qualityScore * 0.4;

  const hydration = Math.min(100, (state.waterGlasses / 8) * 100);

  // No routine-adherence data is collected by this wizard — same ADR-007 stub
  // treatment the real backend gives this component when there's nothing to derive
  // it from (backend/app/services/scores/service.py).
  const routine = 70;

  const overall =
    skinCondition * 0.35 + lifestyle * 0.2 + routine * 0.2 + sleep * 0.15 + hydration * 0.1;

  return {
    overall: Math.round(overall),
    components: [
      { label: "Condition", weight: 35, value: skinCondition },
      { label: "Lifestyle", weight: 20, value: lifestyle },
      { label: "Routine", weight: 20, value: routine },
      { label: "Sleep", weight: 15, value: sleep },
      { label: "Hydration", weight: 10, value: hydration },
    ],
  };
}

// Persists the wizard's answers to the real skin-profile/lifestyle-log endpoints so
// /profile opens pre-filled instead of asking the same questions again (see
// web/lib/assessment/save.ts for the field-by-field mapping and its gaps). Fired once
// per mount, after `hydrated` flips true — not on the very first render, since
// AssessmentProvider (lib/assessment/context.tsx) mounts with DEFAULT_STATE and only
// loads the real sessionStorage answers in its own effect, which commits *after* this
// page's descendant effects. Firing on an unconditional `[]` dependency array would
// have saved DEFAULT_STATE's empty answers instead of the user's real ones. Non-blocking
// otherwise: results above render from local `state` regardless of whether the save
// succeeds, since this environment (and any offline moment) may have no reachable
// backend.
function useSaveAssessmentToProfile(state: AssessmentState, hydrated: boolean) {
  const queryClient = useQueryClient();
  const firedRef = useRef(false);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const payload = assessmentToSkinProfilePayload(state);
      if (!payload) return null;
      const { data, error } = await api.POST("/api/v1/skin-profiles", { body: payload });
      if (error) throw new Error("Failed to save skin profile");
      return data;
    },
    onSuccess: (data) => {
      if (data) queryClient.invalidateQueries({ queryKey: ["skin-profile", "me"] });
    },
  });

  const lifestyleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/lifestyle-logs", {
        body: assessmentToLifestyleLogPayload(state),
      });
      if (error) throw new Error("Failed to save lifestyle log");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lifestyle-logs", "me"] }),
  });

  useEffect(() => {
    if (!hydrated || firedRef.current) return;
    firedRef.current = true;

    Promise.allSettled([profileMutation.mutateAsync(), lifestyleMutation.mutateAsync()]).then(
      (results) => {
        const failed = results.some((r) => r.status === "rejected");
        if (failed) {
          toast.error("Saved your results, but couldn't sync them to your profile. You can fill it in manually.");
        } else {
          toast.success("Your answers were saved to your skin profile");
        }
      }
    );
    // Intentionally omits the mutation objects — see comment above the hook; only
    // `hydrated` flipping true should ever trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
}

export default function AssessmentResultsPage() {
  const { state, hydrated } = useAssessment();
  const results = useMemo(() => computeResults(state), [state]);
  const topPriority = state.priorities[0];

  useSaveAssessmentToProfile(state, hydrated);

  return (
    <AssessmentShell hideFooter>
      <div className="space-y-10">
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="flex justify-center lg:col-span-5">
            <SkinScoreRing score={results.overall} size={260} />
          </div>
          <div className="space-y-6 lg:col-span-7">
            <div className="flex items-center gap-2">
              <BadgeCheck className="text-secondary size-6" strokeWidth={1.5} />
              <h1 className="font-heading text-on-surface text-3xl font-bold">
                Diagnostic overview
              </h1>
            </div>
            <div className="space-y-4">
              {results.components.map((component) => (
                <div key={component.label} className="space-y-1.5">
                  <div className="flex items-end justify-between">
                    <span className="text-on-surface-variant font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                      {component.label} ({component.weight}%)
                    </span>
                    <span className="font-geist text-on-surface text-sm">
                      {Math.round(component.value)}/100
                    </span>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, component.value))}
                    trackClassName="h-2"
                    indicatorClassName="bg-secondary"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border bg-card flex flex-col justify-between rounded-2xl border p-6 lg:col-span-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="text-secondary size-5" strokeWidth={1.5} />
                <span className="text-secondary font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                  Summary
                </span>
              </div>
              <p className="text-on-surface font-sans leading-relaxed">
                {topPriority
                  ? `Based on your answers, ${topPriority.concernName.toLowerCase()} is your top priority (${topPriority.severity}). Your ${state.skinTypeName?.toLowerCase() ?? "skin"} type and current routine suggest focusing your next steps there first.`
                  : `Your ${state.skinTypeName?.toLowerCase() ?? "skin"} type profile is set. Complete a skin profile to get personalized routine and product recommendations.`}
              </p>
            </div>
            <p className="text-on-surface-variant mt-6 border-t pt-4 font-sans text-xs">
              Not medical advice — an AI-assisted estimate from your answers, not a
              diagnosis. Talk to a dermatologist for medical concerns.
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="text-warning size-5" strokeWidth={1.5} />
              <span className="text-warning font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Watch areas
              </span>
            </div>
            <ul className="space-y-3">
              {state.sunExposure === "outdoor" || state.sunExposure === "intense" ? (
                <li className="font-sans text-sm">
                  <p className="font-semibold">UV exposure</p>
                  <p className="text-on-surface-variant text-xs">
                    High sun exposure reported — daily SPF is a priority.
                  </p>
                </li>
              ) : null}
              {state.stressLevel >= 7 && (
                <li className="font-sans text-sm">
                  <p className="font-semibold">Stress</p>
                  <p className="text-on-surface-variant text-xs">
                    Elevated stress can worsen barrier function and breakouts.
                  </p>
                </li>
              )}
              {state.waterGlasses < 6 && (
                <li className="font-sans text-sm">
                  <p className="font-semibold">Hydration</p>
                  <p className="text-on-surface-variant text-xs">
                    Below the 8-glass daily target — dehydration shows up as dullness.
                  </p>
                </li>
              )}
              {state.sunExposure !== "outdoor" &&
                state.sunExposure !== "intense" &&
                state.stressLevel < 7 &&
                state.waterGlasses >= 6 && (
                  <li className="text-on-surface-variant font-sans text-sm">
                    No major risk factors from your answers — nice work.
                  </li>
                )}
            </ul>
          </div>
        </section>

        {state.priorities.length > 0 && (
          <section>
            <h2 className="font-heading text-on-surface mb-4 text-xl font-semibold">
              Identified concerns
            </h2>
            <div className="flex flex-wrap gap-3">
              {state.priorities.map((priority) => (
                <div
                  key={priority.concernId}
                  className="border-border bg-card flex items-center gap-2 rounded-full border px-4 py-2"
                >
                  <span className="bg-secondary size-2 rounded-full" />
                  <span className="font-sans text-sm font-semibold">{priority.concernName}</span>
                  <span className="font-geist text-on-surface-variant text-[10px] font-semibold tracking-[0.05em] uppercase">
                    {priority.severity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-center justify-center gap-3 border-t pt-8 sm:flex-row">
          <Button size="lg" className="px-8" nativeButton={false} render={<Link href="/profile">Complete your skin profile</Link>} />
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/dashboard">Go to dashboard</Link>} />
        </div>
      </div>
    </AssessmentShell>
  );
}
