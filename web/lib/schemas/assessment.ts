import { z } from "zod";

// Milestone 2 P8 — per-step validation for web/app/assessment/*, matching mile_2's
// 4-step wizard mechanics ("Wizard mechanics: ... per-step Zod validation").

export const basicsStepSchema = z.object({
  ageGroup: z.string({ error: "Select your age group to continue." }),
});

export const skinTypeStepSchema = z.object({
  skinTypeId: z.number({ error: "Select your skin type to continue." }),
});

export const concernsStepSchema = z.object({
  priorities: z
    .array(z.object({ concernId: z.number(), concernName: z.string(), severity: z.number() }))
    .min(1, "Select at least one concern to continue."),
});

export const lifestyleStepSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  waterLiters: z.number().min(0).max(10),
  stressLevel: z.number().min(1).max(10),
  sunExposure: z.enum(["None", "Low", "Moderate", "High"]),
});

/** Runs a step schema against wizard state; returns the first issue's message, or
 * null when the step is valid — the shared shape every step page's onContinue uses. */
export function firstStepError(schema: z.ZodType, value: unknown): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Please check this step.");
}
