import test from "node:test";
import assert from "node:assert/strict";

import { getSeverityBand } from "../severity-band.ts";

// Boundaries verified against backend/app/services/scores/constants.py:
// CONDITION_MEDIUM_SEVERITY_MIN = 4, CONDITION_HIGH_SEVERITY_MIN = 8.
test("getSeverityBand — Low/Medium/High boundaries", () => {
  assert.equal(getSeverityBand(1).tier, "low");
  assert.equal(getSeverityBand(3).tier, "low");
  assert.equal(getSeverityBand(4).tier, "medium");
  assert.equal(getSeverityBand(7).tier, "medium");
  assert.equal(getSeverityBand(8).tier, "high");
  assert.equal(getSeverityBand(10).tier, "high");
});

test("getSeverityBand — labels", () => {
  assert.equal(getSeverityBand(2).label, "Low");
  assert.equal(getSeverityBand(5).label, "Medium");
  assert.equal(getSeverityBand(9).label, "High");
});
