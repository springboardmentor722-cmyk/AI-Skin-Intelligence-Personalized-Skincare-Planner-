"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/consultant-onboarding/onboarding-shell";
import { useConsultantOnboarding } from "@/lib/consultant-onboarding/context";
import { consultantOnboardingSchema } from "@/lib/schemas/consultant-onboarding";

const SUMMARY_SECTIONS = [
  {
    title: "Background",
    editHref: "/consultant-onboarding/background",
    fields: ["qualifications", "yearsOfExperience", "currentOrganization", "licenseNumber"],
  },
  {
    title: "Practice",
    editHref: "/consultant-onboarding/practice",
    fields: [
      "specializations",
      "areasOfExpertise",
      "languages",
      "consultationModes",
      "availability",
      "biography",
    ],
  },
  {
    title: "Contact",
    editHref: "/consultant-onboarding/contact",
    fields: ["phone", "location", "clinicAddress", "linkedinUrl", "portfolioUrl"],
  },
] as const;

const FIELD_LABELS: Record<string, string> = {
  qualifications: "Qualifications",
  yearsOfExperience: "Years of experience",
  currentOrganization: "Current organization",
  licenseNumber: "License number",
  specializations: "Specializations",
  areasOfExpertise: "Areas of expertise",
  languages: "Languages",
  consultationModes: "Consultation modes",
  availability: "Availability",
  biography: "Biography",
  phone: "Phone",
  location: "Location",
  clinicAddress: "Clinic address",
  linkedinUrl: "LinkedIn",
  portfolioUrl: "Portfolio",
};

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

export default function ConsultantReviewPage() {
  const router = useRouter();
  const { state, hydrated, reset } = useConsultantOnboarding();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const parsed = consultantOnboardingSchema.safeParse({
      qualifications: state.qualifications,
      yearsOfExperience: state.yearsOfExperience,
      currentOrganization: state.currentOrganization || undefined,
      licenseNumber: state.licenseNumber || undefined,
      specializations: state.specializations,
      areasOfExpertise: state.areasOfExpertise,
      languages: state.languages,
      consultationModes: state.consultationModes,
      availability: state.availability || undefined,
      biography: state.biography,
      phone: state.phone,
      location: state.location || undefined,
      clinicAddress: state.clinicAddress || undefined,
      linkedinUrl: state.linkedinUrl || undefined,
      portfolioUrl: state.portfolioUrl || undefined,
    });
    if (!parsed.success) {
      setError("Some required fields are missing — please go back and complete every step.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/consultant-onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      reset();
      router.push("/consultant/dashboard");
    } catch {
      setError("Network error — check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (!hydrated) return null;

  return (
    <OnboardingShell
      step={4}
      backHref="/consultant-onboarding/contact"
      continueLabel={submitting ? "Submitting…" : "Submit application"}
      continueDisabled={submitting}
      onContinue={() => {
        void handleSubmit();
        return false;
      }}
    >
      <div className="mb-10">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          Review your application
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl font-sans">
          Double-check everything below — you can edit any section before submitting.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive mb-6 flex items-start gap-2 rounded-lg p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {SUMMARY_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-on-surface text-base font-semibold">
                {section.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<a href={section.editHref}>Edit</a>}
              />
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field} className="flex flex-col gap-0.5">
                  <dt className="text-on-surface-variant font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                    {FIELD_LABELS[field]}
                  </dt>
                  <dd className="text-on-surface font-sans text-sm break-words">
                    {formatValue(state[field as keyof typeof state])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <p className="text-on-surface-variant mt-8 text-center font-sans text-xs">
        You&apos;ll be able to upload your professional certificate and license from
        your dashboard right after submitting.
      </p>
    </OnboardingShell>
  );
}
