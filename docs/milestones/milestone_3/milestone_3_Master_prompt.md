# Milestone 3 — Master Prompt (Rubric Compliance & Gap-Closure Pass)

> **What this file is.** The standing master prompt for any Claude Code session executing
> Milestone 3 against the **graded rubric** `docs/milestones/milestone_3/MILESTONE 3.pdf`.
> It replaces the earlier `milestone_3.md` / `milestone_3_prompt.md` (deleted 2026-07-27),
> which were derived from the project PDF *before* the official rubric existed.
> Per `AGENTS.md` §0.1, the rubric's **literal names win** (after confirming with the
> user) — this pass exists to prove, close, and document every literal rubric requirement.
>
> **Critical context:** `PROGRESS.md` records that an internal M3 spec (M3-0…M3-H) was
> already built and merged to `dev` — ingredient intelligence, product catalog +
> recommendations v2, progress tracking, analytics/Insights, dashboards, outbox/worker,
> ES/FAISS, `ml/` eval harness. **Do NOT rebuild from scratch.** Every phase starts with
> an audit of what exists, then closes only the *gaps* between the built system and the
> rubric's literal requirements.

---

## 0. Paste-into-session master prompt

> You are the **Orchestrator** for Skinlytics Milestone 3 (rubric pass). Read, in full,
> in this order, before writing any code:
>
> 1. `AGENTS.md` (especially §0 sources of truth, §0.1 rubric precedence, §0.2
>    missing-data rules) and `CLAUDE.md` imports incl. `.agents/rules/skinlytics-stitch.md`.
> 2. `docs/milestones/milestone_3/MILESTONE 3.pdf` — **the graded rubric.** Steps 1–5 +
>    the official outcomes list. This is what you are graded on. Never work from a
>    summary of it.
> 3. `PROGRESS.md` — the 2026-07-22 audit entry (M1/M2 carry-overs), the "Milestones 2
>    and 3 are both complete" entry (what the earlier internal M3 pass already shipped),
>    the 2026-07-26/27 QA entries, and `bugs_report.md`.
> 4. `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/CONVENTIONS.md`, `docs/AI_ML.md`,
>    `docs/DATASETS_AND_APIS.md`, `docs/DESIGN.md`, `docs/WIREFRAMES.md`; the relevant
>    `database_schemas/` file before any data change; the exact
>    `web/designs/wireframes/` pair + reference screenshot before any screen.
> 5. The phase files in `docs/milestones/milestone_3/phases/` — execute them in order
>    P0 → P7. Each phase is divided into tasks with IDs (`M3R-P<n>-T<m>`).
>
> Run full-auto with the stated defaults. Where a phase marks a decision with a default,
> take the default and record the reasoning in `PROGRESS.md`. The ONLY hard stops
> (stop and wait for the user):
>
> 1. Destroying real persisted data with no way back (drop/truncate live tables, delete
>    live Mongo collections, bucket wipes). Non-destructive migrations don't qualify.
> 2. A genuinely absent external credential/dataset (AGENTS.md §0.2 — e.g.
>    OpenWeather/OpenUV keys, real AWS S3 creds). Never stub silently, never fabricate,
>    never claim the dependent feature done.
> 3. A rubric literal name conflicting with built code/schema (AGENTS.md §0.1) —
>    reconcile with the user before renaming, exactly as M2 did. Known conflicts to
>    raise are pre-listed in §6 below.
> 4. Anything requiring an edit to `AGENTS.md`'s fixed nav lists or an accepted ADR —
>    propose, don't apply.
> 5. A required plugin/skill from §4 that is not installed — name it, give Kiran the
>    install command, and pause only the work that needs it.
>
> After each phase: run its Verification section against the RUNNING docker-compose
> stack (not just unit tests), paste actual command output into the phase report,
> update `PROGRESS.md` honestly in the same branch, run `/code-review` on the diff,
> fix findings, then merge per the git rules in §5 and delete the branch. Never mark
> a task complete on partial or unverified work.

---

## 1. Rubric scope (MILESTONE 3.pdf → what's graded)

| Rubric step | Literal requirements | Likely repo state (verify in P0, never assume) |
|---|---|---|
| **1. Ingredient Intelligence Engine** | Seeded knowledge base (Retinoids, AHAs/BHAs, Vitamin C, Niacinamide, Hyaluronic Acid, Ceramides, Peptides) with attributes, irritation risks, incompatible categories · allergy matching w/ aliases · chemical conflict matrix per routine step · **Safety Score endpoint**: ingredient list + routine time → score 0–100, label `Safe`/`Warning`/`Unsafe`, allergy alerts, interaction warnings | `services/ingredients/` built in earlier M3 pass; endpoint contract vs rubric literal shape unverified |
| **2. Product Recommendation Engine** | Catalog categories (Face Wash, Moisturizer, Sunscreen, Serum, Toner, Treatment Products, Face Masks) w/ mapped actives + price tiers · hard-filter safety gate (allergens + clashes excluded) · weighted suitability: **Concern 50% · Skin-Type Fit 35% · Rating 15%** · budget cap + cheaper alternatives w/ similar actives · endpoint returns categorized recs with match % ("94% Match") | `services/recommendations/` v2 built; verify weights, categories, budget-alternatives, match-% payload |
| **3. Progress Tracking & Cloud Photo Pipeline** | AM/PM check-in logging in **MongoDB** · rolling **7/30/90-day** adherence (completed ÷ assigned) · photo upload streamed to **cloud storage (S3-compatible)**, metadata (**cloud URL, timestamp, skin-health score at upload, tag "Baseline"/"Week 4"**) in **PostgreSQL** · analytics endpoint: score timelines + compliance % + photo links | `services/progress/` + storage adapter built; verify 90-day window, photo-metadata columns (score-at-upload, tag), analytics payload |
| **4. Frontend Dashboards (React)** | **User:** score gauge (0–100) + sub-score cards · interactive AM/PM checklist logging in real time · line charts of score + adherence · recommendations shelf w/ active-ingredient tags + budget flags. **Consultant/Derm portal:** searchable patient roster (concerns, scores, compliance) · patient inspection view w/ survey details, adherence, **side-by-side Baseline vs Current photos** · **routine overwrite form** that reflects live on the user's checklist | Dashboards + Insights built; verify each literal widget, esp. side-by-side compare + overwrite-form→checklist live sync |
| **5. Testing & Verification** | Unit tests: clash detection triggers, allergy filter excludes, adherence math exact · **E2E walkthrough:** assessment → recs → check off tasks → upload photo → derm inspects photo + compliance → derm edits evening treatment step → user sees revised routine live | 507 backend tests exist; the specific rubric E2E walkthrough must exist as a named Playwright spec |

**Official outcomes (all four must be demonstrably true at the end):** Recommendation
engine operational · progress tracking + cloud photo storage functional · ingredient
safety/allergy/conflict + tailored-match workflows integrated · interactive dashboards
for consumers and dermatologists/consultants delivered.

---

## 2. Architecture guardrails (non-negotiable — from AGENTS.md §2)

Do not drift from these, no matter what a phase seems to invite:

- **Layer order is binding** (`docs/architecture.png`): Clients → FastAPI gateway →
  services → `backend/app/ai/` interfaces → data layer; external calls only via
  `backend/app/integrations/`. No layer skipping; route handlers hold no business logic.
- **Service anatomy fixed:** `router.py · service.py · schemas.py · models.py · deps.py`
  under `backend/app/services/<name>/`, mounted under `/api/v1`. Extend the existing
  `ingredients`, `recommendations`, `progress` services — do not create parallel ones.
- **Single-writer rule + derived stores** only via outbox/worker (ADR-010, already real).
- **Data ownership:** PG = ingredients/products/junctions, `skin_assessments`,
  `scoring_weights`, photo metadata; Mongo = routine/lifestyle/progress logs, AI payloads;
  ES/FAISS derived-only; Redis TTL'd; MinIO/S3 private bucket, presigned URLs only,
  EXIF stripped (`core/storage.py` — the ONE storage adapter; rubric's "AWS S3 or Azure
  Blob" is satisfied by the S3 API — prod is an env-var swap, not a code change).
- **Auth:** Better Auth only; backend validates JWT via `core/security.py`. Every new
  endpoint declares role(s) + ownership checks (`user`→me; consultant/derm→assigned
  clients via `clinical_review`'s `_verify_assignment`).
- **Skin Health Score weights** stay `0.35/0.20/0.20/0.15/0.10`, config-driven, math only
  in `services/scores/scoring_engine.py`. The rubric's recommendation weights
  (50/35/15) belong to the **recommendation** engine and must be equally config-driven —
  never hard-coded literals scattered through code.
- **Frontend:** Next.js App Router + TS + Tailwind v4 + shadcn/ui only; Frosted Lab
  Glass tokens from `web/app/globals.css`/`docs/DESIGN.md`; both themes on every screen;
  wireframe pair + reference screenshot checked side-by-side before "done"; TanStack
  Query via `web/lib/api.ts`; regenerate `web/lib/api-types.ts` (`make openapi`) after
  any router change.
- **AI outputs advisory** — `confidence` field + "not medical advice" disclaimer on
  assessment/derm-adjacent surfaces.
- **Commits:** conventional commits, author `Satya Sai tharun Jekkamsetti
  <satya.saitharun02@gmail.com>` (check `git config user.name` first — a stray "Kiran"
  author is a bug), **never** any AI co-author trailer.

---

## 3. Milestone 1 & 2 pendings (close or confirm in Phase 0)

From `PROGRESS.md` (2026-07-22 audit + later entries) — statuses may have moved;
Phase 0 re-verifies each against live code, never trusts this list:

1. **`docker-compose.yml` missing `api`/`web` services** — `worker` was required by the
   earlier M3 pass (verify it landed). `api`/`web` are M4-latest, but the rubric's E2E
   walkthrough runs against the real stack, so confirm the documented runtime works.
2. **OpenWeather/OpenUV keys blank in root `.env`** — credential blocker, hard stop §0.2:
   ask Kiran, don't stub.
3. **5 MinIO storage tests** (`InvalidAccessKeyId`) — env/config mismatch; must be green
   before the photo-pipeline phase (P3) or its results are noise.
4. **Deprecated aliases** `/scores/me`, `/routines/me`, `/routines/generate` still
   mounted — decide (default: keep until M4, note in ledger).
5. **`bugs_report.md` items #3/#4** (assessment `age_group` never sent; fake notification
   bell) — `docs/superpowers/plans/2026-07-26-age-group-sync-and-notification-bell.md`
   existed for these; verify they truly merged to `dev`, else close them in P0.
6. **ADR-010 outbox** — verify the earlier M3 pass really landed it (it claims to);
   ES/FAISS must be rebuildable from PG/Mongo.

---

## 4. Plugins, skills & agents — mandatory usage

### 4.1 Required plugins (Claude Code)

| Plugin | Use it for | When |
|---|---|---|
| **superpowers** | Brainstorm → plan → subagent-driven execution workflow; writing phase plans to `docs/superpowers/plans/`; TDD discipline | Every phase kickoff and execution |
| **ponytail** | Long-running/parallel session management for the multi-agent phases | P1–P5 parallel work |
| **ui-ux-pro-max** | Design-system-aware UI generation and review against Frosted Lab Glass tokens | P4, P5 (dashboards) |
| **frontend-design** | Component structure, layout fidelity vs wireframes | P4, P5 |
| **graphify** | `graphify query/path/explain` before touching unfamiliar code; `graphify update .` after every merged change (repo rule in `CLAUDE.md`) | Every phase |
| **code-review** | `/code-review` on every phase branch before merge | Every phase close |

### 4.2 Required skills

| Skill | Use it for |
|---|---|
| **find-skills** | At every phase start, discover whether an installed skill covers the task before hand-rolling |
| **graphify** | Scoped subgraph queries (`graphify-out/graph.json` exists) instead of raw grep for codebase questions |
| **shadcn** (`.agents/skills/shadcn`) | Any new/changed `web/` component — shadcn primitives first, always |
| **migrate-radix-to-base** (`.agents/skills/migrate-radix-to-base`) | Any touched component still on Radix; remember `nativeButton={false}` on `Button render={<Link/>}` (recurring bug, `bugs_report.md` #1) |
| **ui-ux-pro-max** | Visual QA of both themes against `docs/DESIGN.md` |

**If a listed plugin/skill is missing** when a phase needs it: stop that stream, tell
Kiran exactly what to install (e.g. `/plugin install <name>` or the marketplace it lives
in), and continue on streams that don't need it. **Additional installs worth asking Kiran
for if the phase warrants:** a Playwright/e2e helper skill for P6, and a database
review skill for P1/P3 migrations — ask before improvising.

### 4.3 Agent team (spawn as subagents; one branch per agent, per §5)

| Agent | Role | Phases |
|---|---|---|
| **Orchestrator** (main session) | Reads everything, sequences phases, merges, owns `PROGRESS.md` + ledger | all |
| **Recon Agent** (Explore subagent, read-only) | P0 audits: rubric ↔ code gap table, M1/M2 pending verification; uses graphify first | P0 |
| **Backend Agent** | Ingredient engine, recommendation engine, progress/analytics endpoints; ruff + mypy --strict + pytest before handing back | P1–P3 |
| **Data Agent** | Alembic migrations + `database_schemas/*.sql|md` mirrors in the same change; seed scripts | P1–P3 |
| **Frontend Agent** | User dashboard + portal work; shadcn/migrate-radix skills; both themes; `make openapi` types | P4–P5 |
| **QA Agent** | Unit-test gaps, the rubric E2E walkthrough spec, live-stack verification transcripts | P6 (embedded checks in P1–P5) |
| **Review Agent** | `/code-review` every phase diff; security review on auth/storage-touching diffs | every phase close |
| **Docs Agent** | Phase reports, `PROGRESS.md`, ADRs, `M3R_TASK_LEDGER.md` | every phase close |

Parallelism rule: P1 and P3 backend streams may run in parallel after P0 freezes
contracts; P4/P5 start only after their backing endpoints are contract-frozen (not
necessarily merged). Never two agents writing the same service directory concurrently.

---

## 5. Git workflow (strict)

- **Never touch `main` or `satya-sai-tharun-skinlytics`.** No commits, no merges, no
  force-pushes, no deletions. They are managed by the owner only.
- **`dev` is the integration branch** (it descends from `satya-sai-tharun-skinlytics`).
  All work merges into `dev` and only `dev`.
- **Branch from `dev`, one branch per phase (or per agent stream inside a phase):**
  - Features: `feat/m3r-p<n>-<slug>` (e.g. `feat/m3r-p1-safety-score-endpoint`)
  - Bug fixes: `fix/m3r-<slug>` (e.g. `fix/m3r-minio-test-creds`)
  - Docs/chores: `chore/m3r-<slug>`
- **Merge discipline:** phase verification green → `/code-review` clean → conventional-
  commit history tidy (squash noisy WIP) → merge to `dev` → **delete the branch**
  (local + remote). At milestone end, no `m3r-*` branches may remain.
- Other people's remote branches (`Niranjan--*`, `Pravallika-*`, `hemalatha-*`,
  `manvitha-*`, `samridh-*`, `shristi-*`, `chore/repo-recovery`) are **not yours**:
  never rebase, delete, or merge them.
- Rebase your branch on `dev` before merging if `dev` moved; resolve conflicts on the
  branch, never on `dev`.

---

## 6. Known rubric ↔ repo conflicts (raise with the user, don't silently pick)

1. **Charting library.** Rubric: "Chart.js or Plotly". Locked stack (AGENTS.md §4):
   shadcn Charts/Recharts (Plotly only for heavy scientific viz). **Default:** keep
   Recharts — the graded outcome is a working line chart of score + adherence, not a
   specific library — but flag it and get Kiran's confirmation; if the grader requires
   the literal library, that's an ADR + owner decision, not a quiet swap.
2. **Cloud storage naming.** Rubric: "AWS S3 or Azure Blob". Repo: MinIO (S3 API) in
   dev, real S3 via env swap. **Default:** document the S3-compatible story in the
   phase report; confirm whether the grader needs a live AWS bucket (credential = hard
   stop §0.2 if so).
3. **Endpoint literal names.** If the rubric grader expects specific endpoint paths that
   differ from built ones (e.g. safety-score or analytics routes), follow the M2
   precedent: rubric literal names win **after** confirming with Kiran — alias or
   rename via non-destructive migration, never break the frozen M2 contract silently.
4. **90-day adherence window.** Earlier passes verified 7-day (and 30-day) windows;
   the rubric adds 90-day. If the built adherence engine lacks it, that's a gap to
   close (P3), not a conflict — listed here so it isn't missed.

---

## 7. Phase index (files in `docs/milestones/milestone_3/phases/`)

| Phase | File | Theme | Rubric step |
|---|---|---|---|
| P0 | `phase_0_carryover_and_gap_analysis.md` | Carry-over closure, rubric gap analysis, contract freeze, ledger | pre-req |
| P1 | `phase_1_ingredient_intelligence.md` | Knowledge base, allergy matching, conflict matrix, safety-score endpoint | Step 1 |
| P2 | `phase_2_product_recommendations.md` | Catalog categories, safety gate, 50/35/15 scoring, budget alternatives, match % | Step 2 |
| P3 | `phase_3_progress_and_photo_pipeline.md` | Mongo check-ins, 7/30/90 adherence, photo pipeline, analytics endpoint | Step 3 |
| P4 | `phase_4_user_dashboard.md` | Gauge, AM/PM checklist, charts, recommendations shelf | Step 4.1 |
| P5 | `phase_5_professional_portal.md` | Roster, inspection view, photo compare, routine overwrite | Step 4.2 |
| P6 | `phase_6_testing_and_verification.md` | Unit-test gaps + the rubric E2E walkthrough | Step 5 |
| P7 | `phase_7_docs_release_and_cleanup.md` | Docs, PROGRESS.md, ADRs, branch cleanup, outcomes sign-off | outcomes |

Ledger: maintain `docs/milestones/milestone_3/M3R_TASK_LEDGER.md` (create in P0) with
one row per task ID — status `TODO / IN-PROGRESS / BLOCKED / DONE(+evidence)`.

---

## 8. Definition of done (every task — AGENTS.md §7, restated)

1. Matches the rubric/wireframe/schema file it implements — checked against the file.
2. Role + ownership enforcement present and tested on every new endpoint.
3. Gates green: `ruff` + `mypy --strict` + `pytest` · `npm run lint` + `npm run
   typecheck` (+ Playwright when a flow changed) · production `next build`.
4. Verified against the running stack with real output pasted in the phase report.
5. `database_schemas/`, docs, `PROGRESS.md`, ledger (and ADRs if structural) updated in
   the same branch. `graphify update .` run after the merge.
6. Both themes checked for any UI change. No TODO/FIXME, no commented-out code, no
   fabricated data, no silently stubbed credentials.
