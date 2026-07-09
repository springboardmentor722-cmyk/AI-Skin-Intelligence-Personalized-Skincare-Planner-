"use client";

import { useState } from "react";

import { OnboardingShell } from "@/components/dermatologist-onboarding/onboarding-shell";
import { TagInput } from "@/components/ui/tag-input";
import { useDermatologistOnboarding } from "@/lib/dermatologist-onboarding/context";
import { dermatologistBackgroundSchema } from "@/lib/schemas/dermatologist-onboarding";

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

      <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6 md:p-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="medicalRegistrationNumber"
              className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
            >
              Medical registration number
            </label>
            <input
              id="medicalRegistrationNumber"
              value={state.medicalRegistrationNumber}
              onChange={(e) => update({ medicalRegistrationNumber: e.target.value })}
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            />
            {errors.medicalRegistrationNumber && (
              <p className="text-destructive text-xs">{errors.medicalRegistrationNumber}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="medicalCouncil"
              className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
            >
              Medical council
            </label>
            <input
              id="medicalCouncil"
              value={state.medicalCouncil}
              onChange={(e) => update({ medicalCouncil: e.target.value })}
              placeholder="e.g. General Medical Council"
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            />
            {errors.medicalCouncil && (
              <p className="text-destructive text-xs">{errors.medicalCouncil}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="yearsOfPractice"
              className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
            >
              Years of practice
            </label>
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
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            />
            {errors.yearsOfPractice && (
              <p className="text-destructive text-xs">{errors.yearsOfPractice}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="hospitalClinic"
              className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
            >
              Hospital / clinic <span className="normal-case">(optional)</span>
            </label>
            <input
              id="hospitalClinic"
              value={state.hospitalClinic}
              onChange={(e) => update({ hospitalClinic: e.target.value })}
              placeholder="e.g. City Dermatology Hospital"
              className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            Degrees
          </label>
          <TagInput
            value={state.degrees}
            onChange={(v) => update({ degrees: v })}
            placeholder="e.g. MBBS, MD Dermatology — press Enter to add"
            aria-label="Degrees"
          />
          {errors.degrees && <p className="text-destructive text-xs">{errors.degrees}</p>}
        </div>
      </div>
    </OnboardingShell>
  );
}
