"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/consultant-onboarding/onboarding-shell";
import { TagInput } from "@/components/ui/tag-input";
import { useConsultantOnboarding } from "@/lib/consultant-onboarding/context";
import {
  SUGGESTED_CONSULTATION_MODES,
  consultantPracticeSchema,
} from "@/lib/schemas/consultant-onboarding";
import { cn } from "@/lib/utils";

export default function ConsultantPracticePage() {
  const { state, update } = useConsultantOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleMode = (mode: string) => {
    update({
      consultationModes: state.consultationModes.includes(mode)
        ? state.consultationModes.filter((m) => m !== mode)
        : [...state.consultationModes, mode],
    });
  };

  return (
    <OnboardingShell
      step={2}
      backHref="/consultant-onboarding/background"
      continueHref="/consultant-onboarding/contact"
      onContinue={() => {
        const result = consultantPracticeSchema.safeParse({
          specializations: state.specializations,
          areasOfExpertise: state.areasOfExpertise,
          languages: state.languages,
          consultationModes: state.consultationModes,
          availability: state.availability || undefined,
          biography: state.biography,
        });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of result.error.issues) {
            fieldErrors[String(issue.path[0])] = issue.message;
          }
          setErrors(fieldErrors);
          return false;
        }
        setErrors({});
      }}
    >
      <div className="mb-10">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          Your practice
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          Help clients find the right fit — what you specialize in and how you consult.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6 md:p-10">
        <div className="flex flex-col gap-2">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            Specializations
          </label>
          <TagInput
            value={state.specializations}
            onChange={(v) => update({ specializations: v })}
            placeholder="e.g. Acne, anti-aging — press Enter to add"
            aria-label="Specializations"
          />
          {errors.specializations && (
            <p className="text-destructive text-xs">{errors.specializations}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            Areas of expertise <span className="normal-case">(optional)</span>
          </label>
          <TagInput
            value={state.areasOfExpertise}
            onChange={(v) => update({ areasOfExpertise: v })}
            placeholder="e.g. Sensitive skin — press Enter to add"
            aria-label="Areas of expertise"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            Languages
          </label>
          <TagInput
            value={state.languages}
            onChange={(v) => update({ languages: v })}
            placeholder="e.g. English — press Enter to add"
            aria-label="Languages"
          />
          {errors.languages && <p className="text-destructive text-xs">{errors.languages}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            Consultation modes
          </label>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CONSULTATION_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => toggleMode(mode)}
                className={cn(
                  "rounded-full border px-4 py-2 font-sans text-sm transition-colors",
                  state.consultationModes.includes(mode)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-on-surface hover:border-secondary"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          {errors.consultationModes && (
            <p className="text-destructive text-xs">{errors.consultationModes}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="availability"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Availability <span className="normal-case">(optional)</span>
          </label>
          <input
            id="availability"
            value={state.availability}
            onChange={(e) => update({ availability: e.target.value })}
            placeholder="e.g. Weekdays 9am–5pm GMT"
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="biography"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Biography
          </label>
          <textarea
            id="biography"
            rows={4}
            value={state.biography}
            onChange={(e) => update({ biography: e.target.value })}
            placeholder="A short introduction clients will see on your profile."
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full resize-none rounded-xl border-none p-4 font-sans text-sm focus:ring-2 focus:outline-none"
          />
          {errors.biography && <p className="text-destructive text-xs">{errors.biography}</p>}
        </div>
      </div>
    </OnboardingShell>
  );
}
