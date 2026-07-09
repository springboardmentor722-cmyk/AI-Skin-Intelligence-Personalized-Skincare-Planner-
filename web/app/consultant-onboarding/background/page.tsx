"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/consultant-onboarding/onboarding-shell";
import { useConsultantOnboarding } from "@/lib/consultant-onboarding/context";
import { consultantBackgroundSchema } from "@/lib/schemas/consultant-onboarding";

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

      <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6 md:p-10">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="qualifications"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Qualifications
          </label>
          <textarea
            id="qualifications"
            rows={3}
            value={state.qualifications}
            onChange={(e) => update({ qualifications: e.target.value })}
            placeholder="e.g. MD, Dermatology — Board Certified"
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full resize-none rounded-xl border-none p-4 font-sans text-sm focus:ring-2 focus:outline-none"
          />
          {errors.qualifications && (
            <p className="text-destructive text-xs">{errors.qualifications}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="yearsOfExperience"
              className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
            >
              Years of experience
            </label>
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
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            />
            {errors.yearsOfExperience && (
              <p className="text-destructive text-xs">{errors.yearsOfExperience}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="licenseNumber"
              className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
            >
              License number <span className="normal-case">(if applicable)</span>
            </label>
            <input
              id="licenseNumber"
              value={state.licenseNumber}
              onChange={(e) => update({ licenseNumber: e.target.value })}
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="currentOrganization"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Current organization <span className="normal-case">(optional)</span>
          </label>
          <input
            id="currentOrganization"
            value={state.currentOrganization}
            onChange={(e) => update({ currentOrganization: e.target.value })}
            placeholder="e.g. Skin Health Clinic"
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>
    </OnboardingShell>
  );
}
