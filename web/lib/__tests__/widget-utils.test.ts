import test from "node:test";
import assert from "node:assert/strict";

import { getScoreBand, windowByCalendarDays } from "../score-components.ts";
import { computePercent, formatPrice, stripMarkdownArtifacts } from "../utils.ts";

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

// M3R-P4 fix — a sparse score_vs_adherence series (gaps are normal: a user
// who doesn't check in daily) must be windowed by calendar days, not by
// slicing the last N array entries (which can span far more than N days).
test("windowByCalendarDays — sparse points: only entries within N calendar days of the latest survive", () => {
  const points = [
    { date: "2026-01-01" },
    { date: "2026-01-15" }, // 30 days before the latest — outside a 7-day window
    { date: "2026-01-25" }, // 6 days before the latest — inside a 7-day window
    { date: "2026-01-31" }, // latest point, "today" for this calculation
  ];
  const result = windowByCalendarDays(points, 7);
  assert.deepEqual(
    result.map((p) => p.date),
    ["2026-01-25", "2026-01-31"]
  );
});

test("windowByCalendarDays — dense points: count-based slice would have been wrong, calendar window is right", () => {
  // 10 daily points; a naive slice(-7) would keep the last 7 by count, which
  // here happens to equal the calendar window — but a 3-day window must keep
  // only the last 3 calendar days, not the last 3 array entries starting
  // from a different offset.
  const points = Array.from({ length: 10 }, (_, i) => ({ date: `2026-02-${String(i + 1).padStart(2, "0")}` }));
  const result = windowByCalendarDays(points, 3);
  assert.deepEqual(
    result.map((p) => p.date),
    ["2026-02-08", "2026-02-09", "2026-02-10"]
  );
});

test("windowByCalendarDays — empty input returns empty output", () => {
  assert.deepEqual(windowByCalendarDays([], 7), []);
});

// UI polish pass — scraped seed data (training_dataset raw CSV/JSON) sometimes
// carries literal markdown emphasis with no renderer to interpret it.
test("stripMarkdownArtifacts — strips unbalanced/stray asterisks", () => {
  assert.equal(stripMarkdownArtifacts("**Urtica Dioica Leaf Extract"), "Urtica Dioica Leaf Extract");
  assert.equal(stripMarkdownArtifacts("Plain Ingredient Name"), "Plain Ingredient Name");
  assert.equal(stripMarkdownArtifacts("**Bold** mid *word* end"), "Bold mid word end");
});

test("stripMarkdownArtifacts — passes through null/undefined unchanged", () => {
  assert.equal(stripMarkdownArtifacts(null), null);
  assert.equal(stripMarkdownArtifacts(undefined), undefined);
});
