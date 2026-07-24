import type { components } from "@/lib/api-types";
import type { AssessmentSubmitPayload } from "@/lib/assessment/payload";

type ScoreRead = components["schemas"]["ScoreRead"];

// Milestone 2 P8 — UI phases run against fixtures until P14 swaps in the real
// POST /api/v1/assessment/submit (MILESTONE_2_MASTER_PROMPT.md §12 sequencing
// rule; P9 builds real persistence, P10 the real weighted engine). A canned
// ScoreRead-shaped response, not a live network call. Weights match the docx
// formula (0.35/0.20/0.15/0.20/0.10) — already the live scoring engine's weights
// too (AGENTS.md §5), so this fixture won't need reshaping once P14 swaps it out.
const WEIGHTS = {
  skin_condition_weight: 0.35,
  lifestyle_weight: 0.2,
  sleep_quality_weight: 0.15,
  routine_adherence_weight: 0.2,
  hydration_weight: 0.1,
} as const;

// `payload` isn't read yet — kept in the signature since P9/P14 swap this
// function's body for a real network call without touching any call site.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assessmentSubmitFixture(payload: AssessmentSubmitPayload): ScoreRead {
  const skin_condition_score = 78;
  const lifestyle_score = 82;
  const sleep_quality_score = 75;
  // A brand-new assessment has no completion history yet — docx: "defaults to
  // 100% for new assessments."
  const routine_adherence_score = 100;
  const hydration_score = 88;

  const overall_score =
    WEIGHTS.skin_condition_weight * skin_condition_score +
    WEIGHTS.lifestyle_weight * lifestyle_score +
    WEIGHTS.sleep_quality_weight * sleep_quality_score +
    WEIGHTS.routine_adherence_weight * routine_adherence_score +
    WEIGHTS.hydration_weight * hydration_score;

  return {
    score_id: 0,
    skin_condition_score,
    lifestyle_score,
    sleep_quality_score,
    hydration_score,
    routine_adherence_score,
    overall_score: Math.round(overall_score * 10) / 10,
    weights: WEIGHTS,
    calculated_at: new Date().toISOString(),
  };
}
