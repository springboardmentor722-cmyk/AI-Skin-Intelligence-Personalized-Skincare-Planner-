"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import {
  ALCOHOL_OPTIONS,
  POLLUTION_OPTIONS,
  type LifestyleFormValues,
} from "@/lib/schemas/skin-profile";
import { selectItems } from "@/lib/utils";

type LifestyleLogRead = components["schemas"]["LifestyleLogRead"];

const ALCOHOL_ITEMS = selectItems(ALCOHOL_OPTIONS);
const POLLUTION_ITEMS = selectItems(POLLUTION_OPTIONS);

const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

const emptyForm: LifestyleFormValues = {
  sleep_hours: undefined,
  sleep_quality: 5,
  water_intake_liters: undefined,
  stress_level: 5,
  diet_quality: 5,
  exercise_frequency: undefined,
  smoking: false,
  alcohol_consumption: undefined,
  sun_hours: undefined,
  pollution_level: undefined,
  ac_exposure_hours: undefined,
};

function formFromLog(log: LifestyleLogRead | null): LifestyleFormValues {
  if (!log) return emptyForm;
  return {
    sleep_hours: log.sleep_hours ?? undefined,
    sleep_quality: log.sleep_quality ?? 5,
    water_intake_liters: log.water_intake_liters ?? undefined,
    stress_level: log.stress_level ?? 5,
    diet_quality: log.diet_quality ?? 5,
    exercise_frequency: log.exercise_frequency ?? undefined,
    smoking: log.smoking ?? false,
    alcohol_consumption:
      (log.alcohol_consumption as LifestyleFormValues["alcohol_consumption"]) ?? undefined,
    sun_hours: log.environmental_exposure?.sun_hours ?? undefined,
    pollution_level:
      (log.environmental_exposure?.pollution_level as LifestyleFormValues["pollution_level"]) ??
      undefined,
    ac_exposure_hours: log.environmental_exposure?.ac_exposure_hours ?? undefined,
  };
}

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-geist text-xs text-on-surface-variant">{label}</span>
        <span className="font-geist text-xs tabular-nums text-on-surface">{value}</span>
      </div>
      <Slider min={1} max={10} step={1} value={[value]} onValueChange={(v) => onChange(firstOf(v))} />
    </div>
  );
}

export function LifestyleForm() {
  const logsQuery = useQuery({
    queryKey: ["lifestyle-logs", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/lifestyle-logs/me");
      return data ?? [];
    },
  });

  if (logsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaysLog = (logsQuery.data ?? []).find((log) => log.log_date === today) ?? null;

  return <LifestyleFormInner initialLog={todaysLog} />;
}

function LifestyleFormInner({ initialLog }: { initialLog: LifestyleLogRead | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LifestyleFormValues>(() => formFromLog(initialLog));

  const saveMutation = useMutation({
    mutationFn: async (values: LifestyleFormValues) => {
      const { data, error } = await api.POST("/api/v1/lifestyle-logs", {
        body: {
          log_date: new Date().toISOString().slice(0, 10),
          sleep_hours: values.sleep_hours ?? null,
          sleep_quality: values.sleep_quality ?? null,
          water_intake_liters: values.water_intake_liters ?? null,
          stress_level: values.stress_level ?? null,
          diet_quality: values.diet_quality ?? null,
          exercise_frequency: values.exercise_frequency ?? null,
          smoking: values.smoking,
          alcohol_consumption: values.alcohol_consumption ?? null,
          environmental_exposure: {
            sun_hours: values.sun_hours ?? null,
            pollution_level: values.pollution_level ?? null,
            ac_exposure_hours: values.ac_exposure_hours ?? null,
          },
        },
      });
      if (error) throw new Error("Failed to save lifestyle log");
      return data;
    },
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: ["lifestyle-logs", "me"] });
    },
    onError: () => {
      toast.error("Couldn't save today's lifestyle log. Please try again.");
    },
  });

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="font-heading text-base font-semibold text-card-foreground">
          Today&apos;s lifestyle
        </h2>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Logged once per day — saving again today updates today&apos;s entry.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Sleep duration (hours)</Label>
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={form.sleep_hours ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sleep_hours: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            className="w-full rounded-lg border-none bg-muted px-3 py-2.5 font-sans text-sm text-on-surface focus:ring-2 focus:ring-secondary/40 focus:outline-none"
          />
        </div>

        <RatingSlider
          label="Sleep quality"
          value={form.sleep_quality ?? 5}
          onChange={(v) => setForm((f) => ({ ...f, sleep_quality: v }))}
        />

        <div className="flex flex-col gap-1.5">
          <Label>Water intake (liters)</Label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={form.water_intake_liters ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                water_intake_liters: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            className="w-full rounded-lg border-none bg-muted px-3 py-2.5 font-sans text-sm text-on-surface focus:ring-2 focus:ring-secondary/40 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Exercise (times/week)</Label>
          <input
            type="number"
            min={0}
            value={form.exercise_frequency ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                exercise_frequency: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            className="w-full rounded-lg border-none bg-muted px-3 py-2.5 font-sans text-sm text-on-surface focus:ring-2 focus:ring-secondary/40 focus:outline-none"
          />
        </div>

        <RatingSlider
          label="Stress level"
          value={form.stress_level ?? 5}
          onChange={(v) => setForm((f) => ({ ...f, stress_level: v }))}
        />
        <RatingSlider
          label="Diet quality"
          value={form.diet_quality ?? 5}
          onChange={(v) => setForm((f) => ({ ...f, diet_quality: v }))}
        />

        <div className="flex flex-col gap-1.5">
          <Label>Alcohol consumption</Label>
          <Select
            items={ALCOHOL_ITEMS}
            // `null`, never `undefined` — Base UI's Select decides controlled vs.
            // uncontrolled from the *first* render only and warns on any later switch
            // (@base-ui/utils/useControlled.mjs); `alcohol_consumption` always starts
            // `undefined` (emptyForm), which would otherwise mount this uncontrolled and
            // flip it controlled the instant a value is picked.
            value={form.alcohol_consumption ?? null}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                alcohol_consumption: (v ?? undefined) as LifestyleFormValues["alcohol_consumption"],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {ALCOHOL_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
          <Label>Smoking</Label>
          <Switch
            checked={form.smoking}
            onCheckedChange={(v) => setForm((f) => ({ ...f, smoking: v }))}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <Label>Environmental exposure</Label>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="font-normal text-on-surface-variant">Sun hours</Label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={form.sun_hours ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sun_hours: e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className="w-full rounded-lg border-none bg-muted px-3 py-2.5 font-sans text-sm text-on-surface focus:ring-2 focus:ring-secondary/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-normal text-on-surface-variant">Pollution level</Label>
            <Select
              items={POLLUTION_ITEMS}
              // Same fix as "Alcohol consumption" above — `pollution_level` always
              // starts `undefined` (emptyForm).
              value={form.pollution_level ?? null}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  pollution_level: (v ?? undefined) as LifestyleFormValues["pollution_level"],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {POLLUTION_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-normal text-on-surface-variant">AC exposure (hours)</Label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={form.ac_exposure_hours ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  ac_exposure_hours: e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className="w-full rounded-lg border-none bg-muted px-3 py-2.5 font-sans text-sm text-on-surface focus:ring-2 focus:ring-secondary/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
          Save today&apos;s log
        </Button>
      </div>
    </div>
  );
}
