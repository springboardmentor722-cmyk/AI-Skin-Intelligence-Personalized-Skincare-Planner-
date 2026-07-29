"use client";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Slider } from "@/components/ui/slider";
import { useAssessment } from "@/lib/assessment/context";

// Base UI's Slider supports multi-thumb range sliders, so onValueChange is typed to
// accept either a single number or an array — these sliders are always single-thumb.
const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

// Milestone 2 P8 (MILESTONE 2.docx §"1. In-Built Visual Dataset & Wizard UI",
// "Severity Sliders: Selected concerns open intensity sliders (0 to 10)") — Step 3.
// Guardrail: a slider renders only for a concern the user actually selected on the
// previous step — this maps over `state.priorities` directly, nothing else, so
// there's no path to a slider for an unselected concern.
export default function AssessmentSeverityPage() {
  const { state, update } = useAssessment();

  const setSeverity = (concernId: number, severity: number) => {
    update({
      priorities: state.priorities.map((p) => (p.concernId === concernId ? { ...p, severity } : p)),
    });
  };

  return (
    <AssessmentShell step={4} backHref="/assessment/concerns" continueHref="/assessment/lifestyle">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-on-surface text-3xl font-bold">
          How severe is each concern?
        </h1>
        <p className="text-on-surface-variant mx-auto mt-2 max-w-xl font-sans">
          Rate the intensity of each concern you selected, from barely noticeable to
          severe.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-8 rounded-2xl border p-6 md:p-10">
        {state.priorities.map((priority) => (
          <div key={priority.concernId} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold">
                {priority.concernName} Severity
              </span>
              <span className="font-geist text-secondary text-sm font-semibold tabular-nums">
                {priority.severity} / 10
              </span>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[priority.severity]}
              onValueChange={(v) => setSeverity(priority.concernId, firstOf(v))}
              aria-label={`${priority.concernName} severity`}
            />
          </div>
        ))}
      </div>
    </AssessmentShell>
  );
}
