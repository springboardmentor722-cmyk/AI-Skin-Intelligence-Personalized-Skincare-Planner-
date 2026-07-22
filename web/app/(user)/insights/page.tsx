"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RotateCw, Sparkles, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// web/designs/wireframes/app-insights.html is the consultant-facing "Clinical
// Analyses" screen (its own sidebar shows Dashboard/Analyses/Consultants/Settings,
// its language is clinical: "dermal telemetry", "Consults", "New Assessment") —
// not the User-role Insights screen this module builds (AGENTS.md §3's fixed User
// nav; docs/WIREFRAMES.md sidebar text is non-binding, structure is). The real,
// user-appropriate structure it maps to: "Factor Impact Analysis" bars become the
// sleep/hydration correlation bars below (GET /api/v1/analytics/me), and the "AI
// Diagnostic Feed" cards become the same correlation insights, each carrying its
// data-source label and confidence exactly as milestone_3.md §M3-F specifies.
// "Scans"/"Consults"/"Alerts"/"Export PDF"/"Share" have no user-facing meaning or
// backing data here and are dropped.
export default function InsightsPage() {
  const query = useQuery({
    queryKey: ["analytics", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/analytics/me");
      return data ?? null;
    },
  });

  const points = query.data?.score_vs_adherence ?? [];
  const correlations = query.data?.correlations ?? [];
  const hasEnoughHistory = points.length >= 2;

  const first = points[0]?.overall_score ?? null;
  const last = points[points.length - 1]?.overall_score ?? null;
  const delta = first !== null && last !== null ? Math.round(last - first) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Insights</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          What&apos;s actually moving your Skin Score, drawn from your own logged history.
        </p>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : query.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load your insights."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : !hasEnoughHistory ? (
        <StateCard
          icon={Sparkles}
          title="Not enough history yet"
          description="Log a few check-ins and let your Skin Score run for a while — insights build up from real, logged history, not a guess on day one."
          action={<Button nativeButton={false} render={<Link href="/check-in">Log today&apos;s check-in</Link>} />}
        />
      ) : (
        <>
          <div className="border-border bg-card rounded-2xl border p-6">
            <p className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
              This period
            </p>
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
              <span className="text-on-surface-variant font-sans text-sm">Skin Score change</span>
            </div>
            <p className="text-on-surface-variant mt-2 font-sans text-sm">
              {Math.round(first ?? 0)} → {Math.round(last ?? 0)} over {points.length} logged
              assessments
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">
              Factor impact
            </h3>
            <div className="flex flex-col gap-4">
              {correlations.map((c) => {
                const magnitude = c.correlation !== null ? Math.abs(c.correlation) : 0;
                const positive = (c.correlation ?? 0) >= 0;
                return (
                  <div key={c.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-sans text-sm font-medium">{c.label}</span>
                      {c.correlation !== null && (
                        <span
                          className={cn(
                            "font-geist text-xs font-semibold tabular-nums",
                            positive ? "text-tertiary" : "text-destructive"
                          )}
                        >
                          {positive ? "+" : ""}
                          {Math.round(c.correlation * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={cn("h-full rounded-full", positive ? "bg-tertiary" : "bg-destructive")}
                        style={{ width: `${magnitude * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">
              Insight feed
            </h3>
            <div className="flex flex-col gap-3">
              {correlations.map((c) => (
                <div key={c.label} className="border-border rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-sans text-sm">{c.summary}</p>
                    {c.confidence !== null && (
                      <Badge
                        variant={c.confidence >= 0.6 ? "secondary" : "outline"}
                        className="shrink-0"
                      >
                        {Math.round(c.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  <p className="text-on-surface-variant mt-2 font-geist text-[10px] tracking-[0.05em] uppercase">
                    Source: {c.data_source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
