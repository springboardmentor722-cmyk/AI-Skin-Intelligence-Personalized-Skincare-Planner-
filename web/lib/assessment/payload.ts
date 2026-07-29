import type { AssessmentState, SunExposure } from "./context.ts";

// Milestone 2 P8 (MILESTONE 2.docx §"3. How the Payload Sends to the Backend") —
// the exact frozen request shape, flat per-concern severity fields (deprecated,
// kept for doc-literal backward compatibility, ADR-021 C4) alongside the canonical
// `concerns[]` array. These 10 keys are the seeded skin_concerns table's names run
// through severityFieldForConcernName (confirmed live this session, matches
// web/lib/assessment/skin-concerns.json's own `backend_field` values) — a new
// concern added to the seed data must add its field here too. No runtime import of
// datasets.ts here on purpose: this file (and its unit test,
// lib/__tests__/assessment-payload.test.ts) runs under plain `node --test`, which
// can't load datasets.ts's JSON imports without a bundler.
const FLAT_SEVERITY_FIELDS = [
  "acne_severity",
  "hyperpigmentation_severity",
  "dark_spots_severity",
  "dry_skin_severity",
  "oily_skin_severity",
  "sensitive_skin_severity",
  "wrinkles_severity",
  "fine_lines_severity",
  "redness_severity",
  "uneven_skin_tone_severity",
] as const;

type FlatSeverityField = (typeof FLAT_SEVERITY_FIELDS)[number];

export type AssessmentSubmitPayload = {
  user_id: string;
  skin_type: string;
  age_group?: string;
  lifestyle: {
    sleep_hours: number;
    water_intake_liters: number;
    stress_level: number;
    sun_exposure: SunExposure;
  };
  concerns: { id: number; severity: number }[];
} & Record<FlatSeverityField, number>;

// Mirrors web/lib/assessment/datasets.ts's severityFieldForConcernName exactly
// (mechanical transform, not a lookup table) — duplicated rather than imported so
// this file stays runnable under plain Node for its unit test.
function severityField(concernName: string): string {
  return `${concernName.toLowerCase().replace(/\s+/g, "_")}_severity`;
}

export function buildAssessmentSubmitPayload(
  state: AssessmentState,
  userId: string
): AssessmentSubmitPayload {
  const severityByField = new Map(
    state.priorities.map((p) => [severityField(p.concernName), p.severity])
  );

  const flatSeverities = Object.fromEntries(
    FLAT_SEVERITY_FIELDS.map((field) => [field, severityByField.get(field) ?? 0])
  ) as Record<FlatSeverityField, number>;

  return {
    user_id: userId,
    skin_type: state.skinTypeName ?? "",
    age_group: state.ageGroup ?? undefined,
    ...flatSeverities,
    lifestyle: {
      sleep_hours: state.sleepHours,
      water_intake_liters: state.waterLiters,
      stress_level: state.stressLevel,
      sun_exposure: state.sunExposure,
    },
    concerns: state.priorities.map((p) => ({ id: p.concernId, severity: p.severity })),
  };
}
