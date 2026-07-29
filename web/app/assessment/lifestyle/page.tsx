"use client";

import { useRef, useState } from "react";
import { Minus, Plus, Wand2 } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Slider } from "@/components/ui/slider";
import { useAssessment, type SunExposure } from "@/lib/assessment/context";
import { firstStepError, lifestyleStepSchema } from "@/lib/schemas/assessment";
import { cn } from "@/lib/utils";

// Base UI's Slider supports multi-thumb range sliders, so onValueChange is typed to
// accept either a single number or an array — these sliders are always single-thumb
// (same helper already used in components/skin-profile/skin-profile-form.tsx).
const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

const SUN_EXPOSURE_OPTIONS: SunExposure[] = ["None", "Low", "Moderate", "High"];

// Milestone 2 P8 (MILESTONE 2.docx §"1. In-Built Visual Dataset & Wizard UI",
// "Lifestyle Inputs: Simple numerical steps for sleep, daily water intake, and
// environmental exposure") — Step 4, the exact 4 fields the payload contract needs
// (sleep_hours, water_intake_liters, stress_level, sun_exposure). Allergies/
// sensitivities/sleep-quality collected by an earlier build of this page are
// removed: none are part of the P0-frozen payload, and now that the wizard submits
// against a fixture (not the real skin-profile/lifestyle-log endpoints) they have
// no consumer left — /profile's own forms (components/skin-profile/*) are the real
// place to record them.
export default function AssessmentLifestylePage() {
  const { state, update } = useAssessment();
  const [error, setError] = useState<string | null>(null);
  const sunExposureRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA radiogroup pattern — arrow keys move both focus and selection, same
  // roving-tabindex behavior as /assessment/skin-type's radiogroup.
  const onSunExposureKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = (index + dir + SUN_EXPOSURE_OPTIONS.length) % SUN_EXPOSURE_OPTIONS.length;
    update({ sunExposure: SUN_EXPOSURE_OPTIONS[next] });
    sunExposureRefs.current[next]?.focus();
  };

  return (
    <AssessmentShell
      step={5}
      backHref="/assessment/severity"
      continueHref="/assessment/results"
      onContinue={() => {
        const message = firstStepError(lifestyleStepSchema, {
          sleepHours: state.sleepHours,
          waterLiters: state.waterLiters,
          stressLevel: state.stressLevel,
          sunExposure: state.sunExposure,
        });
        setError(message);
        return message === null;
      }}
    >
      <div className="mb-10 text-center">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          Lifestyle & environment
        </h1>
        <p className="text-on-surface-variant mx-auto mt-2 max-w-xl font-sans">
          Our AI correlates environmental factors and internal stressors to build your
          clinical skin profile.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-8 rounded-2xl border p-6 md:p-10">
        <div className="mb-2 flex items-center gap-2">
          <Wand2 className="text-secondary size-5" strokeWidth={1.5} />
          <h2 className="font-heading text-on-surface text-lg font-semibold">
            Daily habits
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <label className="font-sans text-sm font-semibold">
                  Sleep hours per night
                </label>
                <span className="font-geist text-secondary text-xl font-semibold">
                  {state.sleepHours}
                  <span className="text-on-surface text-base">h</span>
                </span>
              </div>
              <Slider
                min={0}
                max={24}
                step={0.5}
                value={[state.sleepHours]}
                onValueChange={(v) => update({ sleepHours: firstOf(v) })}
                aria-label="Sleep hours per night"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-semibold">
                Daily water intake (litres)
              </label>
              <div className="bg-muted flex items-center justify-between rounded-xl p-3">
                <button
                  type="button"
                  onClick={() => update({ waterLiters: Math.max(0, state.waterLiters - 0.25) })}
                  aria-label="Decrease water intake"
                  className="border-border bg-card flex size-10 items-center justify-center rounded-full border"
                >
                  <Minus className="size-4" strokeWidth={1.5} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-geist text-on-surface text-2xl font-semibold tabular-nums">
                    {state.waterLiters.toFixed(2)}
                  </span>
                  <span className="text-on-surface-variant font-geist text-[10px] font-semibold tracking-[0.05em] uppercase">
                    Litres
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => update({ waterLiters: Math.min(10, state.waterLiters + 0.25) })}
                  aria-label="Increase water intake"
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
                <label className="font-sans text-sm font-semibold">Stress level</label>
                <span className="font-geist text-on-surface text-xl font-semibold tabular-nums">
                  {state.stressLevel}/10
                </span>
              </div>
              <Slider
                min={1}
                max={10}
                value={[state.stressLevel]}
                onValueChange={(v) => update({ stressLevel: firstOf(v) })}
                aria-label="Stress level"
              />
              <div className="text-on-surface-variant font-geist flex justify-between text-[10px] font-semibold tracking-[0.05em] uppercase">
                <span>Low calm</span>
                <span>High stress</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-semibold">Sun exposure</label>
              <div role="radiogroup" aria-label="Sun exposure" className="grid grid-cols-2 gap-2">
                {SUN_EXPOSURE_OPTIONS.map((option, i) => (
                  <button
                    key={option}
                    ref={(el) => {
                      sunExposureRefs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={state.sunExposure === option}
                    tabIndex={state.sunExposure === option ? 0 : -1}
                    onClick={() => update({ sunExposure: option })}
                    onKeyDown={(e) => onSunExposureKeyDown(e, i)}
                    className={cn(
                      "rounded-lg border p-2.5 text-center font-sans text-sm font-medium transition-colors",
                      state.sunExposure === option
                        ? "border-secondary text-secondary bg-secondary/5"
                        : "border-border text-on-surface-variant"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && <p className="text-destructive mt-3 text-xs">{error}</p>}
    </AssessmentShell>
  );
}
