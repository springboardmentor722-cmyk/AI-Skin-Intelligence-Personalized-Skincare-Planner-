# Milestone 3 (remaining work) — API contract freeze

> Produced by M3-P0-T5, against `Master_prompt_milestone3.md`'s §6 owner-confirmed
> conflict resolutions (2026-08-12) and the newer rubric `MILSTONE 3 & 4.pdf`. Every
> shape below is grounded in the actual conventions already in
> `backend/app/services/ingredients/{router,schemas}.py`,
> `backend/app/services/progress/{router,schemas}.py`, and
> `backend/app/services/recommendations/{router,products_router,schemas}.py` — not
> invented from scratch. P1–P4 implement exactly these shapes; deviations found necessary
> during implementation get called out in the phase report, not silently applied here.

## Conventions every endpoint below follows (unchanged from the rest of the app)

- Auth: `Depends(require_role(...))` — never a re-implemented check.
- Professional (consultant/dermatologist) access to another user's data: an optional
  `client_user_id` query param + `clinical_review_service.verify_assignment(db, user["id"],
  client_user_id)`, 422 if missing for a professional caller, 404 if not assigned — exact
  pattern from `POST /ingredients/safety-score`.
- Validation errors from the service layer: caught `ValueError` → `422`.
- Response models are Pydantic schemas in the owning service's `schemas.py`, never raw
  dicts.
- All new routes mount under `/api/v1` via the owning service's existing router — no new
  top-level router files except where noted.

---

## C1 — `POST /api/v1/ingredients/analyze-compatibility`

**Owner decision:** superset over `safety-score`, which stays frozen (P1, G2).
**File:** `backend/app/services/ingredients/router.py` (extends the existing router).

```python
class AnalyzeCompatibilityRequest(BaseModel):
    # Exactly one of the two must be provided — service raises ValueError otherwise.
    ingredient_ids: Annotated[list[int], Field(min_length=1, max_length=20)] | None = None
    inci_text: str | None = None  # free-text INCI list, e.g. "Aqua, Glycerin, Retinol"
    routine_time: Literal["AM", "PM"]

class TokenizedIngredient(BaseModel):
    raw_token: str
    matched_ingredient_id: int | None  # null if no canonical match found
    matched_ingredient_name: str | None
    confidence: float

class AnalyzeCompatibilityRead(BaseModel):
    tokenized: list[TokenizedIngredient]        # only populated when inci_text was used
    score: int                                   # identical composition to SafetyScoreRead
    label: Literal["Safe", "Warning", "Unsafe"]
    confidence: float
    allergy_alerts: list[AllergyAlert]            # reused from ingredients/schemas.py
    interaction_warnings: list[InteractionWarning]  # reused
```

`POST /ingredients/analyze-compatibility` — role `user, consultant, dermatologist` (same
as `safety-score`), same `client_user_id` ownership pattern. 422 if neither
`ingredient_ids` nor `inci_text` given, or both given.

---

## C3 — `POST /api/v1/progress/log-entry`

**Owner decision (corrected 2026-08-12, see G7):** genuinely new — no existing endpoint
covers daily completion + hydration + concerns. **File:**
`backend/app/services/progress/router.py` (extends the existing router; do not create a
new `services/log_entry/`).

```python
class LogEntryCreate(BaseModel):
    date: datetime.date
    completed_step_ids: list[int]   # subset of the day's assigned AM/PM routine steps
    hydration_ml: Annotated[int, Field(ge=0, le=10000)]
    concerns: list[str] = []        # free-text self-reported concerns, not concern_ids —
                                     # the rubric's own wording is "self-reported concerns"

class LogEntryRead(BaseModel):
    date: datetime.date
    completed_step_ids: list[int]
    hydration_ml: int
    concerns: list[str]
    created_at: datetime.datetime
```

`POST /progress/log-entry` — role `user` only, own record (matches `/progress/me/*`'s
existing role scoping). Reads `routine_logs` via the routines service's existing
interface for the completion-flags half (never that collection directly — single-writer
rule); persists hydration + concerns through a new write path in the progress service's
own store. Compliance math (`services/progress/service.py`'s 7/30/90 functions) must
read the same completion data whether it arrived via this endpoint or the existing
routine-step-toggle path — one source of truth, not two.

---

## C2 — `POST /api/v1/products/recommend-routine-set`

**File:** `backend/app/services/recommendations/products_router.py` (extends the
existing router; `products_service.py` gets the new `recommend_routine_set()`).

```python
CATEGORIES: Final = ("Face Wash", "Serum", "Moisturizer", "Sunscreen", "Toner", "Face Masks")

class RoutineSetRequest(BaseModel):
    budget: Annotated[float, Field(gt=0)]
    category_max: dict[str, float] | None = None  # optional per-category cap

class RoutineSetItem(BaseModel):
    category: str
    product: ProductRead | None   # null only if truly no safe candidate exists in that category
    price: float | None
    match_percentage: int | None

class RoutineSetRead(BaseModel):
    items: list[RoutineSetItem]
    total_spend: float
    leftover: float
    over_budget: bool
    shortfall: float | None  # set only when the closest feasible set still exceeds budget
```

`POST /products/recommend-routine-set` — role `user` only (mirrors
`GET /recommendations/me`'s scoping — this is the same suitability pipeline, budget-
constrained). Every `product` in the response has already passed the same hard safety
filter as `GET /recommendations/me` — no separate, weaker filter path.

---

## Product comparison — ALREADY REAL, no contract change

(Not rubric-C4 — that number belongs to the `/dashboard/<role>` route-naming conflict,
tracked separately in P5. Listed here only because it's the other read-only
verification-only item alongside C1–C3.)

`GET /products/compare?product_ids=1&product_ids=2` (`products_router.py:66`,
`compare_products()` in `products_service.py:307`) already returns
`ProductCompareRead { items: list[ProductCompareItem] }` with each item carrying
`ingredient_names`, `skin_types_supported`, `concerns_supported`, and the full
`ProductRead` (including `suitable`/`suitability_confidence` — the safety-gate status).
P3 verifies this against the rubric's field list (price, rating, category, mapped
actives, skin-type/concern fit — all present) and adds tests; **no schema change is
contracted here.**

---

## Ownership / role matrix (all four new/changed surfaces)

| Endpoint | `user` | `consultant`/`dermatologist` | `admin` |
|---|---|---|---|
| `POST /ingredients/analyze-compatibility` | own | assigned client only (`client_user_id`) | — |
| `POST /progress/log-entry` | own | — | — |
| `POST /products/recommend-routine-set` | own | — | — |
| `GET /products/compare` (unchanged) | any (public catalog data) | any | any |

## Error codes (unchanged conventions)

- `422` — validation failure (bad payload shape, missing required field, ambiguous
  `ingredient_ids`/`inci_text`, missing `client_user_id` for a professional caller).
- `404` — target resource not found, or professional caller not assigned to
  `client_user_id`.
- `401`/`403` — handled by `require_role` itself, not per-endpoint code.
