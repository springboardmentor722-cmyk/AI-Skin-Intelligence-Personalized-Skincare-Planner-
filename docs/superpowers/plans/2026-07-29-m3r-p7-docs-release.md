# M3R Phase 7 — Docs, Release & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the M3-rubric-pass with a completion report, lockstep docs/ADRs, a
final `PROGRESS.md` rollup, a verified ledger, confirmed branch cleanliness, and an M4
handoff note — no application code changes.

**Architecture:** Docs-only phase. Every fact cited below was already verified this
session (real commits, real test runs, real grep checks) — this phase's job is to write
it down in the right places, not re-derive it. No new investigation is required beyond
what's in this plan; if a task turns up something this plan didn't anticipate, stop and
flag it rather than guessing.

**Tech Stack:** Markdown docs only. One `make openapi` regeneration (Python + npx
openapi-typescript, already-installed tooling).

## Global Constraints

- Base branch: `chore/m3r-p7-docs-release` from `dev`.
- No AI co-author trailer on any commit, ever. Commit author must be exactly
  `Satya Sai tharun Jekkamsetti <satya.saitharun02@gmail.com>`.
- No outcome in `M3R_COMPLETION_REPORT.md` may be claimed without a pasted verification
  artifact (command + real output) already produced this session — cite it, don't
  re-run things that already have evidence, but never state a result with no artifact
  behind it.
- Never delete `main`, `satya-sai-tharun-skinlytics`, `dev`, or any other contributor's
  branch. `dev → main` promotion is explicitly out of scope for this phase.
- AGENTS.md §0.1 precedent applies: where this session's owner already made a call
  (chart library, storage naming), record it as accepted fact, not as an open question.

---

### Task 1: `M3R_COMPLETION_REPORT.md`

**Files:**
- Create: `docs/milestones/milestone_3/M3R_COMPLETION_REPORT.md`
- Read for format: `docs/milestones/milestone_2/M2_COMPLETION_REPORT.md` (5-section
  structure: requirement→implementation map, what's real vs. fixture, full-stack
  verification, deferred items, git history)
- Read for source facts: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`,
  `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md`,
  `docs/milestones/milestone_3/milestone_3_Master_prompt.md` §6 (rubric conflicts),
  `MILESTONE 3.pdf` (re-read the actual PDF, not a summary of it, per this phase's own
  Verification instruction)

**Interfaces:**
- Consumes: nothing from other Task files — this is the terminal artifact.
- Produces: the file every later task in this plan links back to (Task 6's handoff note
  lives inside it as a new section).

- [ ] **Step 1: Re-read the rubric PDF directly**

Open `docs/milestones/milestone_3/MILESTONE 3.pdf` (or its extracted `.md` if one
exists alongside it — check `docs/milestones/milestone_3/` for a `.md` twin first) and
list the literal graded outcomes/steps it names. Do not rely on `M3R_GAP_ANALYSIS.md`'s
paraphrase for this step — that doc is useful for evidence pointers in Step 3, not as a
substitute for the source PDF's own wording.

- [ ] **Step 2: Write section 1 — Requirement → implementation map**

One row per rubric-graded outcome (Ingredient Intelligence / Safety Score, Progress &
Adherence Tracking, Analytics & Dashboards, E2E rubric walkthrough — confirm exact
count/names against Step 1's PDF read, don't assume 4 without checking). Columns:
Rubric requirement | Phase | Code (file:line or endpoint) | Tests | Screenshots. Pull
the concrete evidence from `M3R_TASK_LEDGER.md`'s DONE rows — every cell must trace to
a ledger row, not be invented fresh. Known evidence already on hand to slot in:
  - Ingredients: `backend/app/services/ingredients/{router,service,schemas}.py`,
    `/ingredients`, `/ingredients/{id}`, `/ingredients/{id}/suitability/me`,
    `/ingredients/interactions`; `backend/tests/test_interactions.py`,
    `test_suitability.py`, `test_recommendations_service.py`.
  - Adherence: `get_compliance_percentages` (7/30/90-day), `list_historical_active_step_ids`
    (`services/progress/service.py`, commit `b78c0f6`);
    `backend/tests/test_progress_service.py` (exact-assert 30/90-day, mid-window-change,
    day-boundary — 3 new tests added P6-T1).
  - Analytics/Dashboards: `GET /analytics/me`, `ScoreAdherenceChart` (Chart.js),
    `web/app/(user)/dashboard/page.tsx`, `web/components/clinical-review/client-detail-view.tsx`
    (dermatologist analytics + photos endpoints).
  - E2E rubric walkthrough: `web/tests/e2e/m3-rubric-walkthrough.spec.ts` (both themes, 3
    viewports), `web/tests/e2e/m3-persistence-after-restart.spec.ts` (postgres+mongo+worker
    restart, consultant-side post-overwrite check), 24 screenshots under
    `docs/milestones/milestone_3/build/e2e/`.

- [ ] **Step 3: Write section 2 — What's real vs. deliberately still fixture**

Table format like M2's. Known items to include:
  - MinIO accepted as the "AWS S3 or Azure Blob" requirement (real adapter, env-var
    swap to real S3/Azure in prod, no code change) — reason: `core/storage.py` already
    sniffs content-type from magic bytes, strips EXIF, presigned URLs only; a live
    AWS/Azure bucket was never required to prove the adapter contract.
  - `docker-compose.yml` still missing `api`/`web` services — expected, M4 scope
    per Master Prompt (not a gap this pass owns).
  - Payments/subscriptions tables exist but unused — ADR-033, no premium/tier gating
    concept anywhere yet, unrelated to M3 scope, don't re-litigate here beyond a
    one-line mention if the rubric touches billing at all (check Step 1's PDF read).

- [ ] **Step 4: Write section 3 — Full-stack verification**

Paste real evidence already produced this session:
  - Backend suite: 507/507 green including all 12 MinIO storage tests
    (`backend/tests/test_storage.py`) — cite `M3R_GAP_ANALYSIS.md` line 11-12 as the
    source of this figure; if a fresher full-suite run exists from P6's Task 4 gate run,
    prefer that number instead (check `M3R_TASK_LEDGER.md` P6-T4 row for the exact count).
  - E2E: full walkthrough spec passing both themes × 3 viewports; persistence spec
    passing against real container restarts; 2 real bugs found and fixed this session
    (ambiguous ingredient-search locator, cleanup-helper FK race) — cite
    `M3R_TASK_LEDGER.md` P6-T2/T4 rows.
  - 2 real UI bugs found and fixed by the new E2E walkthrough (fixed save-bar overflow,
    topbar breakpoint collision) — cite the exact diffs already made in
    `web/components/routine-editor/routine-editor.tsx` and
    `web/components/app-shell/glass-topbar.tsx`.

- [ ] **Step 5: Write section 4 — Deferred items**

Table: item | reason | proposed home. Known candidates:
  - Live host-process restart-persistence proof (uvicorn itself, not containers) —
    deferred, this sandbox's Application Control policy makes force-killing the host
    `uv run uvicorn` process unsafe to test; container-level restart
    (`postgres`/`mongo`/`worker`) already proves the same DB-durability property.
  - `api`/`web` docker-compose services — M4 scope (Task 6 handoff note expands this).
  - Any rubric item Step 1's PDF re-read surfaces as not-yet-covered — do not paper over
    a real gap found here; add it to this table honestly instead of omitting it.

- [ ] **Step 6: Write section 5 — Git history summary**

`git log --oneline dev` range covering this session's work (from P0's setup commit
through P6's merge) — summarize by phase, not a raw dump. One line per phase (P0-P6)
naming the branch, merge commit, and task count.

- [ ] **Step 7: Add the M4 handoff note section (Task 6 content lives here)**

See Task 6 below for exact content — write it as the final section of this same file
rather than a separate document.

- [ ] **Step 8: Commit**

```bash
git add docs/milestones/milestone_3/M3R_COMPLETION_REPORT.md
git commit -m "docs(m3r): write the M3 rubric-pass completion report"
```

---

### Task 2: Docs in lockstep — ARCHITECTURE.md, AGENTS.md, CONVENTIONS.md

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `AGENTS.md` (§5 ingredients row — stale "router lands M3" note)
- Modify: `docs/CONVENTIONS.md` (new patterns from P4/P5, e.g. photo-comparison tags if
  any new convention was actually introduced — check before adding one for its own sake)

**Interfaces:**
- Consumes: nothing new — uses only facts already confirmed via grep this session
  (ingredients router is real and mounted, `backend/app/main.py:139-141`).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Fix AGENTS.md's stale ingredients row**

In `AGENTS.md` §5's service table, the `ingredients` row currently reads "Ingredient
Intelligence (service layer; router lands M3)". This is stale — the router is real and
mounted (`backend/app/main.py:139-141`: `ingredients_router` under `/ingredients`,
`/ingredients/{id}`, `/ingredients/{id}/suitability/me`, `/ingredients/interactions`).
Update the row to drop "(router lands M3)" and list the real endpoints, matching the
style of the other rows in that table.

- [ ] **Step 2: Check docs/ARCHITECTURE.md for structural drift**

`docs/ARCHITECTURE.md` line 101 already correctly shows `/ingredients` as delivered —
no change needed there. Scan §4 (planned services table) for any other service this
session touched (`clinical_review` new endpoints: `/clients/{user_id}/analytics`,
`/clients/{user_id}/photos`, 4 routine-mutation endpoints) and confirm they're reflected.
If `clinical_review`'s row doesn't mention analytics/photos, add them in the same style
as the existing row — one line, not a new subsection.

- [ ] **Step 3: docs/CONVENTIONS.md — only add what's real**

Check `web/components/clinical-review/photo-comparison.tsx` for any actual new
tagging/labeling convention introduced (e.g. a `stage`/`image_stage` label scheme). If
what's there is just consuming an existing `ProgressImage.image_stage` field with no new
convention invented, skip this step — don't manufacture a "pattern" to satisfy the task
list. Ponytail rule: if there's nothing new to document, say so in the commit message
and don't touch the file.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md docs/ARCHITECTURE.md docs/CONVENTIONS.md
git commit -m "docs(m3r): correct stale ingredients-router note, sync clinical_review endpoints"
```

(If Step 3 found nothing to add, the `docs/CONVENTIONS.md` path is simply absent from
this `git add` — that's expected, not an error.)

---

### Task 3: Four new ADRs (ADR-035 through ADR-038)

**Files:**
- Modify: `docs/DECISIONS.md` (append after ADR-034)

**Interfaces:**
- Consumes: exact facts already verified this session via `git log --oneline --all | grep chart`
  and file reads (see below) — no new investigation needed.
- Produces: ADR numbers 035-038 that Task 1's completion report may reference by number.

- [ ] **Step 1: ADR-035 — Chart.js accepted alongside Recharts for the dashboard trend chart**

Append to `docs/DECISIONS.md`:

```markdown
## ADR-035 — Chart.js accepted alongside Recharts for the dashboard adherence chart

**Status:** Accepted (M3-rubric-pass, P4, 2026-07-28)
**Context:** `AGENTS.md` §4 locks the component stack to shadcn primitives, naming
"shadcn Charts/Recharts" as the only charting library. `MILESTONE 3.pdf`'s Progress &
Analytics step calls for a combined score+adherence-over-time chart; the existing
`web/components/charts/trend-chart.tsx` (Recharts, `AreaChart`, single `TrendPoint[]`
series shape) already has 5 real consumers (`check-in`, `progress`, `admin/dashboard`,
`clinical-review/clinical-dashboard`, `design-system`) built around that single-series
shape. Forcing a second, structurally different series (score + adherence, dual-metric,
7/30/90-day literal windows per rubric wording) into the same component would have
meant either breaking those 5 consumers' shape or building an awkward second mode inside
one file.
**Decision:** Owner-confirmed (recorded in `M3R_GAP_ANALYSIS.md` "Decisions already
recorded this session") to add Chart.js (`chart.js` + `react-chartjs-2`, already a
`web/package.json` dependency from a prior session's `6026db6` commit) as a second,
narrowly-scoped charting library for exactly this one new component,
`web/components/charts/score-adherence-chart.tsx`, fed only by `GET /analytics/me`.
`trend-chart.tsx` and its 5 Recharts consumers are deliberately untouched.
**Consequences:** Two charting libraries now coexist in `web/`. Any *future* chart
should default to Recharts (the still-locked general default) unless it needs the same
dual-metric multi-window shape this one solves — that's the bar for reaching for
Chart.js again, not a free choice between the two.
```

- [ ] **Step 2: ADR-036 — MinIO accepted as satisfying the "AWS S3 or Azure Blob" requirement**

Append:

```markdown
## ADR-036 — MinIO accepted as satisfying the rubric's cloud-storage requirement

**Status:** Accepted (M3-rubric-pass, P3, 2026-07-28)
**Context:** `MILESTONE 3.pdf` names "AWS S3 or Azure Blob" for photo/export storage.
`backend/app/core/storage.py` already implements the full contract (magic-byte
content-type sniffing, EXIF stripping, private-bucket + short-lived presigned URLs
only) against MinIO in dev, per `AGENTS.md` §5's existing "drop-in real AWS S3 in prod
via env vars only, no code change" design.
**Decision:** Owner-confirmed (recorded in `M3R_GAP_ANALYSIS.md` §6 item 2) that the
existing MinIO adapter satisfies the requirement as-is — no live AWS/Azure bucket is
needed to pass this milestone. The env-var-swap story (same adapter, different
endpoint/credentials env vars) is the proof, not a new integration.
**Consequences:** No code change. Documented here so a future reviewer doesn't mistake
"MinIO in docker-compose" for an unmet requirement.
```

- [ ] **Step 3: ADR-037 — No endpoint-naming conflict found this pass**

Append:

```markdown
## ADR-037 — No endpoint-naming rubric conflict in M3 (contrast with M2)

**Status:** Accepted (M3-rubric-pass, P0 gap analysis, 2026-07-27)
**Context:** ADR precedent from Milestone 2 (§0.1 in `AGENTS.md`, and `AGENTS.md`'s
own standing-precedent note) established that an external rubric's literal names win
over internal architecture judgment when the two genuinely conflict — that's why M2
renamed tables/endpoints to `skin_assessments`/`skincare_routines` and
`/api/v1/assessment/*`/`/api/v1/routine/*`. Milestone 3's gap analysis
(`M3R_GAP_ANALYSIS.md`, closing note before "Decisions already recorded this session")
explicitly checked for the same class of conflict and found none: the Step 1 Safety
Score endpoint and Step 2-4 gaps identified this pass were genuinely new-build or
rework items, not cases of existing code already doing the same thing under a
different name.
**Decision:** No renaming precedent needed to be invoked this milestone. Recorded as an
ADR anyway (rather than silence) so a future reader doesn't wonder whether the check
was skipped.
**Consequences:** None — this is a documented non-event, not a change.
```

- [ ] **Step 4: ADR-038 — 90-day adherence window and historical-routine correctness fix**

Append:

```markdown
## ADR-038 — Adherence math: literal 7/30/90-day windows, judged against the routine
active on each historical day

**Status:** Accepted (M3-rubric-pass, P3-T2, commit `b78c0f6`)
**Context:** `services/progress/service.py`'s `get_adherence_series` only computed
7-day and 30-day windows; `MILESTONE 3.pdf` Step 3 calls for 90-day coverage too, and
its "assigned counts follow what was assigned each day" wording implies each historical
day's adherence should be judged against whichever routine was actually active *that
day* — not the currently-active routine. The prior implementation silently misjudged
any day before a mid-window regeneration (dermatologist overwrite, reassessment),
because it always compared against the routine active *now*.
**Decision:** Added `get_compliance_percentages` (7/30/90-day completed/assigned
ratios) and `list_historical_active_step_ids` (per-day lookup against whichever routine
of each type was active as of that specific day — soft-deactivated routines are never
hard-deleted, so remain queryable), and rebuilt the adherence math on top of the latter.
Verified with 3 new exact-assert tests in `backend/tests/test_progress_service.py`:
30/90-day compliance ratios, a mid-window routine-change case, and a UTC day-boundary
case.
**Consequences:** Adherence percentages for any user who had a routine regenerated
mid-window are now numerically different (more correct) than before this fix — a
one-time recalculation discontinuity, not a bug, if anyone diffs historical values
against a pre-fix snapshot.
```

- [ ] **Step 5: Commit**

```bash
git add docs/DECISIONS.md
git commit -m "docs(m3r): add ADR-035..038 for chart library, storage naming, endpoint-naming non-conflict, adherence window fix"
```

---

### Task 4: `database_schemas/` mirror check + `make openapi` regeneration

**Files:**
- Check: `database_schemas/skinlytics_postgresql_schema_v3.sql`,
  `skinlytics_mongodb_schema_v3.txt`
- Modify (if drift found): whichever mirror file is stale
- Regenerate: `openapi.json` (repo root, gitignored intermediate), `web/lib/api-types.ts`

**Interfaces:**
- Consumes: nothing — a live-vs-mirror diff check.
- Produces: `web/lib/api-types.ts` current for any later consumer (none in this plan,
  but it's a Definition-of-Done item per `AGENTS.md` §6).

- [ ] **Step 1: Diff the live Postgres schema against the SQL mirror**

```bash
docker compose exec -T postgres pg_dump -U skinlytics -s skinlytics > /tmp/live_schema.sql
diff <(grep -E "^CREATE TABLE|^ALTER TABLE.*ADD COLUMN" /tmp/live_schema.sql | sort) \
     <(grep -E "^CREATE TABLE|^ALTER TABLE.*ADD COLUMN" database_schemas/skinlytics_postgresql_schema_v3.sql | sort)
```

Expected: no output (already in sync — this session's schema changes, if any, went
through Alembic + the same-change mirror-update discipline `AGENTS.md` §5 requires, so
this is confirmation, not new work). If real drift shows up, add the missing
table/column to the mirror file matching its existing style — don't invent a
generalized migration-diffing tool for this one check (ponytail: one-line commit if
real drift is found, this isn't recurring enough to automate).

- [ ] **Step 2: Regenerate OpenAPI types**

```bash
make openapi
git diff --stat web/lib/api-types.ts
```

If the diff is empty, nothing changed since the last regeneration — fine, no commit
needed for this step. If non-empty, the diff reflects real endpoint additions from
P4/P5 (clinical_review analytics/photos endpoints, routine-mutation endpoints) that
were never followed by a regeneration — commit it.

- [ ] **Step 3: Commit (only if Steps 1 or 2 produced a real diff)**

```bash
git add database_schemas/ web/lib/api-types.ts
git commit -m "docs(m3r): regenerate openapi types, confirm schema mirrors match live DB"
```

---

### Task 5: `PROGRESS.md` rollup entry + ledger close-out verification

**Files:**
- Modify: `PROGRESS.md` (append one new dated entry at the end)
- Read/verify only: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`

**Interfaces:**
- Consumes: the per-phase `PROGRESS.md` entries already present for P0-P6 (read the
  last ~6 of them via `tail` before writing the rollup, so the rollup doesn't
  contradict what's already recorded).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Read the existing P0-P6 entries for consistency**

```bash
grep -n "^## " PROGRESS.md | tail -15
```

Confirms the exact dated headers already used (`2026-07-28`, `2026-07-29`, etc.) so the
new rollup entry's date and header style match.

- [ ] **Step 2: Append the rollup entry**

One dated entry (today's date), titled something like
`## 2026-07-29 — M3-rubric-pass complete (P0-P7)`. Content: one line per phase (P0-P7)
naming what it delivered, pointing at the per-phase entries already in this file rather
than repeating their detail; a short "Deferred / owner-flagged" list (host-process
restart-persistence proof, `api`/`web` compose services — both already named in Task 1
Step 5); a closing line noting `M3R_COMPLETION_REPORT.md` is the full detail.

- [ ] **Step 3: Verify the ledger has zero silent drops**

```bash
grep -n "TODO\|BLOCKED\|^| M3R-" docs/milestones/milestone_3/M3R_TASK_LEDGER.md
```

Every `M3R-*` row must show `DONE` with evidence, or an explicit `BLOCKED`/`DEFERRED`
with an owner note — read the full file (89 lines, small) and confirm no row is empty
or ambiguous. If a row is found silently incomplete, fix that row's evidence column
directly (pull the fact from `M3R_GAP_ANALYSIS.md` or a phase plan file — every fact
needed should already exist from P0-P6's work) rather than leaving it and noting it
as a gap.

- [ ] **Step 4: Commit**

```bash
git add PROGRESS.md docs/milestones/milestone_3/M3R_TASK_LEDGER.md
git commit -m "docs(m3r): add M3-rubric-pass rollup entry, close out task ledger"
```

---

### Task 6: Branch cleanup confirmation + M4 handoff note

**Files:**
- Modify: `docs/milestones/milestone_3/M3R_COMPLETION_REPORT.md` (append the handoff
  note as its final section — this is Task 1 Step 7, executed here since it needs the
  branch-list evidence gathered fresh)

**Interfaces:**
- Consumes: Task 1's completion report file (must exist first — this task's commit
  amends the same file, not the same commit).
- Produces: nothing later.

- [ ] **Step 1: Confirm branch cleanliness**

```bash
git branch -a
```

Expected output: only `chore/m3r-p7-docs-release` (this phase's own branch, about to
be deleted at merge), `dev`, `main`, `satya-sai-tharun-skinlytics`, the pre-existing
unrelated `chore/repo-recovery`, and `remotes/origin/*` entries for other contributors'
untouched branches. Zero leftover `feat/m3r-*`/`fix/m3r-*`/`chore/m3r-*` branches from
P0-P6 (already confirmed clean earlier this session — this is a fresh paste, not a new
investigation).

- [ ] **Step 2: Write the M4 handoff note section**

Append to `M3R_COMPLETION_REPORT.md`:

```markdown
## M4 handoff note

What M4 (Dashboards/Reports/Testing/Docker-cloud deploy, `docs/ARCHITECTURE.md` §13)
inherits from this pass:

- **`docker-compose.yml` still has no `api`/`web` service entries** — the monolith
  currently runs `web` via `npm run dev` and `api` via `uv run uvicorn` on the host,
  outside compose. M4's per-service container split (ADR-005) is the point where these
  get added; don't add them prematurely before that ADR's split actually happens.
- **Deprecated endpoint aliases:** none found mounted this pass (`M3R_GAP_ANALYSIS.md`
  §0 — `/scores/me`, `/routines/me`, `/routines/generate` don't exist in code, only in
  historical comments). Nothing to retire.
- **Deferred items carried forward:** host-process restart-persistence proof (in-sandbox
  Application Control policy makes force-killing the host `uv`/uvicorn process unsafe to
  test directly — container-level restart already proves DB durability;
  actual-process-restart proof, if ever needed, belongs in a real staging/CI environment
  that isn't this dev sandbox).
- **Two charting libraries now coexist** (ADR-035) — Recharts stays the default; only
  reach for Chart.js again if a future chart needs the same dual-metric/multi-window
  shape `score-adherence-chart.tsx` solves.
- Branch state going into M4: clean — paste of `git branch -a` above is the record.
```

- [ ] **Step 3: Commit**

```bash
git add docs/milestones/milestone_3/M3R_COMPLETION_REPORT.md
git commit -m "docs(m3r): add M4 handoff note, paste branch-cleanliness confirmation"
```

---

## Exit (not a task — final sequence after Tasks 1-6 are all merged into this branch)

1. Re-read `MILESTONE 3.pdf` one final time, line by line, against
   `M3R_COMPLETION_REPORT.md` — confirm nothing graded is missed.
2. `/code-review` (manual self-review — no `gh`, per this milestone's established
   decision not to open a PR for internal phase branches).
3. Merge `chore/m3r-p7-docs-release` → `dev`. Delete the branch (local + remote if
   pushed).
4. Run `graphify update .` from the repo root (final graph refresh for the whole
   M3-rubric-pass).
5. Tell the user Milestone 3 rubric pass is complete, with `M3R_COMPLETION_REPORT.md`
   linked.
