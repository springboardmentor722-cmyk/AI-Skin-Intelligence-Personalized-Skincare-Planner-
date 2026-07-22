"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  Camera,
  RotateCw,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

// docs/WIREFRAMES.md screen 7 "Progress tracking". M3-E made the before/after photo
// slider, adherence heat grid, and milestones real (backend: progress/service.py's
// photo pipeline, adherence series, and streak/score-band milestone detection).
// The wireframe's "Biometric Sub-factors" bars (Hydration/Sleep/Inflammation/
// Elasticity/UV Exposure as five independent percentages) and fabricated milestone
// badges ("Texture Specialist", "Consistent Hydration") are dropped outright — no
// schema field backs a per-metric biometric score, and only real, computed
// milestones (routine streaks, Skin Score decade crossings) are ever shown.
// PDF/Excel export still depends on the Report Service (not built) and stays
// "Coming soon".
export default function ProgressPage() {
  const [days, setDays] = useState<number>(30);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ["progress", "me", "summary", days],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/progress/me/summary", {
        params: { query: { days } },
      });
      return data ?? null;
    },
  });

  const photosQuery = useQuery({
    queryKey: ["progress", "me", "photos"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/progress/me/photos");
      return data ?? null;
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { error } = await api.POST("/api/v1/progress/me/photos", {
        // openapi-fetch passes FormData through untouched (no JSON serialization,
        // browser sets the multipart boundary itself) — same pattern as
        // consultant/dashboard/page.tsx's document upload.
        body: formData as unknown as never,
      });
      if (error) throw new Error("Upload failed");
    },
    onSuccess: () => {
      toast.success("Photo added");
      queryClient.invalidateQueries({ queryKey: ["progress", "me", "photos"] });
    },
    onError: () => toast.error("Couldn't upload that photo. Try again."),
  });

  const saveLog = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/progress/me/logs", {
        body: { notes: notes || null },
      });
      if (error) throw new Error("Couldn't save your note.");
      return data;
    },
    onSuccess: () => {
      toast.success("This week's note saved");
      setNotes("");
    },
    onError: () => toast.error("Couldn't save your note. Try again."),
  });

  const points = useMemo(() => summaryQuery.data?.points ?? [], [summaryQuery.data]);
  const adherence = summaryQuery.data?.adherence ?? [];
  const insight = summaryQuery.data?.insight ?? null;
  const milestones = summaryQuery.data?.milestones ?? [];
  const photos = photosQuery.data;

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

      {summaryQuery.isLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : summaryQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load your progress trend."
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
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-on-surface text-sm font-semibold">
                  Visual evolution
                </h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto.mutate(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploadPhoto.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-4" strokeWidth={1.5} />
                  Add today&apos;s photo
                </Button>
              </div>
              {photosQuery.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : !photos || photos.photos.length === 0 ? (
                <div className="border-border flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
                  <Camera className="text-on-surface-variant/40 size-7" strokeWidth={1.5} />
                  <p className="text-on-surface-variant font-sans text-xs">
                    No photos yet — add one to start your visual timeline.
                  </p>
                </div>
              ) : !photos.after ? (
                <div className="bg-muted relative h-56 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, presigned URL */}
                  <img src={photos.before?.url} alt="Your first progress photo" className="h-full w-full object-cover" />
                  <p className="text-on-surface-variant absolute right-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 font-sans text-[10px] text-white">
                    Only one photo so far
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-muted relative h-56 overflow-hidden rounded-xl select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, presigned URL */}
                    <img
                      src={photos.after.url}
                      alt="Most recent progress photo"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, presigned URL */}
                      <img
                        src={photos.before?.url}
                        alt="Earliest progress photo"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div
                      className="bg-background pointer-events-none absolute top-0 bottom-0 w-0.5"
                      style={{ left: `${sliderPosition}%` }}
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 font-sans text-[10px] text-white">
                      First
                    </span>
                    <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 font-sans text-[10px] text-white">
                      Today
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[sliderPosition]}
                    onValueChange={(v) => setSliderPosition(firstOf(v))}
                    aria-label="Compare first and most recent photo"
                  />
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
                  Keep your routine streak going and watch your score — real milestones
                  show up here as you earn them.
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-2">
              <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">
                Routine adherence
              </h3>
              {adherence.length === 0 ? (
                <p className="text-on-surface-variant font-sans text-xs">
                  No active routine yet — build one from the My Routine screen to see
                  adherence here.
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

            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <Sparkles className="text-on-surface-variant/40 mx-auto mb-3 size-7" strokeWidth={1.5} />
              <h3 className="font-heading text-on-surface text-sm font-semibold">
                Export report
              </h3>
              <p className="text-on-surface-variant mt-1 font-sans text-xs">Coming soon</p>
            </div>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <h3 className="font-heading text-on-surface mb-3 text-sm font-semibold">
              This week&apos;s note
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How has your skin felt this week? (optional)"
              rows={3}
              className="bg-muted text-on-surface w-full resize-none rounded-xl border-none px-4 py-3 font-sans text-sm focus:ring-2 focus:ring-[var(--secondary)]/40 focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" disabled={saveLog.isPending} onClick={() => saveLog.mutate()}>
                Save this week
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
