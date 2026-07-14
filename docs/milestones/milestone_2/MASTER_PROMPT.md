# Milestone 2 — Master Prompt & Phased Execution Plan

This doc exists because Milestone 2's substance is already built (`## Milestone 2 —
Delivered`, `PROGRESS.md`), but under different literal names than
`mile_2.docx` uses, and the project owner has decided (2026-07-14) to rename to match
the docx literally — see `PROGRESS.md`'s top section for the full reasoning. This is
real, multi-file surgery on tables that already hold live tested data, not a
from-scratch build. Work it in the phases below, in order.

**Full auto mode (2026-07-14):** this plan runs end-to-end without pausing between
phases or on internal architecture judgment calls. Every "confirm with the user"
note that appears in a phase below has a stated **default decision** right next to
it — take that default, document the reasoning in `PROGRESS.md` (this repo's own
long-standing discipline: flag the call and why, don't silently pick one, but don't
block on it either), and keep moving. Genuine hard stops are the **only** exception —
listed explicitly at the end of this section. There are very few of them; almost
everything else in this plan is a "decide and document" call, not a "stop and ask"
one.

**Read before starting, in this order:** `AGENTS.md` (all of it, especially §0.1/§0.2
added for this), `PROGRESS.md`'s top section, `docs/milestones/milestone_2/mile_2.docx`
itself (not this doc's paraphrase of it), `database_schemas/skinlytics_postgresql_schema_v3.sql`.
Also load, since Phase 1.4 touches frontend components: `.agents/rules/skinlytics-stitch.md`
(Stitch extraction conventions — not directly exercised by this rename, but
`CLAUDE.md` treats it as a primary instruction file, so it's in scope for anything
touching `web/`) and `.agents/skills/shadcn/` (`SKILL.md` + its `rules/` subfolder —
composition, forms, styling, icons, base-vs-radix — the actual constraints for any
shadcn component this phase's endpoint-consumer updates touch).

---

## Master prompt

Paste this into a fresh Claude Code CLI session (or continue this one) to execute the
plan below:

> Use the superpowers plugin's `executing-plans` skill to run this — this doc is
> exactly what that skill is for (a written implementation plan with per-phase review
> checkpoints), and it correctly chains into `finishing-a-development-branch` once a
> phase's tasks are done. Note: that skill's own default is to stop and ask on any
> blocker — this prompt's full-auto instructions below override that default for this
> run specifically (per `using-superpowers`'s own stated precedence: direct
> instructions outrank a skill's default behavior), except for the 3 hard stops
> listed below, which stay in force. Read `AGENTS.md`, `PROGRESS.md`'s top section,
> and `docs/milestones/milestone_2/MASTER_PROMPT.md` in full. Execute all 6 phases of
> `MASTER_PROMPT.md` end-to-end, in order, without stopping to ask for confirmation
> between phases — this is a full-auto run. One phase per commit/branch (this repo's
> existing branch-per-fix/`dev`-merge convention, see `PROGRESS.md`'s "Completed"
> entries). Before starting a phase, state in one paragraph what you're about to
> change and why, then proceed immediately — don't wait for a reply. Every place a
> phase says "confirm with the user," instead take that phase's stated default
> decision, write the reasoning into `PROGRESS.md`'s dated entry for that phase, and
> continue to the next step in the same phase. After each phase, run its stated
> verification and report the actual result in your running commentary — don't mark
> a phase done on partial or unverified work, and don't stop the run to report it,
> just keep going into the next phase. The **only** things that should actually stop
> you and wait for the user are the hard stops listed just below — everything else,
> make the call and keep moving:
> 1. Any operation that could destroy real, already-persisted data with no way back
>    (e.g. a migration that would drop/truncate a table holding live rows, not just
>    rename it) — Phase 1's rename migration specifically calls this out.
> 2. A genuinely missing external credential or dataset with no reasonable
>    workaround (`AGENTS.md` §0.2) — not a case where a sensible default exists, only
>    a true dead end.
> 3. Whatever this harness's own standing safety rules already require confirmation
>    for regardless of task (force-push, hard reset, discarding uncommitted work,
>    etc.) — those aren't overridden by "full auto," they're a separate, permanent
>    floor.
> If Docker/Postgres/MongoDB aren't running, say so in your commentary and proceed
> with what's verifiable (code changes, unit tests) rather than stopping — note
> clearly which verification steps couldn't run live, don't claim they did.

---

## Phase 0 — Environment & data check

**Goal:** confirm the ground truth before touching code.

1. `docker_run.py` (or `docker compose up -d`) — confirm Postgres/Mongo/Redis are
   actually reachable. **As of 2026-07-14, Docker (postgres/mongo/redis/minio/
   elasticsearch) is confirmed live** on this machine — check `docker ps` fresh each
   session rather than assuming that state persists; it doesn't survive a reboot.
2. Kaggle credentials are real and working as of 2026-07-14 (root `.env`, regenerated
   from `.env.development` — see `PROGRESS.md`). All 3 datasets are downloaded — see
   Phase 3, already done, skip re-running it unless the data needs refreshing.
3. Note: `docker exec` specifically got consistently deferred/backgrounded by the
   harness in this session for reasons unrelated to query complexity — querying
   Postgres through the app's own `app.db.postgres.async_session_factory` (a small
   inline async script) worked reliably instead when `docker exec psql` didn't.
4. Confirm current branch state (`git status`, `git log -1`) — this plan assumes a
   clean working tree per phase; don't start Phase 1 with Phase 0's exploration still
   uncommitted.

**Checkpoint:** if Docker isn't available, **default: proceed with code-only changes**
(migrations written but not applied/verified) rather than pausing — note clearly in
`PROGRESS.md` which verification steps couldn't run live, so a later session knows to
re-verify against a live database before trusting this phase's DB-touching claims.
**Known unrelated pre-existing gap, not blocking:** 5 MinIO/storage tests fail
(`InvalidAccessKeyId`) — `.env.development`'s `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`
are blank while `docker-compose.yml`'s MinIO container uses hardcoded dev-only
`skinlytics`/`skinlytics_dev_only`. Unrelated to M2 (storage backs consultant/
dermatologist verification documents) — don't fix as part of this plan unless asked.

---

## Phase 1 — Literal rename (the big one)

**Goal:** `skin_scores`→`skin_assessments`, `routines`→`skincare_routines`, endpoints
to the docx's literal paths, without losing any of the already-verified logic in
`scoring_engine.py`/`scores/service.py`/`routines/service.py`.

### 1.1 Postgres tables (SQLAlchemy models + canonical schema doc, together)

- `backend/app/services/scores/models.py`: `SkinScore.__tablename__` →
  `"skin_assessments"`. Columns stay as-is except: mile_2.docx's `skin_assessments`
  table only names `id`, `user_id`, `overall_score`, `detected_concerns` (JSONB),
  `created_at` — the real implementation has more (per-component scores, `weight_id`).
  **Don't drop the extra columns to match the docx literally** — they're real,
  tested, load-bearing data the docx's illustrative schema just didn't anticipate.
  Do add a `detected_concerns` JSONB column if one doesn't functionally exist yet
  (check `skin_profile_concerns` first — the concern list may already be derivable
  through a join rather than needing a duplicate denormalized column). **Default:**
  if it's derivable via a join, don't add a redundant column — note that in the
  migration docstring instead, per `AGENTS.md`'s "don't invent a column" rule, and
  move on.
- `backend/app/services/routines/models.py`: `Routine.__tablename__` →
  `"skincare_routines"`. `RoutineStep`/`RoutineProduct` aren't named in the docx —
  keep `routine_steps`/`routine_products` unless the user says otherwise.
- Every `ForeignKey("skin_scores...")` / `ForeignKey("routines...")` reference
  elsewhere in `backend/app/services/**/models.py` needs updating to match (grep
  first: `grep -rn "skin_scores\|routines.routine_id\|ForeignKey(\"routines" backend/app`).
- `database_schemas/skinlytics_postgresql_schema_v3.sql`: rename the same tables in
  the canonical DDL doc **in the same change** — this file is the project's source of
  truth per `AGENTS.md` §0, it must never drift from the live models. Update
  `README_v3_changes.md` with a dated note explaining the rename and citing this
  master prompt.
- New Alembic migration (`backend/app/migrations/versions/`): a real `rename_table`
  migration (`op.rename_table`), not a drop/recreate — this preserves existing rows
  and their FKs. Write both `upgrade()`/`downgrade()`. Per this repo's own established
  precedent (see `PROGRESS.md`'s baseline-migration entries), if the live dev database
  already has data under the old names, this may need `alembic stamp` reconciliation
  rather than a blind `upgrade` — check the live DB state before running anything.
  **Hard stop, not a default-and-continue case:** `op.rename_table` itself is
  non-destructive (preserves rows), but if you find yourself reaching for anything
  that would drop or truncate a table with real rows in it (e.g. a fresh
  drop/recreate instead of a rename, because a rename hit an unexpected FK issue),
  stop and ask before running it — that's real data loss with no way back, exactly
  the kind of thing full-auto mode doesn't override (see the master prompt's hard
  stops above).

### 1.2 Mongo collection

`routine_logs` **already matches** the docx literally (`routines/service.py`'s
`_ROUTINE_LOGS_COLLECTION`) — no rename needed here. Don't touch it.

### 1.3 Endpoints

- `backend/app/services/scores/router.py`: `GET /scores/me` → add
  `GET /api/v1/assessment/score` (keep the same handler logic — this can be a route
  rename, not new logic). Add `POST /api/v1/assessment/evaluate` — the docx's version
  of "evaluate a submitted profile," which in the real app is really "recompute the
  score for the current user's already-saved profile" (no separate submit-a-whole-
  profile-inline endpoint exists, and shouldn't be invented — the Skin Profile service
  already owns profile writes). **Default:** use this mapping as-is, note the
  reasoning in `PROGRESS.md`, move on.
- `backend/app/services/routines/router.py`: `GET /routines/me` →
  `GET /api/v1/routine`; `POST /routines/generate` → `POST /api/v1/routine/generate`
  (this one's nearly a pure rename — the existing route already matches the docx's
  intent almost exactly, see `PROGRESS.md`'s existing note on this).
- **Default:** keep the *old* paths (`/scores/me`, `/routines/me`, etc.) as
  deprecated aliases pointing at the same handlers, rather than removing them
  immediately — the frontend files below all call the old paths today, and an
  alias costs nothing while Phase 1.4 updates every consumer over to the new ones
  in the same pass. Remove the aliases once Phase 1.4 confirms nothing calls them
  anymore.

### 1.4 Frontend

Update every consumer of the renamed endpoints/types (found via
`grep -rln "scores/me\|routines/me\|routines/generate\|routines/steps" web/app web/components web/lib`
as of this writing):
- `web/app/(user)/routine/page.tsx`
- `web/app/assessment/results/page.tsx`
- `web/app/(user)/routine/edit/[routineId]/page.tsx`
- `web/app/(user)/dashboard/page.tsx`
- `web/components/dashboard/routine-checklist-card.tsx`
- `web/lib/hooks/use-toggle-routine-step.ts`
- `web/lib/api-types.ts` — **regenerate**, don't hand-edit (`make openapi` from
  `backend/`, per `PROGRESS.md`'s documented `cd backend` gotcha).

**Checkpoint:** `ruff`/`mypy --strict`/`pytest` (backend, against a live Postgres —
Phase 0's job) and `tsc`/`eslint`/`next build` (frontend) all clean. Manually verify
in a browser: dashboard loads a score + routine, a checklist toggle still round-trips
to Mongo. If Docker isn't available, write and unit-test what you can (pure functions,
route wiring against mocked deps) and clearly flag the untested parts — don't claim
live verification that didn't happen.

---

## Phase 2 — Scoring formula reconciliation

`scoring_engine.py` already exists (`backend/app/services/scores/scoring_engine.py`,
done 2026-07-14). Confirm its 5 sub-score functions still match mile_2.docx Step 3.1
*exactly*, not just `docs/AI_ML.md`'s paraphrase of it — read Step 3.1 fresh:
- Skin Condition: -15/High, -7/Medium. **Already matches.**
- Sleep: `(hours/8)*100`, capped at 100. **Existing code uses a 7-9h band + 40%
  self-rated quality instead of the docx's flatter `hours/8` formula** — this is a
  real, documented deviation (a richer model than the docx's minimal spec), not a
  bug. **Default: keep the richer version** — it's a strict superset of the docx's
  intent (rewards the same ideal-sleep case, plus accounts for self-rated quality
  the docx's formula ignores entirely), not a narrower or contradictory behavior.
  Note the deviation in `PROGRESS.md` and in this doc, don't narrow it.
- Lifestyle: docx only mentions "deduct for high unprotected UV" — existing code has
  a broader 4-part index (exercise/stress/diet/sun-hygiene) *plus* the UV deduction.
  Same category of deviation as Sleep above — **default: keep the richer version**,
  same reasoning (superset, not a contradiction). Note it, don't narrow it.
- Routine Consistency: "% of checks completed, last 7 days" — existing
  `_routine_adherence_score` uses a **30-day** window, not 7. This is a real,
  checkable *mismatch* against the docx's literal Step 3.1 text, not a superset (a
  30-day average dilutes a bad recent week with three good older ones, which can
  produce a materially different number than the docx's literal ask, not just a
  richer version of the same answer). **Default: fix to 7 days to match the docx
  literally** — this is the one formula change in this phase that isn't just a
  documentation note. Update the two Step 6.1 unit tests' fixtures accordingly if the
  window change affects their expected values.
- Hydration: "compare against standard recommendations" — existing 8-glasses/2L
  standard. **Already matches.**

**Checkpoint:** any change here touches `calculate_skin_health_score`'s callers and
the two Step 6.1 unit tests (`test_compute_and_store_score_is_perfect_for_an_ideal_profile`,
the sensitive-skin safety test) — rerun both after any formula edit.

---

## Phase 3 — Dataset ingestion — **DONE (2026-07-14)**

All 3 datasets from `training_dataset/MANIFEST.md` are downloaded/ingested for real —
see `PROGRESS.md`'s dated entry for the full account. Summary:
- **Sephora** — `make ingest-products` ran against live Postgres: 8,464 new products,
  0 already present, 30 rejected (missing mandatory fields). Final counts:
  `products`=8480, `ingredients`=16303, `product_ingredients`=227657. Fixed 2 real
  bugs found by actually running it (duplicate-ingredient-within-product crash;
  semicolon-delimited sub-lists overflowing `VARCHAR(150)`) — see `products.py`.
- **Cosmetics** — `cosmetics.csv` landed, no pipeline (not needed for M2).
- **ISIC 2019** — 9.2GB, all 8 classes extracted, landing only (not needed for M2).

Nothing left to do here unless the Sephora catalog needs a refresh (re-running
`make ingest-products` is idempotent and safe) or a Cosmetics/ISIC pipeline actually
becomes in-scope later.

---

## Phase 4 — Frontend behavior verification (Step 5 of mile_2.docx)

The frontend is Next.js App Router, not the docx's plain React + react-router-dom +
Axios — confirmed with the user (2026-07-14) as the right call, translate *behavior*,
don't switch stacks. Check each of the docx's Step 5 asks against what's already
built, not from memory:
- Multi-step wizard with step counter, progress bar, per-step validation blocking
  "Next" — `app/assessment/*`. Already built; confirm still true after Phase 1's
  endpoint renames didn't break it.
- Draft persistence on every change, reload-safe — docx says `localStorage`, existing
  code uses `sessionStorage` (survives refresh, not a closed tab) — a known, accepted,
  minor difference per `PROGRESS.md`. **Default: leave as `sessionStorage`** — this
  was already a settled decision before this phase, not something this rename
  reopens; just confirm it still works after Phase 1's endpoint changes.
- Loading spinner with the docx's literal copy ("Analyzing your skin profile...") —
  check the actual copy in the built wizard against this exact string; the docx names
  it explicitly, so an exact match costs nothing and removes a possible grading nit.
  **Default: match the docx's exact copy** — no reason not to, do it.
- Error banner (try/catch around the submit call) — confirmed built; re-verify after
  Phase 1's endpoint path changes.
- Success routing to `/dashboard`, clearing draft state — confirmed built as a manual
  button rather than automatic. **Default: leave as-is** — same reasoning as the
  `sessionStorage` bullet above, an already-settled decision this rename doesn't
  reopen.
- Dashboard's 3-card grid (AM/PM/Weekly) — existing build combines AM+PM into one
  card and puts Weekly on a separate `/routine` page, per an earlier documented
  decision (no wireframe backs a 3-card Dashboard layout). **Default: leave as-is** —
  same reasoning again; don't restructure a settled layout decision as a side effect
  of this rename unless a later phase's grading-safety pass specifically flags it.

**Checkpoint:** browser walkthrough (Playwright or manual) of the full flow: sign in →
submit assessment → see score → toggle a routine step → confirm it persists on
reload. Screenshot both themes if screenshots are part of this project's existing
verification habit (they are, per `PROGRESS.md`).

---

## Phase 5 — Tests & manual verification (mile_2.docx Step 6)

Both mandated unit tests already exist and pass
(`test_compute_and_store_score_is_perfect_for_an_ideal_profile`,
the sensitive-skin routine safety test) — re-run them after Phase 1/2's changes, don't
assume they still pass unchanged. Then re-run the manual Postman/frontend checklist
from Step 6.2 fresh against the renamed endpoints:
1. Log in, obtain a real token.
2. `POST /api/v1/assessment/evaluate` — confirm a real row lands in
   `skin_assessments` (not the old `skin_scores` name, once Phase 1 lands).
3. `GET /api/v1/routine` — confirm AM/PM arrays return.
4. Toggle a step, confirm it's logged in Mongo `routine_logs`.

**Checkpoint:** update `PROGRESS.md` with a dated entry closing this phase, citing
real command output (test pass counts, a real `psql`/`mongosh` query result) — not a
restated claim. This is the same discipline every other `PROGRESS.md` entry already
follows; don't relax it for this pass just because most of the underlying logic
already existed before this rename.
