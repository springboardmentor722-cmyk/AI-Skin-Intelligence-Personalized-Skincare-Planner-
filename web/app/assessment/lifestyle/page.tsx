"use client";

import { FlaskConical, AlertTriangle, Wand2, Minus, Plus } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAssessment, type SunExposure } from "@/lib/assessment/context";
import { cn, selectItems } from "@/lib/utils";

// Base UI's Slider supports multi-thumb range sliders, so onValueChange is typed to
// accept either a single number or an array — these sliders are always single-thumb
// (same helper already used in components/skin-profile/skin-profile-form.tsx).
const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

const ALLERGY_OPTIONS = ["Fragrance", "Essential oils", "Lanolin", "Sulfates", "Nuts"];

const SUN_EXPOSURE_OPTIONS: { value: SunExposure; label: string }[] = [
  { value: "indoor", label: "Indoor / low" },
  { value: "occasional", label: "Occasional" },
  { value: "outdoor", label: "High / outdoor" },
  { value: "intense", label: "Intense" },
];

const SLEEP_QUALITY_OPTIONS = ["Restful, uninterrupted", "Occasional waking", "Frequent insomnia"];
const SLEEP_QUALITY_ITEMS = selectItems(SLEEP_QUALITY_OPTIONS);

const STRESS_LABELS: Record<number, string> = { 1: "Low", 2: "Low", 3: "Calm", 4: "Mild", 5: "Moderate", 6: "Moderate", 7: "Elevated", 8: "High", 9: "High", 10: "Very high" };

// web/designs/wireframes/assessment-step-4-lifestyle.html — the wireframe's "Primary
// Environment" tag section is dropped: it's presented as read-only/derived data with
// no clear source field (not in lifestyle_logs' documented schema), so it isn't built
// rather than inventing a new field for it.
export default function AssessmentLifestylePage() {
  const { state, update } = useAssessment();

  const toggleAllergy = (allergy: string) => {
    update({
      allergies: state.allergies.includes(allergy)
        ? state.allergies.filter((a) => a !== allergy)
        : [...state.allergies, allergy],
    });
  };

  return (
    <AssessmentShell step={4} backHref="/assessment/concerns" continueHref="/assessment/results">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          Sensitivities & lifestyle
        </h1>
        <p className="text-on-surface-variant mx-auto mt-2 max-w-xl font-sans">
          Our AI correlates environmental factors and internal stressors to build your
          clinical skin profile.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-10 rounded-2xl border p-6 md:p-10">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="text-secondary size-5" strokeWidth={1.5} />
            <h2 className="font-heading text-on-surface text-lg font-semibold">
              Known allergies
            </h2>
          </div>
          <p className="text-on-surface-variant mb-3 font-sans text-sm">
            Select any known ingredient allergies or irritants.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((allergy) => {
              const selected = state.allergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={cn(
                    "rounded-full border px-4 py-2 font-sans text-sm font-medium transition-all",
                    selected
                      ? "border-secondary text-secondary bg-secondary/5"
                      : "border-border text-on-surface-variant hover:border-secondary"
                  )}
                >
                  {allergy}
                </button>
              );
            })}
          </div>
        </section>

        <hr className="border-border" />

        <section>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="text-secondary size-5" strokeWidth={1.5} />
            <h2 className="font-heading text-on-surface text-lg font-semibold">
              Dermal reactivity
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(
              [
                { key: "reactsToActives", label: "Reacts to actives", body: "Stinging or redness when using retinol or vitamin C." },
                { key: "sunSensitive", label: "Sun-sensitive", body: "Skin burns easily or reacts to direct UV exposure." },
                { key: "rednessProne", label: "Redness-prone", body: "Chronic flushing or visible capillaries." },
              ] as const
            ).map((item) => (
              <div key={item.key} className="bg-muted flex flex-col gap-2 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm font-semibold">{item.label}</span>
                  <Switch
                    checked={state.sensitivities[item.key]}
                    onCheckedChange={(checked) =>
                      update({ sensitivities: { ...state.sensitivities, [item.key]: checked } })
                    }
                  />
                </div>
                <p className="text-on-surface-variant font-sans text-xs">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-border" />

        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <Wand2 className="text-secondary size-5" strokeWidth={1.5} />
            <h2 className="font-heading text-on-surface text-lg font-semibold">
              Lifestyle & environment
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between">
                  <label className="font-sans text-sm font-semibold">Average sleep</label>
                  <span className="font-geist text-secondary text-xl font-semibold">
                    {state.sleepHours}
                    <span className="text-on-surface text-base">h</span>
                  </span>
                </div>
                <Slider
                  min={4}
                  max={12}
                  step={0.5}
                  value={[state.sleepHours]}
                  onValueChange={(v) => update({ sleepHours: firstOf(v) })}
                />
                <Select
                  items={SLEEP_QUALITY_ITEMS}
                  value={state.sleepQuality}
                  onValueChange={(v) => update({ sleepQuality: v ?? SLEEP_QUALITY_OPTIONS[0] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sleep quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLEEP_QUALITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-sm font-semibold">Daily water intake</label>
                  <span className="text-on-surface-variant font-geist text-xs">Target: 8 glasses</span>
                </div>
                <div className="bg-muted flex items-center justify-between rounded-xl p-3">
                  <button
                    type="button"
                    onClick={() => update({ waterGlasses: Math.max(0, state.waterGlasses - 1) })}
                    className="border-border bg-card flex size-10 items-center justify-center rounded-full border"
                  >
                    <Minus className="size-4" strokeWidth={1.5} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="font-geist text-on-surface text-2xl font-semibold">
                      {state.waterGlasses}
                    </span>
                    <span className="text-on-surface-variant font-geist text-[10px] font-semibold tracking-[0.05em] uppercase">
                      Glasses
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ waterGlasses: Math.min(20, state.waterGlasses + 1) })}
                    className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-full"
                  >
                    <Plus className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between">
                  <label className="font-sans text-sm font-semibold">Stress levels</label>
                  <span className="bg-secondary/10 text-secondary font-geist rounded px-2 py-1 text-xs font-semibold">
                    {STRESS_LABELS[state.stressLevel]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={10}
                  value={[state.stressLevel]}
                  onValueChange={(v) => update({ stressLevel: firstOf(v) })}
                />
                <div className="text-on-surface-variant font-geist flex justify-between text-[10px] font-semibold tracking-[0.05em] uppercase">
                  <span>Low calm</span>
                  <span>High stress</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-semibold">Sun exposure</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUN_EXPOSURE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ sunExposure: option.value })}
                      className={cn(
                        "rounded-lg border p-2.5 text-center font-sans text-sm font-medium transition-colors",
                        state.sunExposure === option.value
                          ? "border-secondary text-secondary bg-secondary/5"
                          : "border-border text-on-surface-variant"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AssessmentShell>
  );
}
