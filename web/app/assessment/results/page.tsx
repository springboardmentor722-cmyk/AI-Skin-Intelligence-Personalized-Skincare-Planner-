"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, RotateCw, Sparkles, TriangleAlert } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StateCard } from "@/components/state-card";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { useAssessment } from "@/lib/assessment/context";
import { useSession } from "@/lib/auth-client";
import { buildAssessmentSubmitPayload } from "@/lib/assessment/payload";
import { assessmentSubmitFixture } from "@/lib/fixtures/assessment-fixtures";
import { SCORE_COMPONENTS } from "@/lib/score-components";
import type { components } from "@/lib/api-types";
import type { AssessmentState } from "@/lib/assessment/context";

type ScoreRead = components["schemas"]["ScoreRead"];

// Milestone 2 P8 — UI phases run against fixtures until P14 swaps in the real
// endpoint (MILESTONE_2_MASTER_PROMPT.md §12; P9 builds real persistence + scoring).
// buildAssessmentSubmitPayload produces the exact P0-frozen contract shape
// (web/lib/assessment/payload.ts, unit-tested against mile_2's worked example);
// assessmentSubmitFixture stands in for the real backend until P9 lands.
//
// Deliberately `useQuery`, not `useMutation` + a manual `useEffect`/ref guard: under
// Next.js App Router client-side navigation this component can render more than once
// before the "final" commit, and `useMutation` hands back a fresh observer per
// render — reproduced live via Playwright, see this file's prior real-backend
// version for the full incident writeup. `useQuery`'s result lives in the shared
// QueryClient cache, read identically by every render regardless of remount count.
//
// `enabled: hydrated` — AssessmentProvider (lib/assessment/context.tsx) mounts with
// DEFAULT_STATE and only loads the real sessionStorage answers in its own
// sync-external-store update; firing on an unconditional mount would build the
// payload from empty answers instead of the user's real ones.
function useSubmitAssessment(state: AssessmentState, hydrated: boolean) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    // Scoped by user id, not a bare string key — the QueryClient cache persists
    // across client-side navigation for the whole SPA session.
    queryKey: ["assessment-submit-fixture", userId, state],
    enabled: hydrated && !!userId,
    retry: false,
    queryFn: async (): Promise<ScoreRead> => {
      if (!state.skinTypeId) {
        throw new Error("Select a skin type before viewing your results.");
      }
      const payload = buildAssessmentSubmitPayload(state, userId!);
      return assessmentSubmitFixture(payload);
    },
  });
}

export default function AssessmentResultsPage() {
  const { state, hydrated } = useAssessment();
  const scoreQuery = useSubmitAssessment(state, hydrated);
  const topPriority = state.priorities[0];

  return (
    <AssessmentShell hideFooter>
      {scoreQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          title="Couldn't calculate your Skin Health Score"
          description={
            scoreQuery.error instanceof Error
              ? scoreQuery.error.message
              : "Something went wrong. Please try again."
          }
          action={
            <Button variant="outline" onClick={() => scoreQuery.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : !scoreQuery.data ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Sparkles className="text-secondary size-8 animate-pulse" strokeWidth={1.5} />
          <p className="text-on-surface-variant font-sans text-sm">
            Analyzing your skin profile...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="flex justify-center lg:col-span-5">
              <SkinScoreRing score={scoreQuery.data.overall_score ?? 0} size={260} />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-secondary size-6" strokeWidth={1.5} />
                <h1 className="font-heading text-on-surface text-3xl font-bold">
                  Diagnostic overview
                </h1>
              </div>
              <div className="flex flex-col gap-4">
                {SCORE_COMPONENTS.map((component) => {
                  const value = scoreQuery.data![component.key] ?? 0;
                  const weight = Math.round((scoreQuery.data!.weights[component.weight] ?? 0) * 100);
                  return (
                    <div key={component.key} className="flex flex-col gap-1.5">
                      <div className="flex items-end justify-between">
                        <span className="text-on-surface-variant font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                          {component.label} ({weight}%)
                        </span>
                        <span className="font-geist text-on-surface text-sm">
                          {Math.round(value)}/100
                        </span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(100, value))}
                        trackClassName="h-2"
                        indicatorClassName="bg-secondary"
                      />
                    </div>
                  );
                })}
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
                    ? `Based on your answers, ${topPriority.concernName.toLowerCase()} is your top priority (${topPriority.severity}/10). Your ${state.skinTypeName?.toLowerCase() ?? "skin"} type and current routine suggest focusing your next steps there first.`
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
              <ul className="flex flex-col gap-3">
                {state.sunExposure === "High" || state.sunExposure === "Moderate" ? (
                  <li className="font-sans text-sm">
                    <p className="font-semibold">UV exposure</p>
                    <p className="text-on-surface-variant text-xs">
                      Notable sun exposure reported — daily SPF is a priority.
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
                {state.waterLiters < 2 && (
                  <li className="font-sans text-sm">
                    <p className="font-semibold">Hydration</p>
                    <p className="text-on-surface-variant text-xs">
                      Below the 2L daily target — dehydration shows up as dullness.
                    </p>
                  </li>
                )}
                {state.sunExposure !== "High" &&
                  state.sunExposure !== "Moderate" &&
                  state.stressLevel < 7 &&
                  state.waterLiters >= 2 && (
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
                      {priority.severity}/10
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
      )}
    </AssessmentShell>
  );
}
