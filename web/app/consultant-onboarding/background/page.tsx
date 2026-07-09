"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/consultant-onboarding/onboarding-shell";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useConsultantOnboarding } from "@/lib/consultant-onboarding/context";
import { consultantBackgroundSchema } from "@/lib/schemas/consultant-onboarding";

const LABEL_CLASS =
  "font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase";
const INPUT_CLASS =
  "bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none";

export default function ConsultantBackgroundPage() {
  const { state, update } = useConsultantOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <OnboardingShell
      step={1}
      backHref="/consultant-onboarding"
      continueHref="/consultant-onboarding/practice"
      onContinue={() => {
        const result = consultantBackgroundSchema.safeParse({
          qualifications: state.qualifications,
          yearsOfExperience: state.yearsOfExperience,
          currentOrganization: state.currentOrganization || undefined,
          licenseNumber: state.licenseNumber || undefined,
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
          Your professional background
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          This is what our review team sees first — be specific about your
          qualifications and experience.
        </p>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6 md:p-10">
        <FieldGroup>
          <Field data-invalid={!!errors.qualifications}>
            <FieldLabel htmlFor="qualifications" className={LABEL_CLASS}>
              Qualifications
            </FieldLabel>
            <textarea
              id="qualifications"
              rows={3}
              value={state.qualifications}
              onChange={(e) => update({ qualifications: e.target.value })}
              placeholder="e.g. MD, Dermatology — Board Certified"
              className={`${INPUT_CLASS} resize-none rounded-xl p-4`}
            />
            <FieldError>{errors.qualifications}</FieldError>
          </Field>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field data-invalid={!!errors.yearsOfExperience}>
              <FieldLabel htmlFor="yearsOfExperience" className={LABEL_CLASS}>
                Years of experience
              </FieldLabel>
              <input
                id="yearsOfExperience"
                type="number"
                min={0}
                max={80}
                value={state.yearsOfExperience ?? ""}
                onChange={(e) =>
                  update({
                    yearsOfExperience: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className={INPUT_CLASS}
              />
              <FieldError>{errors.yearsOfExperience}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="licenseNumber" className={LABEL_CLASS}>
                License number <span className="normal-case">(if applicable)</span>
              </FieldLabel>
              <input
                id="licenseNumber"
                value={state.licenseNumber}
                onChange={(e) => update({ licenseNumber: e.target.value })}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="currentOrganization" className={LABEL_CLASS}>
              Current organization <span className="normal-case">(optional)</span>
            </FieldLabel>
            <input
              id="currentOrganization"
              value={state.currentOrganization}
              onChange={(e) => update({ currentOrganization: e.target.value })}
              placeholder="e.g. Skin Health Clinic"
              className={INPUT_CLASS}
            />
          </Field>
        </FieldGroup>
      </div>
    </OnboardingShell>
  );
}
