"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Camera, RotateCw, Sparkles, Trophy, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";

// Dynamically imported — see the identical comment in app/(user)/dashboard/page.tsx:
// keeps recharts (this app's single heaviest dependency) out of this page's first-visit
// dev compile and initial JS payload until a query with ≥2 real points actually needs it.
const SkinScoreTrendChart = dynamic(
  () => import("@/components/charts/skin-score-trend-chart").then((m) => m.SkinScoreTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

// docs/WIREFRAMES.md screen 7 "Progress tracking". Only the score-trend slice is real
// (GET /api/v1/progress/me/summary, reading PG skin_scores) — the wireframe's
// before/after photo slider, concern-changes table, milestones, and PDF/Excel export
// all depend on Mongo `progress_logs` and the Report Service, neither of which is built
// yet (progress/service.py's own docstring: "separate, larger scope"). Those sections
// are shown as clearly-labeled upcoming work rather than invented with fake data
// (CONVENTIONS.md "raw exports never ship" / AGENTS.md §0 "don't invent, look it up").
export default function ProgressPage() {
  const [days, setDays] = useState<number>(30);

  const query = useQuery({
    queryKey: ["progress", "me", days],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/progress/me/summary", {
        params: { query: { days } },
      });
      return data?.points ?? [];
    },
  });

  const points = useMemo(() => query.data ?? [], [query.data]);
  const chartData = useMemo(
    () => points.map((p) => ({ date: p.date, overall_score: p.overall_score })),
    [points]
  );

  const first = points[0]?.overall_score ?? null;
  const last = points[points.length - 1]?.overall_score ?? null;
  const delta = first !== null && last !== null ? Math.round(last - first) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">Progress tracking</h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Your Skin Score trend over time.
          </p>
        </div>
        <ToggleGroup
          aria-label="Trend range"
          spacing={1}
          className="bg-muted rounded-full p-1"
          value={[String(days)]}
          onValueChange={(next) => {
            // Base UI's single-select ToggleGroup allows deselecting down to an empty
            // array on a second click of the active item — ignored here so one range is
            // always selected, matching the wireframe's segmented-control behavior.
            if (next[0]) setDays(Number(next[0]));
          }}
        >
          {RANGES.map((r) => (
            <ToggleGroupItem
              key={r.days}
              value={String(r.days)}
              className="font-geist text-on-surface-variant data-pressed:bg-secondary data-pressed:text-secondary-foreground rounded-full px-3 py-1.5 text-xs font-bold"
            >
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : query.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load your progress trend."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : points.length === 0 ? (
        <StateCard
          icon={Sparkles}
          title="No progress data yet"
          description="Visit your dashboard to calculate your first Skin Score — this screen tracks it over time from there."
          action={<Button nativeButton={false} render={<Link href="/dashboard">Go to dashboard</Link>} />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-4">
              <p className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                Improvement
              </p>
              {points.length < 2 ? (
                <>
                  <p className="font-geist text-on-surface mt-3 text-4xl font-semibold tabular-nums">
                    {Math.round(first ?? 0)}
                  </p>
                  <p className="text-on-surface-variant mt-2 font-sans text-sm">
                    First recorded score — check back after a few more days for a trend.
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    {delta !== null && delta >= 0 ? (
                      <TrendingUp className="text-tertiary size-6" strokeWidth={1.5} />
                    ) : (
                      <TrendingDown className="text-destructive size-6" strokeWidth={1.5} />
                    )}
                    <span className="font-geist text-on-surface text-4xl font-semibold tabular-nums">
                      {delta !== null && delta >= 0 ? "+" : ""}
                      {delta}
                    </span>
                  </div>
                  <p className="text-on-surface-variant mt-2 font-sans text-sm">
                    Over the last {days} days ({Math.round(first ?? 0)} → {Math.round(last ?? 0)})
                  </p>
                </>
              )}
            </div>

            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-8">
              <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">
                Skin Score trend
              </h3>
              {points.length < 2 ? (
                <p className="text-on-surface-variant font-sans text-sm">
                  No comparison yet — one data point isn&apos;t enough for a trend line.
                </p>
              ) : (
                <SkinScoreTrendChart data={chartData} variant="full" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <Camera className="text-on-surface-variant/40 mx-auto mb-3 size-7" strokeWidth={1.5} />
              <h3 className="font-heading text-on-surface text-sm font-semibold">
                Before/after photos
              </h3>
              <p className="text-on-surface-variant mt-1 font-sans text-xs">Coming soon</p>
            </div>
            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <Trophy className="text-on-surface-variant/40 mx-auto mb-3 size-7" strokeWidth={1.5} />
              <h3 className="font-heading text-on-surface text-sm font-semibold">Milestones</h3>
              <p className="text-on-surface-variant mt-1 font-sans text-xs">Coming soon</p>
            </div>
            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <Sparkles className="text-on-surface-variant/40 mx-auto mb-3 size-7" strokeWidth={1.5} />
              <h3 className="font-heading text-on-surface text-sm font-semibold">
                Export report
              </h3>
              <p className="text-on-surface-variant mt-1 font-sans text-xs">Coming soon</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
