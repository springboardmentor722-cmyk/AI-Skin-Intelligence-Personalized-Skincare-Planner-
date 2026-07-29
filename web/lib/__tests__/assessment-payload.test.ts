import test from "node:test";
import assert from "node:assert/strict";

import { buildAssessmentSubmitPayload } from "../assessment/payload.ts";
import type { AssessmentState } from "../assessment/context.ts";

// Milestone 2 P8 — MILESTONE 2.docx §"3. How the Payload Sends to the Backend"'s
// worked example, verbatim: skin_type Oily, acne_severity 7,
// hyperpigmentation_severity 4, redness 0, wrinkles 0, sleep_hours 7.5,
// water_intake_liters 2.5, stress_level 4, sun_exposure "Moderate". Concern ids are
// test-local (this asserts the builder's own mapping logic, not real database ids —
// concernId is passed straight through into concerns[] unchanged either way).
const EXAMPLE_STATE: AssessmentState = {
  ageGroup: "25-34",
  goals: [],
  location: "",
  skinTypeId: 1,
  skinTypeName: "Oily",
  priorities: [
    { concernId: 101, concernName: "Acne", severity: 7 },
    { concernId: 102, concernName: "Hyperpigmentation", severity: 4 },
  ],
  sleepHours: 7.5,
  waterLiters: 2.5,
  stressLevel: 4,
  sunExposure: "Moderate",
};

test("buildAssessmentSubmitPayload — matches mile_2.docx's worked example exactly", () => {
  const payload = buildAssessmentSubmitPayload(EXAMPLE_STATE, "usr_99");

  assert.equal(payload.user_id, "usr_99");
  assert.equal(payload.skin_type, "Oily");
  assert.equal(payload.age_group, "25-34");
  assert.equal(payload.acne_severity, 7);
  assert.equal(payload.hyperpigmentation_severity, 4);
  assert.equal(payload.redness_severity, 0);
  assert.equal(payload.wrinkles_severity, 0);
  assert.deepEqual(payload.lifestyle, {
    sleep_hours: 7.5,
    water_intake_liters: 2.5,
    stress_level: 4,
    sun_exposure: "Moderate",
  });
  // Canonical array alongside the deprecated flat fields (ADR-021 C4).
  assert.deepEqual(payload.concerns, [
    { id: 101, severity: 7 },
    { id: 102, severity: 4 },
  ]);
});

test("buildAssessmentSubmitPayload — every seeded concern's flat field defaults to 0 when not selected", () => {
  const payload = buildAssessmentSubmitPayload(EXAMPLE_STATE, "usr_99");
  for (const field of [
    "dark_spots_severity",
    "dry_skin_severity",
    "oily_skin_severity",
    "sensitive_skin_severity",
    "fine_lines_severity",
    "uneven_skin_tone_severity",
  ] as const) {
    assert.equal(payload[field], 0);
  }
});

test("buildAssessmentSubmitPayload — no concerns selected yields an empty concerns[] and all-zero flat fields", () => {
  const payload = buildAssessmentSubmitPayload({ ...EXAMPLE_STATE, priorities: [] }, "usr_1");
  assert.deepEqual(payload.concerns, []);
  assert.equal(payload.acne_severity, 0);
});

test("buildAssessmentSubmitPayload — omits age_group when the wizard state has none", () => {
  const payload = buildAssessmentSubmitPayload({ ...EXAMPLE_STATE, ageGroup: null }, "usr_1");
  assert.equal(payload.age_group, undefined);
});
