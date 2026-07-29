"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Droplets, Moon } from "lucide-react";
import { toast } from "sonner";

import { RoutineChecklistCard } from "@/components/dashboard/routine-checklist-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type LifestyleLogRead = components["schemas"]["LifestyleLogRead"];

const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

const todayIso = () => new Date().toISOString().slice(0, 10);

interface HydrationRestFormProps {
  initialWaterLiters: number;
  initialSleepHours: number;
  initialSleepQuality: number;
  initialStressLevel: number;
  initialSunHours: number;
  alreadyLoggedToday: boolean;
}

// Split out so its local state can be *initialized* from the already-loaded
// lifestyle log (a fresh mount, once loading settles below) rather than synced via
// an effect — React's own recommended fix for "state derived from data that
// arrives after the first render" (no setState-in-effect cascade).
function HydrationRestForm({
  initialWaterLiters,
  initialSleepHours,
  initialSleepQuality,
  initialStressLevel,
  initialSunHours,
  alreadyLoggedToday,
}: HydrationRestFormProps) {
  const queryClient = useQueryClient();
  const [waterLiters, setWaterLiters] = useState(initialWaterLiters);
  const [sleepHours, setSleepHours] = useState(initialSleepHours);
  const [sleepQuality, setSleepQuality] = useState(initialSleepQuality);
  const [stressLevel, setStressLevel] = useState(initialStressLevel);
  const [sunHours, setSunHours] = useState(initialSunHours);
  const [loggedToday, setLoggedToday] = useState(alreadyLoggedToday);

  const logToday = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/v1/lifestyle-logs", {
        body: {
          log_date: todayIso(),
          water_intake_liters: waterLiters,
          sleep_hours: sleepHours,
          sleep_quality: sleepQuality,
          stress_level: stressLevel,
          environmental_exposure: { sun_hours: sunHours },
        },
      });
      if (error) throw new Error("Couldn't save today's check-in.");
    },
    onSuccess: () => {
      toast.success("Today's check-in saved");
      setLoggedToday(true);
      queryClient.invalidateQueries({ queryKey: ["lifestyle-logs", "me"] });
    },
    onError: () => toast.error("Couldn't save today's check-in. Try again."),
  });

  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Droplets className="text-secondary size-4" strokeWidth={1.5} />
          <h3 className="font-heading text-on-surface text-sm font-semibold">Hydration</h3>
        </div>
        <p className="font-geist text-on-surface text-2xl font-semibold tabular-nums">
          {waterLiters.toFixed(1)} L
        </p>
        <Slider
          className="mt-2"
          min={0}
          max={4}
          step={0.25}
          value={[waterLiters]}
          onValueChange={(v) => setWaterLiters(firstOf(v))}
          aria-label="Water intake in liters"
        />
      </div>

      <div className="border-border border-t pt-5">
        <div className="mb-2 flex items-center gap-2">
          <Moon className="text-secondary size-4" strokeWidth={1.5} />
          <h3 className="font-heading text-on-surface text-sm font-semibold">Rest cycle</h3>
        </div>
        <p className="font-geist text-on-surface text-2xl font-semibold tabular-nums">
          {sleepHours.toFixed(1)} hrs
        </p>
        <Slider
          className="mt-2"
          min={0}
          max={12}
          step={0.5}
          value={[sleepHours]}
          onValueChange={(v) => setSleepHours(firstOf(v))}
          aria-label="Sleep duration in hours"
        />
        <p className="text-on-surface-variant mt-4 font-sans text-xs">
          Sleep quality ({sleepQuality}/10)
        </p>
        <Slider
          className="mt-2"
          min={1}
          max={10}
          step={1}
          value={[sleepQuality]}
          onValueChange={(v) => setSleepQuality(firstOf(v))}
          aria-label="Sleep quality"
        />
      </div>

      <div className="border-border border-t pt-5">
        <p className="text-on-surface-variant mb-2 font-sans text-xs">
          Stress level ({stressLevel}/10)
        </p>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[stressLevel]}
          onValueChange={(v) => setStressLevel(firstOf(v))}
          aria-label="Stress level"
        />
      </div>

      <div className="border-border border-t pt-5">
        <p className="text-on-surface-variant mb-2 font-sans text-xs">
          Sun exposure ({sunHours.toFixed(1)} hrs)
        </p>
        <Slider
          min={0}
          max={12}
          step={0.5}
          value={[sunHours]}
          onValueChange={(v) => setSunHours(firstOf(v))}
          aria-label="Sun exposure in hours"
        />
      </div>

      <Button disabled={logToday.isPending} onClick={() => logToday.mutate()}>
        {loggedToday ? "Update today's check-in" : "Log today"}
      </Button>
    </div>
  );
}

// web/designs/wireframes/app-checkin.html — "Ritual Check" reuses the exact same
// checklist component/endpoints as the dashboard's routine card and the /routine
// screen (useToggleRoutineStep — one canonical implementation, ADR-established
// pattern), and "Hydration"/"Rest Cycle" write the same real lifestyle_logs upsert
// the Skin Health Score's hydration/sleep components already read
// (skin_profile/service.py's upsert_lifestyle_log). The wireframe's "Skin
// Sensation" mood + dry/oily selector is dropped outright — no schema field
// (lifestyle_logs or progress_logs) backs a daily qualitative mood/dryness rating,
// and the header's "12-day streak" badge has no cheap real source computed
// anywhere yet, so it's omitted rather than guessed.
export default function CheckInPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const routinesQuery = useQuery({
    queryKey: ["routines", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/routine");
      return data ?? [];
    },
  });

  const lifestyleQuery = useQuery({
    queryKey: ["lifestyle-logs", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/lifestyle-logs/me");
      return data ?? [];
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { error } = await api.POST("/api/v1/progress/me/photos", {
        body: formData as unknown as never,
      });
      if (error) throw new Error("Upload failed");
    },
    onSuccess: () => toast.success("Today's photo added to your timeline"),
    onError: () => toast.error("Couldn't upload that photo. Try again."),
  });

  const todayLog = lifestyleQuery.data?.find((log) => log.log_date === todayIso());

  // Milestone 2 P7 — "the 30-day history the dashboard cards read from"
  // (MILESTONE_2_MASTER_PROMPT.md P7): real data from the same GET
  // /api/v1/lifestyle-logs/me the page already fetches (defaults to the last 30
  // entries, skin_profile/service.py's list_recent_lifestyle_logs), not a fixture —
  // future dashboard cards read the same endpoint.
  const historySeries = (field: "sleep_hours" | "water_intake_liters") =>
    [...(lifestyleQuery.data ?? [])]
      .sort((a, b) => a.log_date.localeCompare(b.log_date))
      .map((log: LifestyleLogRead) => ({
        x: new Date(log.log_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        y: log[field] ?? 0,
      }));
  const historyState = lifestyleQuery.isLoading
    ? "loading"
    : (lifestyleQuery.data?.length ?? 0) === 0
      ? "empty"
      : "ready";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Daily check-in</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Consistency is the foundation of real progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {routinesQuery.isLoading ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : (
            <RoutineChecklistCard routines={routinesQuery.data ?? []} />
          )}
        </div>

        {lifestyleQuery.isLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : (
          // Keyed by whether today's entry exists — a fresh mount once the real
          // value is known initializes local state correctly without an effect.
          <HydrationRestForm
            key={todayLog ? "logged" : "unlogged"}
            initialWaterLiters={todayLog?.water_intake_liters ?? 0}
            initialSleepHours={todayLog?.sleep_hours ?? 7}
            initialSleepQuality={todayLog?.sleep_quality ?? 5}
            initialStressLevel={todayLog?.stress_level ?? 5}
            initialSunHours={todayLog?.environmental_exposure?.sun_hours ?? 0}
            alreadyLoggedToday={todayLog !== undefined}
          />
        )}

        <div className="border-border bg-card flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center lg:col-span-1">
          <Camera className="text-on-surface-variant/40 size-8" strokeWidth={1.5} />
          <div>
            <h3 className="font-heading text-on-surface text-sm font-semibold">
              Progress photo
            </h3>
            <p className="text-on-surface-variant mt-1 font-sans text-xs">
              Consistent lighting and angle helps the visual timeline stay comparable.
            </p>
          </div>
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
            variant="outline"
            size="sm"
            disabled={uploadPhoto.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Add today&apos;s photo
          </Button>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/progress">View timeline</Link>} />
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">
          30-day history
        </h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="text-on-surface-variant mb-2 font-sans text-xs">Sleep hours</p>
            <TrendChart
              state={historyState}
              series={historySeries("sleep_hours")}
              seriesLabel="Sleep hours"
              yDomain={[0, 12]}
              emptyMessage="No check-ins logged yet."
            />
          </div>
          <div>
            <p className="text-on-surface-variant mb-2 font-sans text-xs">Water intake (L)</p>
            <TrendChart
              state={historyState}
              series={historySeries("water_intake_liters")}
              seriesLabel="Water intake"
              yDomain={[0, 4]}
              emptyMessage="No check-ins logged yet."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
