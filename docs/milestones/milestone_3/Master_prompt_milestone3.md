# Milestone 3 — Master Prompt (Remaining Work, Newer Rubric)

> **What this file is.** The standing master prompt for any Claude Code session executing
> the **remaining** Milestone 3 work against the **newer graded rubric**
> `docs/milestones/milestone_3/MILSTONE 3 & 4.pdf` (7 pages, received 2026-08-11).
> This newer PDF supersedes the original `MILESTONE 3.pdf` (4 pages) that the earlier
> M3R pass (P0–P7) was written against and closed. It adds literal requirements the
> original never named: an **INCI Text Parsing Engine**, a **`POST
> /api/v1/ingredients/analyze-compatibility`** endpoint, a **Vector DB similarity-search
> stage (128-dim, FAISS/Pinecone)**, a **multi-stage scoring pipeline** (similarity →
> ML ranking → hard filters), a **`POST /api/v1/products/recommend-routine-set`** budget
> solver, **product comparison / dupe endpoints**, a **`POST /api/v1/progress/log-entry`**
> endpoint, and explicit `/dashboard/user`-style route literals.
>
> **This file replaces `milestone_3_Master_prompt.md` + `phases/phase_*.md` + the
> `M3R_*.md` doc set.** Those were written against the old PDF, are already executed
> (closed on `dev`), and are deleted from the working tree. Do **not** restore or rebuild
> them. The old pass's verified evidence still exists in git history
> (`git show 8a4f988:docs/milestones/milestone_3/M3R_COMPLETION_REPORT.md`, etc.) — use
> it as background, never as the source of truth for what is *currently* on disk.
>
> **Critical context:** `PROGRESS.md` claims Milestone 3 is complete. **Do not trust
> it.** Every phase below starts from a live-code audit against the *newer* rubric, then
> closes only the gaps that audit finds. `PROGRESS.md` is updated honestly at the end,
> never assumed.
>
> **Scope boundary:** the newer PDF also contains Milestone 4 (notifications, admin
> dashboard & reports, security/optimization, Docker Compose, CI/CD, cloud deployment).
> **M4 is out of scope for this file** — it has its own milestone, own exit criteria
> (`docs/ARCHITECTURE.md` §13), and per-service containerization is explicitly M4
> (ADR-005). Do not start M4 work from this prompt. Flag anything that touches both.

---

## 0. Paste-into-session master prompt

> You are the **Orchestrator** for Skinlytics Milestone 3 (remaining-work pass). Read, in
> full, in this order, before writing any code:
>
> 1. `AGENTS.md` (especially §0 sources of truth, §0.1 rubric precedence, §0.2
>    missing-data rules), `CLAUDE.md` imports incl. `.agents/rules/skinlytics-stitch.md`,
>    and `docs/milestones/milestone_3/Master_prompt_milestone3.md` (this file).
> 2. `docs/milestones/milestone_3/MILSTONE 3 & 4.pdf` — **the graded rubric.** Its
>    Milestone-3 pages (Steps 1–5 + outcomes) are what you are graded on. Never work
>    from a summary of it; re-read the PDF directly. Note its *literal names* for
>    endpoints and routes — they are graded.
> 3. This file's §2 (verified repo state) — the audit of what is really on disk today,
>    produced by direct `grep`/`git log`/live pytest on 2026-08-11, **not** from
>    `PROGRESS.md`. Trust this table as the starting point, but re-verify anything a
>    phase depends on before building (the disk always wins).
> 4. `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/CONVENTIONS.md`, `docs/AI_ML.md`,
>    `docs/DATASETS_AND_APIS.md`, `docs/DESIGN.md`; the relevant `database_schemas/`
>    file before any data change; the exact `web/designs/wireframes/` pair + reference
>    screenshot before any screen; `ml/README.md` + `ml/eval/run.py` before touching
>    `ml/`.
> 5. The phase prompts in Part 3 of this file — execute in order P0 → P7. Each phase is
>    divided into tasks with IDs (`M3-P<n>-T<m>`). Maintain the ledger file named in
>    §7 (`M3R_TASK_LEDGER.md` recreated fresh; see P0-T6).
>
> **Git workflow (mandatory, §5):** follow the full protocol in §5 for every phase —
> report the §5.19 pre-task block before starting, branch only from updated `dev`, one
> branch per workstream, Conventional Commits with the required author (no AI co-author
> trailers), run tests + `/code-review` before every merge, merge only into `dev`, delete
> the branch (local + remote) after merge. **Never touch `main`, `satya-sai-tharun-
> skinlytics`, or any remote branch you did not create for the current task.** For P2 use
> the `feature/product-quality-model` exception (§5.7), never a new ML branch.
>
> Run full-auto with the stated defaults. Where a phase marks a decision with a default,
> take the default and record the reasoning in `PROGRESS.md`. The ONLY hard stops (stop
> and wait for the user):
>
> 1. **A rubric-literal name conflicting with built code** (AGENTS.md §0.1) — e.g.
>    `analyze-compatibility` vs built `safety-score`; `recommend-routine-set` vs built
>    `max_price` param; `log-entry` vs built `toggle_step_completion`;
>    `/dashboard/user` vs built `/dashboard`; `XGBoost / LightGBM` vs built sklearn
>    `GradientBoostingRegressor`; `128-dimensional` vs built 384-dim. **M2 precedent:
>    the rubric's literal names win, but only after confirming with the owner** — raise
>    each in P0, get a decision, then reconcile (alias, rename via non-destructive
>    migration, or documented-deviation ADR). Never silently pick one direction.
> 2. Destroying real persisted data with no way back (drop/truncate live tables, delete
>    live Mongo collections, bucket wipes). Non-destructive migrations don't qualify.
> 3. A genuinely absent external credential/dataset (AGENTS.md §0.2 — e.g. real AWS S3
>    creds, a real XGBoost/LightGBM training set that doesn't exist on disk). Never stub
>    silently, never fabricate, never claim the dependent feature done.
> 4. Anything requiring an edit to `AGENTS.md`'s fixed nav lists or an accepted ADR —
>    propose, don't apply.
> 5. A required plugin/skill from §4 that is not installed — name it, give the owner the
>    install command, and pause only the work that needs it.
>
> After each phase: run its Verification section against the RUNNING docker-compose
> stack (not just unit tests), paste actual command output into the phase report, update
> `PROGRESS.md` honestly in the same branch, run `/code-review` on the diff, fix
> findings, then merge into `dev` per §5 and delete the branch (local + remote). Never
> mark a task complete on partial or unverified work.

---

## 1. Rubric scope — Milestone 3 pages of `MILSTONE 3 & 4.pdf`

The newer PDF is the graded document. Its Milestone-3 pages are organized as Step 1–5
with an "official outcomes" list. Full literal text is in the PDF; this table maps each
step to what must be true and (from §2) what already is.

| Step | Literal requirements (newer PDF) | Verified state on disk (2026-08-11) | Verdict |
|---|---|---|---|
| **1. Ingredient Intelligence Module** | (1) Mongo collections for rich ingredient metadata (Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/BHAs) incl. pH ranges, contraindications, synergies, allergy tags · (2) **INCI Text Parsing Engine** — regex + NLP string processing converting raw product ingredient strings into tokenized arrays · (3) **`POST /api/v1/ingredients/analyze-compatibility`** evaluating active-ingredient conflicts (e.g. Retinoids + AHAs/BHAs irritation) · (4) Allergy & Sensitivity Engine — parsed components vs user sensitivity arrays → Safe/Caution/Unsafe · (5) Educational context — functions, benefits, usage warnings | Knowledge base seeded (7 classes, `seed.py`), allergy matching alias-aware (`app/ai/suitability.py`), pairwise conflict matrix (`app/ai/interactions.py`), `POST /api/v1/ingredients/safety-score` (0–100 + label + allergy alerts + interaction warnings), educational ingredient endpoints — all real from M3R-P1. **No INCI free-text parser.** **No `analyze-compatibility` endpoint.** | **Partial — close (1b)/(1c) gaps** |
| **2. Product Recommendation Engine** | (1) **Vector Search** — generate **128-dimensional** embeddings for user skin profiles and products, index in a Vector DB (**FAISS / Pinecone**) · (2) **Multi-Stage Scoring Pipeline:** Stage 1 **Similarity Search** (cosine similarity → top candidate set) · Stage 2 **ML Ranking Model** (**XGBoost / LightGBM** → refined suitability) · Stage 3 **Hard Constraint Filtering** (remove allergens / conflicting actives) · (3) **`POST /api/v1/products/recommend-routine-set`** budget-constraint solver across categories (Face Wash, Serum, Moisturizer, Sunscreen, Toner, Face Masks) · (4) **Product Comparison & Alternative Generation** — compare two products side-by-side, auto-generate lower-cost dupes | FAISS vector store real (`app/db/vector.py`, cosine IP, worker-projected per ADR-010) but **384-dim** (all-MiniLM-L6-v2) and **not wired as the recommendation Stage-1 pre-retrieval** (pipeline does relational pre-filter first; FAISS used only for product-detail alternatives). Product-quality **GradientBoostingRegressor** model (sklearn, not XGBoost/LightGBM) wired into `rating_norm` on branch `feature/product-quality-model` — **uncommitted work remains**. Hard-filter safety gate real and tested (stage 1 of the built pipeline). `max_price` + `alternative_for_product_id` exist on `GET /recommendations/me`; **no `recommend-routine-set` solver**. **CORRECTED 2026-08-12: `GET /products/compare` already exists** (`products_service.py:307` `compare_products()`, `products_router.py:66`) — returns side-by-side items incl. ingredients, skin-type/concern fit, and each product's `suitable`/`suitability_confidence` (safety-gate status) via the nested product read. `/products/{id}/alternatives` (dupes) also real. Compare is **REAL, not a gap** — P3 only needs to verify it against the rubric's exact field list + add tests, not build it. | **Largest gap — P2/P3 (solver only; compare already real)** |
| **3. Progress Tracking & Health Scoring** | (1) Weighted Health Score = 0.35 Condition + 0.20 Lifestyle + 0.15 Sleep + 0.20 Routine Consistency + 0.10 Hydration · (2) **`POST /api/v1/progress/log-entry`** storing daily completion flags, hydration metrics, self-reported concerns · progress photos → cloud storage, reference keys in **MongoDB `progress_logs`** · (3) 7-day / 30-day / 90-day analytics mapping score variance vs adherence | Weighted scoring engine real and config-driven (`scores/scoring_engine.py`, weights 0.35/0.20/0.20/0.15/0.10). **CORRECTED 2026-08-12:** `toggle_step_completion` does NOT live in the progress module — it's in `services/routines/` (writes Mongo `routine_logs`), a different service entirely. The progress module already has `POST /progress/me/logs` (`progress/router.py:80` → `upsert_progress_log()`) but that is a **weekly computed self-assessment report** (only user-authored field is `notes`; before/after images, improvement score, concern_changes, trend_summary are all server-computed) — not a daily completion+hydration+concern logger. **The rubric's `log-entry` gap is still real**, just mischaracterized: no endpoint accepts user-submitted daily completion flags + hydration metric + self-reported concerns as input anywhere. Photo pipeline real (MinIO/S3 adapter, EXIF strip, presigned, score-at-upload frozen, Baseline/Week-N tag; metadata in **PostgreSQL** `progress_images`). 7/30/90 compliance + historical-routine-correct adherence + `GET /analytics/me` (timeline + compliance + photos) real. | **Partial — build `log-entry` for real (not a rename)** |
| **4. Dashboards (React + Tailwind)** | `/dashboard/user` — score gauge + component breakdowns · interactive AM/PM checklists · filterable recommendation cards with purchase/view actions · progress charts (Chart.js / Plotly) · `/dashboard/consultant` — assigned clients, assessment records, adherence ratings, routine adjustment controls · `/dashboard/dermatologist` — high-res progress image comparisons, risk factor analyses, concern severity trends, treatment-note interfaces | User dashboard at `/dashboard` (route group `(user)`), consultant at `/consultant/dashboard`, dermatologist at `/dermatologist/dashboard`. Score ring with 5 real sub-scores, live-sync AM/PM checklist, Chart.js `ScoreAdherenceChart` (ADR-035), recommendations shelf with match %/tags/budget flag — all real from M3R-P4. Professional portal (roster, inspection view, Baseline/Current photo compare, routine-overwrite) real from M3R-P5. **Route literals differ from the rubric's `/dashboard/<role>` form.** | **Partial — reconcile routes** |
| **5. Testing & Verification** | Automated backend testing (chemical clash, allergy filter, adherence formulas) · E2E: Signup → Assessment → Routine → Recommendation → Progress → Report | Real from M3R-P6 (unit-test sweep + `m3-rubric-walkthrough.spec.ts` + `m3-persistence-after-restart.spec.ts`; 560/560 backend; e2e ~101 specs). **New work (P2–P4) needs its own tests + walkthrough extension.** | **Extend** |

**Official M3 outcomes (all must be demonstrably true at the end):** Product
Recommendation Engine operational · Progress Tracking System functional · Analytics and
Recommendation Workflows completed · Interactive Dashboards for consumers and
dermatologists/consultants delivered. (The newer PDF re-lists these at its end.)

---

## 2. Verified repo state — what is real vs missing (audit of 2026-08-11)

Produced by direct inspection (git log, grep, file reads) on branch
`feature/product-quality-model`. **Do not trust `PROGRESS.md`; this table is the
baseline.** Rows marked `REAL` are built, tested, and merged to `dev` — do not rebuild
them; extend only. Rows marked `GAP` are the remaining work this prompt exists to close.

### 2.1 REAL (already built & verified — M3R P1–P6, on `dev`)

| Area | What exists | Where |
|---|---|---|
| Ingredient knowledge base | 7 rubric active classes seeded w/ attributes, irritation risk, incompatible categories | `backend/app/db/seed.py:230-320` |
| Allergy matching | alias-aware (e.g. "Ascorbic Acid" ↔ "Vitamin C"), returns suitability + confidence | `backend/app/ai/suitability.py` |
| Conflict matrix | pairwise active-ingredient verdicts | `backend/app/ai/interactions.py` |
| Safety Score endpoint | `POST /api/v1/ingredients/safety-score` → 0–100, Safe/Warning/Unsafe (config-driven thresholds), allergy alerts, interaction warnings; role + assignment checks | `services/ingredients/{router,service,schemas}.py`, migration `75e0940c0f36` |
| Product catalog | Real Sephora ingest, 7 rubric categories + excluded `uncategorized` (2,425 total) | `services/admin/ingest/`, `products_service.py` |
| Suitability weights | config-driven `recommendation_weights` 50/35/15, CHECK sum = 1.00 | migration `6d05f726e558`, `get_active_recommendation_weights()` |
| Recommendation endpoint | `GET /recommendations/me` — per-category top-1, `match_percentage` 0–100, `over_budget` + `alternative_for_product_id`, Redis cache + PG persist | `services/recommendations/service.py` |
| Product comparison | `GET /products/compare` — side-by-side items incl. ingredients, skin-type/concern fit, `suitable`/`suitability_confidence` (safety-gate status) per product **(added to REAL 2026-08-12, was mislabeled a gap)** | `services/recommendations/products_service.py:307` `compare_products()`, `products_router.py:66` |
| Weekly progress report | `POST /progress/me/logs` — one doc per (user, week); only `notes` is user-authored, rest (before/after images, improvement score, concern_changes, trend_summary) computed server-side | `services/progress/service.py:269` `upsert_progress_log()`, Mongo `progress_logs` |
| Safety gates | same `evaluate_products_suitability` hard filter on ranking, budget alternatives, routine gen/add/edit/search, guardrail substitution, `/products/{id}/alternatives` | `services/recommendations/`, `services/routines/guardrails.py` |
| Step-completion adherence | Mongo `routine_logs` via `toggle_step_completion`; 7/30/90-day compliance; per-day historical active-step lookup (correct across mid-window routine changes) **(corrected 2026-08-12: `toggle_step_completion` lives in `services/routines/`, not `services/progress/`)** | `services/routines/service.py` (writer), `services/progress/service.py` (commits `b78c0f6`, compliance math consumer) |
| Photo pipeline | MinIO/S3 adapter (`core/storage.py` — magic-byte sniff, EXIF strip, presigned only); `skin_health_score_at_upload` frozen at upload; Baseline/Week-N auto-tag | migration `fc93ac5cf2d4`, `POST /progress/photos` |
| Analytics | `GET /analytics/me` = score timeline + compliance 7/30/90 + photo links | `services/analytics/` |
| Vector store infra | FAISS-backed, cosine (IndexFlatIP), atomic writes + process lock, per-namespace indexes, worker-projected only (ADR-010), rebuildable | `backend/app/db/vector.py`, `app/worker/rebuild.py`, `app/worker/consumers/embeddings.py` |
| Embeddings | namespaces `products`/`ingredients`/`knowledge_articles`/`user_profiles`; **384-dim** all-MiniLM-L6-v2 (pubmedbert 768 for articles) | `app/ai/schemas.py:144-149`, `app/ai/embedder.py` |
| ML scaffold | `ml/` eval harness (`ml/eval/run.py`), registry layout, training/verify scripts | `ml/` |
| Dashboards | user `/dashboard`, consultant `/consultant/dashboard`, derm `/dermatologist/dashboard`; Chart.js (ADR-035); professional portal roster/inspection/photo-compare/routine-overwrite | `web/app/*`, `web/components/` |
| E2E verification | rubric walkthrough spec + persistence-after-restart spec; 560/560 backend | `web/tests/e2e/m3-*.spec.ts` |

### 2.2 GAP — the remaining Milestone-3 work (this prompt's phases)

| # | Gap | Rubric literal | Current state | Phase |
|---|---|---|---|---|
| G1 | **INCI Text Parsing Engine** | "build an INCI parser using regex and NLP string processing to convert raw product ingredient strings into tokenized arrays" | No free-text tokenizer exists. `safety-score` accepts `ingredient_ids` only (resolved against the seeded `ingredients` table). Free-text INCI → normalized token array → fuzzy-match to canonical ingredients is unbuilt. | P1 |
| G2 | **`analyze-compatibility` endpoint** | "Build endpoint `POST /api/v1/ingredients/analyze-compatibility`" | `safety-score` exists instead. **Literal-name conflict — raise in P0.** Default: add `analyze-compatibility` as the rubric-named surface (thin alias or superset that also returns safety score), keep `safety-score` for backward compat (frozen M3R contract). | P1 |
| G3 | **Vector similarity search wired as recommendation Stage 1** | "Stage 1 (Similarity Search): compute cosine similarity between user vectors and product vectors to isolate the top candidate set" | FAISS infra real but the rec pipeline's Stage 1 is a relational PG pre-filter; no cosine pre-retrieval narrows candidates. `products_service.py:411-413` uses `vector.get_vector/search` only for product-detail alternatives. | P2 |
| G4 | **ML ranking Stage 2 completed** | "Pass top candidates through XGBoost / LightGBM models to compute refined product suitability scores" | `ProductQualityModel` (stub/real, sklearn `GradientBoostingRegressor`, artifact `ml/registry/product-quality-model-0.1.0/model.joblib`) is wired into `rating_norm` on branch `feature/product-quality-model`, with **uncommitted edits** (`ml/training/*`, `web/app/(user)/routine/page.tsx`, `web/app/globals.css`, `web/components/app-shell/app-shell.tsx`, `web/package.json`, `web/package-lock.json`, `backend/pyproject.toml`). **Not XGBoost/LightGBM by name — literal conflict to raise.** Default: keep sklearn GBM (defensible gradient-boosting family, already trained + honest-gated vs baseline), document the deviation in an ADR, complete + commit the branch. | P2 |
| G5 | **`recommend-routine-set` budget solver** | "Build endpoint `POST /api/v1/products/recommend-routine-set` implementing a budget constraint solver across product categories (Face Wash, Serum, Moisturizer, Sunscreen, Toner, Face Masks)" | Only per-recommendation `max_price` flag + single alternative exists. No endpoint that solves for a *full routine set* (one pick per category) under a total budget with a leftover/spend report. **New build.** | P3 |
| G6 | **Product comparison (side-by-side)** | "comparison endpoints allowing users to compare two products side-by-side" | **CORRECTED 2026-08-12 — NOT A GAP.** `GET /products/compare` already real (`products_service.py:307`, `products_router.py:66`), includes safety-gate status per product via nested `suitable`/`suitability_confidence`. P3 verifies against the rubric's exact field list (price, rating, category, mapped actives, skin-type/concern fit) and adds any missing field + tests — no new endpoint. | P3 (verify only) |
| G7 | **`progress/log-entry`** | "Implement endpoint `POST /api/v1/progress/log-entry` to store daily completion flags, hydration metrics, and self-reported concerns" | Daily check-ins real via `toggle_step_completion` (Mongo `routine_logs`) but no endpoint named `log-entry`, and no hydration-metric / self-reported-concern logging payload. **Literal-name conflict — raise in P0.** Default: add `log-entry` as the rubric-named endpoint over the existing progress service (extending, not duplicating, the single-writer path). | P4 |
| G8 | **Dashboard route literals** | `/dashboard/user`, `/dashboard/consultant`, `/dashboard/dermatologist` | Built as `/dashboard` (route group `(user)`), `/consultant/dashboard`, `/dermatologist/dashboard`. **Literal-name conflict — raise in P0.** Default: treat the built role-routed paths as satisfying the rubric (each role has its dashboard) and document; only add `/dashboard/<role>` redirects if the owner wants the literal strings. | P5 |
| G9 | **Embedding dimension literal** | "Generate 128-dimensional vector embeddings" | Built 384-dim (all-MiniLM-L6-v2). **Literal conflict — raise in P0.** Default: keep 384-dim (model quality over literal dim; dim is a property of the chosen embedder, not a free knob) and document in an ADR. | P2 |
| G10 | **Uncommitted branch work** | — | `feature/product-quality-model` carries the committed ML work + uncommitted edits (see G4). All must be completed, gated, and committed before the branch merges to `dev`. | P2 |
| G11 | **New-work tests + E2E extension** | Step 5 (unit + E2E) | New endpoints (G1–G3, G5–G7) need unit/router/RBAC tests + an extended rubric E2E walkthrough touching the new surfaces. | P6 |

---

## 3. Architecture guardrails (non-negotiable — from AGENTS.md §2)

Do not drift from these, no matter what a phase seems to invite:

- **Layer order is binding** (`docs/architecture.png`): Clients → FastAPI gateway →
  services → `backend/app/ai/` interfaces → data layer; external calls only via
  `backend/app/integrations/`. No layer skipping; route handlers hold no business logic.
- **Service anatomy fixed:** `router.py · service.py · schemas.py · models.py · deps.py`
  under `backend/app/services/<name>/`, mounted under `/api/v1`. Extend the existing
  `ingredients`, `recommendations`, `progress`, `analytics` services — do not create
  parallel ones. `GET /recommendations/me` and `GET /products/*` share
  `services/recommendations/` (products live there, not a `services/products/` dir).
- **Single-writer rule + derived stores** only via outbox/worker (ADR-010, real).
  Embeddings/vectors are **never computed or written on the request path** — the worker
  projects them; requests only *read*. New vector consumers must call
  `app/db/vector.py`'s read functions, never upsert.
- **Data ownership:** PG = ingredients/products/junctions, `skin_assessments`,
  `scoring_weights`, photo metadata; Mongo = routine/lifestyle/progress logs, AI
  payloads; ES/FAISS derived-only; Redis TTL'd; MinIO/S3 private bucket, presigned URLs
  only, EXIF stripped (`core/storage.py` — the ONE storage adapter).
- **Auth:** Better Auth only; backend validates JWT via `core/security.py`. Every new
  endpoint declares role(s) + ownership checks (`user`→me; consultant/derm→assigned
  clients via `clinical_review`'s `_verify_assignment`).
- **Skin Health Score weights** stay `0.35/0.20/0.20/0.15/0.10`, config-driven, math
  only in `services/scores/scoring_engine.py`. Recommendation weights (50/35/15) stay
  in the `recommendation_weights` table. Any new safety-score/label thresholds are
  equally config-driven — never hardcoded literals.
- **AI outputs advisory** — `confidence` field + "not medical advice" disclaimer on
  assessment/derm-adjacent surfaces. ML-influenced recommendation scores keep this
  contract; never present model output as a diagnosis.
- **Frontend:** Next.js App Router + TS + Tailwind v4 + shadcn/ui only; Frosted Lab
  Glass tokens from `web/app/globals.css`/`docs/DESIGN.md`; both themes on every screen;
  wireframe pair + reference screenshot checked side-by-side before "done"; TanStack
  Query via `web/lib/api.ts`; regenerate `web/lib/api-types.ts` (`make openapi`) after
  any router change.
- **Commits:** conventional commits, author `Satya Sai tharun Jekkamsetti
  <satya.saitharun02@gmail.com>` (check `git config user.name` first — a stray author
  is a bug), **never** any AI co-author trailer (owner decision, 2026-07-25).

---

## 4. Plugins, skills & agents — mandatory usage

### 4.1 Required plugins (Claude Code)

| Plugin | Use it for | When |
|---|---|---|
| **superpowers** | Brainstorm → plan → subagent-driven execution; writing phase plans to `docs/superpowers/plans/`; TDD discipline | Every phase kickoff and execution |
| **ponytail** | Long-running/parallel session management for multi-agent phases | P1–P4 parallel work |
| **ui-ux-pro-max** | Design-system-aware UI generation and review against Frosted Lab Glass tokens | P5 (dashboard route reconciliation) |
| **frontend-design** | Component structure, layout fidelity vs wireframes | P5 |
| **graphify** | `graphify query/path/explain` before touching unfamiliar code; `graphify update .` after every merged change (repo rule in `CLAUDE.md`) | Every phase |
| **code-review** | `/code-review` on every phase branch before merge | Every phase close |

### 4.2 Required skills

| Skill | Use it for |
|---|---|
| **find-skills** | At every phase start, discover whether an installed skill covers the task before hand-rolling |
| **graphify** | Scoped subgraph queries (`graphify-out/graph.json` exists) instead of raw grep for codebase questions |
| **shadcn** | Any new/changed `web/` component — shadcn primitives first, always |
| **migrate-radix-to-base** | Any touched component still on Radix; remember `nativeButton={false}` on `Button render={<Link/>}` (recurring bug, `bugs_report.md` #1) |
| **ui-ux-pro-max** | Visual QA of both themes against `docs/DESIGN.md` |

**If a listed plugin/skill is missing** when a phase needs it: stop that stream, tell the
owner exactly what to install, and continue on streams that don't need it.

### 4.3 Agent team (spawn as subagents; one branch per agent, per §5)

| Agent | Role | Phases |
|---|---|---|
| **Orchestrator** (main session) | Reads everything, sequences phases, merges, owns `PROGRESS.md` + ledger | all |
| **Recon Agent** (Explore subagent, read-only) | P0 audits: rubric ↔ code gap re-verification, contract freeze; uses graphify first | P0 |
| **Backend Agent** | INCI parser, compatibility endpoint, vector-stage wiring, ML-ranking completion, budget solver, compare, log-entry; ruff + mypy --strict + pytest before handing back | P1–P4 |
| **Data Agent** | Alembic migrations + `database_schemas/*.sql|md` mirrors in the same change; seed/ingest scripts | P1–P4 |
| **ML Agent** | Complete/commit the product-quality-model branch; train/honesty-gate/verify; eval-harness section; dimension/label ADR inputs | P2 |
| **Frontend Agent** | Dashboard route reconciliation + any UI; shadcn/migrate-radix skills; both themes; `make openapi` types | P5 |
| **QA Agent** | Unit-test gaps, extended rubric E2E walkthrough, live-stack verification transcripts | P6 (embedded checks in P1–P4) |
| **Review Agent** | `/code-review` every phase diff; security review on auth/storage/ML-touching diffs | every phase close |
| **Docs Agent** | Phase reports, `PROGRESS.md`, ADRs, ledger | every phase close |

Parallelism rule: P1 (ingredients) and P3 (products/progress) backend streams may run in
parallel after P0 freezes contracts; P5 starts only after its backing endpoints are
contract-frozen. Never two agents writing the same service directory concurrently.

---

## 5. Git & GitHub workflow (mandatory — full protocol)

The workflow in this section is **mandatory for EVERY task** in this repo. It overrides
any assumption to work directly on shared branches. **Never touch any remote branches
except the one(s) you create for the current task; never touch `main`; never merge to
`satya-sai-tharun-skinlytics`.** The target of every merge is `dev` and only `dev`.

Standalone copy for pasting into a fresh session or another tool that only needs the
workflow: `docs/milestones/milestone_3/GITHUB_WORKFLOW_RULES.md`. Same rules, same
branch names — keep both in lockstep if either changes.

### 5.1 Branch structure

```
main                              ← owner-managed only — never commit/merge/delete/force-push
└── satya-sai-tharun-skinlytics   ← project main, owner-managed only — same restrictions
    └── dev                       ← the ONLY integration branch; all work merges here
        ├── feat/m3-<phase>-<slug>
        ├── fix/m3-<slug>
        ├── chore/m3-<slug>
        └── feature/product-quality-model   ← P2 exception (§5.7)
```

- `main` and `satya-sai-tharun-skinlytics`: **NEVER** commit, merge into, delete, or
  force-push. Owner-managed only.
- `dev`: the only integration branch. Every feature/fix/chore branch ultimately merges
  into `dev`. Do not bypass `dev`.
- Never create a feature branch from another feature branch. Never
  `main → feature`, `feature → main`, or `feature → feature`. The only valid flow is
  `dev → feature branch → dev`.

### 5.2 The basic development flow

```
dev
 ↓
create feat/fix/chore branch
 ↓
implement task
 ↓
test
 ↓
code review (/code-review)
 ↓
commit (conventional commits)
 ↓
merge into dev
 ↓
delete feature branch (local + remote)
```

### 5.3 Before starting ANY task

1. Inspect git state: `git status`, `git branch --show-current`, `git fetch origin`.
2. If starting a new task: `git checkout dev` && `git pull origin dev`, then create the
   new branch **from updated dev** (e.g. `git checkout -b feat/m3-p1-inci-compatibility`).
3. Verify: `git branch --show-current` + `git status`. **Do NOT start implementation
   until confirmed on the correct task branch.**
4. Report the §5.19 pre-task block before any implementation.

### 5.4 Branch naming

- Feature: `feat/m3-<phase>-<slug>` — e.g. `feat/m3-p0-rebaseline`,
  `feat/m3-p1-inci-compatibility`, `feat/m3-p3-routine-set-compare`,
  `feat/m3-p4-log-entry`, `feat/m3-p5-dashboard-routes`, `feat/m3-p6-verification`.
- Bug fix: `fix/m3-<slug>` — e.g. `fix/m3-recommendation-filter`.
- Docs/chore: `chore/m3-<slug>` — e.g. `chore/m3-p7-docs-closeout`.
- Use descriptive names; the slug names the actual work.

### 5.5 Milestone-3 phase branches & dependency

| Phase | Branch |
|---|---|
| P0 | `feat/m3-p0-rebaseline` |
| P1 | `feat/m3-p1-inci-compatibility` |
| P2 | `feature/product-quality-model` (§5.7 exception) |
| P3 | `feat/m3-p3-routine-set-compare` |
| P4 | `feat/m3-p4-log-entry` |
| P5 | `feat/m3-p5-dashboard-routes` |
| P6 | `feat/m3-p6-verification` |
| P7 | `chore/m3-p7-docs-closeout` |
| P8 | `feat/m3-p8-biometric-consent` (beyond rubric, ADR-047) |
| P9 | `feat/m3-p9-cf-signal` (beyond rubric, ADR-048) |

Normal dependency: `P0 → P1/P2/P3/P4/P5 → P6 → P7`. **P6 must not start until P1–P5
are completed and merged into `dev`.** P8/P9 depend only on P0 (contract freeze) and can
run any time after — they're independent of P1–P7's rubric-gap-closing work.

### 5.6 One branch per workstream

Each independent feature/workstream has its own branch (e.g. backend
`feat/m3-p1-inci-compatibility`, frontend `feat/m3-p5-dashboard-routes`, QA
`feat/m3-p6-verification`, docs `chore/m3-p7-docs-closeout`). **Never have multiple
agents independently modifying the same service directory at the same time.** If
multiple agents are required, coordinate their scopes first.

### 5.7 P2 special exception: `feature/product-quality-model`

This existing branch already holds the in-flight ML / Product-Quality-Model work. For
P2: **DO NOT create another ML branch, DO NOT create `feat/m3-p2-ml`, DO NOT fork
another branch from `feature/product-quality-model`.** Instead:

1. `git checkout feature/product-quality-model`.
2. Inspect all committed and uncommitted changes.
3. Complete the existing ML work.
4. Run all required tests.
5. Commit the remaining work.
6. Run `/code-review`.
7. Merge `feature/product-quality-model` into `dev`.
8. Delete `feature/product-quality-model` (local + remote) after the successful merge.

The branch is temporary and must not remain after P2 merges.

### 5.8 Never work directly on dev / never touch other developers' branches

- Do not implement feature work directly on `dev`. If you discover you are on `dev` and
  need to modify code: **STOP**, create the appropriate task branch from `dev` first.
  The only operations allowed directly on `dev` are integration/merge operations and
  explicitly authorized maintenance.
- Other developers' branches (`Niranjan--*`, `Pravallika-*`, `hemalatha-*`,
  `manvitha-*`, `samridh-*`, `shristi-*`, `chore/repo-recovery`, and **any branch you
  did not create for the current task**): **NEVER** delete, merge, rebase, force-push,
  rename, modify, or reset them. Only manage branches belonging to the current
  task/workstream.

### 5.9 Working-tree safety

Before making changes: `git status`. If existing uncommitted changes exist, **do NOT
automatically** `git reset --hard`, `git clean -fd`, `git checkout -- .`,
`git restore .`, or `git stash`. Inspect what the changes are first. **Never destroy
existing work.** If the changes belong to another task or agent, preserve them and ask
for clarification.

Note on the current working tree: the old M3R doc set (`milestone_3_Master_prompt.md`,
`phases/`, `M3R_*.md`, `build/e2e/*.png`) is currently deleted, uncommitted. This file
supersedes it. Do not restore those files; do not commit their deletions inside a
feature phase either — fold them into P0's setup commit or ask the owner.

### 5.10 Rebase rule

If `dev` has changed while your feature branch is being developed: `git fetch origin`,
`git checkout <feature-branch>`, `git rebase origin/dev`. Resolve conflicts **on the
feature branch**, never on `dev`. After resolving, re-run the complete relevant test
suite, then continue with code review and merge.

### 5.11 Commit rules

Use **Conventional Commits** that describe the actual change. Examples:
`feat(ingredients): add INCI compatibility analysis`,
`feat(recommendations): add routine budget solver`,
`feat(progress): add log entry endpoint`,
`fix(recommendations): prevent allergen products`,
`test(milestone3): extend recommendation coverage`,
`docs(milestone3): update completion report`.

Avoid vague subjects such as `update`, `changes`, `fix`, `final`, `done`, `work`, `test`.

### 5.12 Required git author

Before committing, verify `git config user.name` and `git config user.email`:

- Name: **`Satya Sai tharun Jekkamsetti`**
- Email: **`satya.saitharun02@gmail.com`**

If the identity is incorrect, STOP before committing and correct it. **NEVER add AI
co-author trailers** (`Co-authored-by: Claude`, `Co-authored-by: Anthropic`,
`Co-authored-by: AI`).

### 5.13 Testing before merge

A branch is not ready to merge merely because the code works locally. Before merging,
run ALL applicable project gates:

- Backend: `ruff`, `mypy --strict`, `pytest`
- Frontend: `npm run lint`, `npm run typecheck`, `npm run build`
- When applicable: Playwright / E2E tests, Docker Compose live-stack verification

Use the exact verification requirements of the current Milestone phase. **Do not claim
tests are passing unless they were actually executed.**

### 5.14 Code review before merge

Before merging ANY feature branch, run `/code-review`. Fix all actionable findings. The
branch is mergeable only when: implementation is complete, tests pass, code review is
clean, documentation is updated, working tree is clean, and no unintended files are
included.

### 5.15 Documentation in the same branch

Update the required documentation files **in the SAME feature branch**
(`PROGRESS.md`, `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`, `docs/ARCHITECTURE.md`,
`docs/CONVENTIONS.md`, `docs/AI_ML.md`, `docs/DECISIONS.md`, `database_schemas/`). Do
not postpone required documentation until after merging.

### 5.16 Merge workflow

Before merging: `git status`, `git branch --show-current`, `git fetch origin`. Confirm:

1. Current branch is the intended feature branch.
2. `dev` is up to date.
3. Feature branch contains only intended changes.
4. Tests are green.
5. `/code-review` is complete.
6. Documentation is synchronized.

Then merge into `dev`. **The target is ALWAYS `dev` — NEVER `main`, NEVER
`satya-sai-tharun-skinlytics`.**

### 5.17 After a successful merge

Delete the local branch (`git branch -d <branch-name>`), delete the remote branch
(`git push origin --delete <branch-name>`), then verify with `git branch`,
`git branch -r`, `git status`. The completed feature branch must no longer remain.

### 5.18 Final Milestone-3 branch state

At the end of Milestone 3: `main` **untouched**, `satya-sai-tharun-skinlytics`
**untouched**, `dev` contains all verified Milestone-3 work. All temporary M3 branches
merged into `dev` and deleted locally + remotely:
`feat/m3-p0-rebaseline`, `feat/m3-p1-inci-compatibility`,
`feature/product-quality-model`, `feat/m3-p3-routine-set-compare`,
`feat/m3-p4-log-entry`, `feat/m3-p5-dashboard-routes`, `feat/m3-p6-verification`,
`chore/m3-p7-docs-closeout`, `feat/m3-p8-biometric-consent` (beyond rubric),
`feat/m3-p9-cf-signal` (beyond rubric).

### 5.19 Mandatory pre-task report (before every task)

```
Current branch:
Base branch:
Task:
Required branch:
Branch status:
Existing related implementation:
Files/services affected:
Tests required:
Documentation required:
Merge target:
```

### 5.20 Non-negotiable rules

1. Never commit directly to `main`.
2. Never commit directly to `satya-sai-tharun-skinlytics`.
3. `dev` is the integration branch.
4. Every new task starts from the latest `dev`.
5. Create a dedicated branch for each feature/fix/chore.
6. Never create a feature branch from another feature branch.
7. Never modify another developer's branch.
8. Never force-push shared branches.
9. Never destroy uncommitted work.
10. Run required tests before merging.
11. Run `/code-review` before merging.
12. Merge completed work into `dev`.
13. Delete the feature branch after a successful merge.
14. Use Conventional Commits.
15. Use the required Git author.
16. Never add AI co-author trailers.
17. If `dev` changes, rebase your feature branch onto `dev` before merging.
18. Resolve conflicts on the feature branch, never on `dev`.
19. Never mark a task DONE without actual verification.
20. Do not bypass this workflow for small changes unless the repository owner
    explicitly instructs you to do so.

### 5.21 Execution principle

For every task: inspect git state → identify the correct base branch → update `dev` if
necessary → create the correct task branch → verify the branch → inspect existing
implementation → implement the task → test thoroughly → update required documentation →
run `/code-review` → commit using Conventional Commits → re-check the working tree →
merge into `dev` → delete the completed branch → verify the final git state. **Never
skip the branch workflow.**

The final development state must always be: `dev` = latest verified integration state ·
feature branch = merged · feature branch = deleted · working tree = clean · tests =
verified · code review = completed · documentation = synchronized.

---

## 6. Literal-name conflicts to raise with the owner in P0 (don't silently pick)

Per AGENTS.md §0.1 + M2 precedent (literal names win, but only after confirming with the
owner). Every row has a **default**; take the default only if the owner confirms it.

| # | Rubric literal | Built reality | Default resolution |
|---|---|---|---|
| C1 | `POST /api/v1/ingredients/analyze-compatibility` | `POST /api/v1/ingredients/safety-score` | Add `analyze-compatibility` as the rubric-named endpoint (thin alias or superset returning the same safety verdicts); keep `safety-score` (frozen M3R contract) |
| C2 | `POST /api/v1/products/recommend-routine-set` | `max_price` query param on `GET /recommendations/me` | Build the new endpoint (G5) — it is a genuinely new capability (multi-category solver), not a rename |
| C3 | `POST /api/v1/progress/log-entry` | `toggle_step_completion` lives in `services/routines/` (Mongo `routine_logs`) — unrelated to `services/progress/`. `services/progress/` has `POST /progress/me/logs` but that's a weekly computed report (only `notes` is user-authored), not a daily completion/hydration/concern logger. **CORRECTED 2026-08-12: no existing endpoint covers this — it's a real new build**, not a rename. | Build `log-entry` fresh in `services/progress/` (G7) |
| C4 | `/dashboard/user`, `/dashboard/consultant`, `/dashboard/dermatologist` | `/dashboard`, `/consultant/dashboard`, `/dermatologist/dashboard` | Document the built role-routed paths as satisfying the rubric; add `/dashboard/<role>` redirects only if owner wants literal strings (G8) |
| C5 | "XGBoost / LightGBM" (Stage-2 ML) | sklearn `GradientBoostingRegressor` (product-quality model) | Keep sklearn GBM (already trained, honest-gated, wired); record a deviation ADR in P2 (G4) |
| C6 | "128-dimensional" embeddings | 384-dim all-MiniLM-L6-v2 | Keep 384-dim; record a deviation ADR in P2 (G9) |
| C7 | Progress-photo reference keys in Mongo `progress_logs` | Photo metadata in **PostgreSQL** `progress_images` | Keep PG (system-of-record; Mongo holds routine/lifestyle logs); record an ADR (or confirm the older M3R ADR-036 story) |
| C8 | Mongo "collections" for ingredient metadata | Ingredient metadata in **PostgreSQL** | Keep PG (canonical schema, single-writer); Mongo already holds the AI-payload/log collections. Confirm with owner |

---

## 7. Ledger & phase index

**Ledger:** maintain `docs/milestones/milestone_3/M3R_TASK_LEDGER.md` (recreate fresh in
P0 — the old one is deleted; its content lives in git history). One row per task ID
`M3-P<n>-T<m>`. Status vocabulary: `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE` ·
`DEFERRED`.

**Phase index (files live in this prompt, Part 3 — no separate `phases/` directory yet;
split them out only if a phase grows large):**

| Phase | Theme | Rubric step | Gaps closed |
|---|---|---|---|
| P0 | Re-baseline + contract freeze | pre-req | All §6 conflicts resolved; §2 re-verified |
| P1 | INCI parsing + compatibility | Step 1 | G1, G2 |
| P2 | Vector Stage-1 + ML Stage-2 completion | Step 2 | G3, G4, G9, G10 |
| P3 | Routine-set budget solver + compare/dupes | Step 2 | G5, G6 |
| P4 | Progress log-entry + analytics reconcile | Step 3 | G7 |
| P5 | Dashboard routes + UI reconcile | Step 4 | G8 |
| P6 | Testing & verification (extended) | Step 5 | G11 |
| P7 | Docs/ADR/lockstep + close-out | outcomes | — |
| P8 | Biometric consent + face-photo assessment pipeline | **beyond rubric — owner-authorized 2026-08-12** | ADR-047 |
| P9 | Sephora-review collaborative-filtering signal | **beyond rubric — owner-authorized 2026-08-12** | ADR-048 |

**P8 and P9 are NOT graded M3 rubric requirements.** They exist because the owner
explicitly reopened ADR-033 and directed both builds after reviewing three external
repos (see ADR-047/ADR-048 for the full record). They follow the identical §5 git
workflow (own branches, `feat/m3-p8-biometric-consent`, `feat/m3-p9-cf-signal`,
merge to `dev` only) but must never be reported as closing a graded gap — P7's
completion report keeps them in a clearly separate "beyond-rubric" section, not
folded into the four official M3 outcomes.

---

## 8. Definition of done (every task — AGENTS.md §7, restated)

1. Matches the rubric/wireframe/schema file it implements — checked against the file.
2. Role + ownership enforcement present and tested on every new endpoint.
3. Gates green: backend `ruff` + `mypy --strict` + `pytest`; frontend `npm run lint` +
   `npm run typecheck` (+ Playwright when a flow changed) + production `next build`.
4. Verified against the running stack with real output pasted in the phase report.
5. `database_schemas/`, docs, `PROGRESS.md`, ledger (and ADRs if structural) updated in
   the same branch. `graphify update .` run after the merge.
6. Both themes checked for any UI change. No TODO/FIXME, no commented-out code, no
   fabricated data, no silently stubbed credentials.
7. Git workflow per §5: correct task branch (from updated `dev`), Conventional Commits
   with the required author and no AI co-author trailers, merged into `dev`, branch
   deleted (local + remote). `main`/`satya-sai-tharun-skinlytics`/other-developers'
   branches never touched.

---

# PART 2 — Phase map

| Phase | Branch | Gate | Depends on |
|---|---|---|---|
| P0 | `feat/m3-p0-rebaseline` | §2 re-verified, §6 decisions recorded, contract frozen | — |
| P1 | `feat/m3-p1-inci-compatibility` | INCI parser + `analyze-compatibility` live, tests green | P0 |
| P2 | `feature/product-quality-model` (complete + merge) | vector Stage-1 + ML Stage-2 + deviations ADR'd, branch merged | P0 |
| P3 | `feat/m3-p3-routine-set-compare` | `recommend-routine-set` + compare live, tests green | P0 |
| P4 | `feat/m3-p4-log-entry` | `progress/log-entry` live, tests green | P0 |
| P5 | `feat/m3-p5-dashboard-routes` | route literals reconciled, both themes, types regenerated | P0 (+ frozen contracts) |
| P6 | `feat/m3-p6-verification` | full-gate run + extended rubric walkthrough green | P1–P5 |
| P7 | `chore/m3-p7-docs-closeout` | docs/ADRs/lockstep, ledger, PROGRESS.md, merge + cleanup | P6 |
| P8 | `feat/m3-p8-biometric-consent` | consent+upload+purge+retrain+fairness-gate all live, tests green, `/security-review` clean | P0 (independent of P1-P7) |
| P9 | `feat/m3-p9-cf-signal` | CF ingest+blend live, tiebreak-only constraint proven, tests green | P0 (independent of P1-P7) |

---

# PART 3 — Phase prompts

Each phase is a standalone prompt block. Copy the block, branch as named, run the `/goal`
LOOP. All phases assume the §0 master prompt context is already loaded.

---

## Phase 0 — Re-baseline & contract freeze

**Branch:** `feat/m3-p0-rebaseline` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.

> **/goal** Re-verify §2 of `Master_prompt_milestone3.md` against live code (disk wins,
> `PROGRESS.md` is untrusted), resolve every literal-name conflict in §6 with the owner,
> freeze the new API contract, and seed the ledger. Iterate until the gap table + contract
> are stable and owner-approved.

**Skills/plugins:** superpowers (brainstorm → plan), graphify (query before grep), ponytail
(parallel recon agents), find-skills.

**Tasks:**

- **M3-P0-T1** Environment & stack sanity. Bring up `docker compose up -d`
  (`postgres, mongo, redis, elasticsearch, minio, worker`), verify all healthy + backend
  `/health/ready`. Run backend suite (`ruff`, `mypy --strict`, `pytest`) and frontend
  (`lint`, `typecheck`) to establish the green baseline. Record exact counts.
- **M3-P0-T2** Re-verify §2 gap table. For each row (G1–G11) confirm REAL/GAP against
  live code with `grep`/reads — do not trust the table or `PROGRESS.md`. Update §2 in
  this file if the disk disagrees.
- **M3-P0-T3** Working-tree reconciliation. Confirm with the owner that the old M3R doc
  deletions are intentional (this file supersedes them). Fold the deletions into a P0
  setup commit if approved; otherwise leave untracked and note in the ledger.
- **M3-P0-T4** Resolve §6 conflicts C1–C8 with the owner. Record each decision
  (literal-name resolution + any ADR needed) in `PROGRESS.md` and the ledger. If the
  owner chooses a non-default option, update the affected phase prompts accordingly.
- **M3-P0-T5** Contract freeze. Write the API contract section (fresh
  `M3R_API_CONTRACT.md` or a `CONTRACT.md` under `docs/milestones/milestone_3/`) for the
  new/renamed surfaces: `analyze-compatibility`, INCI tokenizer payload, vector
  Stage-1 wiring, `recommend-routine-set`, product compare, `log-entry`. Reuse the
  frozen-shape conventions of the old contract (auth, role, ownership, error codes).
- **M3-P0-T6** Recreate `M3R_TASK_LEDGER.md` with every phase's task IDs (this file's
  M3-P<n>-T<m> scheme), all `TODO`.
- **M3-P0-T7** Merge `feat/m3-p0-rebaseline` to `dev`, delete the branch. `/code-review`
  the diff first.

**Verification:** all §6 conflicts have an owner decision recorded; gap table matches the
disk; backend + frontend baselines green with exact numbers in the phase report.

---

## Phase 1 — INCI parsing engine + `analyze-compatibility`

**Branch:** `feat/m3-p1-inci-compatibility` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.

> **/goal** Build the INCI Text Parsing Engine (free-text INCI string → normalized,
> tokenized ingredient array → canonical `ingredients` table matches), and ship the
> rubric-named `POST /api/v1/ingredients/analyze-compatibility` endpoint that returns
> active-ingredient conflict verdicts (+ the safety-score composition the owner approved
> in P0-T4). Iterate until a raw INCI list like `"Aqua, Glycerin, Retinol, Glycolic
> Acid"` returns a tokenized array and a Retinoids+AHAs/BHAs conflict verdict with real
> tests, against the running stack.

**Skills/plugins:** superpowers (TDD plans), graphify, backend agent team, ponytail.

**Tasks:**

- **M3-P1-T1** Design the INCI tokenizer (regex tokenization: split on commas, strip
  parentheses/inorganic-noise qualifiers, normalize INCI case like "retinyl palmitate",
  percent-range handling) and its alias fuzzy-match layer over `app/ai/ingredient_synonyms.py`
  + the seeded `ingredients` table. Write the design plan under `docs/superpowers/plans/`.
- **M3-P1-T2** Implement the tokenizer in `backend/app/ai/` (new module, e.g.
  `inci_parser.py`), pure functions, no DB imports. Tokenized array shape must be
  versioned/documented (it feeds the compatibility endpoint and is a candidate for the
  future product-ingest pipeline).
- **M3-P1-T3** Implement `POST /api/v1/ingredients/analyze-compatibility` in
  `services/ingredients/` per the P0-frozen contract (P0-T5): request carries either
  `ingredient_ids` or a free-text INCI string + `routine_time`; response carries
  tokenized ingredients, pairwise conflict verdicts (from `app/ai/interactions.py`),
  allergy alerts (from `app/ai/suitability.py`), and — per the owner's P0 decision —
  the safety score/label composition. Role + ownership checks (user own / professional
  assigned-client).
- **M3-P1-T4** Wire the tokenizer into the existing `safety-score` endpoint if the owner
  approved the superset option (accept a free-text INCI string there too) — additive
  request field, no behavior change to the existing `ingredient_ids` path.
- **M3-P1-T5** Tests: tokenizer unit tests (INCI edge cases: whitespace, `(and)`/`(or)`
  qualifiers, percentage suffixes, alias variants, unknown tokens), router tests
  (free-text + id paths, empty → 422, professional-without-assignment → 404,
  professional-with-assignment → 200, RBAC reject), plus a compatibility verdict test
  (Retinoids + AHAs/BHAs flagged).
- **M3-P1-T6** Regenerate `web/lib/api-types.ts` (`make openapi`). If any UI touches the
  new endpoint (ingredient pages), build both themes per wireframes. (Optional in P1 —
  defer UI to P5 unless the endpoint is user-facing now.)
- **M3-P1-T7** Full gate + live-stack verification (paste real curl of
  `analyze-compatibility` with a raw INCI string), `/code-review`, update
  `PROGRESS.md` + ledger, merge to `dev`, delete branch, `graphify update .`.

**Verification:** tokenizer returns correct arrays for the INCI edge-case fixtures;
`analyze-compatibility` returns conflict verdicts + safety composition against the
running stack; suite green; `api-types.ts` regenerated.

---

## Phase 2 — Vector Stage-1 + ML Stage-2 completion (product-quality-model)

**Branch:** `feature/product-quality-model` (complete the in-flight work; this branch
already holds the ML commits — do not fork another)
**Git:** §5.7 exception — checkout this branch, inspect committed + uncommitted changes,
complete + commit the ML work, run tests, `/code-review`, merge into `dev`, then delete
the branch (local + remote). Do NOT create `feat/m3-p2-ml` or fork from this branch.
Complete the §5.19 pre-task report before starting.

> **/goal** Make the recommendation pipeline match the rubric's multi-stage shape: a
> real vector-similarity pre-retrieval (Stage 1) over the worker-projected FAISS index,
> the ML ranking model (Stage 2) completed and honest, hard-constraint filtering (Stage
> 3) preserved as a guarantee, and the literal-name deviations (G4/G9 + C5/C6) resolved
> with owner-confirmed ADRs. Iterate until `GET /recommendations/me` demonstrably
> retrieves via cosine similarity, ranks via the model, never surfaces an allergen, and
> the in-flight branch is merged clean.

**Skills/plugins:** superpowers, graphify, ML Agent + Backend Agent team, ponytail,
code-review.

**Tasks:**

- **M3-P2-T1** Complete + gate the in-flight ML work. Finish the uncommitted edits
  (`ml/training/*`, `backend/pyproject.toml`, and the web edits if they belong to this
  feature — move unrelated web edits out to their own branch). Run the training script,
  the honesty gate vs baseline, the artifact smoke check, and the eval-harness product-
  quality section; make them all green and commit.
- **M3-P2-T2** Record the C5 deviation ADR (sklearn GradientBoostingRegressor as the
  rubric's "XGBoost / LightGBM" Stage-2 model) and the C6 deviation ADR (384-dim vs the
  rubric's "128-dimensional"), per the owner's P0 decision. Append to
  `docs/DECISIONS.md`.
- **M3-P2-T3** Wire vector-similarity as a real Stage-1 pre-retrieval. Design: embed the
  user's active profile (`user_profiles` namespace — worker must project it if not
  already), cosine-search `products` namespace to isolate a top candidate set, then flow
  that set into the existing relational hard filters (avoid-junction + allergy) and then
  ranking. The hard-filter guarantee must hold **regardless of retrieval** — an
  allergen can never reach ranking, even if similarity ranks it first. Follow the
  single-writer rule: reads only on the request path; if `user_profiles` has no
  embedding yet, project it in the worker, not in the endpoint.
- **M3-P2-T4** TDD: a similarity-retrieval regression test (a product with high cosine
  similarity to the profile is retrieved even if relational filters alone wouldn't have
  surfaced it) + an allergen-never-surfaces test under the new retrieval path.
- **M3-P2-T5** Verify the ML model's effect end-to-end: the existing wiring test proves
  `rating_norm` changes with the model (not just call-through); extend it if the new
  Stage-1 ordering changes inputs. Ensure the fallback (corrupted/missing artifact →
  stub, `RealProductQualityModel._load()` already handles this) still holds.
- **M3-P2-T6** Full gate (ruff/mypy/pytest/lint/typecheck/build), live-stack verification
  (paste a real `GET /recommendations/me` run showing similarity-based retrieval + model-
  ranked `match_percentage` + zero allergens), `/code-review`, update `PROGRESS.md` +
  ledger, merge `feature/product-quality-model` to `dev`, delete the branch,
  `graphify update .`.

**Verification:** `GET /recommendations/me` retrieves via cosine similarity over FAISS,
ranks via the ML model, never surfaces an allergy/avoid product; the in-flight branch is
merged with no leftover uncommitted work; both deviation ADRs recorded.

---

## Phase 3 — `recommend-routine-set` budget solver + product comparison

**Branch:** `feat/m3-p3-routine-set-compare` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.

> **/goal** Ship `POST /api/v1/products/recommend-routine-set` — a budget-constraint
> solver that picks a full routine (one product per category across Face Wash, Serum,
> Moisturizer, Sunscreen, Toner, Face Masks) under a total budget with a spend/leftover
> report — and a two-product side-by-side comparison endpoint (with the existing
> dupe/alternative generation folded in as "lower-cost dupe"). Iterate until a real user
> with a real budget gets a complete, safety-gated routine set that respects the cap and
> can compare any two products head-to-head.

**Skills/plugins:** superpowers, graphify, Backend Agent, ponytail.

**Tasks:**

- **M3-P3-T1** Design the solver. Budget optimization over categories with per-category
  best-matches (reuse the 50/35/15 scoring + safety gates from `services/recommendations/`),
  a total-budget constraint, and a deterministic solver (greedy per-category best-fit with
  documented trade-off behavior, or a small integer-programming/DP approach if the owner
  approves — prefer the simplest correct one). Write the plan under
  `docs/superpowers/plans/`.
- **M3-P3-T2** Implement `POST /api/v1/products/recommend-routine-set`: request carries
  `budget` (+ optional per-category max, `skin_type`/profile auto-resolved from the
  authenticated user), response carries the chosen routine set (product per category,
  per-item price, total spend, leftover, per-item `match_percentage`), with `over_budget`
  semantics: if no valid full set fits, return the closest feasible set + a clear
  `shortfall`/warning, never a fabricated product. Hard-filter safety gates apply to
  every product in the set. Role + ownership checks.
- **M3-P3-T3** **CORRECTED 2026-08-12 — `GET /products/compare` already exists and already covers this** (`products_service.py:307` `compare_products()`, `products_router.py:66`; response includes each product's `suitable`/`suitability_confidence` as the safety-gate status). Do not rebuild it. Instead: verify its response against the rubric's exact field list (price, rating, category, mapped actives, skin-type/concern fit) and add any genuinely missing field via a additive schema change; confirm role/ownership checks match the rest of `services/recommendations/`; leave `/products/{id}/alternatives` (dupes) as-is — it already serves the "lower-cost alternative" role, no folding needed.
- **M3-P3-T4** Tests: solver unit tests (cap respected, per-category coverage, ties
  deterministic, infeasible budget → closest feasible + warning, allergy/avoid product
  never in a set), router tests (auth/RBAC/ownership, 422s), compare tests (both
  products resolved, safety status per product, missing id → 404). Ensure the solver
  tests are deterministic (no RNG-dependence — seed or monkeypatch as the M3R pass did).
- **M3-P3-T5** Regenerate `api-types.ts`. If the product pages surface compare or
  routine-set (per wireframes), build both themes in P5 instead unless the pages already
  exist — do not add UI to a backend phase without the wireframe pair.
- **M3-P3-T6** Full gate + live-stack verification (real user, real budget → real set),
  `/code-review`, update `PROGRESS.md` + ledger, merge to `dev`, delete branch,
  `graphify update .`.

**Verification:** a real budget-constrained user receives a complete safety-gated routine
set with exact spend/leftover; compare returns both products side-by-side; suite green.

---

## Phase 4 — `progress/log-entry` + analytics reconciliation

**Branch:** `feat/m3-p4-log-entry` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.

> **/goal** Ship the rubric-named `POST /api/v1/progress/log-entry` for daily completion
> flags, hydration metrics, and self-reported concerns over the existing progress service
> (single-writer: extend `services/progress/`, never a parallel log store), reconcile the
> Mongo `progress_logs` collection naming per the owner's C7 decision, and confirm
> 7/30/90 analytics consume the new entries. Iterate until a real check-in logs completion
> + hydration + a concern and the analytics endpoint reflects it.

**Skills/plugins:** superpowers, graphify, Backend Agent, Data Agent.

**Tasks:**

- **M3-P4-T1** **CORRECTED 2026-08-12:** `toggle_step_completion` lives in
  `services/routines/` (writes Mongo `routine_logs`), not in `services/progress/` —
  it's step-level AM/PM completion toggling, a different concern from the rubric's
  daily hydration + self-reported-concern log. `services/progress/`'s own
  `POST /progress/me/logs` is a weekly computed report (only `notes` is user input),
  not this either. `log-entry` is genuinely new: reads `routine_logs` (via the
  routines service's existing interface, never its collection directly — single-writer
  rule) for the completion-flags half, and adds a new write path in
  `services/progress/` for hydration + concerns. If the owner's C7 decision affects
  where progress-log storage lives, apply it here.
- **M3-P4-T2** Implement `POST /api/v1/progress/log-entry`: accepts daily completion
  flags (step ids / AM-PM), `hydration_ml` or a hydration metric, and optional
  self-reported concerns; persists through the existing progress service; updates the
  compliance math inputs (completed ÷ assigned) without breaking historical-routine
  correctness (`list_historical_active_step_ids`). Role + ownership checks.
- **M3-P4-T3** Extend `GET /analytics/me` if needed so hydration/concern trends appear
  alongside score timeline + compliance + photos (only if the rubric's Step-3 "mapping
  score variance against adherence levels" benefits; don't add speculative fields).
- **M3-P4-T4** Tests: log-entry service (persistence, adherence math still exact on the
  new writer, hydration/concern stored), router (auth/RBAC/ownership, validation), and a
  mid-window regression (a log-entry created after a routine change still computes
  correct 7/30/90).
- **M3-P4-T5** Update `database_schemas/` mirrors (Mongo `progress_logs` shape, any PG
  columns) + Alembic migration in the same change. Regenerate `api-types.ts` if the
  analytics payload changed.
- **M3-P4-T6** Full gate + live-stack verification (real check-in via `log-entry` →
  real analytics reflect it), `/code-review`, update `PROGRESS.md` + ledger, merge to
  `dev`, delete branch, `graphify update .`.

**Verification:** a real `log-entry` call persists completion + hydration + concerns and
the 7/30/90 analytics reflect it; adherence math stays exact (mid-window case tested).

---

## Phase 5 — Dashboard route reconciliation + UI touch-ups

**Branch:** `feat/m3-p5-dashboard-routes` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.

> **/goal** Resolve the `/dashboard/user|consultant|dermatologist` literals per the
> owner's P0 decision, confirm every rubric dashboard widget is present and real (both
> themes), and surface any new P1–P4 endpoint on the matching wireframe-backed screen.
> Iterate until the route story is decided and each role's dashboard demonstrably renders
> real data with the fixed navs intact.

**Skills/plugins:** superpowers, ui-ux-pro-max, frontend-design, shadcn,
migrate-radix-to-base, graphify, Frontend Agent.

**Tasks:**

- **M3-P5-T1** Implement the owner's C4 decision: either document the built role-routed
  paths as satisfying the rubric, or add `/dashboard/user`, `/dashboard/consultant`,
  `/dashboard/dermatologist` as redirects to the built routes (App Router
  `redirect()`), keeping the four locked navs (`web/lib/nav-config.ts`) untouched.
- **M3-P5-T2** Audit each role dashboard against the rubric literals (§1 Step 4): user =
  score gauge + breakdowns + interactive AM/PM checklist + filterable rec cards with
  purchase/view actions + progress charts; consultant = assigned clients, assessment
  records, adherence ratings, routine adjustment controls; derm = high-res progress
  image comparisons, risk-factor analyses, concern-severity trends, treatment-note
  interfaces. Flag any widget missing or fed by fake data.
- **M3-P5-T3** Wire any new P1–P4 endpoint into its wireframe-backed screen (e.g. product
  compare / routine-set on product pages; `analyze-compatibility` on ingredient pages)
  — only for screens whose wireframe pair exists; otherwise defer and note.
- **M3-P5-T4** Both-theme visual pass against `web/designs/wireframes/` +
  `source/reference-screenshots/` (see the `app-dashboard.html` mislabeling note in the
  old gap analysis — re-fetch from Stitch project `933192060480910018` if reachable, else
  content-compare and flag). Fix token drift; add `aria-label`/a11y for any new control.
- **M3-P5-T5** Full gate (`make openapi` first if any schema changed; lint/typecheck/
  build; both themes), `/code-review`, update `PROGRESS.md` + ledger, merge to `dev`,
  delete branch, `graphify update .`.

**Verification:** route literals resolved per owner decision; each role dashboard renders
real, non-fake data in both themes; navs unchanged; a11y pass on new controls.

---

## Phase 6 — Testing & verification (extended)

**Branch:** `feat/m3-p6-verification` (from `dev`)
**Git:** P6 must not start until P1–P5 are merged into `dev`. Complete the §5.19 pre-task
report before starting; merge into `dev` only; delete the branch (local + remote) after
merge. Never touch `main`, `satya-sai-tharun-skinlytics`, or any remote branch you
didn't create.

> **/goal** Make the rubric's Step-5 claims provable for the whole remaining-work pass:
> unit coverage for every new P1–P4 surface (chemical-clash, allergy, adherence, solver,
> compare, tokenizer, ML effect), and an extended E2E walkthrough covering the new
> endpoint surfaces end-to-end in both themes. Iterate until the full gate is green and
> the walkthrough runs 3×-consecutive flake-free.

**Skills/plugins:** superpowers, graphify, QA Agent, ponytail, code-review.

**Tasks:**

- **M3-P6-T1** Unit-test sweep. For each new surface: chemical-clash detection
  (`analyze-compatibility`), allergy filter (all new gates incl. solver/compare), INCI
  tokenizer edge cases, budget-solver determinism, ML-stage effect, adherence formulas
  (unchanged but re-run exact-value asserts). Close every gap found.
- **M3-P6-T2** Extend the rubric walkthrough spec (`web/tests/e2e/m3-rubric-walkthrough.spec.ts`)
  — or add a sibling `m3-remaining-walkthrough.spec.ts` — covering: signup/assessment →
  INCI/`analyze-compatibility` → recommendations with vector/ML rank → routine-set budget
  result → check-in via `log-entry` → photo upload → derm inspects + edits → user sees
  live update. Both themes; screenshots to `docs/milestones/milestone_3/build/e2e/`.
- **M3-P6-T3** Extend the persistence spec (`m3-persistence-after-restart.spec.ts`) if
  any new data (log-entry, routine-set) must survive a store restart.
- **M3-P6-T4** Full-gate run: backend `ruff`/`mypy --strict`/`pytest` (full suite), frontend
  lint/typecheck/unit/build, full Playwright e2e (both themes). Fix real bugs the run
  surfaces; classify residual flakiness honestly (never claim green on unverified runs).
  Paste exact counts in the phase report.
- **M3-P6-T5** `/code-review`, update `PROGRESS.md` + ledger, merge to `dev`, delete
  branch, `graphify update .`.

**Verification:** every new surface has real tests; the extended walkthrough runs clean
in both themes 3×; full gate green with exact numbers pasted.

---

## Phase 7 — Docs, ADR lockstep & close-out

**Branch:** `chore/m3-p7-docs-closeout` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; merge into `dev` only; delete
the branch (local + remote) after merge. Never touch `main`, `satya-sai-tharun-
skinlytics`, or any remote branch you didn't create.

> **/goal** Close the milestone honestly: every §6 deviation ADR recorded, docs
> (`ARCHITECTURE.md`, `CONVENTIONS.md`, `AI_ML.md`, `database_schemas/`, `AGENTS.md`
> stale lines) in lockstep, `PROGRESS.md` milestone entry written from verified results,
> ledger close-out, and branch cleanup. Iterate until the milestone's four official
> outcomes are each backed by a named artifact.

**Tasks:**

- **M3-P7-T1** Outcomes sign-off document (`M3R_COMPLETION_REPORT.md`, fresh) mapping each
  newer-PDF requirement to code + tests + screenshots, including the §6 deviation ADRs
  as accepted deviations. Cite real commit hashes.
- **M3-P7-T2** Docs in lockstep: `ARCHITECTURE.md` (new endpoints/vector-stage/ml-stage,
  any ownership changes), `CONVENTIONS.md`, `AI_ML.md` (INCI parser, ML ranking model,
  embedding dims), `database_schemas/` mirrors, and fix `AGENTS.md`'s stale "ingredients
  router lands M3" line from the old gap analysis.
- **M3-P7-T3** `PROGRESS.md` milestone entry written from verified results (exact test
  counts, live-stack outputs) — honest, no claims that weren't run.
- **M3-P7-T4** Ledger close-out: every `M3-P<n>-T<m>` row `DONE` with evidence or
  `DEFERRED` with reason + proposed home.
- **M3-P7-T5** Branch cleanup: verify every `feat/m3-*`/`fix/m3-*`/`chore/m3-*` branch
  and the merged `feature/product-quality-model` branch is merged to `dev` + deleted.
- **M3-P7-T6** Handoff note for M4 (from the newer PDF's M4 pages): notifications,
  admin/reports, Docker Compose `api`/`web`, CI/CD, cloud deployment — all deferred
  here, with the ADR-005 containerization boundary restated.

**Verification:** each of the four official outcomes maps to a named artifact; no
`m3-*`/`feature/product-quality-model` branches remain; `PROGRESS.md` and the ledger are
accurate against the disk.

---

## Phase 8 — Biometric consent + face-photo assessment pipeline (beyond rubric)

**Branch:** `feat/m3-p8-biometric-consent` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.
**Not a graded M3 requirement.** Owner-authorized 2026-08-12, reopening ADR-033's third
deliberately-left-open item. Full design record: `docs/DECISIONS.md` ADR-047. **Not legal
advice** — this phase builds engineering scaffolding for a real legal review, it does not
substitute for one; say so explicitly in the phase report, don't let it read as "done."

> **/goal** Build the consent ledger, face-photo upload, 90-day auto-purge, scheduled
> auto-retrain, and mandatory fairness gate exactly as ADR-047 specifies — no piece
> skipped, no piece silently descoped. Iterate until a user can grant biometric-training
> consent, upload a face photo, have it become eligible for training, get auto-purged at
> 90 days if untouched, and a scheduled retrain only ever promotes an artifact that passed
> the Fitzpatrick/Monk fairness gate.

**Skills/plugins:** superpowers (TDD, this is genuinely new code), graphify, Backend
Agent, ML Agent, Data Agent, code-review (mandatory security-review pass given biometric
data — this phase also gets `/security-review`, not just `/code-review`).

**Tasks:**

- **M3-P8-T1** Migration: `biometric_training_consent` table (ADR-047 §1) under
  `services/assessment/`, Alembic + `database_schemas/skinlytics_postgresql_schema_v3.sql`
  mirror in the same change. Endpoints: grant consent, revoke consent (sets `revoked_at`,
  never deletes the row — audit trail), get current consent status. Role: `user` only,
  own record.
- **M3-P8-T2** Face-image upload endpoint on `services/assessment/` (ADR-047 §2): reuses
  `core/storage.py` unchanged, `assessment-photos/user_{id}/...` prefix. Upload succeeds
  regardless of consent (the user's own assessment always works); a photo is flagged
  training-eligible only when a non-revoked consent row exists at upload time.
- **M3-P8-T3** Worker purge job (ADR-047 §3): scheduled job scanning for
  training-eligible photos past 90 days from `consented_at`, deleting the row (PG),
  object (S3), any AI-payload doc (Mongo), and vector-namespace entry. Add monitoring —
  log a metric/alert on purge-job failure (a silent failure here is a compliance
  regression, not just a bug, per ADR-047's consequences).
- **M3-P8-T4** Real `SkinTypeClassifier`/`ConcernDetector` training pipeline (ADR-047
  §4): follow `ml/training/train_lesion_classifier.py`'s structure (transfer-learning
  CNN) but target the app's own `skin_types`/`skin_concerns` taxonomy; bootstrap on a
  public dataset (document exactly which one and its license in `docs/AI_ML.md`, same
  rigor as the ISIC-2019 precedent); artifact versioned into `ml/registry/`.
- **M3-P8-T5** Scheduled auto-retrain worker job (ADR-047 §4): batches newly-eligible
  opted-in photos on a schedule, invokes T4's training pipeline as fine-tuning, produces
  a candidate artifact — does NOT promote it yet (that's gated by T6).
- **M3-P8-T6** Fairness gate (ADR-047 §5, blocking): Fitzpatrick/Monk skin-tone slice
  evaluation against a documented threshold; a candidate that fails is logged and
  discarded, never promoted, never manually overridden without a recorded exception in
  `docs/DECISIONS.md`. Wire this as the only path from "candidate artifact" to "serving
  artifact" — no other promotion path may exist.
- **M3-P8-T7** Tests: consent grant/revoke/ownership, upload eligibility logic, purge-job
  correctness (photo past 90 days is gone from all four stores; photo before 90 days is
  untouched), fairness-gate blocks a deliberately-failing candidate in a test fixture,
  retrain job never promotes without a passing gate result.
- **M3-P8-T8** Full gate + live-stack verification (real consent grant → real upload →
  simulate purge-eligible timestamp → confirm real deletion across all four stores),
  `/code-review` AND `/security-review` (biometric data path), update `docs/AI_ML.md`
  model cards + `PROGRESS.md` + ledger — explicitly labeled beyond-rubric — merge to
  `dev`, delete branch, `graphify update .`.

**Verification:** consent ledger enforces training-eligibility correctly; purge job
proven to delete across all four stores at the 90-day boundary; fairness gate proven to
block a failing candidate in a test; both `/code-review` and `/security-review` clean.

---

## Phase 9 — Sephora-review collaborative-filtering signal (beyond rubric)

**Branch:** `feat/m3-p9-cf-signal` (from `dev`)
**Git:** complete the §5.19 pre-task report before starting; branch from updated `dev`;
merge into `dev` only; delete the branch (local + remote) after merge. Never touch
`main`, `satya-sai-tharun-skinlytics`, or any remote branch you didn't create.
**Not a graded M3 requirement.** Owner-authorized 2026-08-12. Full design record:
`docs/DECISIONS.md` ADR-048.

> **/goal** Ingest the five already-downloaded `training_dataset/raw/sephora/reviews_*.csv`
> files, build an item-item collaborative-filtering similarity artifact from Sephora's own
> reviewer population, and blend it into `GET /recommendations/me` as a tiebreak/boost
> signal only — the frozen 50/35/15 `recommendation_weights` and every existing safety
> gate stay untouched and authoritative. Iterate until two near-tied candidate products
> demonstrably reorder based on the CF signal, while a lower-suitability or unsafe product
> never outranks a safer, better-matched one because of it.

**Skills/plugins:** superpowers, graphify, Backend Agent, Data Agent, ML Agent.

**Tasks:**

- **M3-P9-T1** Ingest pipeline (extends `services/admin/ingest/`, not a new pattern):
  parse `reviews_0-250.csv` through `reviews_1250-end.csv` into a sparse user×product
  rating matrix (Sephora's `user_id`/`product_id`/`rating` columns — verify exact column
  names against the actual CSV header before writing the parser, don't assume from the
  repo's README). Compute item-item cosine similarity.
- **M3-P9-T2** Store the similarity result as a derived, worker-projected artifact
  (never a live-written DB table — single-writer rule, ADR-010) under `ml/registry/`,
  loaded the same way FAISS indexes are — must be re-derivable from the raw CSVs alone,
  never hand-edited.
- **M3-P9-T3** Blend into `services/recommendations/service.py`'s existing pipeline
  (ADR-048 §2): after the safety-gated, vector-retrieved, ML-ranked candidate set is
  produced, apply CF similarity as a secondary sort key / small score nudge among
  near-tied candidates only. It must be provably incapable of promoting a product past a
  hard safety filter or materially outranking the primary suitability score — write the
  test for this constraint before the feature test.
- **M3-P9-T4** `docs/AI_ML.md` model card entry: label this signal explicitly as
  "Sephora shopper population co-preference patterns," distinct from personalized
  Skinlytics-user behavior (ADR-048 §3) — the UI/API must never imply this reflects the
  current user's own history.
- **M3-P9-T5** Tests: ingest parser correctness (matrix shape, known similarity pairs),
  the tiebreak-only constraint from T3 (a CF-favored-but-unsafe product never surfaces
  ahead of a safe one — construct the adversarial fixture deliberately), determinism.
- **M3-P9-T6** Full gate + live-stack verification (real `GET /recommendations/me` call
  showing two near-tied candidates reordered by the CF signal, and a control case proving
  a safety-gated product still never surfaces), `/code-review`, update `PROGRESS.md` +
  ledger — explicitly labeled beyond-rubric — merge to `dev`, delete branch,
  `graphify update .`.

**Verification:** CF signal demonstrably reorders near-ties only; frozen 50/35/15 weights
and every safety gate provably unaffected; provenance labeled in the model card.

---

## Appendix A — quick reference

- **Governing rubric:** `docs/milestones/milestone_3/MILSTONE 3 & 4.pdf` (newer,
  graded). Old PDF `MILESTONE 3.pdf` superseded.
- **Deliverable location:** this file; ledger `M3R_TASK_LEDGER.md`; contract file per
  P0-T5; reports under `docs/milestones/milestone_3/build/`.
- **Key verified facts (2026-08-11):** safety-score, recommendations (50/35/15,
  per-category, budget flag + alternative), progress/analytics (7/30/90 + photos), FAISS
  store (384-dim, worker-projected), dashboards (3 roles) — all REAL. INCI parser,
  `analyze-compatibility`, vector Stage-1, ML Stage-2 completion, `recommend-routine-set`,
  compare, `log-entry`, route literals — GAPS this prompt closes.
- **Current branch:** `feature/product-quality-model` (in-flight ML work, G4/G10) — P2
  completes + merges it.
- **Git author (every commit):** `Satya Sai tharun Jekkamsetti
  <satya.saitharun02@gmail.com>`; no AI co-author trailers, ever.
