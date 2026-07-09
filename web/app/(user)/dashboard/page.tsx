"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight, RotateCw, Sparkles, TriangleAlert } from "lucide-react";

import { RoutineChecklistCard } from "@/components/dashboard/routine-checklist-card";
import { ProductRecommendationCard } from "@/components/products/product-recommendation-card";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

// Dynamically imported (not a static import) — recharts is this app's single heaviest
// dependency, and lazy-loading it here keeps it out of Dashboard's own first-visit dev
// compile and initial JS payload entirely, only fetching it once a signed-in user with
// a real score actually reaches the chart. No SSR (recharts needs a real DOM to
// measure), Skeleton fallback matches the space it'll occupy once loaded.
const SkinScoreTrendChart = dynamic(
  () => import("@/components/charts/skin-score-trend-chart").then((m) => m.SkinScoreTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-40 w-full rounded-lg" /> }
);

// docs/WIREFRAMES.md screen 3 "User dashboard". Only the four documented, real-data
// components are built: Skin Score Ring w/ weighted breakdown, today's routine
// checklist, recommended products (3, match rings), progress mini-chart. The
// wireframe HTML's own weather/reminders/AI-insight modules aren't in WIREFRAMES.md's
// component list and have no backing endpoint — dropped rather than invented
// (CONVENTIONS.md "raw exports never ship").
const SCORE_COMPONENTS = [
  { key: "skin_condition_score", label: "Condition", weight: "skin_condition_weight" },
  { key: "lifestyle_score", label: "Lifestyle", weight: "lifestyle_weight" },
  { key: "routine_adherence_score", label: "Routine", weight: "routine_adherence_weight" },
  { key: "sleep_quality_score", label: "Sleep", weight: "sleep_quality_weight" },
  { key: "hydration_score", label: "Hydration", weight: "hydration_weight" },
] as const;

// Both the greeting (depends on the viewer's local hour) and today's date (can render
// with a different weekday/month order depending on the environment's default locale)
// differ between the server that renders the initial HTML and the browser that
// hydrates it — computing them directly during render caused a real hydration mismatch
// (server "Thursday, July 9" vs. client "Thursday 9 July", different default locales).
// useSyncExternalStore's getServerSnapshot is the React-sanctioned fix for exactly this
// class of value: it renders a fixed, locale/timezone-agnostic placeholder during SSR
// and hydration, then reads the real client-local value immediately after — same
// pattern already used for useIsMobile (hooks/use-mobile.ts), instead of a
// "mounted"-flag state-in-effect this repo's React Compiler lint rule disallows.
let cachedGreetingSnapshot: { greeting: string; today: string } | null = null;

function getGreetingSnapshot() {
  if (!cachedGreetingSnapshot) {
    const now = new Date();
    const hour = now.getHours();
    cachedGreetingSnapshot = {
      greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
      today: now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    };
  }
  return cachedGreetingSnapshot;
}

const GREETING_SERVER_SNAPSHOT = { greeting: "Hello", today: "today" };

function subscribeNever() {
  return () => {};
}

function useGreeting() {
  return useSyncExternalStore(
    subscribeNever,
    getGreetingSnapshot,
    () => GREETING_SERVER_SNAPSHOT
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={className ?? "h-64 w-full rounded-2xl"} />;
}

function CardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StateCard
      tone="destructive"
      icon={TriangleAlert}
      description={message}
      action={
        <Button variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" strokeWidth={1.5} />
          Retry
        </Button>
      }
    />
  );
}

export default function UserDashboardPage() {
  const scoreQuery = useQuery({
    queryKey: ["scores", "me"],
    queryFn: async () => {
      const { data, response } = await api.GET("/api/v1/scores/me");
      if (response.status === 404) return null;
      return data ?? null;
    },
  });

  const routinesQuery = useQuery({
    queryKey: ["routines", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/routines/me");
      return data ?? [];
    },
    enabled: scoreQuery.data !== null,
  });

  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/recommendations/me");
      return data ?? [];
    },
    enabled: scoreQuery.data !== null,
  });

  const progressQuery = useQuery({
    queryKey: ["progress", "me", "summary"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/progress/me/summary");
      return data?.points ?? [];
    },
    enabled: scoreQuery.data !== null,
  });

  const chartData = useMemo(
    () =>
      (progressQuery.data ?? []).map((p) => ({
        date: p.date,
        overall_score: p.overall_score,
      })),
    [progressQuery.data]
  );

  const { greeting, today } = useGreeting();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">{greeting}</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Here&apos;s your clinical summary for {today}.
        </p>
      </div>

      {scoreQuery.isLoading ? (
        <CardSkeleton className="h-96 w-full rounded-2xl" />
      ) : scoreQuery.data === null ? (
        <StateCard
          icon={Sparkles}
          title="Complete your skin profile to unlock your dashboard"
          description="Your Skin Score, routine, and recommendations are calculated from your skin profile — set it up to get started."
          action={
            <Button nativeButton={false} render={<Link href="/profile">Complete skin profile</Link>} />
          }
        />
      ) : scoreQuery.isError ? (
        <CardError
          message="Couldn't load your Skin Score."
          onRetry={() => scoreQuery.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-5">
              <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">Skin score</h3>
              <div className="flex justify-center py-4">
                <SkinScoreRing score={scoreQuery.data!.overall_score ?? 0} size={200} />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {SCORE_COMPONENTS.map((c) => {
                  const value = scoreQuery.data![c.key] ?? 0;
                  const weight = Math.round((scoreQuery.data!.weights[c.weight] ?? 0) * 100);
                  return (
                    <div key={c.key} className="flex flex-col gap-1">
                      <div className="flex items-end justify-between text-xs">
                        <span className="text-on-surface-variant font-geist font-semibold tracking-[0.05em] uppercase">
                          {c.label} ({weight}%)
                        </span>
                        <span className="font-geist text-on-surface">{Math.round(value)}/100</span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(100, value))}
                        trackClassName="h-1.5"
                        indicatorClassName="bg-secondary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7">
              {routinesQuery.isLoading ? (
                <CardSkeleton />
              ) : routinesQuery.isError ? (
                <CardError message="Couldn't load your routine." onRetry={() => routinesQuery.refetch()} />
              ) : (
                <RoutineChecklistCard routines={routinesQuery.data ?? []} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-on-surface text-lg font-semibold">
                  Recommended for you
                </h3>
                <Link
                  href="/recommendations"
                  className="text-secondary flex items-center gap-1 font-sans text-sm font-medium"
                >
                  View all
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              </div>
              {recommendationsQuery.isLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                  ))}
                </div>
              ) : recommendationsQuery.isError ? (
                <CardError
                  message="Couldn't load recommendations."
                  onRetry={() => recommendationsQuery.refetch()}
                />
              ) : (recommendationsQuery.data ?? []).length === 0 ? (
                <p className="text-on-surface-variant font-sans text-sm">
                  No recommendations yet — add concerns to your skin profile to get matched
                  products.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {(recommendationsQuery.data ?? []).slice(0, 3).map((rec) => (
                    <ProductRecommendationCard key={rec.product.product_id} recommendation={rec} compact />
                  ))}
                </div>
              )}
            </div>

            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-on-surface text-lg font-semibold">Progress</h3>
                <Link
                  href="/progress"
                  className="text-secondary flex items-center gap-1 font-sans text-sm font-medium"
                >
                  Details
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              </div>
              {progressQuery.isLoading ? (
                <Skeleton className="h-40 w-full rounded-lg" />
              ) : progressQuery.isError ? (
                <CardError
                  message="Couldn't load your progress trend."
                  onRetry={() => progressQuery.refetch()}
                />
              ) : chartData.length < 2 ? (
                <p className="text-on-surface-variant font-sans text-sm">
                  Check back after a few days to see your Skin Score trend.
                </p>
              ) : (
                <SkinScoreTrendChart data={chartData} variant="compact" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
