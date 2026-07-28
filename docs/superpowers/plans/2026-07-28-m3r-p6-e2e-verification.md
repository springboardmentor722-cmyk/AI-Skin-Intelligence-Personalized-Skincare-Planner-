# M3R Phase 6 — Testing & Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close M3R-P6-T1 through T4 (`docs/milestones/milestone_3/M3R_TASK_LEDGER.md`,
`docs/milestones/milestone_3/phases/phase_6_testing_and_verification.md`) —
`MILESTONE 3.pdf` Step 5's cross-cutting verification requirements, now that
P1-P5 are all merged.

**Pre-flight investigation already done (do not re-derive):**
- (a) Chemical-clash detection: solidly covered by `backend/tests/test_interactions.py`
  (5 tests) — flat pytest functions with clear names, no gap.
- (b) Allergy filtering: solidly covered across `backend/tests/test_suitability.py`
  (allergy-match logic) and `backend/tests/test_recommendations_service.py`
  (end-to-end allergy exclusion from recommendations) — no gap.
- (c) Adherence formulas: **real gap** in `backend/tests/test_progress_service.py`.
  `test_get_compliance_percentages_computes_completed_over_assigned` (line 222) only
  exact-asserts the 7-day ratio; 30/90-day are merely checked `is not None`, not
  exact-value-asserted. The existing mid-window-routine-change test (line 175) only
  covers `get_adherence_series`, never `get_compliance_percentages` (the actual 7/30/90
  formula) — so a routine change mid-window is untested against the function the
  rubric actually names. No day-boundary test exists at all (grepped, zero matches).
- `tests/e2e/m3-rubric-walkthrough.spec.ts` does not exist yet.
  `web/tests/e2e/user-journey.spec.ts` already covers assessment→recommendations→
  checklist-tick (steps 1-2 of the rubric walkthrough) — extend its pattern, don't
  rebuild. Nothing existing covers photo upload, a dermatologist inspecting/editing,
  or the "user sees the live update" loop.
- `web/tests/e2e/helpers.ts` already has `pool()`, `clearRateLimits()`,
  `deleteTestUser()`, `deleteMongoLogsForUser()`, `signOut()`, `promoteRole()`,
  `screenshotPath()` — reuse every one of these, don't add parallel helpers.
- No restart-mid-suite mechanism exists anywhere (no `docker-compose restart` helper,
  no pytest fixture) — T3 builds this from scratch.
- Playwright 1.61.1 + chromium browser binary are already installed in this
  environment (`C:\Users\satya\AppData\Local\ms-playwright\chromium-1228`) — real E2E
  runs, real screenshots, and real multi-viewport testing are all genuinely possible
  here, not blocked the way pixel-level verification was in P4/P5 (no interactive
  browser tool exists in this session, but Playwright drives its own browser
  headlessly/headed via `npx playwright test`, which is exactly what this phase's own
  spec already requires).

## Global Constraints

- **Real stack only, no mocks** — matches this repo's established e2e philosophy
  (`playwright.config.ts`'s own comment: "hits a real, shared backend — Postgres,
  Redis, MinIO"). Every new test (unit or e2e) exercises real code paths.
- **`workers: 1`** for any new e2e spec run alongside the existing suite — the config
  already forces this repo-wide for real shared-Redis-rate-limit reasons; don't
  override it per-spec.
- **`clearRateLimits()` first**, in every new e2e spec, per the existing convention.
- **Reuse `web/tests/e2e/helpers.ts`** — no new parallel helper functions for
  something a real, existing helper already does.
- **Both themes** (`chromium-light`/`chromium-dark` projects already defined in
  `playwright.config.ts`) for the new walkthrough spec, per the phase file's explicit
  "Both themes" requirement.
- **Responsive verification**: since a real, working E2E harness exists in this
  session (unlike the interactive-browser gap noted in P4/P5), use real Playwright
  viewport sizing (`page.setViewportSize()` or dedicated projects) to check the User
  Dashboard and the Professional Portal's key screens at mobile (375×667), tablet
  (768×1024), and desktop (1440×900) — take real screenshots, don't skip this or
  fake it. If a real responsive bug surfaces, fix it using the `shadcn`/
  `ui-ux-pro-max` skills per the user's explicit instruction, not an invented
  ad-hoc CSS patch.
- If any bug surfaces during this phase's testing (unit, e2e, or responsive), fix
  it using `/code-review` to scope the fix, `/ponytail:ponytail ultra` for the
  actual minimal fix, and `/graphify` to understand cross-file impact before
  touching shared code — per the user's explicit instruction for this phase.
- No fabricated data at any point — real seeded/created test accounts and real
  service-layer computations only (AGENTS.md §0.2).
- Quality gates: backend `ruff` + `mypy --strict` + `pytest`; frontend
  `npm run lint` + `npm run typecheck` + full `npx playwright test` + production
  `next build`.
- **Never add a Co-Authored-By trailer or any AI-assistant co-author to any commit
  message.**

---

### Task 1: Close the adherence-formula test gaps

**Files:**
- Modify: `backend/tests/test_progress_service.py`

- [ ] **Step 1: Read the current file's real fixture/helper patterns first**

Read `backend/tests/test_progress_service.py` in full — especially
`test_get_compliance_percentages_computes_completed_over_assigned` (line 222) and
`test_adherence_series_uses_the_routine_active_on_each_historical_day` (line 175) —
to match this file's existing fixture style (routine creation, routine_logs seeding
via Mongo, `db_session`/`test_user_id` fixtures) exactly, not a new pattern.

- [ ] **Step 2: Exact-value-assert the 30-day and 90-day compliance ratios**

Extend or add a test that seeds a real, known routine + a real, known set of
`routine_logs` completions spanning past the 7-day boundary (e.g. completions on
specific days within the 30-day and 90-day windows but outside the 7-day one), and
asserts `get_compliance_percentages`'s `thirty_day`/`ninety_day` fields against the
exact expected ratio (completed ÷ assigned) — not just `is not None`.

- [ ] **Step 3: Mid-window routine change against `get_compliance_percentages`
  specifically**

Add a test mirroring the existing `test_adherence_series_uses_the_routine_active_on_
each_historical_day`'s setup (a routine regenerated/changed partway through the
window, using `routines_service.list_historical_active_step_ids` under the hood) —
but asserting `get_compliance_percentages`'s own output is correct across the
change, not `get_adherence_series`'s. This is the rubric's actual named formula;
the existing test only proves the *series* function handles this, not the
*percentages* function.

- [ ] **Step 4: Day-boundary test**

Add a test asserting a completion logged exactly at a day boundary (e.g. just
before/after UTC midnight, matching whatever day-boundary convention
`scores/service.py`'s existing fix already established — check that file for the
precedent, don't invent a new day-boundary rule) lands in the correct day's bucket,
not off-by-one into the adjacent day.

- [ ] **Step 5: Run gates, verify, commit**

```bash
cd backend && uv run pytest tests/test_progress_service.py -v
uv run ruff check . && uv run mypy app
```

```bash
git add backend/tests/test_progress_service.py
git commit -m "test(progress): exact-assert 30/90-day compliance, mid-window-change, and day-boundary cases"
```

---

### Task 2: The rubric E2E walkthrough spec (both themes + responsive check)

**Files:**
- Create: `tests/e2e/m3-rubric-walkthrough.spec.ts`
- Create: `docs/milestones/milestone_3/build/e2e/` (screenshots)

**Why this exists:** the rubric's literal cross-role, cross-session flow
(assessment → recommendations → check-off → photo → dermatologist inspects +
edits → user sees the live update) has never been exercised end to end as one
spec. P4-T2's 30s poll and P5-T4's routine-overwrite endpoints both exist and are
independently tested, but nothing proves the two actually compose correctly across
two real browser sessions.

- [ ] **Step 1: Read the reusable patterns fully before writing**

Read `web/tests/e2e/user-journey.spec.ts` in full (the closest existing analog —
steps 1-2 of this walkthrough are already proven there) and
`web/tests/e2e/helpers.ts` in full (every helper you'll reuse:
`clearRateLimits`, `pool`, `deleteTestUser`, `deleteMongoLogsForUser`, `signOut`,
`promoteRole`, `screenshotPath`). Also skim `web/tests/e2e/clinical-dashboard-p5.spec.ts`
for the existing pattern of driving a dermatologist/consultant session, and
`web/tests/e2e/cross-role-verification-journey.spec.ts` for the existing pattern of
switching between two real logged-in sessions in one spec (two `browser.newContext()`
calls, or however that file actually does it — read it, don't guess).

- [ ] **Step 2: Write the spec, following this exact sequence**

1. `clearRateLimits()` first.
2. Sign up / create a real user account (reuse `user-journey.spec.ts`'s pattern).
   Submit a real assessment via the real wizard. Confirm real recommendations
   render (reuse the existing dashboard/recommendations page object patterns
   already established in `user-journey.spec.ts`).
3. Check off at least one routine task on the dashboard (real checkbox, real
   persistence — confirm via a direct DB/Mongo query using the real `pool()`
   helper, matching `user-journey.spec.ts:183-188`'s existing pattern, not just a
   UI-level assertion). Upload a real progress photo via the real upload flow
   (check `web/app/(user)/upload-photo/page.tsx` or wherever the real upload UI
   lives — confirm the real path first).
4. Create/promote a real dermatologist account (`promoteRole` helper), assign the
   user to them (reuse whatever real assignment mechanism the admin/clinical_review
   flow already provides — check `web/tests/e2e/consultant-onboarding.spec.ts`
   or `admin-panel.spec.ts` for the real assignment UI/API pattern already
   established, don't invent a new one). As the dermatologist (new browser
   context, real login): open the user's inspection view, confirm the real photo
   and real compliance stats render, then edit an evening treatment step via the
   new P5-T4 routine-overwrite UI.
5. Back in the original user's session/context: confirm the revised routine step
   displays — either immediately (if the poll interval has elapsed within the
   test's real wall-clock time) or after triggering a refetch consistent with how
   a real user would experience it (a page reload is acceptable if waiting a full
   30s poll cycle in a test is impractical — use your judgment, but don't
   fabricate the check; if you have to reload, say so plainly in a comment, don't
   silently pretend the poll was what proved it).
6. Take real screenshots at each numbered step, in both themes (the config already
   defines `chromium-light`/`chromium-dark` projects — this spec runs under both
   automatically when invoked without a `--project` filter), saved under
   `docs/milestones/milestone_3/build/e2e/` via the existing `screenshotPath()`
   helper.
7. Clean up: `deleteTestUser()` for both accounts, `deleteMongoLogsForUser()`,
   `signOut()` — matching every other spec's teardown convention.

- [ ] **Step 3: Responsive check (per the user's explicit instruction this session)**

In the same spec or a small sibling spec, load the User Dashboard and the
Professional Portal's client-detail/inspection view at three real viewport sizes
via `page.setViewportSize({width, height})`: mobile (375×667), tablet (768×1024),
desktop (1440×900). Take real screenshots at each size, in both themes. Visually
inspect (read the screenshot images directly) for broken layout, overlapping
text, or unusable controls. If a real responsive bug is found, fix it now using
the `shadcn` and `ui-ux-pro-max` skills (invoke them) rather than an ad-hoc CSS
patch — this is exactly the scenario the user asked those skills be used for.

- [ ] **Step 4: Run the spec 3× consecutively (flake check, per the phase file's
  own verification requirement)**

```bash
cd web && npx playwright test tests/e2e/m3-rubric-walkthrough.spec.ts
```
Run this exact command 3 times in a row (no run_in_background — synchronous,
generous timeout given real backend round trips, e.g. 300000ms per run). All 3
runs must pass. If any run flakes, root-cause it (per `/code-review`'s spirit —
don't just retry blindly) before considering this task done.

- [ ] **Step 5: Gates + commit**

```bash
cd web && npm run typecheck && npm run lint
```

```bash
git add tests/e2e/m3-rubric-walkthrough.spec.ts docs/milestones/milestone_3/build/e2e/
git commit -m "test(e2e): add the M3 rubric walkthrough spec, both themes, 3 viewport sizes"
```

---

### Task 3: Cross-dashboard sync + persistence checks (restart mid-suite)

**Files:**
- Create: `tests/e2e/m3-persistence-after-restart.spec.ts` (or extend Task 2's spec
  if genuinely cleaner — use your judgment, but a restart mid-test is disruptive
  enough to other tests in the same file that a separate spec is probably safer)

**Why this exists:** the rubric wants proof that check-ins, photos, and the
overwritten routine survive a real backend/store restart — i.e., they're real DB
state, not something that happens to work only because a long-lived in-memory
process/cache hasn't been recycled yet.

- [ ] **Step 1: Design the restart mechanism**

Since no restart-mid-suite mechanism exists in this repo yet, build the minimal
one: a small script or inline `child_process`/`execSync` call (from the Playwright
spec's Node.js context, which already has shell access) that runs
`docker compose restart worker` and, separately, actually stops and restarts the
real `uv run uvicorn` backend process this milestone's phases have been using
directly (not via docker-compose, since `api`/`web` aren't containerized — see
`docker-compose.yml`'s own comment on this, ADR-005). Check how previous phases in
this milestone started/stopped the backend (`uv run uvicorn app.main:app`) for the
real command to restart. Keep this minimal — a helper function in
`web/tests/e2e/helpers.ts` (e.g. `restartBackend()`) if it's reusable, or inline in
the spec if it's genuinely single-use. Don't build unrequested infrastructure
(ponytail) — this only needs to prove real persistence, not become a general
chaos-testing framework.

- [ ] **Step 2: Write the persistence check**

1. As a real user: check off a routine task, upload a photo.
2. As a real dermatologist (assigned): overwrite an evening treatment step.
3. Restart the backend process (and the `worker` container, since the outbox/
   projection pipeline is part of what should survive).
4. As the user again (same account, fresh page load — not relying on any client
   state that could have survived the restart client-side, which it obviously
   would since it's the browser, not the server, that's untouched — the point is
   confirming the SERVER's response after restart reflects real DB state): confirm
   the checked-off task, the uploaded photo, and the overwritten routine step are
   all still present, read fresh from Postgres/Mongo after the restart, not from
   any stale in-memory cache.
5. Also confirm the consultant/dermatologist's own view shows the same
   post-overwrite state (the same routine edit persisted from Task 4's mutation).

- [ ] **Step 3: Run, gates, commit**

```bash
cd web && npx playwright test tests/e2e/m3-persistence-after-restart.spec.ts
cd web && npm run typecheck && npm run lint
```

```bash
git add tests/e2e/m3-persistence-after-restart.spec.ts web/tests/e2e/helpers.ts
git commit -m "test(e2e): verify check-ins/photos/routine-overwrite survive a real backend restart"
```

---

### Task 4: Full-gate run + ledger close-out

**Files:**
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`,
  `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md`

- [ ] **Step 1: Run the entire gate, in one pass, output pasted into the ledger**

```bash
cd backend && uv run pytest -q
cd backend && uv run ruff check . && uv run mypy app
cd web && npm run typecheck && npm run lint
cd web && npx playwright test
cd web && npm run build
```

All must be green. Any red = root-cause and fix using `/code-review` +
`/ponytail:ponytail ultra` + `/graphify` (per the user's explicit instruction),
on a `fix/m3r-*` branch if the fix is non-trivial, before this phase closes — not
silently patched around.

- [ ] **Step 2: Update the ledger**

Mark M3R-P6-T1 through T4 `DONE` with real evidence (test counts, spec names,
screenshot paths, the 3×-consecutive flake-check result). Update
`M3R_GAP_ANALYSIS.md` §5 to reflect the closed testing gaps.

```bash
git add docs/milestones/milestone_3/M3R_TASK_LEDGER.md docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md
git commit -m "docs(m3r): close P6 ledger rows - full rubric test/verification sweep complete"
```

---

## Verification

The walkthrough spec (`m3-rubric-walkthrough.spec.ts`) passes 3× consecutively.
The persistence spec passes at least once with a real restart proven, not
simulated. Gate outputs pasted into the ledger. Coverage of the three rubric test
classes cited by file/test name.

## Exit

Manual self-review (no `gh`/PR, per this milestone's established decision) →
merge `feat/m3r-p6-e2e-verification` to `dev` → delete branch →
`graphify update .` → `PROGRESS.md` entry.
