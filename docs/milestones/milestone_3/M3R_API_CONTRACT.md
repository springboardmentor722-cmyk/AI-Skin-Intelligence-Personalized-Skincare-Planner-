# M3R API Contract — frozen for P0

Reconciled against live schemas (`backend/app/services/{ingredients,recommendations,
progress}/schemas.py`) and `M3R_GAP_ANALYSIS.md`. These four surfaces are additive
extensions of the existing services (single-writer rule, service anatomy unchanged) —
none of this invents a parallel module. P1-P3 build against these shapes; P4/P5 build
against the regenerated `web/lib/api-types.ts` these produce (`make openapi` after each
merge).

## 1. Safety Score endpoint (new — Rubric Step 1)

`POST /api/v1/ingredients/safety-score`

- **Auth:** `require_role("user")` (own profile) + consultant/dermatologist for
  assigned clients via `clinical_review`'s public `verify_assignment` wrapper (pass
  `client_user_id` as an optional query param, ownership-checked).
- **Request body** (`SafetyScoreRequest`):
  ```json
  {
    "ingredient_ids": [12, 45, 88],
    "routine_time": "AM" | "PM"
  }
  ```
  `ingredient_ids` resolve against the existing `ingredients` table (never a free-text
  INCI parse in v1 — that's a future enhancement, not this pass's scope).
- **Response** (`SafetyScoreRead`):
  ```json
  {
    "score": 62,
    "label": "Warning",
    "confidence": 0.9,
    "allergy_alerts": [
      { "ingredient_id": 3, "ingredient_name": "Ascorbic Acid", "reason": "Possible allergy match: 'Ascorbic Acid' overlaps a tag in your recorded allergies. Check with a professional before using.", "confidence": 0.7 }
    ],
    "interaction_warnings": [
      { "ingredient_id_a": 12, "ingredient_id_b": 88, "ingredient_name_a": "Retinol", "ingredient_name_b": "Glycolic Acid", "verdict": "avoid", "reason": "..." }
    ]
  }
  ```
  - `score`: `int`, 0-100.
  - `label`: `Literal["Safe", "Warning", "Unsafe"]` — thresholds config-driven (new PG
    row, pattern: `scoring_weights`), not hardcoded Python constants.
  - `allergy_alerts`: built from the existing `app/ai/suitability.py` synonym-aware
    matcher against the caller's `skin_profile` allergens — read via the skin_profile
    service interface, never its tables directly. Reuses `SuitabilityResult`'s existing
    `reasons[0]` + `confidence` directly, rather than deriving a separate matched-
    allergen/alias-flag pair.
  - `interaction_warnings`: built from `app/ai/interactions.py`'s existing pairwise
    verdicts. `routine_time` scopes the request to one routine step by construction —
    every ingredient in `ingredient_ids` is understood to be used in that one step, so
    every pairwise interaction found among them is inherently a same-step conflict.
    The parameter is recorded on the request but there is no separate per-pair
    filtering logic to build.
  - `confidence`: standard AI-advisory field (AGENTS.md §2.8); "not medical advice"
    surfaces client-side wherever this is rendered.
- **Errors:** `422` for unknown `ingredient_ids`; `404` if `client_user_id` isn't
  assigned to the caller.

## 2. Recommendation endpoint (extend `GET /recommendations/me` — Rubric Step 2)

- **Auth:** unchanged (`require_role("user")` + professional-for-assigned-client).
- **New query params:** `max_price: float | None` (hard budget cap, not just a soft
  scoring signal — a top match over the cap is hard-flagged (`over_budget: true`,
  never merely down-ranked in the ranking itself) and, when a real cheaper
  same-category candidate exists, a second, flagged alternative entry is appended
  alongside it. The over-budget product itself is never dropped from the response —
  see `over_budget`/`alternative_for_product_id` below for the real behavior).
- **Response** (`RecommendationRead`, extended):
  ```json
  {
    "product": { "...": "ProductRead, unchanged (product.category carries the category)" },
    "match_percentage": 94,
    "reasons": ["Targets acne", "Oil-free formula matches oily skin type"],
    "active_ingredient_tags": ["Salicylic Acid", "Niacinamide"],
    "over_budget": false,
    "alternative_for_product_id": null
  }
  ```
  - No redundant top-level `category` — `product.category` already carries it.
    "Categorized recommendations" (MILESTONE 3.pdf Step 2) means: the served list is
    the top `_TOP_PER_CATEGORY` (= 1) ranked candidate per `product.category` across
    the 7 rubric-literal categories (Face Wash, Moisturizer, Sunscreen, Serum, Toner,
    Treatment Products, Face Masks) — i.e. one best match per category, not a flat
    single global top-N that could all land in one category.
  - `match_percentage`: `int` 0-100, rounded — replaces the raw `match_score: float`
    (renamed field, same underlying weighted-scoring computation).
  - `active_ingredient_tags`: the distinct `ingredients.category` values (Retinoids,
    AHAs/BHAs, ...) found across the product's mapped ingredients — populated for
    budget-cap alternative entries too (closed post-launch review, alongside the rest
    of the alternative-scoring rework), not hardcoded `[]` for them anymore. Often
    genuinely `[]` in practice, for main-path entries and alternatives alike, on real
    ingested products whose ingredients never mapped to a curated `ingredients.category`
    value — an honest data-coverage gap in the underlying ingredient catalog, not a bug
    in this field.
  - `over_budget` / `alternative_for_product_id`: when a top match exceeds
    `max_price`, its entry gets `over_budget: true` — the product itself is never
    dropped from the response, only flagged — and, if a real cheaper same-category,
    allergy/avoid-gated-safe candidate exists, a second entry is appended with
    `alternative_for_product_id` set to the over-budget product's id and
    `over_budget: false`. No alternative is fabricated if none qualifies.
  - Weights (Concern 50% / Skin-Type Fit 35% / Rating 15%) live in a new config-driven
    PG row (pattern: `scoring_weights`, `CHECK` sum = 1.00) — never hardcoded literals.
- **Errors:** unchanged from the existing endpoint.

## 3. Progress check-ins + photo pipeline (extend `progress` service — Rubric Step 3)

### 3a. Adherence (extend `ProgressSummaryRead` / analytics, see §4)

Adherence windows computed: `7`, `30`, **and `30 -> 90`** (new). Same
completed-steps-÷-assigned-steps formula, same day-boundary convention as
`scores/service.py`'s existing fix — one implementation, not three.

### 3b. Photo upload (extend `POST /progress/photos`)

- **New request field:** `tag: str | None` (e.g. `"Baseline"`, `"Week 4"`) — if
  omitted, server computes a default: first photo for the user auto-tags `"Baseline"`,
  subsequent ones compute `"Week N"` from weeks-since-baseline. User-supplied value
  always wins over the computed default.
- **New PG column** on `progress_images`: `skin_health_score_at_upload: float | None`
  — read from the scores service interface at upload time and frozen (never
  recomputed later, even after the live score changes). Alembic migration + same-change
  update to `database_schemas/skinlytics_postgresql_schema_v3.sql`.
- **`ProgressPhotoRead` extended:**
  ```json
  {
    "progress_image_id": 9,
    "image_stage": "Baseline",
    "uploaded_at": "2026-08-01T10:00:00Z",
    "skin_health_score_at_upload": 74.5,
    "url": "https://...presigned..."
  }
  ```

## 4. Analytics endpoint (extend `GET /analytics/me` — Rubric Step 3)

Merge photo links into the existing `score_vs_adherence` + `correlations` payload so
one endpoint serves the rubric's literal "historical score timelines, compliance
percentages, and progress photo links" together — P4/P5 charts consume only this
endpoint, no client-side recomputation or a second fetch to `/progress/me/photos`.

- **Response** (`AnalyticsMeRead`, extended):
  ```json
  {
    "score_timeline": [{ "date": "2026-07-01", "overall_score": 68 }],
    "compliance": { "7_day": 0.85, "30_day": 0.72, "90_day": 0.68 },
    "photos": [
      { "progress_image_id": 9, "image_stage": "Baseline", "uploaded_at": "...", "skin_health_score_at_upload": 74.5, "url": "..." }
    ],
    "correlations": { "...": "unchanged" }
  }
  ```
- **Auth:** unchanged (`require_role("user")` + assigned professionals via
  `clinical_review`).

---

## Frontend consumption notes (P4/P5)

- Dashboard chart library: **Chart.js or Plotly** per the session's recorded decision
  (see `M3R_GAP_ANALYSIS.md` §Decisions) — implementation detail (which of the two, and
  whether it replaces or sits alongside the existing Recharts trend chart) deferred to
  P4 kickoff; prefer whichever avoids adding a net-new dependency once P4 checks
  `web/package.json`.
- `make openapi` must be re-run after each of P1/P2/P3 merges so P4/P5 build against
  real generated types, not hand-typed guesses of this contract.
