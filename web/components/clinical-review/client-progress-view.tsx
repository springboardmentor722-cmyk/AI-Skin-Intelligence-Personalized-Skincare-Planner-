"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RotateCw, Sparkles, Trophy, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// Dynamically imported for the same reason as app/(user)/progress/page.tsx —
// keep recharts out of this page's first-visit compile until a query with
// ≥2 real points actually needs it.
const SkinScoreTrendChart = dynamic(
  () => import("@/components/charts/skin-score-trend-chart").then((m) => m.SkinScoreTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

interface ClientProgressViewProps {
  userId: string;
  backHref: string;
}

// Read-only professional counterpart to app/(user)/progress/page.tsx — same
// score trend, adherence heat grid, insight, and milestones, plus the weekly
// concern-progression logs the client records themselves. No photo upload or
// note-taking here; those are the client's own actions. Backed by
// clinical_review/service.py's get_client_progress_summary /
// list_client_progress_logs, which are thin assignment-gated wrappers around
// the exact same progress_service functions the client's own page reads.
export function ClientProgressView({ userId, backHref }: ClientProgressViewProps) {
  const [days, setDays] = useState<number>(30);

  const summaryQuery = useQuery({
    queryKey: ["clinical-review", "client-progress-summary", userId, days],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/progress/summary", {
        params: { path: { user_id: userId }, query: { days } },
      });
      if (error) throw new Error("Couldn't load this client's progress trend.");
      return data;
    },
  });

  const logsQuery = useQuery({
    queryKey: ["clinical-review", "client-progress-logs", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/progress/logs", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load this client's weekly logs.");
      return data;
    },
  });

  const points = useMemo(() => summaryQuery.data?.points ?? [], [summaryQuery.data]);
  const adherence = summaryQuery.data?.adherence ?? [];
  const insight = summaryQuery.data?.insight ?? null;
  const milestones = summaryQuery.data?.milestones ?? [];
  const logs = logsQuery.data ?? [];

  const chartData = useMemo(
    () => points.map((p) => ({ date: p.date, overall_score: p.overall_score })),
    [points]
  );

  const first = points[0]?.overall_score ?? null;
  const last = points[points.length - 1]?.overall_score ?? null;
  const delta = first !== null && last !== null ? Math.round(last - first) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link href={backHref}>
                <ArrowLeft className="size-4" strokeWidth={1.5} />
              </Link>
            }
          />
          <div>
            <h1 className="font-heading text-on-surface text-2xl font-bold">Progress tracking</h1>
            <p className="text-on-surface-variant mt-1 font-sans text-sm">
              This client&apos;s Skin Score trend over time.
            </p>
          </div>
        </div>
        <ToggleGroup
          aria-label="Trend range"
          spacing={1}
          className="bg-muted rounded-full p-1"
          value={[String(days)]}
          onValueChange={(next) => {
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

      {summaryQuery.isLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : summaryQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load this client's progress trend."
          action={
            <Button variant="outline" onClick={() => summaryQuery.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : points.length === 0 ? (
        <StateCard
          icon={Sparkles}
          title="No progress data yet"
          description="This client hasn't computed a Skin Score yet — nothing to trend."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-4">
              <p className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                Improvement
              </p>
              {points.length < 2 ? (
                <p className="font-geist text-on-surface mt-3 text-4xl font-semibold tabular-nums">
                  {Math.round(first ?? 0)}
                </p>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-2">
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
              {insight && (
                <p
                  className={cn(
                    "mt-3 font-sans text-xs",
                    insight.low_confidence ? "text-on-surface-variant" : "text-on-surface"
                  )}
                >
                  {insight.summary}
                  {insight.low_confidence && " (not enough data for high confidence yet)"}
                </p>
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
            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-2">
              <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">
                Routine adherence
              </h3>
              {adherence.length === 0 ? (
                <p className="text-on-surface-variant font-sans text-xs">
                  No active routine yet for this client.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {adherence.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${Math.round(day.completed_ratio * 100)}% completed`}
                      className="size-4 rounded-sm"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--secondary) ${Math.round(day.completed_ratio * 100)}%, var(--muted))`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-border bg-card rounded-2xl border p-6">
              <h3 className="font-heading text-on-surface mb-4 flex items-center gap-2 text-sm font-semibold">
                <Trophy className="text-on-surface-variant size-4" strokeWidth={1.5} />
                Milestones
              </h3>
              {milestones.length === 0 ? (
                <p className="text-on-surface-variant font-sans text-xs">
                  No milestones earned yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {milestones.map((m) => (
                    <li key={`${m.label}-${m.achieved_on}`} className="flex flex-col">
                      <span className="font-sans text-sm font-semibold">{m.label}</span>
                      <span className="text-on-surface-variant font-sans text-xs">
                        {m.achieved_on}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <div className="border-border bg-card rounded-2xl border p-6">
        <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">Weekly logs</h3>
        {logsQuery.isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : logsQuery.isError ? (
          <StateCard
            tone="destructive"
            icon={TriangleAlert}
            description="Couldn't load this client's weekly logs."
            action={
              <Button variant="outline" onClick={() => logsQuery.refetch()}>
                <RotateCw className="size-4" strokeWidth={1.5} />
                Retry
              </Button>
            }
          />
        ) : logs.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">
            No weekly logs yet — these appear as the client records notes on their own
            Progress screen.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {logs.map((log) => (
              <div key={`${log.week_number}-${log.created_at}`} className="border-border rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-geist text-on-surface text-sm font-semibold">
                    Week {log.week_number}
                  </span>
                  <span className="text-on-surface-variant font-geist text-xs">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                {log.trend_summary && (
                  <p className="text-on-surface mt-2 font-sans text-sm">{log.trend_summary}</p>
                )}
                {log.concern_changes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.concern_changes.map((c) => (
                      <span
                        key={c.concern}
                        className="bg-muted text-on-surface-variant rounded-full px-2.5 py-1 font-geist text-xs"
                      >
                        {c.concern}: {c.before} → {c.after}
                      </span>
                    ))}
                  </div>
                )}
                {log.notes && (
                  <p className="text-on-surface-variant mt-3 font-sans text-xs italic">
                    &ldquo;{log.notes}&rdquo;
                  </p>
                )}
                {(log.before_image_url || log.after_image_url) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {log.before_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, presigned URL
                      <img
                        src={log.before_image_url}
                        alt={`Week ${log.week_number} before`}
                        className="h-32 w-full rounded-lg object-cover"
                      />
                    )}
                    {log.after_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, presigned URL
                      <img
                        src={log.after_image_url}
                        alt={`Week ${log.week_number} after`}
                        className="h-32 w-full rounded-lg object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
