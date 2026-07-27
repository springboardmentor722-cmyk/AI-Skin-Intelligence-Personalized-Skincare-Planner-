# M3R Gap Analysis — Rubric vs Live Code (P0)

Written against `docs/milestones/milestone_3/MILESTONE 3.pdf` (the graded rubric) and
verified against the live repo on `feat/m3r-p0-gap-analysis` (branched from `dev`) —
file paths, `grep`, live pytest runs, not `PROGRESS.md`'s or the Master Prompt's own
claims. Where the Master Prompt's assumed repo state disagreed with what's actually on
disk, the disk wins and the disagreement is called out below. This table is the only
input P1-P6 use to scope work — **rows marked `none` are not touched.**

Docker compose stack (`postgres, mongo, redis, elasticsearch, minio, worker`) was
brought up and verified healthy this pass; backend suite is 507/507 green including all
12 MinIO storage tests (`backend/tests/test_storage.py`).

---

## 0. Master Prompt assumptions that turned out stale

| Assumed (Master Prompt §3 / §1) | Actual | Verdict |
|---|---|---|
| 5 MinIO tests failing, `InvalidAccessKeyId` | `.env` S3 creds already match `docker-compose.yml`'s MinIO creds; the failure was Docker Desktop being down, not a credential mismatch. All 12 storage tests pass now that the stack is up. | **Stale — closed, no code change needed.** |
| OpenWeather/OpenUV keys blank in root `.env` | Both keys are present and non-blank; `backend/app/integrations/base.py` has real timeout/retry/circuit-breaker, `weather/service.py` surfaces `AdapterError` rather than fabricating a fallback. | **Stale — closed, no code change needed.** |
| Deprecated aliases `/scores/me`, `/routines/me`, `/routines/generate` still mounted | Grepped every router; these paths don't exist. Only comments reference the old names historically. Real mounted paths: `/assessment/score`, `/assessment/evaluate`, `/routine`, `/routine/generate`. | **Stale — nothing to deprecate.** |
| bugs_report.md #3/#4 (age_group, notification bell) still open | Both fixed and merged (`a98aac4`, `631de83`) — confirmed in code, not just git log. | **Stale — already closed.** |
| ADR-010 outbox may not have landed | `backend/app/db/outbox.py` + `backend/app/worker/poller.py` are real; grep for direct ES/vector writes outside the worker returned zero hits. | **Confirmed real, matches ADR-010.** |
| `docker-compose.yml` missing `api`/`web` services | Confirmed still missing (6 services: postgres/mongo/redis/elasticsearch/minio/worker). | **Confirmed — expected, M4 scope per Master Prompt.** |

---

## 1. Ingredient Intelligence Engine (Rubric Step 1)

**Partially exists.** `backend/app/services/ingredients/{router,service,schemas}.py` is
real (not just a service layer, contrary to `AGENTS.md`'s stale "router lands M3" note
— that line should be corrected in P7 docs pass). Knowledge base is seeded
(`backend/app/db/seed.py:230-320`) with all seven rubric active classes. Allergy
matching with aliases is real (`app/ai/suitability.py`, synonym-aware).

**Real gaps (P1 scope):**
- Chemical conflict matrix (`app/ai/interactions.py`) is pairwise ingredient-name rules
  only — **no routine-step/time dimension** (rubric wants "same evening step" scoping).
  **Resolved during P1, no new table built:** the Safety Score endpoint's own request
  shape (`ingredient_ids` + one `routine_time` value) already scopes every submitted
  ingredient to one step by construction — every pairwise interaction found among them
  is inherently a same-step conflict. `routine_time` is recorded on the request but
  there's no separate per-pair, step-aware filtering logic to build on top of
  `app/ai/interactions.py`'s existing pairwise dict. See `M3R_API_CONTRACT.md` §1.
- **No Safety Score endpoint at all.** Closest is `GET /ingredients/interactions`
  (pairwise verdicts, no numeric 0-100 score or Safe/Warning/Unsafe label). This is the
  rubric's core Step-1 deliverable and must be built new, composing the existing
  suitability + interaction building blocks rather than reimplementing them.

## 2. Product Recommendation Engine (Rubric Step 2)

**Exists, wrong shape.** Hard-filter safety gate is real and tested
(`recommendations/service.py:339-352`). Budget-alternative logic exists as a separate
endpoint (`/products/{id}/alternatives`).

**Real gaps (P2 scope) — CLOSED in P2:**
- ~~Catalog categories seeded are `Cleanser, Moisturizer, Sunscreen, Treatment` —
  rubric's literal 7 are `Face Wash, Moisturizer, Sunscreen, Serum, Toner, Treatment
  Products, Face Masks`. Needs a deterministic re-mapping migration over the real
  8,464-product Sephora catalog (never fabricate products, AGENTS.md §0.2).~~ **DONE:**
  all 7 rubric-literal categories mapped over real Sephora skincare catalog. Raw CSV:
  8,494 total rows across all Sephora product lines (skincare, makeup, hair, fragrance,
  etc.); skincare-only ingest loaded 2,409 products across the 7 categories plus
  `uncategorized`. Live DB: Face Wash 219, Moisturizer 406, Serum 379, Treatment
  Products 356, Toner 79, Sunscreen 107, Face Masks 180, uncategorized 699 (2,425 total
  incl. 16 hand-seeded originals).
- Suitability weights are `0.35/0.25/0.15/0.10/0.10/0.05` across 6 hardcoded module
  constants (`app/ai/recommender.py:6-11`) — rubric needs exactly **Concern 50% /
  Skin-Type Fit 35% / Rating 15%**, config-driven (pattern: `scoring_weights`, CHECK
  sum = 1.00), not scattered Python literals.
- No hard budget-cap filter on `GET /recommendations/me` — only a soft `_price_fit`
  scoring signal. The existing `/products/{id}/alternatives` endpoint needs to be
  integrated into the main recommendation response, not left as a side call.
- `match_score` is a raw float, not literally the "94% Match" display shape — cosmetic
  only, no gap in substance.

## 3. Progress Tracking & Cloud Photo Pipeline (Rubric Step 3)

**Mostly exists.** AM/PM check-in logging in Mongo is real
(`routines/service.py::toggle_step_completion`/`get_completed_step_ids`, `routine_logs`
collection). Photo upload pipeline is real and live-verified (`core/storage.py` —
private bucket, presigned URLs, EXIF-stripped, content-type sniffed).

**Real gaps (P3 scope):**
- Adherence math only computes 7-day and 30-day windows
  (`progress/service.py::get_adherence_series`, `routines/service.py`) — **no 90-day
  window exists anywhere.**
- `ProgressImage` (PG) has no skin-health-score-at-upload column; `image_stage` (the
  tag field) exists in the model but the upload router never accepts it from the
  client, so every photo silently defaults to `"progress"` — the "Baseline"/"Week 4"
  tag never actually reaches the API.
- Analytics endpoint (`GET /analytics/me`) returns score timeline + compliance % but
  **not** photo links — those live on a separate `GET /progress/me/photos`. Rubric
  wants all three in one payload shaped for charting/comparison.

## 4. Frontend Dashboards (Rubric Step 4)

**User dashboard (4.1): mostly exists.** Score gauge (`skin-score-ring.tsx`), AM/PM
checklist (`dashboard/routine-checklist-card.tsx`), a Recharts-based trend chart, and a
recommendations section are all present at least partially.

**Real gap:** only `recharts` (`^3.9.2`) is installed in `web/package.json` — no
Plotly, no Chart.js. The session's decision to switch dashboard charts to Chart.js or
Plotly (see §Decisions below) hasn't been implemented in code yet — that's P4 scope.

**Consultant/Dermatologist portal (4.2): roster exists, everything else is missing.**
`web/components/clinical-review/client-detail-view.tsx` shows only today's
step-completion ratio.

**Real gaps (P5 scope, both frontend and backend):**
- **No photo display at all** — no baseline/current rendering, no side-by-side
  compare. `clinical_review/router.py` has no photo-read endpoint.
- **No routine-overwrite capability at all** — no write/edit endpoint in
  `clinical_review/`, no form in the frontend.

These two gaps also block Step 5's E2E walkthrough, which requires exactly this flow.

## 5. Testing & Verification (Rubric Step 5)

**Partially exists.** Unit-test coverage for clash detection and allergy-filter
exclusion is real (`test_ingredients_service.py`, `test_recommendations_service.py`,
`test_suitability.py`). Adherence-math tests exist for the windows that currently
exist (7/30) — 90-day is untestable until P3 builds it.

**Real gap:** no E2E spec covers the rubric's literal walkthrough (assessment → recs →
check-off → photo upload → derm inspects + edits → user sees live update). Existing
specs (`user-journey.spec.ts`, `cross-role-verification-journey.spec.ts`) don't touch
photos or derm routine edits. This is blocked on P5's portal work landing first.

---

## Decisions already recorded this session (owner confirmed, not defaults)

1. **Chart library:** switch P4/P5 dashboard charts from the locked Recharts default to
   **Chart.js or Plotly**, matching the rubric's literal wording. This is a deviation
   from `AGENTS.md` §4's locked stack — record as an ADR in `docs/DECISIONS.md` during
   P7 (or earlier, at P4 kickoff). Implementation choice between the two (prefer
   whichever avoids adding a net-new dependency) is deferred to P4.
2. **Cloud storage naming:** the existing MinIO (S3-compatible) adapter in
   `core/storage.py` is accepted as satisfying the rubric's "AWS S3 or Azure Blob"
   requirement — no live AWS/Azure bucket needed. Document the env-var-swap story in
   the P3 phase report.
3. **Working tree cleanup:** the pre-existing uncommitted doc deletions (superseded
   `docs/superpowers/plans/*.md` QA-pass plans, old `milestone_3.md`/
   `milestone_3_prompt.md`) were committed as P0 setup (`bd145e2`).

No endpoint-literal-naming conflict was found this pass (unlike M2) — the Step 1
Safety Score endpoint and Step 2/3/4 gaps are genuinely new-build or rework items, not
a case of the code already doing the same thing under a different name. They're scoped
as build work in P1-P5, not raised as a conflict needing precedence resolution.
