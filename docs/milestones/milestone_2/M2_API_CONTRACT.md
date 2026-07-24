# M2 API Contract — frozen for P0

Reconciled against the live `openapi.json` (regenerated `2026-07-23`) and
`docs/DECISIONS.md` ADR-020/ADR-021. This extends the existing surface — it does not
invent a parallel one. Live paths not touched by this milestone
(`/routines/products/search`, `/routines/steps/{step_id}`,
`/routines/{routine_id}/steps*`) are unchanged and out of scope here.

## 1. `POST /api/v1/assessment/submit`

**Superseded by ADR-027 (M2-P9)** — this is now a real, new endpoint
(`backend/app/services/assessment/`), not a rename of `/assessment/evaluate`. P8's
wizard already builds and submits the full P0-frozen payload shape (against a
fixture, until this phase); a bare rename with no body would have had nowhere real
for that payload to go. `POST /api/v1/assessment/evaluate` is untouched, still
mounted, still means "recompute the score for the current user's already-saved
profile" — this is an addition alongside it, not a replacement.

- **Auth:** `require_role("user")`.
- **Request body:** `AssessmentSubmitRequest`
  (`backend/app/services/assessment/schemas.py`):
  ```json
  {
    "skin_type": "Oily",
    "concerns": [{ "id": 1, "severity": 7 }, { "id": 2, "severity": 4 }],
    "lifestyle": {
      "sleep_hours": 7.5,
      "water_intake_liters": 2.5,
      "stress_level": 4,
      "sun_exposure": "Moderate"
    },
    "acne_severity": 7,
    "hyperpigmentation_severity": 4,
    "redness_severity": 0,
    "wrinkles_severity": 0
  }
  ```
  `concerns[]` is canonical; the 10 flat `{concern}_severity` fields (one per
  seeded `skin_concerns` row) are deprecated but accepted — if `concerns` is
  omitted, the service derives it from whichever flat fields are nonzero
  (ADR-021 C4's adapter). `skin_type` is validated against the real seeded
  `skin_types.skin_type_name` values, not a hardcoded enum.
- **Response:** `AssessmentSubmitResponse` — `assessment_id` (= the computed
  `SkinScore.score_id`, what `GET /assessment/score/{id}` below takes),
  `submission_id` (the raw-snapshot row's own id), `prioritized_concerns`,
  `risk_factors`, and the full `score` (`ScoreRead`, unchanged shape).
- **Errors:** `422` with field-level `details` for unknown `skin_type`, unknown
  `concerns[].id`, severity outside 0-10, implausible `sleep_hours`/
  `water_intake_liters`, or an unknown `sun_exposure`.
- **Side effects:** syncs a new versioned `skin_profiles` row + today's
  `lifestyle_logs` document (through the Skin Profile service, never written
  directly), computes and stores a real score, and appends an immutable
  `assessment_submissions` row (new table — raw payload, append-only).

## 2. `GET /api/v1/assessment/score/{id}`

New — extends the live `GET /api/v1/assessment/score` (no id, "latest for me").
`score_id` already exists as a real PK with an index on `(user_id, calculated_at)`,
so this is a small service addition (`get_score_by_id(db, user_id, score_id)`), not
new architecture.

- **Auth:** `require_role("user")`; ownership-checked — a `score_id` belonging to
  another user returns `404`, not `403` (don't leak existence).
- **Response:** `ScoreRead` — as of P10 (ADR-028), also carries `skin_age`
  (`float | None`, decision C6 — `None` when the profile has no `age_group` set)
  and `band` (`"Good" | "Fair" | "Poor" | None`, the P1 ramp).
- **Errors:** `404` if the id doesn't exist or doesn't belong to the caller.
- **Deprecation:** bare `GET /api/v1/assessment/score` (no id) stays mounted as a
  "latest for me" convenience alias — it's genuinely useful (the dashboard's hero
  card wants "my current score," not a specific historical id) and isn't being
  removed, just no longer the docx-literal primary route.

## 3. `POST /api/v1/routine/generate` and `GET /api/v1/routine`

**Endpoints unchanged; response shape extended (P11, ADR-029).** Route paths
still match the docx literally (`backend/app/services/routines/router.py`).
`RoutineStepRead` gained three fields the doc's own "each step carrying its
category, product/ingredient recommendation, rationale, and any safety flag
that fired" names explicitly:
- `category` — one of 6 canonical values (`Cleansing`, `Exfoliation`,
  `Treatment`, `Moisturizing`, `Sun Protection`, `Night Care`,
  `routines/constants.py`), distinct from the underlying `products.category`
  (the real, smaller 4-value product taxonomy candidates are drawn from).
- `rationale` — why this product was chosen.
- `safety_flag` — which guardrail fired for this step, if any (e.g.
  `"soothing_substitution"`), `null` otherwise.

AM/PM/Weekly generation now uses a fixed canonical pipeline (no more skin-type-
conditional step removal) plus a distinct post-generation safety-guardrail
layer (`routines/guardrails.py`) — see ADR-029 for the full account.

## 4. Dashboard read models (fixture-shaped until P14)

Per `MILESTONE_2_MASTER_PROMPT.md` §12 (sequencing rule), P1–P5 build against typed
fixtures in `web/lib/fixtures/` whose shapes match real API responses exactly, so
P14 is a fetch swap, not a rewrite. Shapes below are the freeze; fixtures must
conform to these, not to the screenshot numbers directly.

- **User dashboard:** `ScoreRead` (hero ring + sub-scores) · `RoutineRead[]` (AM/PM
  chains) · `ProductRead[]` (`recommendations` service, existing) · progress-service
  read model for the trend chart (existing `progress/schemas.py` — reuse, don't
  redefine) · concern-breakdown donut derived from `SkinProfileConcernRead[]`
  (existing) — no new backend shape needed for row 1–3; row 4's checklist already
  has a live Mongo-backed read path (`routine_logs`).
- **Admin dashboard:** reuse `web/app/api/admin/dashboard-stats` (existing route,
  confirmed present) for the KPI row rather than inventing a parallel stats
  endpoint — P4 wires this instead of a fixture-only stub, once its actual response
  shape is diffed against `UI_SPEC.md §4.4`'s cards in that phase.
- **Consultant / Dermatologist dashboards:** roster + assignment reads route through
  `clinical_review/service.py`'s existing `_verify_assignment` ownership check
  (AGENTS.md §2 rule 6) — no new service, new read-only aggregation endpoints only
  if P5 finds the existing per-client reads insufficient for a list view (to be
  confirmed in that phase, not assumed here).

## 5. Not touched by this milestone

`skin_types` / `skin_concerns` seed data (P6) are read via existing lookup-table
queries, not a new endpoint — the JSON files are a build-time/seed artifact, served
to the frontend as static assets (`web/public/assets/...`, ADR-021 C5) plus a
Pydantic-validated seed step, not an API surface.
