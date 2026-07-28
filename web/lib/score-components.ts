import type { components } from "@/lib/api-types";

type ScoreRead = components["schemas"]["ScoreRead"];

// Shared between the dashboard and the assessment wizard's results page — both
// render the same real ScoreRead breakdown, same labels/order, so they must stay
// in lockstep rather than each keeping its own copy.
// Good/Fair/Poor ramp for score rings, chips, and badges across all four roles
// (Milestone 2 UI pack, MILESTONE_2_MASTER_PROMPT.md §1a THEME OVERRIDE: "The score
// ramp ... stay[s]; render them with the existing theme's success/warning/danger
// tokens" — reuses --success/--warning/--error already in app/globals.css rather
// than the separate theme-invariant --score-teal/blue/amber/red 4-band system
// docs/DESIGN.md §2 defines for the Skin Score Ring gradient, a different element).
/**
 * Daily fluid benchmark the H (Hydration) sub-score is graded against.
 *
 * MUST equal `HYDRATION_BENCHMARK_LITERS` in
 * backend/app/services/scores/constants.py. ADR-021 C3 / ADR-028 corrected that
 * benchmark from 2.0L to 3.0L at P10, but the dashboard kept its own hardcoded
 * 2.5L, so the "Hydration Level" card graded the user against a third number
 * that matched neither the old value nor the new one — a user drinking 2.5L saw
 * "100% of 2.5L goal" while their actual H sub-score was 83.
 *
 * The durable fix is for the API to publish the benchmark alongside the score
 * so there is exactly one source; until then this constant is the single
 * frontend copy and the docstring is the link.
 */
export const HYDRATION_BENCHMARK_LITERS = 3.0;

export const SCORE_BANDS = [
  { min: 75, label: "Good", colorVar: "var(--success)" },
  { min: 60, label: "Fair", colorVar: "var(--warning)" },
  { min: 0, label: "Poor", colorVar: "var(--error)" },
] as const;

export type ScoreBandLabel = (typeof SCORE_BANDS)[number]["label"];

export function getScoreBand(value: number): { label: ScoreBandLabel; colorVar: string } {
  const band = SCORE_BANDS.find((b) => value >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
  return { label: band.label, colorVar: band.colorVar };
}

/**
 * `GET /analytics/me`'s `score_vs_adherence` series has one point per day a
 * score was actually computed — gaps are normal for a user who doesn't check
 * in daily, so slicing the last N *entries* ("last 7 points") can silently
 * span far more than N *calendar* days once the data is sparse. The
 * dashboard's range switcher promises a literal "7/30/90 days" window
 * (M3R_API_CONTRACT.md §4), so this filters by actual calendar distance
 * instead. Uses the latest point's own date as "today" rather than the real
 * current date, since historical/seed data may not include today.
 */
export function windowByCalendarDays<T extends { date: string }>(points: T[], days: number): T[] {
  if (points.length === 0) return [];
  const cutoff = new Date(points[points.length - 1].date);
  cutoff.setDate(cutoff.getDate() - days);
  return points.filter((p) => new Date(p.date) > cutoff);
}

export const SCORE_COMPONENTS: {
  key: keyof Pick<
    ScoreRead,
    | "skin_condition_score"
    | "lifestyle_score"
    | "routine_adherence_score"
    | "sleep_quality_score"
    | "hydration_score"
  >;
  label: string;
  weight: keyof ScoreRead["weights"];
}[] = [
  { key: "skin_condition_score", label: "Condition", weight: "skin_condition_weight" },
  { key: "lifestyle_score", label: "Lifestyle", weight: "lifestyle_weight" },
  { key: "routine_adherence_score", label: "Routine", weight: "routine_adherence_weight" },
  { key: "sleep_quality_score", label: "Sleep", weight: "sleep_quality_weight" },
  { key: "hydration_score", label: "Hydration", weight: "hydration_weight" },
];
