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
