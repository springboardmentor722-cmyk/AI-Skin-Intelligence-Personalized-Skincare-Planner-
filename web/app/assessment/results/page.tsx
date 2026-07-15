"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, AlertTriangle, BadgeCheck, TriangleAlert, RotateCw } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StateCard } from "@/components/state-card";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { useAssessment } from "@/lib/assessment/context";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { assessmentToLifestyleLogPayload, assessmentToSkinProfilePayload } from "@/lib/assessment/save";
import { SCORE_COMPONENTS } from "@/lib/score-components";
import type { components } from "@/lib/api-types";
import type { AssessmentState } from "@/lib/assessment/context";

type ScoreRead = components["schemas"]["ScoreRead"];

// Saves the wizard's answers to the real skin-profile/lifestyle-log endpoints (see
// web/lib/assessment/save.ts for the field-by-field mapping and its gaps), generates
// real routines, then fetches the real, backend-computed Skin Health Score — the
// score this page shows is the same one GET /api/v1/assessment/score returns everywhere else in
// the app, not a separate client-side estimate.
//
// Deliberately `useQuery`, not `useMutation` + a manual `useEffect`/ref guard (what
// this used to be): `useMutation` hands back a *new* observer object on every render,
// so its `data`/`status` only exist in that one render's closure. Under Next.js App
// Router client-side navigation (`router.push`, not a full page load) this component
// can render more than once before the "final" commit — reproduced live via
// Playwright against `next dev`: `mutate()` fired and completed successfully
// (`onSuccess` logged the real score) on an *earlier* render's mutation object, while
// the render that actually got committed to the DOM held a *different*, still-`idle`
// mutation object whose own effect never re-fired the call (its guard ref was already
// flipped) — so the page stayed on "Analyzing your skin profile..." forever even
// though the backend had already saved everything. `useQuery`'s result lives in the
// shared `QueryClient` cache, not per-render, so every render of this component reads
// the *same* underlying state regardless of how many times React (re-)renders it —
// this is the documented reason TanStack Query recommends `useQuery` over
// `useMutation` for "run once on mount" side effects.
//
// `enabled: hydrated` replaces the old ref guard — not on the very first render,
// since AssessmentProvider (lib/assessment/context.tsx) mounts with DEFAULT_STATE and
// only loads the real sessionStorage answers in its own sync-external-store update,
// which is why `hydrated` exists at all: firing on an unconditional mount would have
// saved DEFAULT_STATE's empty answers instead of the user's real ones.
//
// The skin-profile save is the one step that must succeed — score computation
// requires a real profile to exist (backend/app/services/scores/service.py raises
// "No skin profile yet" without one). The lifestyle-log save and routine generation
// are best-effort: score computation degrades gracefully (a neutral 50) for
// lifestyle/sleep/hydration/routine_adherence without them, so a failure in either
// shouldn't block the real score from showing.
function useSubmitAssessment(state: AssessmentState, hydrated: boolean) {
  const queryClient = useQueryClient();
  // Scoped by user id, not a bare string key: the QueryClient (and its cache) persists
  // across client-side navigation for the whole SPA session, so an unscoped key could
  // hand a *different* signed-in user this browser tab's previously cached score.
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["assessment-submit", userId],
    enabled: hydrated && !!userId,
    retry: false,
    queryFn: async (): Promise<ScoreRead> => {
      const profilePayload = assessmentToSkinProfilePayload(state);
      if (!profilePayload) {
        throw new Error("Select a skin type before viewing your results.");
      }
      const { error: profileError } = await api.POST("/api/v1/skin-profiles", {
        body: profilePayload,
      });
      if (profileError) throw new Error("Couldn't save your skin profile.");
      queryClient.invalidateQueries({ queryKey: ["skin-profile", "me"] });

      await api
        .POST("/api/v1/lifestyle-logs", { body: assessmentToLifestyleLogPayload(state) })
        .then(() => queryClient.invalidateQueries({ queryKey: ["lifestyle-logs", "me"] }))
        .catch(() => {});
      await api.POST("/api/v1/routine/generate").catch(() => {});

      const { data: score, error: scoreError } = await api.GET("/api/v1/assessment/score");
      if (scoreError || !score) throw new Error("Couldn't calculate your Skin Health Score.");
      return score;
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
          <RotateCw className="text-secondary size-8 animate-spin" strokeWidth={1.5} />
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
              <ul className="flex flex-col gap-3">
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
      )}
    </AssessmentShell>
  );
}
