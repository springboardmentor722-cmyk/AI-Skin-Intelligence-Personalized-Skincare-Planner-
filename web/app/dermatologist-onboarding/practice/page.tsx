"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/dermatologist-onboarding/onboarding-shell";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { TagInput } from "@/components/ui/tag-input";
import { useDermatologistOnboarding } from "@/lib/dermatologist-onboarding/context";
import { dermatologistPracticeSchema } from "@/lib/schemas/dermatologist-onboarding";

const LABEL_CLASS =
  "font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase";
const INPUT_CLASS =
  "bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none";

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

      <div className="border-border bg-card rounded-2xl border p-6 md:p-10">
        <FieldGroup>
          <Field data-invalid={!!errors.specializations}>
            <FieldLabel className={LABEL_CLASS}>Specializations</FieldLabel>
            <TagInput
              value={state.specializations}
              onChange={(v) => update({ specializations: v })}
              placeholder="e.g. Psoriasis, eczema — press Enter to add"
              aria-label="Specializations"
            />
            <FieldError>{errors.specializations}</FieldError>
          </Field>

          <Field>
            <FieldLabel className={LABEL_CLASS}>
              Board certifications <span className="normal-case">(optional)</span>
            </FieldLabel>
            <TagInput
              value={state.boardCertifications}
              onChange={(v) => update({ boardCertifications: v })}
              placeholder="e.g. Board Certified Dermatologist — press Enter to add"
              aria-label="Board certifications"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="researchInterests" className={LABEL_CLASS}>
              Research interests <span className="normal-case">(optional)</span>
            </FieldLabel>
            <input
              id="researchInterests"
              value={state.researchInterests}
              onChange={(e) => update({ researchInterests: e.target.value })}
              placeholder="e.g. Autoimmune skin conditions"
              className={INPUT_CLASS}
            />
          </Field>

          <Field data-invalid={!!errors.professionalBiography}>
            <FieldLabel htmlFor="professionalBiography" className={LABEL_CLASS}>
              Professional biography
            </FieldLabel>
            <textarea
              id="professionalBiography"
              rows={4}
              value={state.professionalBiography}
              onChange={(e) => update({ professionalBiography: e.target.value })}
              placeholder="A short introduction patients will see on your profile."
              className={`${INPUT_CLASS} resize-none rounded-xl p-4`}
            />
            <FieldError>{errors.professionalBiography}</FieldError>
          </Field>
        </FieldGroup>
      </div>
    </OnboardingShell>
  );
}
