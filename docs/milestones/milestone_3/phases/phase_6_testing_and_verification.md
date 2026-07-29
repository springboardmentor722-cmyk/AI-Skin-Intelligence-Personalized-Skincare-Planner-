# M3R Phase 6 — Testing & Verification Workflow (Rubric Step 5)

**Branch:** `feat/m3r-p6-e2e-verification` (from `dev`) · **Agents:** QA Agent (lead) +
Review Agent · **Depends:** P1–P5 merged.
**Skills/plugins:** find-skills (check for a Playwright/e2e skill first — if a good one
exists uninstalled, ask Kiran to install it before hand-rolling), graphify, code-review.

> P1–P5 each shipped their own unit/integration tests. This phase adds the
> rubric-literal cross-cutting verification and closes coverage gaps found along the way.

## Tasks

- **M3R-P6-T1 — Rubric unit-test sweep.** Confirm (and fill gaps in) the three
  rubric-named test classes, as named suites a grader can run and read:
  chemical-clash detection triggers on unsafe pairings · allergy filters remove unsafe
  products from recommendations · adherence formulas exact on fixtures (7/30/90,
  mid-window routine change, day boundary). Real-store fixtures, no mocks.
- **M3R-P6-T2 — The rubric E2E walkthrough** as one named Playwright spec
  (`tests/e2e/m3-rubric-walkthrough.spec.ts`), against the real stack, following the
  repo's e2e rules (`clearRateLimits()` first, `workers: 1`, `getByRole("button")` for
  Base-UI link-buttons):
  1. Submit an initial assessment; review generated recommendations.
  2. Check off routine tasks; upload a progress photo.
  3. As dermatologist: open the user, inspect the photo + compliance stats, update an
     evening treatment step.
  4. Back as the user: confirm the revised routine displays live.
  Both themes; screenshots at each numbered step saved under
  `docs/milestones/milestone_3/build/e2e/`.
- **M3R-P6-T3 — Cross-dashboard sync + persistence checks.** Restart backend +
  stores mid-suite scenario: check-ins, photos, and the overwritten routine survive
  (DB persistence, not client state). Consultant sees the same post-overwrite state
  the dermatologist created.
- **M3R-P6-T4 — Full-gate run.** Entire backend suite, frontend unit tests, full e2e
  suite, `ruff`/`mypy --strict`/`eslint`/`tsc`, production `next build` — all green in
  one run, output pasted into the phase report. Any red = fix on `fix/m3r-*` branch
  before this phase closes.

## Verification

The walkthrough spec passes 3× consecutively (flake check). Gate outputs pasted.
Coverage of the three rubric test classes cited by file/test name in the ledger.

## Exit

`/code-review` → merge to `dev` → delete branch → `graphify update .` → `PROGRESS.md`.
