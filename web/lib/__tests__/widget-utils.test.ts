import test from "node:test";
import assert from "node:assert/strict";

import { getScoreBand } from "../score-components.ts";
import { computePercent, formatPrice } from "../utils.ts";

// Milestone 2 P3 — pure-function unit tests for the widget kit's three non-JSX
// pieces (score ramp, percentage maths, en-IN currency). Run with
// `node --test lib/__tests__/widget-utils.test.ts` — Node 24 strips TS types
// natively, so no test runner dependency (vitest/jest) is needed for three
// pure functions with zero DOM/React surface.

test("getScoreBand — Good/Fair/Poor boundaries", () => {
  assert.equal(getScoreBand(100).label, "Good");
  assert.equal(getScoreBand(75).label, "Good");
  assert.equal(getScoreBand(74).label, "Fair");
  assert.equal(getScoreBand(60).label, "Fair");
  assert.equal(getScoreBand(59).label, "Poor");
  assert.equal(getScoreBand(0).label, "Poor");
});

test("getScoreBand — colour vars point at the existing semantic tokens", () => {
  assert.equal(getScoreBand(80).colorVar, "var(--success)");
  assert.equal(getScoreBand(65).colorVar, "var(--warning)");
  assert.equal(getScoreBand(10).colorVar, "var(--error)");
});

test("computePercent — normal shares", () => {
  assert.equal(computePercent(1, 4), 25);
  assert.equal(computePercent(2, 3), 67);
  assert.equal(computePercent(0, 10), 0);
});

test("computePercent — degenerate totals never divide by zero or go negative", () => {
  assert.equal(computePercent(5, 0), 0);
  assert.equal(computePercent(-5, 10), 0);
});

test("computePercent — clamps above 100", () => {
  assert.equal(computePercent(150, 100), 100);
});

test("formatPrice — en-IN grouping, no naive thousands separator", () => {
  assert.equal(formatPrice(2480500, "INR"), "₹24,80,500");
  assert.equal(formatPrice(349, "INR"), "₹349");
});

test("formatPrice — null price is an honest dash, not 0 or NaN", () => {
  assert.equal(formatPrice(null, "INR"), "—");
});
