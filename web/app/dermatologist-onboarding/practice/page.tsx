"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/dermatologist-onboarding/onboarding-shell";
import { TagInput } from "@/components/ui/tag-input";
import { useDermatologistOnboarding } from "@/lib/dermatologist-onboarding/context";
import { dermatologistPracticeSchema } from "@/lib/schemas/dermatologist-onboarding";

export default function DermatologistPracticePage() {
  const { state, update } = useDermatologistOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <OnboardingShell
      step={2}
      backHref="/dermatologist-onboarding/background"
      continueHref="/dermatologist-onboarding/contact"
      onContinue={() => {
        const result = dermatologistPracticeSchema.safeParse({
          boardCertifications: state.boardCertifications,
          specializations: state.specializations,
          researchInterests: state.researchInterests || undefined,
          professionalBiography: state.professionalBiography,
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
        <h1 className="font-heading text-on-surface text-3xl font-bold">Your practice</h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          Help patients find the right fit — what you specialize in and your research
          interests.
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
            placeholder="e.g. Psoriasis, eczema — press Enter to add"
            aria-label="Specializations"
          />
          {errors.specializations && (
            <p className="text-destructive text-xs">{errors.specializations}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            Board certifications <span className="normal-case">(optional)</span>
          </label>
          <TagInput
            value={state.boardCertifications}
            onChange={(v) => update({ boardCertifications: v })}
            placeholder="e.g. Board Certified Dermatologist — press Enter to add"
            aria-label="Board certifications"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="researchInterests"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Research interests <span className="normal-case">(optional)</span>
          </label>
          <input
            id="researchInterests"
            value={state.researchInterests}
            onChange={(e) => update({ researchInterests: e.target.value })}
            placeholder="e.g. Autoimmune skin conditions"
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="professionalBiography"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Professional biography
          </label>
          <textarea
            id="professionalBiography"
            rows={4}
            value={state.professionalBiography}
            onChange={(e) => update({ professionalBiography: e.target.value })}
            placeholder="A short introduction patients will see on your profile."
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full resize-none rounded-xl border-none p-4 font-sans text-sm focus:ring-2 focus:outline-none"
          />
          {errors.professionalBiography && (
            <p className="text-destructive text-xs">{errors.professionalBiography}</p>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}
