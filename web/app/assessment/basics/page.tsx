"use client";

import { useState } from "react";
import { MapPin, Info, Sparkles, Palette, TrendingUp, Droplet, Leaf } from "lucide-react";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { useAssessment } from "@/lib/assessment/context";
import { basicsStepSchema, firstStepError } from "@/lib/schemas/assessment";
import { AGE_GROUPS } from "@/lib/schemas/skin-profile";
import { cn } from "@/lib/utils";

const GOALS = [
  { id: "clearer-skin", icon: Sparkles, title: "Clearer skin", body: "Reduce acne, blemishes, and congestion." },
  { id: "even-tone", icon: Palette, title: "Even tone", body: "Target dark spots and hyperpigmentation." },
  { id: "anti-aging", icon: TrendingUp, title: "Anti-aging", body: "Fine lines, wrinkles, and skin elasticity." },
  { id: "hydration", icon: Droplet, title: "Deep hydration", body: "Relieve dryness and flaky textures." },
  { id: "sensitivity", icon: Leaf, title: "Calm sensitivity", body: "Manage redness, irritation, or rosacea." },
];

// web/designs/wireframes/assessment-step-1-basics.html — age uses the same AGE_GROUPS
// as the Skin Profile screen (docs/WIREFRAMES.md screen 4), not the wireframe's own
// differently-banded list, so both flows describe the same real taxonomy.
export default function AssessmentBasicsPage() {
  const { state, update } = useAssessment();
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (id: string) => {
    update({
      goals: state.goals.includes(id)
        ? state.goals.filter((g) => g !== id)
        : [...state.goals, id],
    });
  };

  return (
    <AssessmentShell
      step={1}
      backHref="/assessment"
      continueHref="/assessment/skin-type"
      onContinue={() => {
        const message = firstStepError(basicsStepSchema, { ageGroup: state.ageGroup });
        setError(message);
        return message === null;
      }}
    >
      <div className="mb-10">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          Let&apos;s get to know your skin
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          Our clinical AI uses these basics to calibrate your skin analysis and
          environment-specific recommendations.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-8 rounded-2xl border p-6 md:p-10">
        <div className="flex flex-col gap-3">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            How old are you?
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => update({ ageGroup: age })}
                className={cn(
                  "rounded-full border px-5 py-2.5 font-sans text-sm transition-colors",
                  state.ageGroup === age
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-on-surface hover:border-secondary"
                )}
              >
                {age}
              </button>
            ))}
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            What are your primary goals?{" "}
            <span className="normal-case">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {GOALS.map((goal) => {
              const selected = state.goals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    selected
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-secondary/40"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-full p-2",
                      selected ? "bg-secondary/10 text-secondary" : "bg-muted text-on-surface-variant"
                    )}
                  >
                    <goal.icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-on-surface text-base font-semibold">
                      {goal.title}
                    </h3>
                    <p className="text-on-surface-variant font-sans text-sm">{goal.body}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="location"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Where do you live?
          </label>
          <div className="relative">
            <MapPin
              className="text-on-surface-variant absolute top-1/2 left-4 size-4 -translate-y-1/2"
              strokeWidth={1.5}
            />
            <input
              id="location"
              type="text"
              value={state.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="e.g. London, United Kingdom"
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none py-2.5 pr-4 pl-11 font-sans text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <p className="text-on-surface-variant flex items-center gap-1.5 font-sans text-xs">
            <Info className="size-3.5" strokeWidth={1.5} />
            Used for weather & UV-based advice. Skinlytics never shares your location.
          </p>
        </div>
      </div>
    </AssessmentShell>
  );
}
