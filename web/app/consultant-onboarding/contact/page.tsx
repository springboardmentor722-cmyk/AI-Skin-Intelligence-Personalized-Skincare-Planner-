"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/consultant-onboarding/onboarding-shell";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useConsultantOnboarding } from "@/lib/consultant-onboarding/context";
import { consultantContactSchema } from "@/lib/schemas/consultant-onboarding";

const LABEL_CLASS =
  "font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase";
const INPUT_CLASS =
  "bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none";

export default function ConsultantContactPage() {
  const { state, update } = useConsultantOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <OnboardingShell
      step={3}
      backHref="/consultant-onboarding/practice"
      continueHref="/consultant-onboarding/review"
      onContinue={() => {
        const result = consultantContactSchema.safeParse({
          phone: state.phone,
          location: state.location || undefined,
          clinicAddress: state.clinicAddress || undefined,
          linkedinUrl: state.linkedinUrl || undefined,
          portfolioUrl: state.portfolioUrl || undefined,
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
          Contact & practice location
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          How clients and our review team can reach you.
        </p>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6 md:p-10">
        <FieldGroup>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone" className={LABEL_CLASS}>
                Phone
              </FieldLabel>
              <input
                id="phone"
                type="tel"
                value={state.phone}
                onChange={(e) => update({ phone: e.target.value })}
                className={INPUT_CLASS}
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="location" className={LABEL_CLASS}>
                Location <span className="normal-case">(optional)</span>
              </FieldLabel>
              <input
                id="location"
                value={state.location}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="e.g. London, United Kingdom"
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="clinicAddress" className={LABEL_CLASS}>
              Clinic address <span className="normal-case">(optional)</span>
            </FieldLabel>
            <input
              id="clinicAddress"
              value={state.clinicAddress}
              onChange={(e) => update({ clinicAddress: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field data-invalid={!!errors.linkedinUrl}>
              <FieldLabel htmlFor="linkedinUrl" className={LABEL_CLASS}>
                LinkedIn <span className="normal-case">(optional)</span>
              </FieldLabel>
              <input
                id="linkedinUrl"
                value={state.linkedinUrl}
                onChange={(e) => update({ linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/…"
                className={INPUT_CLASS}
              />
              <FieldError>{errors.linkedinUrl}</FieldError>
            </Field>

            <Field data-invalid={!!errors.portfolioUrl}>
              <FieldLabel htmlFor="portfolioUrl" className={LABEL_CLASS}>
                Portfolio <span className="normal-case">(optional)</span>
              </FieldLabel>
              <input
                id="portfolioUrl"
                value={state.portfolioUrl}
                onChange={(e) => update({ portfolioUrl: e.target.value })}
                placeholder="https://…"
                className={INPUT_CLASS}
              />
              <FieldError>{errors.portfolioUrl}</FieldError>
            </Field>
          </div>
        </FieldGroup>
      </div>
    </OnboardingShell>
  );
}
