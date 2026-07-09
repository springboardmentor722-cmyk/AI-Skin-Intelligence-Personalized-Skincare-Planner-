"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/dermatologist-onboarding/onboarding-shell";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { TagInput } from "@/components/ui/tag-input";
import { useDermatologistOnboarding } from "@/lib/dermatologist-onboarding/context";
import { dermatologistBackgroundSchema } from "@/lib/schemas/dermatologist-onboarding";

const LABEL_CLASS =
  "font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase";
const INPUT_CLASS =
  "bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none";

export default function DermatologistBackgroundPage() {
  const { state, update } = useDermatologistOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <OnboardingShell
      step={1}
      backHref="/dermatologist-onboarding"
      continueHref="/dermatologist-onboarding/practice"
      onContinue={() => {
        const result = dermatologistBackgroundSchema.safeParse({
          medicalRegistrationNumber: state.medicalRegistrationNumber,
          medicalCouncil: state.medicalCouncil,
          hospitalClinic: state.hospitalClinic || undefined,
          yearsOfPractice: state.yearsOfPractice,
          degrees: state.degrees,
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
          Your medical background
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          This is what our review team sees first — be specific about your medical
          registration and experience.
        </p>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6 md:p-10">
        <FieldGroup>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field data-invalid={!!errors.medicalRegistrationNumber}>
              <FieldLabel htmlFor="medicalRegistrationNumber" className={LABEL_CLASS}>
                Medical registration number
              </FieldLabel>
              <input
                id="medicalRegistrationNumber"
                value={state.medicalRegistrationNumber}
                onChange={(e) => update({ medicalRegistrationNumber: e.target.value })}
                className={INPUT_CLASS}
              />
              <FieldError>{errors.medicalRegistrationNumber}</FieldError>
            </Field>

            <Field data-invalid={!!errors.medicalCouncil}>
              <FieldLabel htmlFor="medicalCouncil" className={LABEL_CLASS}>
                Medical council
              </FieldLabel>
              <input
                id="medicalCouncil"
                value={state.medicalCouncil}
                onChange={(e) => update({ medicalCouncil: e.target.value })}
                placeholder="e.g. General Medical Council"
                className={INPUT_CLASS}
              />
              <FieldError>{errors.medicalCouncil}</FieldError>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field data-invalid={!!errors.yearsOfPractice}>
              <FieldLabel htmlFor="yearsOfPractice" className={LABEL_CLASS}>
                Years of practice
              </FieldLabel>
              <input
                id="yearsOfPractice"
                type="number"
                min={0}
                max={80}
                value={state.yearsOfPractice ?? ""}
                onChange={(e) =>
                  update({
                    yearsOfPractice: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className={INPUT_CLASS}
              />
              <FieldError>{errors.yearsOfPractice}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="hospitalClinic" className={LABEL_CLASS}>
                Hospital / clinic <span className="normal-case">(optional)</span>
              </FieldLabel>
              <input
                id="hospitalClinic"
                value={state.hospitalClinic}
                onChange={(e) => update({ hospitalClinic: e.target.value })}
                placeholder="e.g. City Dermatology Hospital"
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field data-invalid={!!errors.degrees}>
            <FieldLabel className={LABEL_CLASS}>Degrees</FieldLabel>
            <TagInput
              value={state.degrees}
              onChange={(v) => update({ degrees: v })}
              placeholder="e.g. MBBS, MD Dermatology — press Enter to add"
              aria-label="Degrees"
            />
            <FieldError>{errors.degrees}</FieldError>
          </Field>
        </FieldGroup>
      </div>
    </OnboardingShell>
  );
}
