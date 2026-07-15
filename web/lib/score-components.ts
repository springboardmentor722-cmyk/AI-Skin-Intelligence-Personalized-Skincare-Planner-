import type { components } from "@/lib/api-types";

type ScoreRead = components["schemas"]["ScoreRead"];

// Shared between the dashboard and the assessment wizard's results page — both
// render the same real ScoreRead breakdown, same labels/order, so they must stay
// in lockstep rather than each keeping its own copy.
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
