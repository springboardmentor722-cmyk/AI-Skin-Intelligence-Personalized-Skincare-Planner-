import type { AssessmentState } from "@/lib/assessment/context";
import type { components } from "@/lib/api-types";

type SkinProfileCreate = components["schemas"]["SkinProfileCreate"];
type LifestyleLogCreate = components["schemas"]["LifestyleLogCreate"];

// The assessment wizard (web/app/assessment/*) and the Skin profile & lifestyle screen
// (web/app/(user)/profile, components/skin-profile/*) ask overlapping questions —
// skin type, concerns, allergies, sensitivities, sleep, water, stress, sun exposure —
// but the wizard never used to persist any of it; it only computed a client-side score
// estimate and discarded the answers. That meant finishing the assessment and then
// opening /profile asked the user to re-enter the same information from scratch.
//
// These two functions map the wizard's own state onto the real backend request shapes
// so assessment/results/page.tsx can actually save it (POST /skin-profiles +
// POST /lifestyle-logs) — the same endpoints /profile's forms already use, so /profile
// opens pre-filled afterward instead of empty. Not every field lines up 1:1: some are
// direct matches, some need a shape conversion (documented per-field below), and some
// questions /profile's lifestyle form asks (gender, diet quality, exercise frequency,
// smoking, alcohol, pollution level, AC hours) aren't collected by the wizard at all —
// left unset here, not guessed, so /profile still has real, non-redundant work to do.

const SEVERITY_TO_RATING: Record<AssessmentState["priorities"][number]["severity"], number> = {
  mild: 3,
  moderate: 6,
  severe: 9,
};

// No priority slider in the wizard (docs/WIREFRAMES.md's own assessment spec uses
// selection order, not a 1–10 control) — this converts rank position to a descending
// 1–10 scale so the value still means "how important is this relative to the others",
// matching /profile's own priority_level semantics as closely as selection-order allows.
const PRIORITY_RANK_TO_LEVEL = [10, 7, 4] as const;

const SLEEP_QUALITY_TO_RATING: Record<string, number> = {
  "Restful, uninterrupted": 9,
  "Occasional waking": 6,
  "Frequent insomnia": 3,
};

// Representative hours per bucket — the wizard asks a category, /profile's lifestyle
// form asks real hours; this is a stated approximation, not a measured value.
const SUN_EXPOSURE_TO_HOURS: Record<AssessmentState["sunExposure"], number> = {
  indoor: 0.5,
  occasional: 2,
  outdoor: 4,
  intense: 6,
};

const SENSITIVITY_LABELS: Record<keyof AssessmentState["sensitivities"], string> = {
  reactsToActives: "Reacts to actives",
  sunSensitive: "Sun-sensitive",
  rednessProne: "Redness-prone",
};

export function assessmentToSkinProfilePayload(state: AssessmentState): SkinProfileCreate | null {
  if (!state.skinTypeId) return null; // required by the backend; nothing to save without it

  const sensitivityTags = (Object.keys(state.sensitivities) as (keyof AssessmentState["sensitivities"])[])
    .filter((key) => state.sensitivities[key])
    .map((key) => SENSITIVITY_LABELS[key]);

  return {
    skin_type_id: state.skinTypeId,
    age_group: state.ageGroup ?? null,
    allergies: state.allergies.length > 0 ? state.allergies.join(", ") : null,
    sensitivities: sensitivityTags.length > 0 ? sensitivityTags.join(", ") : null,
    concerns: state.priorities.map((p, i) => ({
      concern_id: p.concernId,
      severity_rating: SEVERITY_TO_RATING[p.severity],
      priority_level: PRIORITY_RANK_TO_LEVEL[i] ?? 1,
    })),
  };
}

export function assessmentToLifestyleLogPayload(state: AssessmentState): LifestyleLogCreate {
  return {
    log_date: new Date().toISOString().slice(0, 10),
    sleep_hours: state.sleepHours,
    sleep_quality: SLEEP_QUALITY_TO_RATING[state.sleepQuality] ?? null,
    // Standard 250ml-glass conversion, same as backend/app/services/scores/service.py's
    // own hydration-score calculation.
    water_intake_liters: Math.round(state.waterGlasses * 0.25 * 100) / 100,
    stress_level: state.stressLevel,
    // Not collected by the wizard — left unset, not guessed.
    diet_quality: null,
    exercise_frequency: null,
    smoking: null,
    alcohol_consumption: null,
    environmental_exposure: {
      sun_hours: SUN_EXPOSURE_TO_HOURS[state.sunExposure],
      pollution_level: null,
      ac_exposure_hours: null,
    },
  };
}
