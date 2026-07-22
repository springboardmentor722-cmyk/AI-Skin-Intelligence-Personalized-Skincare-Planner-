# Milestone 3 — Product Intelligence & Progress Tracking (Weeks 5–6)

> **Status:** Planned (spec authored 2026-07-22, after a full M1/M2 audit — see
> `PROGRESS.md`'s "Milestone 1 & 2 audit" entry).
> **Sources:** requirements PDF pp. 8–11 (Milestone 3 tasks/outcomes/evaluation
> criteria — the primary source of truth), `docs/ARCHITECTURE.md` §4/§7/§10/§13,
> `docs/AI_ML.md`, `docs/DATASETS_AND_APIS.md` §"Milestone mapping",
> `database_schemas/*`, and the live codebase.
> **⚠ No external graded rubric doc exists for M3 yet.** M2 had `mile_2.docx`; this
> folder has none. This spec is internally derived. Per the standing precedent in
> `AGENTS.md` §0.1 (resolved 2026-07-15): **if a graded M3 rubric doc arrives, its
> literal names (tables, endpoints, filenames) win over this spec** — reconcile with
> the user first, then rename, exactly as M2's `MASTER_PROMPT.md` did.
> **Format note:** Markdown, not HTML — this repo's docs are Markdown-native,
> greppable, and PR-diffable; agents consume them with Read/Grep, where HTML only
> adds markup noise. The HTML wireframes in `web/designs/wireframes/` remain the
> *visual* source of truth.

---

## 1. Overview

### Purpose

The PDF (p. 10) defines Milestone 3 — Week 5 & 6, "Product Intelligence & Progress
Tracking" — as five tasks:

1. Implement ingredient intelligence engine.
2. Build product recommendation workflows.
3. Develop progress tracking system.
4. Generate skincare analytics.
5. Create user dashboards.

### Expected outcomes (PDF p. 10, graded evaluation criteria p. 11)

- **Product recommendation engine operational.**
- **Progress tracking system functional.**
- **Analytics and recommendation workflows completed.**

### Project goals this milestone serves

M2 built the "brain" (assessment, scoring, routine generation) against a
placeholder-quality recommendation stub. M3 makes the *intelligence* real: the
ingredient knowledge layer (PDF Module 5), the full recommendation pipeline (PDF
Module 6, `docs/ARCHITECTURE.md` §10), longitudinal progress tracking against the
M2 score baseline (PDF Module 8), and the first analytics workflows (PDF Modules
8–9). It also stands up the derived-store infrastructure (outbox → worker →
Elasticsearch + vector DB, ADR-010) that recommendation and search depend on.

### Scope

**In scope (modules M3-0 … M3-H, §3):** carry-over closure from M1/M2 · outbox
table + arq worker + ES/FAISS projection · Ingredient Intelligence service + UI ·
product catalog/detail/compare/alternatives + UI · recommendation engine v2
(pipeline stages 1–4, budget-aware, persisted, feedback events) · progress tracking
(Mongo `progress_logs`, photos, Daily Check-in screen, trend analysis) · Analytics
service + Insights screen · user-dashboard refresh + PDF §8 metric instrumentation ·
`ml/` scaffold + eval harness.

**Out of scope (deferred, with reasons):**

| Item | Deferred to | Why |
|---|---|---|
| Notification & Reminder system (PDF Module 10) | M4 | `docs/ARCHITECTURE.md` §13 places dashboards+reports+deployment in M4; notifications service (#9) is grouped "M3–M4" and nothing in M3's graded criteria needs it. If capacity remains after M3-G, it is the first pull-forward candidate. |
| Reports & Export (PDF Module 11) | M4 | Explicitly M4 per PDF week plan ("reports and visualization modules"). |
| Consultant `Recommendations`/`Reports`, Dermatologist `Treatment Plans`/`Analytics` screens | M4 | PDF M4 "executive dashboards"; each needs its own data model + design pass (`PROGRESS.md` Pending). Flag to owner if they want any pulled in. |
| Image-based skin assessment (real `SkinTypeClassifier`/`ConcernDetector` CNNs) | M4/ml track | ISIC data is landed but no training pipeline exists; M2's rubric chose rule-based assessment. ADR-007 stubs remain the contract. |
| Per-service containerization | M4 | ADR-005: monolith until M4. |
| Payments (Stripe/Razorpay) | M4+ | Keys blank; no M3 criterion touches billing. |

---

## 2. Architecture

`docs/ARCHITECTURE.md` and `docs/architecture.png` are binding; this section is the
M3 *delta* — do not re-derive the base architecture from here.

- **Backend** — the FastAPI modular monolith gains: an `ingredients` router (the
  service dir exists with models + one admin read function), an `analytics` service
  (read-only aggregator, never a source of truth), an expanded `progress` service,
  an upgraded `recommendations` service, and a new top-level `backend/app/worker/`
  (arq) consuming a new PG `outbox` table (ADR-010). Service anatomy stays
  `router.py · service.py · schemas.py · models.py · deps.py`; all routes under
  `/api/v1`; single-writer rule holds (ADR-005).
- **Frontend** — Next.js App Router: five unbuilt User screens become real
  (`/ingredients`, ingredient detail, product catalog/detail/compare under the
  existing `/recommendations` area, `/check-in`, `/insights`, full `/progress`).
  shadcn primitives only; tokens from `web/app/globals.css`; both themes; nav
  `built:` flags flip in `web/lib/nav-config.ts` as each ships.
- **AI pipeline** — contract-first behind `backend/app/ai/` (ADR-007).
  M3 makes real (config-selected, `AI_IMPL` per interface): `IngredientSuitability`
  (rules over PG junctions + confidence), `Recommender` v2 (pipeline below),
  `ProgressTrendAnalyzer` (deterministic trend math over score/progress series),
  `TextEmbedder` (SentenceTransformers all-MiniLM-L6-v2, 384-d, pinned per
  namespace). Image models stay stubs. Every AI response carries `confidence`;
  assessment-adjacent UI keeps the "not medical advice" disclaimer.
- **Databases** — PostgreSQL: new `outbox` table; `products` gains
  `rating`/`review_count` (real Sephora columns, §5). MongoDB: `progress_logs`
  (schema v3 #3, exists on paper, unused until now) + new `recommendation_feedback`
  collection (schema doc updated in the same change). Elasticsearch: `products_index`,
  `ingredients_index`, `knowledge_articles_index` created and projected (derived-only,
  rebuildable). Vector DB: FAISS locally (Pinecone env keys stay blank — do not
  require them), namespaces per `skinlytics_vector_db_schema_v3.txt`.
- **Storage** — progress photos ride the existing `core/storage.py` MinIO/S3
  adapter: private bucket, presigned URLs, EXIF stripped on upload (ARCHITECTURE §9).
- **Authentication** — unchanged (Better Auth authors, FastAPI validates;
  `require_user`/`require_role`/`require_verified_professional` only). Every new
  endpoint declares role(s) and ownership checks in its service's `deps.py`.
- **Recommendation engine** — ARCHITECTURE §10's five stages become real:
  1. Relational pre-filter (PG junctions; allergy/avoid = HARD filters first) — exists.
  2. Vector similarity (FAISS, metadata-filtered to stage-1 candidates) — new.
  3. Keyword/hybrid (ES: budget, brand, category, `is_active`) — new.
  4. Rank — content-based weighted scorer (documented formula, §8) with an optional
     flag-gated LightGBM ranker *only if* real feedback labels exist — never trained
     on fabricated data (AGENTS.md §0.2).
  5. Serve + Redis cache `recommendation:cache:{user_id}` TTL 24h — exists;
     invalidation triggers extended (§5).
- **Skin analysis pipeline** — unchanged from M2 (rule-based evaluate/score paths);
  M3 only *reads* assessment history for progress/analytics.
- **Routine generation / calendar engine** — no new engine. The existing routines
  service + Mongo `routine_logs` (M2) are the calendar/adherence substrate; M3 adds
  the Daily Check-in screen writing to them and adherence analytics reading them.
- **Analytics** — new read-only aggregator service (#10 in ARCHITECTURE §4): reads
  every store via other services' interface functions, owns nothing, `/analytics`.
- **Notifications / Integrations** — notifications deferred (§1). No new external
  providers; existing adapters (`integrations/{openweather,openuv,pubmed}.py`) and
  their contract (env keys, retry/backoff, breaker, Redis TTL cache) are the pattern
  for any incidental addition.

---

## 3. Deliverables — modules

Build in the order listed; each module = one or more feature branches (§Git in
`milestone_3_prompt.md`), each independently mergeable and verified.

### M3-0 · Carry-over closure (P0 — before any new feature)

- **Objective:** close every open M1/M2 item that is cheap, unblocking, or noise.
- **Features / tasks:**
  1. Remove deprecated aliases `/scores/me`, `/routines/me`, `/routines/generate`
     after a grep sweep proves nothing (including `web/tests/`) calls them; regen
     `web/lib/api-types.ts` (`make openapi`).
  2. Fix the 5 MinIO test failures: set root-`.env` `S3_ACCESS_KEY_ID`/
     `S3_SECRET_ACCESS_KEY` to compose's dev creds (`skinlytics`/
     `skinlytics_dev_only`) via `.env` regeneration guidance (never commit values);
     make `.env.example`/`.env.development` name the expectation.
  3. Add the eslint ignore for `playwright-report/` so unscoped `npm run lint` is
     clean.
  4. Add `worker` to `docker-compose.yml` (arq, same image as api-to-be, runs
     `arq app.worker.main.WorkerSettings`) — lands with M3-A; `api`/`web` compose
     entries + Dockerfiles remain tracked for M4 unless a Docker-verified session
     makes them cheap now.
- **Dependencies:** none. **Inputs:** current repo. **Outputs:** green full test
  suite (0 known-red tests), pruned API surface.
- **Acceptance criteria:** `pytest` fully green (239/239-equivalent — no
  pre-existing failures left); `grep -r "scores/me\|routines/me\|routines/generate"
  web/ backend/` returns only historical docs; unscoped `npm run lint` clean.
- **Testing:** full backend suite + `tsc`/`eslint`/`next build` + existing e2e.

### M3-A · Outbox, worker & derived stores (ES + FAISS)

- **Objective:** ADR-010 made real — transactional outbox, arq worker, ES indices
  and FAISS namespaces projected from PG/Mongo, rebuildable at any time.
- **Features:** `outbox` table (§5) written in the same transaction as source
  mutations of products / ingredients / knowledge articles / skin profiles; worker
  consumers: `project_elasticsearch` (3 indices per
  `skinlytics_elasticsearch_schema_v2.txt`), `embed_and_upsert` (per-namespace
  recipes + pinned models per `skinlytics_vector_db_schema_v3.txt` / `AI_ML.md`),
  sync bookkeeping in Mongo `product_vectors_metadata`; a full-rebuild entrypoint
  (`make rebuild-derived` → `python -m app.worker.rebuild`); ES + FAISS clients in
  `app/db/{elasticsearch,vector}.py` (lazy, health-checked, absent-safe in tests).
- **Dependencies:** M3-0.4 (worker in compose). ES container already in compose.
- **Inputs:** live PG rows (8,480 products, 16,303 ingredients), Mongo
  `knowledge_articles` (PubMed ingest). **Outputs:** populated `products_index`,
  `ingredients_index`, `knowledge_articles_index`; FAISS namespaces
  `products`/`ingredients`/`knowledge_articles`.
- **Acceptance criteria:** a product update lands in ES + vector within seconds
  (eventual, ADR-010); dropping the ES index + FAISS files and running the rebuild
  restores them byte-equivalent in counts; no service writes ES/vector directly
  (grep-verifiable: only `app/worker/` imports those clients for writes).
- **Testing:** unit tests for outbox append (same-transaction atomicity — a rolled-back
  source write leaves no outbox row); worker consumer tests against live Docker ES;
  rebuild idempotence test; projection-lag smoke test.

### M3-B · Ingredient Intelligence (PDF Module 5)

- **Objective:** the real Ingredient Intelligence API + UI — analysis, suitability,
  interactions, allergy detection, education.
- **Features (backend):** standalone `ingredients` router (`/api/v1/ingredients`)
  — list (paginated, ES-backed search + category filter), detail (treats-concerns
  junctions with `evidence_strength`, avoid-flags per skin type with `reason`,
  products containing it, education snippets from `knowledge_articles`),
  `GET /api/v1/ingredients/{id}/suitability/me` (per-profile suitability +
  interaction flags + allergy hit via the `IngredientSuitability` interface —
  suitability logic lives in the AI layer, service calls the interface),
  `GET /api/v1/ingredients/interactions?ids=…` (pairwise conflict/synergy from a
  curated rules table in code reviewed against `docs/DATASETS_AND_APIS.md` §3
  sources — no scraping of INCIDecoder/COSDNA).
- **Features (frontend):** `/ingredients` list + `/ingredients/[id]` detail against
  wireframe pairs `app-ingredients[-dark].html`, `app-ingredient-detail[-dark].html`;
  nav `built: true`; per-user suitability badge with confidence label; allergy
  warnings prominent; "not medical advice" disclaimer.
- **Dependencies:** M3-A (ES search; degrade to PG `ILIKE` when ES is down —
  fallback stated in the response envelope, not silent).
- **Inputs:** `ingredients` + junction tables, `knowledge_articles`, user's current
  skin profile (allergies/sensitivities are free-text tags — matching is
  case-insensitive name/INCI containment, documented in code).
- **Outputs:** the endpoints above; typed client regenerated.
- **Acceptance criteria:** PDF Module 5's five bullets all demonstrable; zero
  missed allergy conflicts on the test matrix (hard requirement, `AI_ML.md` model
  card); screens match wireframes side-by-side in both themes.
- **Testing:** service tests (suitability matrix: each skin type × avoid-flagged
  ingredient; allergy tag hit/miss; interaction pairs), router auth matrix, ES-down
  fallback test, Playwright e2e (list → search → detail → suitability, light+dark).

### M3-C · Product catalog, detail, compare, alternatives (PDF Module 6 surface)

- **Objective:** a real product-browsing surface (today "Products" nav aliases the
  recommendations screen).
- **Features (backend):** `products` router under the recommendations service
  (owner of `products*` tables): `GET /api/v1/products` (ES-backed: text search,
  category/brand/budget/skin-type filters, pagination, `is_active` only),
  `GET /api/v1/products/{id}` (full detail + ingredient list with per-user
  avoid/allergy annotations + suitability score), `GET /api/v1/products/compare?ids=a,b[,c]`
  (≤3, aligned attribute matrix), `GET /api/v1/products/{id}/alternatives`
  (same category, overlapping concerns, vector-nearest, budget-band aware).
- **Features (frontend):** Products catalog + product detail + compare against
  `app-products[-dark]`, `app-product-detail[-dark]`, `app-products-compare[-dark]`
  wireframes; "Products" nav repointed from `/recommendations` to the new catalog
  (`/products`), with the recommendations screen linked from dashboard + catalog
  ("For you") — this restores the nav label's real meaning; flag in PR description.
- **Dependencies:** M3-A (ES + vector); M3-B (ingredient annotations on detail).
- **Inputs:** ingested Sephora catalog + junctions + new `rating`/`review_count` (§5).
- **Outputs:** endpoints above; screens; regenerated types.
- **Acceptance criteria:** PDF Module 6 bullets "product comparison", "alternative
  product suggestions", "budget-based recommendations" demonstrable end-to-end
  against live data; catalog p95 < 300 ms non-AI budget (ARCHITECTURE §1).
- **Testing:** filter/pagination contract tests, compare validation (2–3 ids, 404s,
  cross-role), alternatives exclude avoid-flagged products (hard-filter test),
  Playwright e2e catalog → detail → compare journey (both themes).

### M3-D · Recommendation engine v2 (PDF Module 6 engine — the graded criterion)

- **Objective:** "Product recommendation engine operational" — the five-stage
  pipeline replacing the M1 stub ranking.
- **Features:** stages 1–5 (§2) behind the existing `Recommender` interface;
  per-user suitability scoring (0–100 `match_score` driving the Match ring);
  `reasons[]` (suitability match, concern overlap, budget fit — machine-readable,
  `AI_ML.md`); budget preference from Mongo `user_preferences`; persist each served
  set's top-N to PG `product_recommendations` (table exists, currently unwritten —
  gives consultants/admin a reviewable record and M4 analytics a source);
  `POST /api/v1/recommendations/feedback` (thumbs/save/dismiss → Mongo
  `recommendation_feedback`, the future ranking-label stream); cache invalidation
  extended to preference changes and catalog changes touching cached candidates
  (via outbox consumer). Optional, flag-gated (`AI_IMPL_RECOMMENDER=ranker`):
  LightGBM ranker trained *only* on real accumulated feedback — if none exists by
  build time, ship the content-based scorer as the operational engine and record
  that decision in `PROGRESS.md` (do not fabricate training data — AGENTS.md §0.2).
- **Dependencies:** M3-A, M3-C, `ml/` scaffold (M3-H) if the ranker path activates.
- **Inputs:** profile + preferences + catalog + junctions + vectors + ES.
- **Outputs:** upgraded `GET /api/v1/recommendations/me` (same contract — additive
  fields only), feedback endpoint, persisted recommendation rows.
- **Acceptance criteria:** stage budgets honored (pre-filter 50 ms · vector 150 ms ·
  ES 100 ms · rank 200 ms; < 1.5 s cache-miss, < 100 ms cache-hit, p95 —
  ARCHITECTURE §10); an allergy/avoid-flagged product can never appear (hard-filter
  property test across seeded profiles); cold-start user gets content-based results;
  cache invalidates on profile/preference/catalog change.
- **Testing:** pipeline contract tests per stage; hard-filter property test;
  latency measurement in a marked (skippable-in-CI) perf test against live Docker
  stores; feedback round-trip test; e2e "Why this matches you" rendering.

### M3-E · Progress tracking system (PDF Module 8 — graded criterion)

- **Objective:** "Progress tracking system functional" — monitoring, before/after,
  adherence, milestones.
- **Features (backend):** progress service expansion — Mongo `progress_logs`
  (weekly: notes, self-assessment, photo refs; schema v3 #3),
  `POST/GET /api/v1/progress/me/logs`; photo upload via presigned URL
  (`POST /api/v1/progress/me/photos` → `core/storage.py`, EXIF stripped, private
  bucket; register in PG `progress_images` with `image_stage`), before/after pair
  retrieval; adherence series from `routine_logs` (via routines service interface);
  score trend from `skin_assessments` (via scores service interface);
  `ProgressTrendAnalyzer` real impl: deterministic linear-trend + moving-average
  insight (direction, magnitude, confidence; < 0.6 confidence → UI warning, never
  auto-written to history — `AI_ML.md`); weekly milestone detection (streaks,
  score-band crossings).
- **Features (frontend):** full `/progress` screen per `app-progress[-dark].html`
  (photo timeline, before/after slider, adherence heat, trend chart with dataviz
  discipline) and `/check-in` per `app-checkin[-dark].html` (daily: routine
  checklist mirror, water/sleep quick log writing the same `routine_logs`/
  `lifestyle_logs` upserts the dashboard card uses); nav `built: true` for both.
- **Dependencies:** none hard (storage + logs exist); M3-D not required.
- **Inputs:** routine_logs, lifestyle_logs, skin_assessments history, photos.
- **Outputs:** endpoints + two screens; `progress/me/summary` unchanged (additive).
- **Acceptance criteria:** a user can log a check-in, upload before/after photos,
  and see adherence + score trend + at least one generated insight over seeded
  history; photos only ever served via signed URLs; EXIF verified stripped.
- **Testing:** Mongo upsert idempotence (one doc/user/week), photo pipeline test
  (upload → EXIF absent → signed URL fetch), ownership matrix (user A cannot read
  B's logs/photos), trend math unit tests on fixed series, e2e check-in → progress
  journey both themes.

### M3-F · Analytics service + Insights (PDF Modules 8–9 — "analytics workflows completed")

- **Objective:** the read-only Analytics aggregator (#10) + the user-facing
  Insights screen.
- **Features (backend):** `analytics` service (owns nothing; reads via scores/
  routines/progress/recommendations interface functions): `GET /api/v1/analytics/me`
  (score trajectory vs adherence, hydration/sleep correlations — simple documented
  statistics, no invented ML), `GET /api/v1/analytics/admin` extensions to the
  existing dashboard-stats where cheap (recommendation acceptance from feedback,
  adherence distribution — admin role). PDF §8 metric counters (assessment counts,
  rec CTR from feedback, engagement) exposed via the analytics service for the
  admin Monitoring screen.
- **Features (frontend):** `/insights` per `app-insights[-dark].html`; nav flips
  `built: true`; each insight card carries its data-source label and confidence
  where AI-derived.
- **Dependencies:** M3-E (adherence/progress series), M3-D (feedback for rec
  analytics — degrade gracefully to "not enough data" empty states, designed, not
  blank).
- **Acceptance criteria:** "Analytics and recommendation workflows completed" —
  insights render from real user history; empty states for new users; admin sees
  platform-level aggregates; no analytics write path exists (grep-verifiable).
- **Testing:** aggregation unit tests on fixed fixtures; cross-role access matrix
  (user sees only `me`; admin-only for platform aggregates); e2e insights render.

### M3-G · User dashboards refresh + instrumentation (PDF task 5)

- **Objective:** "Create user dashboards" — the dashboard reflects every M3 module
  with real data, and the PDF §8 system metrics are actually measured.
- **Features:** dashboard cards link/preview: today's check-in state, latest
  insight, top recommendation with Match ring, progress snapshot; Skin Score Ring
  treatment identical everywhere (AGENTS.md §4 signature element); request-latency
  metrics (API p95, rec latency, dashboard TTI) captured via existing structured
  logs + surfaced on admin Monitoring; `/profile` sidebar nav entry **only if the
  owner approves** the AGENTS.md nav-list change (flag, don't decide).
- **Dependencies:** M3-B…F. **Acceptance criteria:** every User nav item now
  `built: true` except any the owner explicitly defers; dashboard TTI p75 < 2.5 s
  against the live dev stack; both themes verified side-by-side with wireframes.
- **Testing:** e2e full user journey extended (signup → assessment → check-in →
  products → ingredients → progress → insights), light+dark; visual check both themes.

### M3-H · `ml/` scaffold + eval harness (`AI_ML.md` §"Evaluation harness")

- **Objective:** the planned `ml/` tree exists so model work stops being ad-hoc:
  `ml/eval/` with golden datasets, `make eval` wired (target exists, currently
  no-ops), metrics per `AI_ML.md` model cards for the surfaces M3 makes real
  (suitability precision@flag + zero-missed-allergy; recommender NDCG@10/precision@5
  once real labels exist — until then the eval reports "no label data" honestly);
  registry layout `ml/registry/` documented. Update ARCHITECTURE §12 / CONVENTIONS
  repo tree in the same change (`ml/` moves from PLANNED to real).
- **Dependencies:** M3-B/M3-D. **Acceptance criteria:** `make eval` runs and writes
  a report; CI does not regress; no fabricated datasets.
- **Testing:** eval-runner unit test on a tiny fixture set.

---

## 4. Folder structure (where new code belongs — no duplicates, no new layouts)

```
backend/app/
├── worker/                    # NEW (M3-A): main.py (WorkerSettings), consumers/
│   │                         #   es_projection.py, embeddings.py, rebuild.py
├── db/elasticsearch.py        # NEW client (lazy); db/vector.py — FAISS wrapper
├── ai/                        # suitability.py, recommender.py, trend.py,
│   │                         #   embedder.py — real impls behind existing contracts;
│   │                         #   schemas.py stays the single contract module
├── services/
│   ├── ingredients/           # + router.py, deps.py (M3-B); service.py grows
│   ├── recommendations/       # + products router module (M3-C), feedback (M3-D)
│   ├── progress/              # + models.py (progress_images), photos/logs (M3-E)
│   └── analytics/             # NEW service package (M3-F)
├── migrations/versions/       # outbox + products.rating migrations (§5)
ml/                            # NEW (M3-H): eval/, registry/ (see AI_ML.md)
web/app/(user)/
├── ingredients/  page.tsx + [id]/page.tsx        (M3-B)
├── products/     page.tsx + [id]/page.tsx + compare/page.tsx (M3-C)
├── check-in/     page.tsx                        (M3-E)
├── progress/     page.tsx (rebuilt to full scope) (M3-E)
└── insights/     page.tsx                        (M3-F)
web/components/   # shared: match-ring, insight-card, before-after-slider, etc.
```

Update `docs/ARCHITECTURE.md` §12 and `docs/CONVENTIONS.md`'s tree in the same
change that creates `ml/` or `worker/`.

## 5. Database changes

Every PG change = Alembic migration **plus** the same edit to
`database_schemas/skinlytics_postgresql_schema_v3.sql` (+ dated note in
`README_v3_changes.md`) in the same branch — that is how M2's rename kept the
canonical schema canonical. Mongo/ES/vector changes update their schema txt files
in the same branch. Never touch Better Auth identity tables from Alembic (ADR-003).

1. **`outbox` (NEW, M3-A)** — resolves the open ADR-010 promise:
   ```sql
   CREATE TABLE outbox (
       outbox_id BIGSERIAL PRIMARY KEY,
       aggregate_type VARCHAR(50) NOT NULL,   -- 'product'|'ingredient'|'article'|'profile'
       aggregate_id TEXT NOT NULL,            -- TEXT: covers int PKs and user ids (ADR-003)
       event_type VARCHAR(50) NOT NULL,       -- 'upsert'|'delete'
       payload JSONB,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       processed_at TIMESTAMP                 -- NULL = pending; index on (processed_at, outbox_id)
   );
   ```
2. **`products` + `rating DECIMAL(3,2)` + `review_count INTEGER`** (M3-C/D) —
   backed by *real* Sephora `product_info.csv` columns (`rating`, `reviews`), not
   invented; ingest (`admin/ingest/products.py`) extended to populate them;
   nullable (curated seed rows have none). This finally makes `AI_ML.md`'s
   "sorts by rating" stub semantics and the §10 rank signal schema-true.
3. **Mongo `recommendation_feedback` (NEW collection, M3-D)** — documented in
   `skinlytics_mongodb_schema_v3.txt` as #9 in the same branch:
   `{ user_id: String, product_id: Int, recommendation_id: Int|null,
   action: 'thumbs_up'|'thumbs_down'|'saved'|'dismissed', created_at }`,
   index `{ user_id: 1, created_at: -1 }`. Single writer: recommendations service.
4. **Mongo `progress_logs`** — no schema change; first real writer (progress
   service, M3-E), shape exactly as documented (one doc per user per week).
5. **ES indices** — created by the worker from
   `skinlytics_elasticsearch_schema_v2.txt` mappings verbatim (derived-only).
6. **`product_recommendations`** — no DDL change; first real writer (M3-D).
7. **`progress_images`** — no DDL change; first real writer (M3-E).

## 6. APIs

All under `/api/v1`, JWT-verified, role-checked, Pydantic-validated, standard error
envelope (`docs/CONVENTIONS.md`), rate-limited (stricter tier on AI paths — the
recommendation and suitability endpoints join that tier). Regenerate
`web/lib/api-types.ts` (`make openapi`) in every branch that touches a router.

| Method + path | Role | Notes |
|---|---|---|
| `GET /ingredients` | user (+all signed-in) | list/search/filter; ES-backed, PG fallback |
| `GET /ingredients/{id}` | user (+all) | detail + junctions + education |
| `GET /ingredients/{id}/suitability/me` | user | per-profile; `confidence`; allergy flags |
| `GET /ingredients/interactions?ids=` | user | 2–5 ids; pairwise flags |
| `GET /products` | user (+all) | catalog: search/category/brand/budget/skin-type |
| `GET /products/{id}` | user | detail + per-user annotations |
| `GET /products/compare?ids=` | user | 2–3 ids |
| `GET /products/{id}/alternatives` | user | vector-nearest, hard-filtered |
| `GET /recommendations/me` | user | **updated** — additive fields (`match_score` semantics unchanged) |
| `POST /recommendations/feedback` | user | body `{product_id, action, recommendation_id?}` → 204 |
| `POST /progress/me/logs` · `GET /progress/me/logs` | user | weekly log upsert/list |
| `POST /progress/me/photos` · `GET /progress/me/photos` | user | presigned upload/list |
| `GET /progress/me/summary` | user | **unchanged contract**, richer payload additive |
| `GET /analytics/me` | user | insights aggregates |
| `GET /analytics/admin` | admin | platform aggregates (analytics service; admin-role-gated) |

**Validation:** ids positive ints; compare/interactions enforce arity; enum-checked
`action`/`image_stage`; pagination capped (`page_size ≤ 100`). **Security:**
ownership in each `deps.py` (`me`-scoped reads only); photos signed-URL-only;
admin aggregates never expose per-user rows without the existing clinical-access
rules; audit-logging stays admin-mutation-only (ARCHITECTURE §2).
**Response formats:** JSON per existing schema conventions; every AI-derived field
group carries `confidence`; degraded dependencies (ES down) surface
`"source": "fallback"` rather than silently changing semantics.

## 7. Frontend

- **Pages:** §4 list. Every screen builds against its exact wireframe pair +
  reference screenshot, opened side-by-side before "done" (AGENTS.md §4) — all six
  M3 screens have wireframe pairs already extracted (verified 2026-07-22).
- **Components:** shadcn primitives already in the wireframe set only; new shared
  components live in `web/components/` (match-ring reuses `SkinScoreRing` gradient
  treatment; before/after slider; insight card; ingredient badge). Check shadcn
  first before writing custom (`.agents/skills/shadcn/` rules apply).
- **Layouts:** existing `AppShell`; User route group stays bare-path.
- **State:** TanStack Query via `web/lib/api.ts` only (no raw fetch); prefer
  `useQuery` for run-once-on-mount (the M2 `useMutation` navigation bug —
  `PROGRESS.md` 2026-07-15); query keys scoped by `userId` where user-specific.
- **Errors/loading:** every screen designs empty/loading/error per
  `docs/WIREFRAMES.md` global patterns — skeletons on load, `StateCard` +
  Retry on error, designed empty states for new users (esp. Insights/Progress).
- **Accessibility:** focus management, `aria` on sliders/compare tables, reduced
  motion **and reduced transparency** honored (ARCHITECTURE §11); Playwright
  selectors respect the Base UI `role="button"` quirk (`PROGRESS.md`).
- **Responsive:** wireframe breakpoints; data tables scroll within their card.
- **Charts:** follow the dataviz skill/`docs/DESIGN.md`; Recharts via shadcn charts;
  Plotly only if a screen genuinely needs scientific viz.
- **Both themes, every screen** — definition of done (AGENTS.md §7).

## 8. AI

- **Models/interfaces made real this milestone:** `IngredientSuitability`,
  `Recommender` (v2), `ProgressTrendAnalyzer`, `TextEmbedder`. Remaining stubs:
  `SkinTypeClassifier`, `ConcernDetector`, `SkinScorePredictor` (unchanged, ADR-007).
- **Inference flow:** service → `app/ai/` interface → config-selected impl
  (`AI_IMPL_*` env per interface, `stub|real[|ranker]`); embeddings computed only
  in the worker (never request-path).
- **Recommendation pipeline & decision logic:** §2 stages; the content-based rank
  formula is explicit and documented in code:
  `match = 0.35·suitability + 0.25·concern_overlap + 0.15·vector_similarity +
  0.10·rating_norm + 0.10·price_fit + 0.05·popularity_norm` — weights are module
  constants with a docstring, tuned only with recorded reasoning (this is the
  operational engine unless real feedback labels justify the flag-gated ranker).
- **Confidence scoring:** every surface returns calibrated-honest confidence
  (rule-derived values documented per rule, e.g. allergy exact-name hit = 0.95,
  substring hit = 0.7); < 0.6 triggers the UI low-confidence warning and is never
  auto-persisted to history (`AI_ML.md`).
- **Fallback strategy:** ES down → PG filter fallback (flagged in response);
  vector store empty → skip stage 2, log, proceed; ranker flag off/no labels →
  content-based; cold start → content-based + popularity prior; hard filters can
  never be skipped by any fallback path.
- **Validation:** eval harness (M3-H); the zero-missed-allergy requirement is a
  release-blocking test, not a metric to monitor.

## 9. Testing

- **Unit:** scoring/rank/trend/suitability math on fixed fixtures; outbox
  atomicity; parser/normalizer edges (INCI names, budget bands).
- **Integration (real Docker stores — repo pattern, `tests/conftest.py`):** every
  new endpoint against live PG/Mongo/Redis/ES/MinIO; worker projection round-trips;
  cache invalidation paths.
- **API:** auth matrix per new route (valid/expired/wrong-role JWT — CONVENTIONS
  §Testing); ownership matrices; error-envelope shape; OpenAPI regeneration diff
  reviewed.
- **UI:** component states (empty/loading/error) for new shared components.
- **E2E (Playwright, `workers: 1`, `helpers.ts`, ADR-018):** extended user journey
  (§M3-G) light+dark; ingredient and product journeys; check-in→progress; **the
  deferred M2 assessment error-path spec** (forced network failure → banner + Retry)
  lands here.
- **Regression:** full existing suites green at every merge; deprecated-alias
  removal verified by the full e2e run.
- **Performance:** marked perf tests assert §M3-D stage budgets and catalog p95
  against the live dev stack (skippable in CI, run before milestone close);
  dashboard TTI measured (p75 < 2.5 s target).
- **Coverage floor:** 80% on services touched (CONVENTIONS).

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| No external M3 rubric doc yet — literal names may differ | Rename churn late in milestone | Banner at top; additive API changes; confirm with owner the moment a docx lands (M2 precedent) |
| ES/vector infra adds ops surface (memory, startup order) | Flaky dev/test envs | Lazy clients, health checks, explicit PG fallbacks, ES-down tests; worker isolated in compose |
| No real interaction labels for a learned ranker | "Rec engine operational" misread as "trained model required" | PDF requires *operational workflows*, not a trained ranker; content-based engine is the deliverable; feedback collection starts now; decision recorded in PROGRESS.md |
| Sephora junction sparsity (skin-type/concern links only exist for seeded rows) | Thin recommendations over the 8.4k catalog | Verify junction coverage early (M3-C); if sparse, derive product↔concern/skin-type links from ingredient junctions (documented derivation, not invention); flag coverage stats in PR |
| Free-text allergy tags vs INCI names | Missed allergy = hard-requirement failure | Conservative containment matching + zero-miss test matrix + prominent "check with a professional" copy |
| Docker VM clock skew (known env issue) | Same-day upsert tests flake | Restart Docker Desktop before perf/e2e sessions (PROGRESS.md remedy) |
| Photo privacy (progress photos are sensitive) | Trust/compliance failure | Existing storage adapter: private bucket, signed URLs, EXIF strip verified by test; consent copy on upload UI |
| Scope creep into notifications/reports | Milestone slips | Out-of-scope table §1 is binding; pull-forward only by owner decision |

## 11. Definition of Done — Milestone 3

- [ ] All M3-0 carry-over items closed; full backend + frontend suites green with
      zero known-red tests.
- [ ] Outbox + worker live; ES + FAISS populated and rebuildable by one command;
      no direct derived-store writes outside the worker.
- [ ] PDF Module 5 (ingredient intelligence) demonstrable: analysis, suitability,
      interactions, allergy detection, education — with the zero-missed-allergy
      test matrix passing.
- [ ] PDF Module 6 demonstrable: personalized recs, suitability scoring, compare,
      alternatives, budget-based — five-stage pipeline serving within stage budgets.
- [ ] PDF Module 8 demonstrable: check-in, weekly logs, photos (signed-URL-only,
      EXIF-stripped), adherence + trend + insights.
- [ ] Analytics workflows complete: `/analytics/me` + admin aggregates + Insights
      screen with designed empty states.
- [ ] Every User nav item `built: true` (or explicitly owner-deferred, recorded in
      PROGRESS.md); all six new screens verified against wireframes in both themes.
- [ ] `ml/` exists with a running `make eval`; no fabricated datasets anywhere.
- [ ] Every schema change mirrored in `database_schemas/` in the same branch;
      `web/lib/api-types.ts` regenerated in every router-touching branch;
      ADRs appended for structural decisions (outbox, products.rating, feedback
      collection, nav repoint).
- [ ] `PROGRESS.md` updated per branch, honestly, including live-verification
      evidence (the repo's standing bar: verified against the running system, not
      just unit tests).
- [ ] Extended cross-theme e2e user journey passes 3/3 consecutive runs against the
      live dev stack.
