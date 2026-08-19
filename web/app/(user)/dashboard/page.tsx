"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Droplet,
  FlaskConical,
  Moon,
  Sparkles,
  Sun,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ChecklistStrip, type ChecklistTask } from "@/components/dashboard/checklist-strip";
import { HeroBand } from "@/components/dashboard/hero-band";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { ProductCarousel, type CarouselProduct } from "@/components/dashboard/product-carousel";
import { RoutineChain, type RoutineChainStep } from "@/components/dashboard/routine-chain";
import { SeverityIndicator } from "@/components/dashboard/severity-indicator";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutBreakdown } from "@/components/charts/donut-breakdown";
import { ScoreAdherenceChart } from "@/components/charts/score-adherence-chart";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useToggleRoutineStep } from "@/lib/hooks/use-toggle-routine-step";
import { HYDRATION_BENCHMARK_LITERS, windowByCalendarDays } from "@/lib/score-components";
import { computePercent } from "@/lib/utils";
import { retryFor, widgetStateFor } from "@/lib/widget-state";

const todayIso = () => new Date().toISOString().slice(0, 10);

// docs/DECISIONS.md ADR-023: this page rebuilds MILESTONE_2_UI_SPEC.md §4.1's 4-row
// layout from the P3 widget kit, keeping every real data source the pre-M2-UI-pack
// dashboard already had wired in (score, routines, recommendations, progress,
// lifestyle logs, analytics, skin profile). "Skin Age" was the one remaining
// fixture (ADR-021 C6) until P10 built the real derivation — wired to the real
// ScoreRead.skin_age as of P14, honest empty state when the profile has no
// age_group set (ADR-028).

function useReportDashboardTti(ready: boolean) {
  const reported = useRef(false);
  useEffect(() => {
    if (!ready || reported.current) return;
    reported.current = true;
    const [navEntry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const durationMs = navEntry ? navEntry.domInteractive : performance.now();
    void api.POST("/api/v1/instrumentation/dashboard-tti", { body: { duration_ms: durationMs } });
  }, [ready]);
}

let cachedGreetingSnapshot: { greeting: string; today: string } | null = null;

function getGreetingSnapshot() {
  if (!cachedGreetingSnapshot) {
    const now = new Date();
    const hour = now.getHours();
    cachedGreetingSnapshot = {
      greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
      today: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    };
  }
  return cachedGreetingSnapshot;
}
const GREETING_SERVER_SNAPSHOT = { greeting: "Hello", today: "today" };
function subscribeNever() {
  return () => {};
}
function useGreeting() {
  return useSyncExternalStore(subscribeNever, getGreetingSnapshot, () => GREETING_SERVER_SNAPSHOT);
}

// Keyword heuristic — RoutineStepRead has no step_category field to key off of, so
// the icon is inferred from the step name (this app's existing seed data uses
// consistent naming: "Cleanser", "SPF/Sunscreen", "Night Cream", etc).
function iconForStep(stepName: string | null): LucideIcon {
  const name = (stepName ?? "").toLowerCase();
  if (name.includes("cleans")) return Droplet;
  if (name.includes("spf") || name.includes("sun")) return Sun;
  if (name.includes("night") || name.includes("sleep")) return Moon;
  if (name.includes("serum") || name.includes("treatment")) return FlaskConical;
  return Sparkles;
}

const RANGE_OPTIONS = ["7", "30", "90"] as const;
type Range = (typeof RANGE_OPTIONS)[number];

export default function UserDashboardPage() {
  const [trendRange, setTrendRange] = useState<Range>("30");
  const toggleStep = useToggleRoutineStep();

  const scoreQuery = useQuery({
    queryKey: ["scores", "me"],
    queryFn: async () => {
      const { data, response } = await api.GET("/api/v1/assessment/score");
      if (response.status === 404) return null;
      return data ?? null;
    },
  });

  const routinesQuery = useQuery({
    queryKey: ["routines", "me"],
    queryFn: async () => (await api.GET("/api/v1/routine")).data ?? [],
    enabled: scoreQuery.data !== null,
    // P5 dependency: live-sync a professional's routine overwrite without a manual reload
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", "me"],
    queryFn: async () => (await api.GET("/api/v1/recommendations/me")).data ?? [],
    enabled: scoreQuery.data !== null,
  });

  const lifestyleQuery = useQuery({
    queryKey: ["lifestyle-logs", "me"],
    queryFn: async () => (await api.GET("/api/v1/lifestyle-logs/me")).data ?? [],
    enabled: scoreQuery.data !== null,
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics", "me"],
    queryFn: async () => (await api.GET("/api/v1/analytics/me")).data ?? null,
    enabled: scoreQuery.data !== null,
  });

  const skinProfileQuery = useQuery({
    queryKey: ["skin-profiles", "me"],
    queryFn: async () => (await api.GET("/api/v1/skin-profiles/me")).data ?? null,
    enabled: scoreQuery.data !== null,
  });

  const skinTypesQuery = useQuery({
    queryKey: ["skin-types"],
    queryFn: async () => (await api.GET("/api/v1/skin-types")).data ?? [],
    enabled: scoreQuery.data !== null,
    staleTime: Infinity,
  });

  const skinConcernsQuery = useQuery({
    queryKey: ["skin-concerns"],
    queryFn: async () => (await api.GET("/api/v1/skin-concerns")).data ?? [],
    enabled: scoreQuery.data !== null,
    staleTime: Infinity,
  });

  const { greeting, today } = useGreeting();

  const chartPoints = useMemo(() => {
    const points = analyticsQuery.data?.score_vs_adherence ?? [];
    return windowByCalendarDays(points, Number(trendRange)).map((p) => ({
      date: p.date,
      score: p.overall_score,
      adherence: p.adherence_ratio,
    }));
  }, [analyticsQuery.data, trendRange]);
  const scoreDelta = useMemo(() => {
    const scored = chartPoints.filter((p) => p.score != null);
    if (scored.length < 2) return null;
    const diff = (scored[scored.length - 1].score as number) - (scored[0].score as number);
    return {
      label: `${Math.abs(Math.round(diff))} pts this range`,
      direction: diff >= 0 ? ("up" as const) : ("down" as const),
    };
  }, [chartPoints]);

  const routines = routinesQuery.data ?? [];
  const amSteps = routines.find((r) => r.routine_type === "AM")?.steps ?? [];
  const pmSteps = routines.find((r) => r.routine_type === "PM")?.steps ?? [];
  const allSteps = [...amSteps, ...pmSteps];
  const checklistTasks: ChecklistTask[] = allSteps.map((s) => ({
    key: s.step_id,
    label: s.step_name ?? "Step",
    done: s.completed_today,
  }));

  const skinTypeName = useMemo(() => {
    const typeId = skinProfileQuery.data?.skin_type_id;
    return skinTypesQuery.data?.find((t) => t.skin_type_id === typeId)?.skin_type_name ?? null;
  }, [skinProfileQuery.data, skinTypesQuery.data]);

  const topConcern = useMemo(() => {
    const concerns = skinProfileQuery.data?.concerns ?? [];
    if (concerns.length === 0) return null;
    const top = [...concerns].sort(
      (a, b) => (b.severity_rating ?? 0) - (a.severity_rating ?? 0)
    )[0];
    const name = skinConcernsQuery.data?.find((c) => c.concern_id === top.concern_id)?.concern_name ?? null;
    return name ? { name, rating: top.severity_rating ?? 0 } : null;
  }, [skinProfileQuery.data, skinConcernsQuery.data]);

  const concernDonutData = useMemo(() => {
    const concerns = skinProfileQuery.data?.concerns ?? [];
    const total = concerns.reduce((sum, c) => sum + (c.severity_rating ?? 0), 0);
    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];
    return concerns
      .map((c, i) => ({
        key: String(c.concern_id),
        label:
          skinConcernsQuery.data?.find((sc) => sc.concern_id === c.concern_id)?.concern_name ??
          "Concern",
        value: c.severity_rating ?? 0,
        percent: computePercent(c.severity_rating ?? 0, total),
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [skinProfileQuery.data, skinConcernsQuery.data]);

  const latestLifestyleLog =
    (lifestyleQuery.data ?? []).find((l) => l.log_date === todayIso()) ??
    (lifestyleQuery.data ?? [])[0] ??
    null;
  const hydrationPercent =
    latestLifestyleLog?.water_intake_liters != null
      ? computePercent(latestLifestyleLog.water_intake_liters, HYDRATION_BENCHMARK_LITERS)
      : null;
  const hydrationLabel =
    hydrationPercent == null ? undefined : hydrationPercent >= 80 ? "Good" : hydrationPercent >= 50 ? "Fair" : "Low";

  const carouselProducts: CarouselProduct[] = (recommendationsQuery.data ?? [])
    .slice(0, 8)
    .map((rec) => ({
      key: rec.product.product_id,
      name: rec.product.product_name ?? "Product",
      imageUrl: rec.product.image_url ?? undefined,
      price: rec.product.price,
      currency: rec.product.currency,
      rating: rec.product.rating ?? undefined,
      matchPercentage: rec.match_percentage,
      activeIngredientTags: rec.active_ingredient_tags,
      overBudget: rec.over_budget,
    }));

  const latestInsight = (analyticsQuery.data?.correlations ?? []).find((c) => c.correlation !== null);

  useReportDashboardTti(
    !scoreQuery.isLoading && !routinesQuery.isLoading && !recommendationsQuery.isLoading
  );

  if (scoreQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }
  if (scoreQuery.data === null) {
    return (
      <StateCard
        icon={Sparkles}
        title="Complete your skin profile to unlock your dashboard"
        description="Your Skin Score, routine, and recommendations are calculated from your skin profile — set it up to get started."
        action={<Button nativeButton={false} render={<Link href="/profile">Complete skin profile</Link>} />}
      />
    );
  }
  if (scoreQuery.isError) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load your Skin Score."
        action={
          <Button variant="outline" onClick={() => scoreQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const score = scoreQuery.data!;

  return (
    <div className="flex flex-col gap-6">
      <HeroBand
        tint="user"
        eyebrow="AI Skin Intelligence"
        title={`${greeting}! 👋`}
        subtitle={`Here's your skin summary and personalized recommendations for ${today}.`}
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground self-start text-xs font-medium">Skin Health Score</p>
          <SkinScoreRing
            score={score.overall_score ?? 0}
            size={110}
            label=""
            subScores={[
              { label: "Condition", value: score.skin_condition_score ?? 0, weight: 0.35 },
              { label: "Lifestyle", value: score.lifestyle_score ?? 0, weight: 0.2 },
              { label: "Routine", value: score.routine_adherence_score ?? 0, weight: 0.2 },
              { label: "Sleep", value: score.sleep_quality_score ?? 0, weight: 0.15 },
              { label: "Hydration", value: score.hydration_score ?? 0, weight: 0.1 },
            ]}
          />
          {scoreDelta && (
            <span
              className={`text-xs font-medium ${scoreDelta.direction === "up" ? "text-success" : "text-error"}`}
            >
              {scoreDelta.direction === "up" ? "↑" : "↓"} {scoreDelta.label}
            </span>
          )}
        </div>
      </HeroBand>

      {/* Row 1 — 4 KPI cards, UI_SPEC.md §4.1 (Skin Score moved into the hero above) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <StatCard
            label="Skin Type"
            value={skinTypeName ?? undefined}
            state={
              skinProfileQuery.isLoading || skinTypesQuery.isLoading
                ? "loading"
                : skinProfileQuery.isError || skinTypesQuery.isError
                  ? "error"
                  : !skinTypeName
                    ? "empty"
                    : "ready"
            }
            onRetry={() => {
              void skinProfileQuery.refetch();
              void skinTypesQuery.refetch();
            }}
            icon={UserRound}
            tint="primary"
            footerLink={{ label: "View Details", href: "/profile" }}
            emptyMessage="Set up your skin profile."
            emptyActionLabel="Set up"
            emptyActionHref="/profile"
          />
        </div>
        <div className="lg:col-span-3">
          <StatCard
            label="Top Concerns"
            valueSlot={
              topConcern ? <SeverityIndicator mode="tier" rating={topConcern.rating} label={topConcern.name} /> : undefined
            }
            state={
              skinProfileQuery.isLoading || skinConcernsQuery.isLoading
                ? "loading"
                : skinProfileQuery.isError || skinConcernsQuery.isError
                  ? "error"
                  : !topConcern
                    ? "empty"
                    : "ready"
            }
            onRetry={() => {
              void skinProfileQuery.refetch();
              void skinConcernsQuery.refetch();
            }}
            icon={TriangleAlert}
            tint="danger"
            footerLink={{ label: "View Analysis", href: "/assessment/results" }}
            emptyMessage="No concerns logged."
          />
        </div>
        <div className="lg:col-span-3">
          <StatCard
            label="Skin Age"
            value={score.skin_age != null ? Math.round(score.skin_age) : undefined}
            icon={Sparkles}
            tint="tertiary"
            emptyMessage="Set an age group on your profile to see this."
            footerLink={{ label: "View Details", href: "/progress" }}
          />
        </div>
        <div className="lg:col-span-3">
          <StatCard
            label="Hydration Level"
            valueSlot={
              hydrationPercent != null ? (
                <SeverityIndicator
                  mode="percent"
                  value={hydrationPercent}
                  label={`${hydrationLabel} — ${hydrationPercent}%`}
                  tone={hydrationPercent >= 80 ? "good" : hydrationPercent >= 50 ? "mid" : "low"}
                />
              ) : undefined
            }
            state={widgetStateFor(lifestyleQuery, hydrationPercent == null)}
            onRetry={retryFor(lifestyleQuery)}
            icon={Droplet}
            tint="info"
            delta={
              hydrationPercent != null
                ? {
                    label: `${hydrationPercent}% of ${HYDRATION_BENCHMARK_LITERS}L goal`,
                    direction: "neutral",
                  }
                : undefined
            }
            emptyMessage="Log your water intake."
            emptyActionLabel="Check in"
            emptyActionHref="/check-in"
          />
        </div>
      </div>

      {/* Row 2 — Today's Routine · Skin Health Progress · AI Skin Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5 lg:col-span-4">
          <h3 className="font-heading text-base font-semibold">Today&apos;s Routine</h3>
          {routinesQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <RoutineChain
                period="AM"
                steps={amSteps.map(
                  (s): RoutineChainStep => ({
                    key: s.step_id,
                    icon: iconForStep(s.step_name),
                    label: s.step_name ?? "Step",
                    done: s.completed_today,
                  })
                )}
              />
              <RoutineChain
                period="PM"
                steps={pmSteps.map(
                  (s): RoutineChainStep => ({
                    key: s.step_id,
                    icon: iconForStep(s.step_name),
                    label: s.step_name ?? "Step",
                    done: s.completed_today,
                  })
                )}
              />
            </>
          )}
          <Button variant="outline" size="sm" className="w-full" nativeButton={false} render={<Link href="/routine" />}>
            View Full Routine <span aria-hidden>→</span>
          </Button>
        </div>

        <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5 lg:col-span-4">
          <h3 className="font-heading text-base font-semibold">Skin Health Progress</h3>
          <ScoreAdherenceChart
            state={widgetStateFor(analyticsQuery, chartPoints.length < 2)}
            onRetry={retryFor(analyticsQuery)}
            points={chartPoints}
            rangeOptions={RANGE_OPTIONS}
            rangeValue={trendRange}
            onRangeChange={(v) => setTrendRange(v as Range)}
            emptyMessage="Check back after a few days to see your Skin Score trend."
            footerNote={
              scoreDelta ? `Your skin health has changed by ${scoreDelta.label} in this range.` : undefined
            }
          />
        </div>

        <div className="lg:col-span-4">
          <InsightBanner
            variant="tip"
            title="AI Skin Insights"
            state={widgetStateFor(analyticsQuery, !latestInsight)}
            onRetry={retryFor(analyticsQuery)}
            lines={latestInsight ? [latestInsight.summary] : undefined}
            emptyMessage="Log a few more check-ins to unlock your first insight."
            emptyActionLabel="View All Insights"
            emptyActionHref="/insights"
            actionLabel="View All Insights"
            actionHref="/insights"
          />
        </div>
      </div>

      {/* Row 3 — Recommended Products · Skin Concerns Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border-border bg-card rounded-2xl border p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">Recommended Products for You</h3>
            <Link href="/recommendations" className="text-secondary text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <ProductCarousel
            state={widgetStateFor(recommendationsQuery, carouselProducts.length === 0)}
            onRetry={retryFor(recommendationsQuery)}
            products={carouselProducts}
            emptyMessage="Add concerns to your skin profile to get matched products."
            emptyActionLabel="Update profile"
            emptyActionHref="/profile"
          />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5 lg:col-span-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Skin Concerns Overview</h3>
          <DonutBreakdown
            state={widgetStateFor(skinProfileQuery, concernDonutData.length === 0)}
            onRetry={retryFor(skinProfileQuery)}
            data={concernDonutData}
            centerValue={concernDonutData.length}
            centerLabel="Primary Concerns"
            legend="percent"
            emptyMessage="No concerns logged yet."
          />
        </div>
      </div>

      {/* Row 4 — full-width Daily Checklist */}
      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="font-heading mb-3 text-base font-semibold">Daily Checklist</h3>
        <ChecklistStrip
          state={widgetStateFor(routinesQuery, checklistTasks.length === 0)}
          onRetry={retryFor(routinesQuery)}
          tasks={checklistTasks}
          onToggle={(key) => {
            const step = allSteps.find((s) => s.step_id === key);
            if (step) toggleStep.mutate({ stepId: step.step_id, completed: !step.completed_today });
          }}
          emptyMessage="Generate a routine to get your daily checklist."
          emptyActionLabel="Generate routine"
          emptyActionHref="/routine"
        />
      </div>
    </div>
  );
}
