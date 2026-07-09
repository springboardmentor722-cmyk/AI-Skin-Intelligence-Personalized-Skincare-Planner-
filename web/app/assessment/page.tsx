"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Camera, Fingerprint, Moon, Thermometer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssessmentShell } from "@/components/assessment/assessment-shell";

const ANALYSIS_POINTS = [
  {
    icon: Fingerprint,
    title: "Skin type & concerns",
    body: "Your baseline skin type and the specific concerns you want addressed.",
  },
  {
    icon: Moon,
    title: "Lifestyle & sleep",
    body: "Recovery cycles and daily habits that affect barrier health.",
  },
  {
    icon: Thermometer,
    title: "Environmental stress",
    body: "Sun exposure and environment factors that shape your routine.",
  },
];

// web/designs/wireframes/assessment-intro.html
export default function AssessmentIntroPage() {
  return (
    <AssessmentShell hideFooter>
      <div className="flex flex-col gap-10 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-on-surface text-4xl font-bold">
            Let&apos;s understand your skin.
          </h1>
          <p className="text-on-surface-variant mx-auto max-w-xl font-sans text-lg">
            Your personalized clinical-grade analysis begins with a comprehensive look at
            your unique biology and environment.
          </p>
        </div>

        <div className="glass grid grid-cols-1 items-center gap-8 rounded-2xl p-8 text-left md:grid-cols-2 md:p-10">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-heading text-on-surface mb-2 text-xl font-semibold">
                Assessment plan
              </h2>
              <p className="text-on-surface-variant font-sans text-sm">
                A 4-step protocol taking about 3 minutes, followed by your results.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {ANALYSIS_POINTS.map((point) => (
                <div key={point.title} className="flex items-start gap-3">
                  <div className="bg-secondary/10 text-secondary rounded-lg p-2">
                    <point.icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-semibold">{point.title}</h3>
                    <p className="text-on-surface-variant font-sans text-xs">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-4/5 overflow-hidden rounded-xl">
            <Image
              src="/images/assessment/intro.jpg"
              alt="Diagnostic facial scan in progress"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="text-on-surface-variant flex flex-col items-center justify-center gap-3 font-sans text-sm sm:flex-row">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" strokeWidth={1.5} />
            HIPAA compliant privacy
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Camera className="size-4" strokeWidth={1.5} />
            No photo required to complete this assessment
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="px-8"
            nativeButton={false}
            render={
              <Link href="/assessment/basics">
                Begin assessment
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard">Skip for now</Link>}
          />
        </div>
      </div>
    </AssessmentShell>
  );
}
