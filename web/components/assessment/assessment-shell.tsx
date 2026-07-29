"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "/assessment/basics", label: "Basics" },
  { path: "/assessment/skin-type", label: "Skin type" },
  { path: "/assessment/concerns", label: "Concerns" },
  { path: "/assessment/severity", label: "Severity" },
  { path: "/assessment/lifestyle", label: "Lifestyle" },
  { path: "/assessment/results", label: "Done" },
];

interface AssessmentShellProps {
  /** 1-indexed step number matching STEPS above; omit for the intro screen. */
  step?: number;
  children: React.ReactNode;
  backHref?: string;
  onContinue?: () => boolean | void;
  continueHref?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  /** Intro (web/designs/wireframes/assessment-intro.html) has its own inline, centered
   * CTAs, not the sticky Back/Continue footer bar the 4 step screens use. */
  hideFooter?: boolean;
}

// Shared chrome for every assessment screen — web/designs/wireframes/assessment-step-*
// .html: sticky glass progress header + step chips, sticky glass Back/Continue footer.
// No app shell (sidebar/topbar) — this wizard is a standalone flow, like /login /signup.
export function AssessmentShell({
  step,
  children,
  backHref,
  onContinue,
  continueHref,
  continueLabel = "Continue",
  continueDisabled,
  hideFooter = false,
}: AssessmentShellProps) {
  const router = useRouter();
  const progressPercent = step ? (step / STEPS.length) * 100 : 0;

  const handleContinue = () => {
    const proceed = onContinue?.();
    if (proceed === false) return;
    if (continueHref) router.push(continueHref);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-50 rounded-none border-x-0 border-t-0">
        <div className="mx-auto max-w-7xl flex flex-col gap-3 px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-heading text-on-surface text-lg font-bold">
              Skinlytics
            </Link>
            <span className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
              {step ? `Step ${step} of ${STEPS.length}` : "Introduction"}
            </span>
          </div>
          {step != null && (
            <>
              <Progress
                value={progressPercent}
                trackClassName="h-1"
                indicatorClassName="bg-secondary transition-all duration-500"
              />
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {STEPS.map((s, i) => {
                  const stepNum = i + 1;
                  const done = stepNum < step;
                  const active = stepNum === step;
                  return (
                    <span
                      key={s.path}
                      className={cn(
                        "font-geist flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        active && "bg-secondary text-secondary-foreground",
                        done && "bg-secondary/10 text-secondary",
                        !active && !done && "bg-muted text-on-surface-variant"
                      )}
                    >
                      {done && <Check className="size-3" strokeWidth={2} />}
                      {s.label}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">{children}</main>

      {!hideFooter && (
        <footer className="glass sticky bottom-0 z-50 mt-auto rounded-none border-x-0 border-b-0">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            {backHref ? (
              <Button variant="outline" nativeButton={false} render={<Link href={backHref}>Back</Link>} />
            ) : (
              <span />
            )}
            <Button onClick={handleContinue} disabled={continueDisabled}>
              {continueLabel}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
