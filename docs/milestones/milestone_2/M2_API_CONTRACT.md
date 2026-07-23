# M2 API Contract — frozen for P0

Reconciled against the live `openapi.json` (regenerated `2026-07-23`) and
`docs/DECISIONS.md` ADR-020/ADR-021. This extends the existing surface — it does not
invent a parallel one. Live paths not touched by this milestone
(`/routines/products/search`, `/routines/steps/{step_id}`,
`/routines/{routine_id}/steps*`) are unchanged and out of scope here.

## 1. `POST /api/v1/assessment/submit`

Renamed from the live `POST /api/v1/assessment/evaluate` (ADR-020 point 2). Same
handler, same behavior — "recompute the score for the current user's already-saved
profile," per `backend/app/services/scores/router.py`'s own documented rationale.
No separate submit-a-whole-profile-inline payload exists or should be invented; the
Skin Profile service (`/skin-profiles`) already owns profile writes.

- **Auth:** `require_role("user")`.
- **Request body:** none.
- **Response:** `ScoreRead` (unchanged shape — `backend/app/services/scores/
  schemas.py`):
  ```json
  {
    "score_id": 42,
    "skin_condition_score": 88.0,
    "lifestyle_score": 91.5,
    "sleep_quality_score": 76.0,
    "hydration_score": 100.0,
    "routine_adherence_score": 60.0,
    "overall_score": 84.2,
    "weights": {
      "skin_condition_weight": 0.35,
      "lifestyle_weight": 0.20,
      "sleep_quality_weight": 0.20,
      "routine_adherence_weight": 0.15,
      "hydration_weight": 0.10
    },
    "calculated_at": "2026-07-21T10:15:00Z"
  }
  ```
- **Errors:** `404` if no skin profile exists yet (unchanged).
- **Deprecation:** old path `POST /api/v1/assessment/evaluate` stays mounted as an
  alias to the same handler until a `web/` consumer sweep confirms nothing calls it
  (same pattern as the 2026-07-15 rename), then removed.

## 2. `GET /api/v1/assessment/score/{id}`

New — extends the live `GET /api/v1/assessment/score` (no id, "latest for me").
`score_id` already exists as a real PK with an index on `(user_id, calculated_at)`,
so this is a small service addition (`get_score_by_id(db, user_id, score_id)`), not
new architecture.

- **Auth:** `require_role("user")`; ownership-checked — a `score_id` belonging to
  another user returns `404`, not `403` (don't leak existence).
- **Response:** `ScoreRead`, same shape as above.
- **Errors:** `404` if the id doesn't exist or doesn't belong to the caller.
- **Deprecation:** bare `GET /api/v1/assessment/score` (no id) stays mounted as a
  "latest for me" convenience alias — it's genuinely useful (the dashboard's hero
  card wants "my current score," not a specific historical id) and isn't being
  removed, just no longer the docx-literal primary route.

## 3. `POST /api/v1/routine/generate` and `GET /api/v1/routine`

**No change.** Both already match the docx literally
(`backend/app/services/routines/router.py`) — confirmed against `openapi.json`.
`RoutineRead` shape is unchanged.

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
