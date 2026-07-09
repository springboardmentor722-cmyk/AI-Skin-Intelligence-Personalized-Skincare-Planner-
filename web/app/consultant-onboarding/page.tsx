"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, ShieldCheck, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/consultant-onboarding/onboarding-shell";

const REQUIREMENTS = [
  {
    icon: Stethoscope,
    title: "Professional background",
    body: "Qualifications, years of experience, and your current organization.",
  },
  {
    icon: FileText,
    title: "Practice details",
    body: "Specializations, languages, consultation modes, and a short biography.",
  },
  {
    icon: BadgeCheck,
    title: "Verification documents",
    body: "A professional certificate (and license, if applicable) — uploaded from your dashboard once your account is created.",
  },
];

// New UX — no wireframe exists for this (docs/AGENTS.md's "genuinely new" carve-out,
// Branch 4 of the Milestone 1 foundation expansion). Reachable by a plain "user"
// account applying for the first time, or a "consultant" account whose application
// was rejected/needs more info and is resubmitting.
export default function ConsultantOnboardingIntroPage() {
  return (
    <OnboardingShell hideFooter>
      <div className="flex flex-col gap-10 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-on-surface text-4xl font-bold">
            Apply as a skincare consultant
          </h1>
          <p className="text-on-surface-variant mx-auto max-w-xl font-sans text-lg">
            Tell us about your professional background. Our team reviews every
            application before your account unlocks client-facing features.
          </p>
        </div>

        <div className="glass grid grid-cols-1 gap-6 rounded-2xl p-8 text-left md:grid-cols-3 md:p-10">
          {REQUIREMENTS.map((req) => (
            <div key={req.title} className="flex flex-col gap-3">
              <div className="bg-secondary/10 text-secondary w-fit rounded-lg p-2">
                <req.icon className="size-5" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading text-on-surface text-sm font-semibold">
                  {req.title}
                </h3>
                <p className="text-on-surface-variant mt-1 font-sans text-xs">{req.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-on-surface-variant flex flex-col items-center justify-center gap-3 font-sans text-sm sm:flex-row">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" strokeWidth={1.5} />
            Your account stays in &ldquo;pending review&rdquo; until approved
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="px-8"
            nativeButton={false}
            render={
              <Link href="/consultant-onboarding/background">
                Start application
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/assessment">Not now</Link>}
          />
        </div>
      </div>
    </OnboardingShell>
  );
}
