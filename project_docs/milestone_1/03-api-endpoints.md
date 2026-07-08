# API Endpoints — Milestone 1

Generated from the live FastAPI OpenAPI schema (`backend/app/main.py`'s
`app.openapi()`), not hand-typed — this is what actually exists in code as of Milestone 1
close. The full machine-readable spec is regenerated any time the backend changes via
`make openapi` (writes `openapi.json` at repo root + `web/lib/api-types.ts`, the typed
frontend client).

**Conventions** (`docs/CONVENTIONS.md`): every route is versioned under `/api/v1`
(ADR-009); errors use one envelope —
`{ "error": { "code", "message", "details", "request_id" } }`; `me`-scoped paths read/
write only the caller's own data.

## Auth model

All endpoints below except the two reference-data `GET`s require a valid Better Auth JWT
(`Authorization: Bearer <token>`), verified by FastAPI against Better Auth's JWKS
(`core/security.py`). Most also require the caller's role to be exactly `user` — these
are User-role domain features (`docs/ARCHITECTURE.md` §2); a consultant/dermatologist/
admin JWT gets **403 Forbidden**, not empty data, if it calls one (Milestone 1's RBAC
enforcement, see root `PROGRESS.md`).

| Method | Path | Auth | Service | Purpose |
|---|---|---|---|---|
| GET | `/health` | none | — | Liveness probe (unversioned) |
| GET | `/api/v1/users/me` | any authenticated role | User | `{id, role}` from JWT claims — used to route to the right role dashboard after login. **Deliberately not role-restricted.** |
| GET | `/api/v1/users/me/profile` | role = `user` | User | The domain profile: age, gender, etc. |
| PUT | `/api/v1/users/me/profile` | role = `user` | User | Update the domain profile |
| GET | `/api/v1/skin-types` | none | Skin Profile | Reference data — the 5 skin types |
| GET | `/api/v1/skin-concerns` | none | Skin Profile | Reference data — the 10 skin concerns |
| GET | `/api/v1/skin-profiles/me` | role = `user` | Skin Profile | Current (versioned) skin profile + concerns |
| POST | `/api/v1/skin-profiles` | role = `user` | Skin Profile | Create/replace the active skin profile; invalidates the recommendation cache |
| POST | `/api/v1/lifestyle-logs` | role = `user` | Skin Profile | Upsert today's lifestyle log (Mongo, one/day) |
| GET | `/api/v1/lifestyle-logs/me` | role = `user` | Skin Profile | Recent lifestyle logs |
| GET | `/api/v1/scores/me` | role = `user` | Skin Health Scoring | Computes/returns today's weighted Skin Score (404 if no skin profile exists yet) |
| GET | `/api/v1/routines/me` | role = `user` | Routine Planner | AM/PM routine with steps + linked products (generates once, then reuses) |
| GET | `/api/v1/recommendations/me` | role = `user` | Product Recommendation | Ranked product matches with `match_score` + `reasons[]`, Redis-cached 24h |
| GET | `/api/v1/progress/me/summary?days=` | role = `user` | Progress Tracking | Skin Score trend points over the last `days` (1–365, default 30) |

## Response shapes (key schemas)

```
ScoreRead {
  score_id, skin_condition_score, lifestyle_score, sleep_quality_score,
  hydration_score, routine_adherence_score, overall_score,
  weights: { skin_condition_weight, lifestyle_weight, sleep_quality_weight,
             routine_adherence_weight, hydration_weight },   // fractions, sum to 1.00
  calculated_at
}

RoutineRead {
  routine_id, routine_name, routine_type ("AM" | "PM"), description,
  steps: [{ step_id, step_order, step_name, instruction, duration_minutes,
            products: [{ product: ProductRead, usage_notes }] }]
}

RecommendationRead {
  product: ProductRead,
  match_score: number,       // 0-1
  reasons: string[]          // human-readable, not frontend-guessed
}

ProgressSummaryRead {
  points: [{ date, overall_score }]
}
```

## Deliberately stubbed (ADR-007)

`scores/me`, `routines/me`, and `recommendations/me` compute real numbers from real
declared data (skin profile, concerns, lifestyle logs) using **deterministic, rule-based
logic** — not machine-learning models. This is intentional Milestone 1 scope: the API
contracts above are final and stable; Milestone 2–3 swap the internals for real models
behind the same response shapes, which is why the frontend never needs to change when
that happens.

## Not yet built (out of Milestone 1 scope)

Skin Assessment (`/api/v1/assessments`), Ingredient Intelligence
(`/api/v1/ingredients`), Notification (`/api/v1/notifications`, `/reminders`), Analytics
(`/api/v1/analytics`), Report (`/api/v1/reports`), and Admin (`/api/v1/admin`) endpoints
from `docs/ARCHITECTURE.md` §4's 12-service list are not implemented yet — each is
tracked as later-milestone work in root `PROGRESS.md`.
