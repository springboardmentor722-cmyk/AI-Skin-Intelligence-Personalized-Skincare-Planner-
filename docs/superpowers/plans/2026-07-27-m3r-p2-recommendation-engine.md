# M3R Phase 2 — Product Recommendation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close M3R-P2-T1 through T6 (`docs/milestones/milestone_3/M3R_TASK_LEDGER.md`) —
rewrite the Product Recommendation Engine's catalog categories, scoring weights, and
response shape to match `MILESTONE 3.pdf` Step 2 literally: 7 named categories, a
config-driven Concern 50% / Skin-Type Fit 35% / Rating 15% formula, a hard budget cap
with cheaper-alternative substitution, and a categorized response with match
percentages.

**Architecture:** Pure extension/rework of `backend/app/services/recommendations/`
and `backend/app/ai/recommender.py` — no new service module. Real product data only
(AGENTS.md §0.2): the raw Sephora CSV is already downloaded
(`training_dataset/raw/sephora/product_info.csv`, confirmed present) and Kaggle
credentials exist in root `.env` — this phase fixes a real bug in the existing ingest
(`backend/app/services/admin/ingest/products.py` uses the CSV's `primary_category`
column — a top-level Skincare/Makeup/Hair/Fragrance split, useless for a skincare
catalog — instead of `tertiary_category`, which has the actual granular skincare
product types) and then runs it for the first time (today only 16 hand-seeded
products exist in the live DB, not the "8,464-product catalog" earlier docs assumed).

**Tech Stack:** FastAPI + SQLAlchemy async + Alembic + pandas (already a backend dep,
used by the existing ingest script).

## Global Constraints

- 7 literal catalog categories: **Face Wash, Moisturizer, Sunscreen, Serum, Toner,
  Treatment Products, Face Masks**. Every product gets exactly one of these, or an
  explicit `uncategorized` — never a guessed category (AGENTS.md §0.2).
- Weighted suitability: **Concern Match 50% / Skin-Type Fit 35% / Rating 15%**,
  config-driven (PG row, `CHECK` sum = 1.00, one active row) — same philosophy as
  `scoring_weights` (AGENTS.md §2 rule 7). Never hardcoded Python literals for these
  three numbers.
- Hard-filter safety gate (already real, `recommendations/service.py:339-352` —
  **do not touch, no gap here**).
- Budget cap: a `max_price` param that actually excludes/replaces over-cap top
  matches, not just a soft scoring signal.
- Recommendation endpoint returns **categorized** results with a match **percentage**
  (int, 0-100).
- Any schema change: Alembic migration + same-change update to
  `database_schemas/skinlytics_postgresql_schema_v3.sql`.
- Real-store fixtures in tests, no mocks.
- `ruff` + `mypy --strict` + `pytest` green; `make openapi` after router/schema
  changes.
- **Cross-cutting risk (read before Task 1):** `backend/app/services/routines/
  constants.py`'s `CATEGORY_TO_PRODUCT_CATEGORY` dict hardcodes the *current*
  category strings (`"Cleanser"`, `"Treatment"`) to pick candidate products for the
  M2 routine generator's AM/PM/Weekly pipeline. Renaming product categories without
  updating this dict silently breaks routine generation (every Cleansing/Exfoliation/
  Treatment step would find zero candidates). Task 1 updates this dict in the same
  change as the rename — this is not optional cleanup, it's required for the rename
  to be safe.

**Contract refinement (decided during planning, corrects `M3R_API_CONTRACT.md` §2):**
Drop the redundant top-level `category` field from the response — `product.category`
(already on `ProductRead`) already carries it, no need to duplicate. Also:
`_TOP_N = 3` (global top-3 across all candidates) becomes `_TOP_PER_CATEGORY = 1`
(best match *per category*, since the rubric's "categorized recommendations" implies
coverage across categories, not a single global top-3 that could all land in one
category) — update `M3R_API_CONTRACT.md` in Task 5's commit to reflect this.

---

### Task 1: Category vocabulary rename (seed data + routine generator + tests + frontend filter)

**Files:**
- Modify: `backend/app/db/seed.py` (category values: `Cleanser` → `Face Wash`,
  `Treatment` → `Treatment Products`; `Moisturizer`/`Sunscreen` unchanged)
- Modify: `backend/app/services/routines/constants.py` (`CATEGORY_TO_PRODUCT_CATEGORY`
  dict + its comment)
- Modify: `backend/tests/test_routines_service.py`,
  `backend/tests/test_recommendations_service.py`,
  `backend/tests/test_products_service.py` (every hardcoded `"Cleanser"`/`"Treatment"`
  category string literal)
- Modify: `web/app/(user)/products/page.tsx` (`CATEGORIES` array)
- Test: existing tests in the three files above, updated in place (this task is a
  rename — it doesn't add new test *behavior*, it keeps existing behavior passing
  under the new names)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this task only renames existing string literals
  consistently. No function signatures change.

- [ ] **Step 1: Confirm the full blast radius before touching anything**

Run: `grep -rn '"Cleanser"\|"Treatment"' backend/ --include=*.py`
Expected: exactly these 4 files (already confirmed during planning):
`backend/app/db/seed.py`, `backend/app/services/routines/constants.py`,
`backend/tests/test_routines_service.py`, `backend/tests/test_recommendations_service.py`,
`backend/tests/test_products_service.py`. If this grep finds a *different* set of
files than expected, STOP and report NEEDS_CONTEXT before proceeding — the plan's
risk analysis assumed this exact file list.

- [ ] **Step 2: Rename in seed.py**

In `backend/app/db/seed.py`, change every `"category": "Cleanser"` to
`"category": "Face Wash"` and every `"category": "Treatment"` to
`"category": "Treatment Products"` in the product seed entries (lines ~67-211 per
the earlier grep — re-locate exactly via the file itself, don't guess line numbers).
Leave `"Moisturizer"` and `"Sunscreen"` untouched. Do NOT touch the *ingredient*
category seed block below it (lines ~230+, `"category": "Retinoids"` etc. — those
are ingredient active-classes, a completely different vocabulary, unrelated to this
rename).

- [ ] **Step 3: Update the routine generator's category mapping**

In `backend/app/services/routines/constants.py`, update
`CATEGORY_TO_PRODUCT_CATEGORY`:

```python
# The seed catalog (backend/app/db/seed.py) uses the rubric's 7 literal product
# categories (MILESTONE 3.pdf Step 2) since M3R-P2 — Exfoliation and Night Care
# still share Treatment Products/Moisturizer respectively (same real actives,
# different cadence/positioning), same precedent as before the rename.
CATEGORY_TO_PRODUCT_CATEGORY: dict[str, str] = {
    CLEANSING: "Face Wash",
    EXFOLIATION: "Treatment Products",
    TREATMENT: "Treatment Products",
    MOISTURIZING: "Moisturizer",
    SUN_PROTECTION: "Sunscreen",
    NIGHT_CARE: "Moisturizer",
}
```

(Read the file first to confirm the exact existing key names — `CLEANSING`,
`EXFOLIATION`, `TREATMENT`, `MOISTURIZING`, `SUN_PROTECTION`, `NIGHT_CARE` — and keep
whatever the real dict's other two entries currently map to unchanged if they don't
reference `Cleanser`/`Treatment` at all.)

- [ ] **Step 4: Update every hardcoded test literal**

In `backend/tests/test_routines_service.py`: change `category="Treatment"` (the
"Unsafe-for-Sensitive Treatment" test product, line ~194) to
`category="Treatment Products"`.

In `backend/tests/test_recommendations_service.py`: change
`test_list_products_for_skin_type_filters_by_category`'s
`category="Cleanser"` (line ~49) and its assertion `p.category == "Cleanser"`
(line ~52) to `"Face Wash"`.

In `backend/tests/test_products_service.py`: change every `category="Treatment"`
(lines ~48, ~75) and its matching assertions (`item.category == "Treatment"`,
lines ~56, ~83) to `"Treatment Products"`; change `category="Cleanser"` (line ~200)
to `"Face Wash"`.

- [ ] **Step 5: Update the frontend category filter**

In `web/app/(user)/products/page.tsx`, change:
```typescript
const CATEGORIES = ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"];
```
to the full rubric-literal 7:
```typescript
const CATEGORIES = [
  "Face Wash",
  "Moisturizer",
  "Sunscreen",
  "Serum",
  "Toner",
  "Treatment Products",
  "Face Masks",
];
```

- [ ] **Step 6: Run the full backend suite and confirm nothing else references the old names**

Run: `cd backend && uv run pytest -q`
Expected: all green (the renamed tests pass under their new category strings; no
other test silently depended on the old names — if something unexpected fails, that's
a real gap in Step 1's blast-radius grep, not a flake — investigate before proceeding).

Run: `cd web && npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add backend/app/db/seed.py backend/app/services/routines/constants.py \
  backend/tests/test_routines_service.py backend/tests/test_recommendations_service.py \
  backend/tests/test_products_service.py "web/app/(user)/products/page.tsx"
git commit -m "refactor(catalog): rename product categories to the rubric's 7 literal names"
```

---

### Task 2: Fix the ingest pipeline's category mapping and run the real Sephora ingest

**Files:**
- Modify: `backend/app/services/admin/ingest/products.py`
- Test: `backend/tests/test_products_ingest.py` (create if it doesn't already exist —
  check first with `ls backend/tests/test_products_ingest.py`; if a test file for this
  module already exists under a different name, extend that one instead)

**Interfaces:**
- Consumes: nothing new — reads the same CSV columns already read
  (`row.get("primary_category")` replaced by `row.get("primary_category")` +
  `row.get("tertiary_category")`).
- Produces: `def map_tertiary_category(tertiary_category: str | None) -> str` — pure
  function, the rubric-category mapping table below. Called from `normalize_rows`.

- [ ] **Step 1: Write the failing test for the mapping function**

```python
# backend/tests/test_products_ingest.py (new file, or extend if one already exists
# under a different name for this module — check first)
from app.services.admin.ingest.products import map_tertiary_category


def test_map_tertiary_category_maps_known_skincare_types() -> None:
    assert map_tertiary_category("Face Wash & Cleansers") == "Face Wash"
    assert map_tertiary_category("Moisturizers") == "Moisturizer"
    assert map_tertiary_category("Face Sunscreen") == "Sunscreen"
    assert map_tertiary_category("Body Sunscreen") == "Sunscreen"
    assert map_tertiary_category("Face Serums") == "Serum"
    assert map_tertiary_category("Toners") == "Toner"
    assert map_tertiary_category("Face Masks") == "Face Masks"
    assert map_tertiary_category("Sheet Masks") == "Face Masks"
    assert map_tertiary_category("Eye Masks") == "Face Masks"
    assert map_tertiary_category("Blemish & Acne Treatments") == "Treatment Products"
    assert map_tertiary_category("Anti-Aging") == "Treatment Products"
    assert map_tertiary_category("Facial Peels") == "Treatment Products"
    assert map_tertiary_category("Exfoliators") == "Treatment Products"
    assert map_tertiary_category("Eye Creams & Treatments") == "Treatment Products"
    assert map_tertiary_category("Night Creams") == "Moisturizer"


def test_map_tertiary_category_returns_uncategorized_for_unmapped_or_missing_types() -> None:
    # Real dataset values that don't cleanly map to any of the 7 rubric categories -
    # never guessed (AGENTS.md §0.2).
    assert map_tertiary_category("Face Oils") == "uncategorized"
    assert map_tertiary_category("Mists & Essences") == "uncategorized"
    assert map_tertiary_category("Beauty Supplements") == "uncategorized"
    assert map_tertiary_category(None) == "uncategorized"
    assert map_tertiary_category("Some Brand New Type Not In The Table") == "uncategorized"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -v`
Expected: FAIL with `ImportError` (`map_tertiary_category` doesn't exist yet).

- [ ] **Step 3: Implement the mapping function**

Add to `backend/app/services/admin/ingest/products.py` (near the top, after imports):

```python
# Real dataset values (training_dataset/raw/sephora/product_info.csv's
# `tertiary_category` column, Skincare-primary-category rows only) mapped to
# MILESTONE 3.pdf Step 2's 7 literal catalog categories. Anything not listed here
# gets "uncategorized" rather than a guessed category (AGENTS.md §0.2) - this table
# was built by inspecting the real column's actual value distribution, not invented.
_TERTIARY_CATEGORY_MAP: dict[str, str] = {
    "Face Wash & Cleansers": "Face Wash",
    "Moisturizers": "Moisturizer",
    "Night Creams": "Moisturizer",
    "Face Sunscreen": "Sunscreen",
    "Body Sunscreen": "Sunscreen",
    "Face Serums": "Serum",
    "Toners": "Toner",
    "Face Masks": "Face Masks",
    "Sheet Masks": "Face Masks",
    "Eye Masks": "Face Masks",
    "Blemish & Acne Treatments": "Treatment Products",
    "Anti-Aging": "Treatment Products",
    "Facial Peels": "Treatment Products",
    "Exfoliators": "Treatment Products",
    "Eye Creams & Treatments": "Treatment Products",
}


def map_tertiary_category(tertiary_category: str | None) -> str:
    if tertiary_category is None:
        return "uncategorized"
    return _TERTIARY_CATEGORY_MAP.get(tertiary_category, "uncategorized")
```

- [ ] **Step 4: Wire the mapping into `normalize_rows`, restricted to Skincare rows**

In `normalize_rows` (same file), change the category line
(`"category": _safe_str(row.get("primary_category")) or None,`) to:

```python
"category": map_tertiary_category(_safe_str(row.get("tertiary_category")) or None),
```

And add a Skincare-only filter at the top of the row-iteration loop (right after
`for _, row in df.iterrows():`), rejecting non-skincare rows the same way missing-field
rows are already rejected:

```python
        if _safe_str(row.get("primary_category")) != "Skincare":
            rejected.append({"row": row.to_dict(), "reason": "not a skincare product"})
            continue
```

(Place this check before the existing `brand_name`/`product_name`/`price_raw`
mandatory-field check, so a non-skincare row is rejected for the right stated reason
even if it also happens to be missing a mandatory field.)

- [ ] **Step 5: Run the mapping test again, then the full ingest test suite**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -v`
Expected: PASS (both tests).

Run: `cd backend && uv run pytest -q` (full suite — confirm the Skincare-only filter
and new category values don't break any existing ingest test that asserted on the old
`primary_category`-based behavior; if one does, update it the same way Task 1 updated
category-string tests — it's testing stale behavior, not catching a real regression).

- [ ] **Step 6: Run the real ingest against the live stack**

Run: `cd backend && uv run python -m app.services.admin.ingest.products`
(equivalent to `make ingest-products` from repo root)
Expected: a real ingest report written (check the function `write_ingest_report`'s
output path in the same file for where — paste its summary: total rows processed,
accepted count, rejected count and reasons breakdown). Loads roughly ~2,400 Skincare
rows through the accept/reject gates (exact accepted count depends on how many pass
the existing `brand_name`/`product_name`/`price` mandatory-field + dedupe gates - paste
whatever the real number is, don't guess it in advance).

Then verify against the live DB:
```bash
docker exec ai-skin-intelligence-personalized-skincare-planner--postgres-1 \
  psql -U skinlytics -d skinlytics -c "SELECT category, count(*) FROM products GROUP BY category ORDER BY count(*) DESC;"
```
Expected: the 7 rubric categories plus `uncategorized` and the original 16 seed
products' categories, all present with real counts — paste this output into your
report.

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/admin/ingest/products.py backend/tests/test_products_ingest.py
git commit -m "fix(ingest): map real Sephora tertiary_category to rubric categories, Skincare-only, then run it"
```

(The ingest itself is a live-database side effect, not a file change — nothing else
to `git add` for the data load itself. Note in your task report that the ingest ran
against the live docker-compose Postgres, not a throwaway.)

---

### Task 3: Config-driven recommendation weights (50/35/15)

**Files:**
- Modify: `backend/app/services/recommendations/models.py` (add `RecommendationWeights`)
- Create: `backend/app/migrations/versions/<new>_add_recommendation_weights.py`
- Modify: `database_schemas/skinlytics_postgresql_schema_v3.sql` (mirror + seed INSERT,
  near the `scoring_weights`/`ingredient_safety_config` blocks)
- Modify: `backend/app/services/recommendations/service.py` (add
  `get_active_recommendation_weights`)
- Test: `backend/tests/test_recommendations_service.py`

**Interfaces:**
- Produces: `RecommendationWeights` model (`recommendation_weights` table):
  `weight_id: int`, `concern_weight: float`, `skin_type_fit_weight: float`,
  `rating_weight: float`, `is_active: bool | None`, `created_at: datetime | None`.
- Produces: `async def get_active_recommendation_weights(db: AsyncSession) ->
  RecommendationWeights` — raises `ValueError` if no active row (mirrors
  `scores/service.py:44-49`'s `get_active_weights` and Phase 1's
  `get_active_safety_config` exactly — read both for the pattern before writing this).

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_recommendations_service.py, add:
from app.services.recommendations.service import get_active_recommendation_weights


async def test_get_active_recommendation_weights_returns_the_seeded_active_row(
    db_session: AsyncSession,
) -> None:
    weights = await get_active_recommendation_weights(db_session)

    assert weights.is_active is True
    total = (
        float(weights.concern_weight)
        + float(weights.skin_type_fit_weight)
        + float(weights.rating_weight)
    )
    assert abs(total - 1.00) < 0.001
    assert float(weights.concern_weight) == 0.50
    assert float(weights.skin_type_fit_weight) == 0.35
    assert float(weights.rating_weight) == 0.15
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_recommendations_service.py::test_get_active_recommendation_weights_returns_the_seeded_active_row -v`
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Add the model**

Add to `backend/app/services/recommendations/models.py` (this file already has
`Product`/`ProductConcern`/etc. — add this alongside them, import
`CheckConstraint, Index, Numeric, text` from `sqlalchemy` if not already imported,
check the file's existing imports first before adding a duplicate):

```python
class RecommendationWeights(Base):
    """Config-driven Suitability Scoring weights (MILESTONE 3.pdf Step 2) - same
    philosophy as scores/models.py's ScoringWeights and ingredients/models.py's
    IngredientSafetyConfig (M3R Phase 1): retuning is a DB update, not a deploy."""

    __tablename__ = "recommendation_weights"
    __table_args__ = (
        CheckConstraint(
            "concern_weight + skin_type_fit_weight + rating_weight = 1.00",
            name="chk_recommendation_weights_sum",
        ),
        Index(
            "uq_recommendation_weights_one_active",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )

    weight_id: Mapped[int] = mapped_column(primary_key=True)
    concern_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.50)
    skin_type_fit_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.35)
    rating_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.15)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
```

(Add `import datetime` at the top if the file doesn't already import it — check first.)

- [ ] **Step 4: Generate and edit the migration**

Run: `cd backend && uv run alembic revision -m "add recommendation weights"`

Fill in `upgrade`/`downgrade` following Phase 1's
`75e0940c0f36_add_ingredient_safety_config.py` exactly as a style template (same
table-creation shape, same partial-unique-index shape, same seed-row `op.execute`):

```python
def upgrade() -> None:
    op.create_table(
        "recommendation_weights",
        sa.Column("weight_id", sa.Integer(), primary_key=True),
        sa.Column("concern_weight", sa.Numeric(4, 2), nullable=False, server_default="0.50"),
        sa.Column("skin_type_fit_weight", sa.Numeric(4, 2), nullable=False, server_default="0.35"),
        sa.Column("rating_weight", sa.Numeric(4, 2), nullable=False, server_default="0.15"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.CheckConstraint(
            "concern_weight + skin_type_fit_weight + rating_weight = 1.00",
            name="chk_recommendation_weights_sum",
        ),
    )
    op.create_index(
        "uq_recommendation_weights_one_active",
        "recommendation_weights",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )
    op.execute(
        "INSERT INTO recommendation_weights "
        "(concern_weight, skin_type_fit_weight, rating_weight, is_active) "
        "VALUES (0.50, 0.35, 0.15, TRUE)"
    )


def downgrade() -> None:
    op.drop_index("uq_recommendation_weights_one_active", table_name="recommendation_weights")
    op.drop_table("recommendation_weights")
```

Run: `cd backend && uv run alembic upgrade head`
Expected: applies cleanly.

- [ ] **Step 5: Mirror the canonical SQL doc**

Add to `database_schemas/skinlytics_postgresql_schema_v3.sql`, right after the
`ingredient_safety_config` table Phase 1 added (search for it, don't guess the line
number):

```sql
CREATE TABLE recommendation_weights (
    weight_id SERIAL PRIMARY KEY,
    concern_weight DECIMAL(4,2) NOT NULL DEFAULT 0.50,
    skin_type_fit_weight DECIMAL(4,2) NOT NULL DEFAULT 0.35,
    rating_weight DECIMAL(4,2) NOT NULL DEFAULT 0.15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_recommendation_weights_sum CHECK (
        concern_weight + skin_type_fit_weight + rating_weight = 1.00
    )
);
CREATE UNIQUE INDEX uq_recommendation_weights_one_active ON recommendation_weights (is_active) WHERE is_active = true;
```

And the seed INSERT next to the existing `scoring_weights`/`ingredient_safety_config`
seed inserts:

```sql
INSERT INTO recommendation_weights (concern_weight, skin_type_fit_weight, rating_weight, is_active)
VALUES (0.50, 0.35, 0.15, TRUE);
```

- [ ] **Step 6: Add the service getter**

Add to `backend/app/services/recommendations/service.py` (add
`RecommendationWeights` to the existing models import):

```python
async def get_active_recommendation_weights(db: AsyncSession) -> RecommendationWeights:
    result = await db.execute(
        select(RecommendationWeights).where(RecommendationWeights.is_active.is_(True))
    )
    weights = result.scalars().first()
    if weights is None:
        raise ValueError("No active recommendation_weights row — seed data is missing")
    return weights
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_recommendations_service.py::test_get_active_recommendation_weights_returns_the_seeded_active_row -v`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/app/services/recommendations/models.py backend/app/migrations/versions/ \
  database_schemas/skinlytics_postgresql_schema_v3.sql backend/app/services/recommendations/service.py \
  backend/tests/test_recommendations_service.py
git commit -m "feat(recommendations): add config-driven 50/35/15 suitability weights table"
```

---

### Task 4: Rewrite scoring to the literal 3-factor formula, per-category top-K

**Files:**
- Modify: `backend/app/ai/schemas.py` (`RecommendationFeatures`)
- Modify: `backend/app/ai/recommender.py` (`ContentBasedRecommender.score`)
- Modify: `backend/app/services/recommendations/service.py` (`get_recommendations`'s
  ranking stage)
- Test: `backend/tests/test_recommendations_service.py`,
  `backend/tests/test_ai_recommender.py` if it exists (check first: `ls
  backend/tests/test_ai_recommender.py` or similar — search
  `grep -rl ContentBasedRecommender backend/tests/`)

**Interfaces:**
- Consumes: `get_active_recommendation_weights` (Task 3).
- Produces: `RecommendationFeatures` reduced to exactly `concern_overlap: float,
  skin_type_fit: float, rating_norm: float` (renamed from `suitability` to
  `skin_type_fit` for literal-rubric clarity — same underlying signal, the existing
  per-product suitability aggregate already measures "how well this fits your skin
  type/allergies/sensitivities"). `ContentBasedRecommender.score(features, *,
  concern_weight: float, skin_type_fit_weight: float, rating_weight: float) -> float`
  — weights passed in by the caller (same "weights passed in, not imported" pattern
  `scores/scoring_engine.py` already documents), never read from the DB inside `app/ai/`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_recommendations_service.py, add (or a new
# backend/tests/test_ai_recommender.py if a recommender-specific test file already
# exists separately from the service-level one — check first with the grep above):
from app.ai.recommender import ContentBasedRecommender
from app.ai.schemas import RecommendationFeatures


def test_content_based_recommender_applies_the_literal_50_35_15_formula() -> None:
    recommender = ContentBasedRecommender()
    features = RecommendationFeatures(concern_overlap=1.0, skin_type_fit=1.0, rating_norm=1.0)

    score = recommender.score(
        features, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )

    assert score == 100.0


def test_content_based_recommender_weights_concern_match_highest() -> None:
    recommender = ContentBasedRecommender()
    concern_only = RecommendationFeatures(concern_overlap=1.0, skin_type_fit=0.0, rating_norm=0.0)
    fit_only = RecommendationFeatures(concern_overlap=0.0, skin_type_fit=1.0, rating_norm=0.0)

    concern_score = recommender.score(
        concern_only, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )
    fit_score = recommender.score(
        fit_only, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )

    assert concern_score > fit_score  # 50 > 35
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest -k content_based_recommender -v`
Expected: FAIL (`RecommendationFeatures` doesn't accept `skin_type_fit` yet;
`score()` doesn't accept weight kwargs yet).

- [ ] **Step 3: Update `RecommendationFeatures`**

In `backend/app/ai/schemas.py`, replace:
```python
class RecommendationFeatures(BaseModel):
    suitability: float
    concern_overlap: float
    vector_similarity: float
    rating_norm: float
    price_fit: float
    popularity_norm: float
```
with:
```python
class RecommendationFeatures(BaseModel):
    """Stage-4 rank inputs (MILESTONE 3.pdf Step 2's literal 3-factor formula,
    M3R Phase 2) — every field pre-normalized to [0, 1] by the caller (service.py).
    `skin_type_fit` reuses the same per-product suitability aggregate the pipeline
    already computed (how well this product's ingredients fit the user's skin type,
    allergies, and sensitivities) - renamed from `suitability` for literal-rubric
    clarity, not a new signal. `vector_similarity`/`price_fit`/`popularity_norm` are
    dropped from ranking per the rubric's exact 3-factor requirement - price becomes
    a separate hard budget-cap gate (service.py), not a ranking weight; vector
    similarity and popularity remain used elsewhere (products_service.py's
    alternatives lookup) but no longer feed the primary recommendation score."""

    concern_overlap: float
    skin_type_fit: float
    rating_norm: float
```

- [ ] **Step 4: Update `ContentBasedRecommender.score`**

In `backend/app/ai/recommender.py`, replace the whole file's body (delete the module-
level `_WEIGHT_*` constants entirely — they're replaced by caller-supplied weights):

```python
from app.ai.schemas import RecommendationFeatures


class ContentBasedRecommender:
    """The stage-4 rank step (MILESTONE 3.pdf Step 2) - see app/ai/schemas.py's
    `Recommender` Protocol docstring for why this has no stub/ranker split. Weights
    are passed in by the caller (recommendations/service.py, reading the active
    `recommendation_weights` row), never imported as module constants - same
    pattern scores/scoring_engine.py already documents for its own weighted sum."""

    def score(
        self,
        features: RecommendationFeatures,
        *,
        concern_weight: float,
        skin_type_fit_weight: float,
        rating_weight: float,
    ) -> float:
        raw = (
            concern_weight * features.concern_overlap
            + skin_type_fit_weight * features.skin_type_fit
            + rating_weight * features.rating_norm
        )
        return round(raw * 100, 1)
```

- [ ] **Step 5: Update the `Recommender` Protocol in `app/ai/schemas.py`**

Update the `Recommender` Protocol's `score` method signature to match:
```python
class Recommender(Protocol):
    def score(
        self,
        features: RecommendationFeatures,
        *,
        concern_weight: float,
        skin_type_fit_weight: float,
        rating_weight: float,
    ) -> float: ...
```

- [ ] **Step 6: Update `get_recommendations`'s ranking stage**

In `backend/app/services/recommendations/service.py`'s `get_recommendations`
function: delete stage 2 (vector similarity/FAISS lookup) and stage 3 (budget
preference) entirely from the ranking computation — vector similarity and budget move
out of the score formula per this task's scope (budget becomes Task 5's hard-cap
gate, separate from ranking). Fetch weights once before the ranking loop:
`weights = await get_active_recommendation_weights(db)`. In the ranking loop, replace
the `RecommendationFeatures(...)` construction and `_recommender.score(features)`
call with:

```python
        features = RecommendationFeatures(
            concern_overlap=concern_overlap,
            skin_type_fit=agg.score,
            rating_norm=rating_norm,
        )
        match_score = _recommender.score(
            features,
            concern_weight=float(weights.concern_weight),
            skin_type_fit_weight=float(weights.skin_type_fit_weight),
            rating_weight=float(weights.rating_weight),
        )
```

Delete the now-unused `price = float(product.price) if product.price is not None
else None`, `popularity_norm = ...`, `_get_budget_preference`, `_price_fit`, and
`max_review_count` lines/functions from this file — they're not used by anything
else in this module (confirm with a grep for each name before deleting: `grep -n
"_price_fit\|_get_budget_preference\|popularity_norm\|max_review_count"
backend/app/services/recommendations/service.py` — if any has a second caller
outside `get_recommendations`, keep it and flag as a concern in your report instead
of guessing). Also delete the now-dead `vector_db`/`math` imports at the top of the
file if nothing else in it uses them (`math.log1p` was only for `popularity_norm`;
`vector_db` was only for stage 2 — grep to confirm before removing).

Change the **per-category top-K restructure**: replace the module-level `_TOP_N = 3`
constant with `_TOP_PER_CATEGORY = 1`, and change the final ranking/serving logic
from "sort all candidates together, take global top N" to "group ranked candidates
by `product.category`, take the top `_TOP_PER_CATEGORY` within each category, across
all categories that have at least one surviving candidate." Keep the existing
deterministic tiebreak (`product_id` descending) within each category's group.

- [ ] **Step 7: Update the existing ranking-order test for the new per-category shape**

`test_recommendations_are_ranked_highest_match_score_first`
(`backend/tests/test_recommendations_service.py`) currently asserts `len(results) <=
3` (the old global top-3). Update it to reflect per-category top-1: assert instead
that results are grouped one-per-category (no two results share the same
`product.category`) and that `match_score`s within the returned set are individually
plausible (each `>= 0` and `<= 100`) - don't assert a single global sort order across
categories anymore, since results from different categories aren't meant to be
compared against each other for ordering purposes.

- [ ] **Step 8: Run the full backend suite**

Run: `cd backend && uv run pytest -q`
Expected: all green. Investigate and fix (don't skip) any other test that silently
depended on the old 6-factor formula, the old `_TOP_N = 3` global-list shape, or the
old `RecommendationFeatures` field names — these are real coupling points this task's
rewrite is expected to touch, not flakes.

- [ ] **Step 9: Commit**

```bash
git add backend/app/ai/schemas.py backend/app/ai/recommender.py \
  backend/app/services/recommendations/service.py backend/tests/test_recommendations_service.py
git commit -m "feat(recommendations): rewrite scoring to the literal 50/35/15 formula, per-category top-1"
```

---

### Task 5: Budget hard-cap + alternative substitution + categorized response reshape

**Files:**
- Modify: `backend/app/services/recommendations/schemas.py` (`RecommendationRead`)
- Modify: `backend/app/services/recommendations/service.py` (budget-cap
  post-processing + `get_recommendations` signature)
- Modify: `backend/app/services/recommendations/router.py` (`max_price` query param)
- Modify: `docs/milestones/milestone_3/M3R_API_CONTRACT.md` (§2 — the "Contract
  refinement" note at the top of this plan)
- Test: `backend/tests/test_recommendations_service.py`,
  `backend/tests/test_recommendations_router.py`

**Interfaces:**
- Consumes: `list_avoided_ingredient_product_ids`, `list_concern_ids_for_products`,
  `list_ingredient_categories_for_products` (all already exist in
  `recommendations/service.py`, reused here for the budget-alternative lookup and the
  active-ingredient-tags field — don't reimplement any of them).
- Produces: `RecommendationRead` gains `match_percentage: int` (replaces
  `match_score: float`), `active_ingredient_tags: list[str]`, `over_budget: bool`,
  `alternative_for_product_id: int | None`. `get_recommendations(db, user_id, *,
  max_price: float | None = None)`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_recommendations_service.py, add:
async def test_recommendation_read_carries_match_percentage_and_active_ingredient_tags(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=8, priority_level=8)],
        ),
    )

    results = await get_recommendations(db_session, test_user_id)

    assert len(results) > 0
    for r in results:
        assert 0 <= r.match_percentage <= 100
        assert isinstance(r.active_ingredient_tags, list)
        assert r.over_budget is False  # no max_price given
        assert r.alternative_for_product_id is None


async def test_over_budget_top_match_is_flagged_and_gets_a_cheaper_alternative(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """Real seeded product fixture, no mocks - same pattern as
    test_an_allergy_flagged_product_can_never_appear_in_recommendations above.
    Creates a same-category cheaper product so a real substitute exists, then caps
    the budget below the top-ranked candidate's real seeded price."""
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )

    # First run uncapped to find which product/category actually wins today's
    # ranking and its real price - don't hardcode a price, read it from the live
    # seeded catalog so this test doesn't silently rot if seed data changes.
    uncapped = await get_recommendations(db_session, test_user_id, max_price=None)
    assert len(uncapped) > 0
    target = uncapped[0]
    real_price = float(target.product.price)
    cheap_cap = real_price - 1.0
    assert cheap_cap > 0, "seeded fixture must have a real positive price to cap under"

    capped = await get_recommendations(db_session, test_user_id, max_price=cheap_cap)

    matching_entries = [r for r in capped if r.product.product_id == target.product.product_id]
    assert len(matching_entries) == 1
    assert matching_entries[0].over_budget is True
    alternatives = [
        r for r in capped if r.alternative_for_product_id == target.product.product_id
    ]
    # An alternative is only guaranteed if the seeded catalog has another product in
    # the same category under the cap - assert the flagging behavior always, and the
    # alternative's presence only if one plausibly exists (same category, cheaper).
    if alternatives:
        assert float(alternatives[0].product.price) <= cheap_cap
        assert alternatives[0].over_budget is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest -k "match_percentage or over_budget" -v`
Expected: FAIL (`match_percentage`/`active_ingredient_tags`/`over_budget`/
`alternative_for_product_id` don't exist on `RecommendationRead` yet; `max_price`
isn't an accepted kwarg yet).

- [ ] **Step 3: Update `RecommendationRead`**

In `backend/app/services/recommendations/schemas.py`, replace:
```python
class RecommendationRead(BaseModel):
    product: ProductRead
    match_score: float
    reasons: list[str]
```
with:
```python
class RecommendationRead(BaseModel):
    product: ProductRead
    match_percentage: int
    reasons: list[str]
    active_ingredient_tags: list[str]
    over_budget: bool
    alternative_for_product_id: int | None
```

- [ ] **Step 4: Wire `active_ingredient_tags` and the new field defaults into the ranking stage**

Back in `get_recommendations` (Task 4 already restructured this loop): call
`ingredient_categories = await list_ingredient_categories_for_products(db,
[p.product_id for p in products])` once before the ranking loop (same batching
pattern as `product_concerns`, already fetched the same way). In the loop, build each
`RecommendationRead` with `active_ingredient_tags=sorted(set(ingredient_categories.get(
product.product_id, [])))`, `match_percentage=round(match_score)` (renaming from the
raw float; the recommender's `score()` already returns a 0-100-scaled float per Task
4's formula, so this is a rename + rounding, not new math), `over_budget=False`,
`alternative_for_product_id=None` (both defaulted here, set for real in Step 5 below).

- [ ] **Step 5: Restructure the cache-hit path so `profile` is always in scope**

Today, `get_recommendations` checks the Redis cache and returns immediately on a
hit, *before* fetching `profile` — so `profile`/`concern_ids` aren't available yet at
that point. The budget cap needs them regardless of whether results came from cache
or a fresh computation, so move the profile fetch (and the `concern_ids` line right
after it) to the top of the function, before the cache check:

```python
async def get_recommendations(
    db: AsyncSession, user_id: str, *, max_price: float | None = None
) -> list[RecommendationRead]:
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        return []
    concern_ids = {c.concern_id for c in profile.concerns}

    redis = get_redis()
    cache_key = f"recommendation:cache:{user_id}"
    cached = await redis.get(cache_key)
    if cached:
        results = [RecommendationRead.model_validate(item) for item in json.loads(cached)]
    else:
        # ... existing stage-1/stage-4/stage-5 body goes here, unchanged, EXCEPT:
        # delete the now-duplicate `profile = ...`/`if profile is None: return []`/
        # `concern_ids = ...` lines it used to start with (moved above already).
        ...
        results = [...]  # the list built in Step 6/existing code

    if max_price is not None:
        results = await _apply_budget_cap(db, results, max_price, profile, concern_ids)
    return results
```

(This is a real behavior change worth noting in your report: previously a cached
result could still be returned even if the user's profile had since been deleted;
now a deleted profile returns `[]` unconditionally, which is more correct — flag this
as an intentional side effect, not a bug, if you notice it.)

- [ ] **Step 6: Implement `_apply_budget_cap`**

Add this function to `backend/app/services/recommendations/service.py` (all imports
it needs — `select`, `Product`, `ProductRead`, `list_avoided_ingredient_product_ids`,
`list_concern_ids_for_products` — already exist in this file, don't add new ones):

```python
async def _apply_budget_cap(
    db: AsyncSession,
    results: list[RecommendationRead],
    max_price: float,
    profile: SkinProfileRead,
    concern_ids: set[int],
) -> list[RecommendationRead]:
    """Hard cap (MILESTONE 3.pdf Step 2 "Budget Optimization & Alternatives") - a
    top match over `max_price` is flagged, and the cheapest same-category candidate
    under the cap with the most concern overlap is added alongside it as a real,
    never-fabricated substitute. Reuses the same avoid-filter every other stage of
    this pipeline already applies (list_avoided_ingredient_product_ids) - this is
    not a rebuild of products_service.py's get_alternatives (that function finds a
    similarly-*priced* substitute via a +/-30% band; this needs a substitute
    strictly *under* a hard cap, a different filter, hence a separate small query
    here rather than reusing that function's band logic)."""
    avoided_product_ids = await list_avoided_ingredient_product_ids(db, profile.skin_type_id)
    existing_product_ids = {r.product.product_id for r in results}
    augmented: list[RecommendationRead] = list(results)

    for entry in results:
        price = entry.product.price
        if price is None or float(price) <= max_price:
            continue
        entry.over_budget = True

        candidates_result = await db.execute(
            select(Product).where(
                Product.category == entry.product.category,
                Product.product_id.notin_(existing_product_ids),
                Product.is_active.is_(True),
                Product.price.isnot(None),
                Product.price <= max_price,
            )
        )
        candidates = [
            c
            for c in candidates_result.scalars().all()
            if c.product_id not in avoided_product_ids
        ]
        if not candidates:
            continue

        candidate_concerns = await list_concern_ids_for_products(
            db, [c.product_id for c in candidates]
        )

        def _overlap_count(product_id: int) -> int:
            return len(
                [cid for cid in candidate_concerns.get(product_id, []) if cid in concern_ids]
            )

        best = max(candidates, key=lambda c: (_overlap_count(c.product_id), -float(c.price)))
        best_overlap = _overlap_count(best.product_id)
        match_percentage = round((best_overlap / len(concern_ids)) * 100) if concern_ids else 50

        augmented.append(
            RecommendationRead(
                product=ProductRead.model_validate(best),
                match_percentage=match_percentage,
                reasons=[f"Cheaper alternative under your ${max_price:.2f} budget"],
                active_ingredient_tags=[],
                over_budget=False,
                alternative_for_product_id=entry.product.product_id,
            )
        )
        existing_product_ids.add(best.product_id)

    return augmented
```

- [ ] **Step 7: Add the router's `max_price` query param**

In `backend/app/services/recommendations/router.py`:
```python
@router.get("/recommendations/me")
async def get_my_recommendations(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    max_price: Annotated[float | None, Query(gt=0)] = None,
) -> list[RecommendationRead]:
    return await service.get_recommendations(db, user["id"], max_price=max_price)
```
(Add `Query` to the existing `fastapi` import line.)

- [ ] **Step 8: Regenerate OpenAPI types**

Run: `make openapi`
Expected: `web/lib/api-types.ts` picks up the new `max_price` param and
`RecommendationRead` shape; check the diff is scoped to this endpoint's types.

- [ ] **Step 9: Fix `M3R_API_CONTRACT.md` §2 to match what was actually built**

Update the example JSON to drop the redundant top-level `category` field (per this
plan's "Contract refinement" note) and confirm `match_percentage`,
`active_ingredient_tags`, `over_budget`, `alternative_for_product_id` field names
match exactly what Step 3 built. Note the per-category top-1 behavior (replacing
"categorized recs" ambiguity with the concrete rule: one best match per category).

- [ ] **Step 10: Run tests to verify they pass, then the full gate**

Run: `cd backend && uv run pytest -k "match_percentage or over_budget" -v`
Expected: PASS.

Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q`
Expected: all green.

- [ ] **Step 11: Commit**

```bash
git add backend/app/services/recommendations/schemas.py backend/app/services/recommendations/service.py \
  backend/app/services/recommendations/router.py web/lib/api-types.ts \
  docs/milestones/milestone_3/M3R_API_CONTRACT.md backend/tests/test_recommendations_service.py \
  backend/tests/test_recommendations_router.py
git commit -m "feat(recommendations): budget hard-cap with alternative substitution, categorized response shape"
```

---

### Task 6: Full gate + docs/ledger close-out

**Files:**
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`
- Modify: `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md` (correct the "8,464-product
  catalog" framing now that the real ingest ran)

- [ ] **Step 1: Run the full gate**

Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q`
Run: `cd web && npm run typecheck && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 2: Update the ledger**

Change `M3R-P2-T1` through `M3R-P2-T6` from `TODO`/`DONE` (T2 was already DONE per
P0's gap analysis, don't re-mark it) to `DONE` with evidence: real ingested product
count by category (from Task 2's live-DB query), the migration revision id (Task 3),
the endpoint's new response shape, and real test names.

- [ ] **Step 3: Correct the gap-analysis doc's catalog-size claim**

In `M3R_GAP_ANALYSIS.md` §2, update the "real 8,464-product Sephora catalog" language
to reflect what's actually true after this phase: the raw CSV has 8,494 rows total
across all Sephora product lines, of which the real *Skincare*-only ingest loaded
[N] products (the real number from Task 2's ingest report) across the 7 rubric
categories plus `uncategorized`.

- [ ] **Step 4: Commit**

```bash
git add docs/milestones/milestone_3/M3R_TASK_LEDGER.md docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md
git commit -m "docs(m3r): close P2 ledger rows - recommendation engine rebuilt to rubric spec"
```

---

---

### Task 7: Populate `product_skin_types`/`product_concerns` for the real ingested catalog

**Why this exists:** the final whole-branch review (after Task 6) found that
`load_into_database` (Task 2) never wrote `product_skin_types`/`product_concerns` —
so `list_products_for_skin_type` (an INNER JOIN on `product_skin_types`) can only
ever see the 16 original hand-seeded products. The 2,409 real ingested products are
invisible to `get_recommendations` end-to-end: at most 4 of the 7 categories can
ever appear, no matter the user's profile. This was a genuine plan gap, not a task
deviation — the original plan never asked for this. Confirmed fixable with real,
non-fabricated data: the raw CSV's `highlights` column (already downloaded, already
read during this investigation) has exactly 6 distinct real skin-type phrases and
10 distinct real concern phrases across the 2,420 Skincare rows — a genuine signal,
not free text to be guessed at.

**Files:**
- Modify: `backend/app/services/admin/ingest/products.py`
- Test: `backend/tests/test_products_ingest.py`

**Interfaces:**
- Produces: `def parse_highlights(highlights_raw: str | None) -> tuple[list[str], list[str]]`
  — returns `(skin_type_names, concern_names)`, both real seeded-table name strings
  (`skin_types.skin_type_name` / `skin_concerns.concern_name`), never invented ones.
- Produces: `async def load_product_associations(db: AsyncSession, products:
  list[dict[str, Any]]) -> tuple[int, int]` — returns `(skin_type_rows_created,
  concern_rows_created)`. Idempotent (check-then-insert on `(product_id,
  skin_type_id)` / `(product_id, concern_id)`), safe to re-run against
  already-associated products.
- Modifies: `normalize_rows` to add `skin_type_names`/`concern_names` keys to every
  accepted product dict. Modifies: `run()` to call `load_product_associations` after
  `load_into_database`.

**Real mapping tables (from this investigation's actual CSV inspection — use verbatim,
do not add or guess additional entries):**

Skin type highlight phrases (all 6 that exist in the real data map cleanly onto the
5 real seeded `skin_types.skin_type_name` values — no "Sensitive" phrase exists in
this dataset at all; Sensitive-skin association for these products is honestly left
empty here, not guessed):
```python
_SKIN_TYPE_HIGHLIGHT_MAP: dict[str, list[str]] = {
    "Best for Combination Skin": ["Combination"],
    "Best for Dry Skin": ["Dry"],
    "Best for Dry, Combo, Normal Skin": ["Dry", "Combination", "Normal"],
    "Best for Normal Skin": ["Normal"],
    "Best for Oily Skin": ["Oily"],
    "Best for Oily, Combo, Normal Skin": ["Oily", "Combination", "Normal"],
}
```

Concern highlight phrases (only 6 of the real dataset's 10 distinct phrases map
cleanly onto the 10 real seeded `skin_concerns.concern_name` values — "Good for:
Damage", "Good for: Dark Circles", "Good for: Loss of firmness", "Good for: Pores"
have no clean match among the seeded concerns and are deliberately left unmapped,
never guessed at, per AGENTS.md §0.2):
```python
_CONCERN_HIGHLIGHT_MAP: dict[str, list[str]] = {
    "Good for: Acne/Blemishes": ["Acne"],
    "Good for: Anti-Aging": ["Wrinkles", "Fine Lines"],
    "Good for: Dark spots": ["Dark Spots"],
    "Good for: Dryness": ["Dry Skin"],
    "Good for: Dullness/Uneven Texture": ["Uneven Skin Tone"],
    "Good for: Redness": ["Redness"],
}
```

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_products_ingest.py, add:
from app.services.admin.ingest.products import parse_highlights


def test_parse_highlights_maps_real_skin_type_and_concern_phrases() -> None:
    raw = "['Vegan', 'Best for Oily, Combo, Normal Skin', 'Good for: Acne/Blemishes']"

    skin_types, concerns = parse_highlights(raw)

    assert skin_types == ["Combination", "Normal", "Oily"]
    assert concerns == ["Acne"]


def test_parse_highlights_ignores_unmapped_phrases_and_none() -> None:
    assert parse_highlights(None) == ([], [])
    assert parse_highlights("['Vegan', 'Good for: Pores']") == ([], [])


def test_parse_highlights_handles_malformed_input_gracefully() -> None:
    assert parse_highlights("not a python list literal") == ([], [])
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -k parse_highlights -v`
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `parse_highlights`**

Add to `backend/app/services/admin/ingest/products.py` (add `import ast` to the
existing imports, alongside `json`/`re`):

```python
_SKIN_TYPE_HIGHLIGHT_MAP: dict[str, list[str]] = {
    "Best for Combination Skin": ["Combination"],
    "Best for Dry Skin": ["Dry"],
    "Best for Dry, Combo, Normal Skin": ["Dry", "Combination", "Normal"],
    "Best for Normal Skin": ["Normal"],
    "Best for Oily Skin": ["Oily"],
    "Best for Oily, Combo, Normal Skin": ["Oily", "Combination", "Normal"],
}

_CONCERN_HIGHLIGHT_MAP: dict[str, list[str]] = {
    "Good for: Acne/Blemishes": ["Acne"],
    "Good for: Anti-Aging": ["Wrinkles", "Fine Lines"],
    "Good for: Dark spots": ["Dark Spots"],
    "Good for: Dryness": ["Dry Skin"],
    "Good for: Dullness/Uneven Texture": ["Uneven Skin Tone"],
    "Good for: Redness": ["Redness"],
}


def parse_highlights(highlights_raw: str | None) -> tuple[list[str], list[str]]:
    """Real, non-fabricated mapping from the raw Sephora dataset's own
    `highlights` column (a Python-literal-repr'd list of strings) to this app's
    exact seeded skin_types.skin_type_name / skin_concerns.concern_name values.
    Any phrase not in the maps above contributes nothing - never guessed
    (AGENTS.md §0.2)."""
    if not highlights_raw:
        return [], []
    try:
        items = ast.literal_eval(highlights_raw)
    except (ValueError, SyntaxError):
        return [], []
    if not isinstance(items, list):
        return [], []

    skin_types: list[str] = []
    concerns: list[str] = []
    for item in items:
        if item in _SKIN_TYPE_HIGHLIGHT_MAP:
            skin_types.extend(_SKIN_TYPE_HIGHLIGHT_MAP[item])
        if item in _CONCERN_HIGHLIGHT_MAP:
            concerns.extend(_CONCERN_HIGHLIGHT_MAP[item])
    return sorted(set(skin_types)), sorted(set(concerns))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -k parse_highlights -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire into `normalize_rows`**

In `normalize_rows`, right after the existing `products.append({...})` block's
dict literal, add two new keys computed from `parse_highlights`:

```python
        skin_type_names, concern_names = parse_highlights(_safe_str(row.get("highlights")) or None)
        products.append(
            {
                "brand_name": brand_name,
                "product_name": product_name,
                "category": map_tertiary_category(_safe_str(row.get("tertiary_category")) or None),
                "product_url": _safe_str(row.get("product_url")) or None,
                "image_url": _safe_str(row.get("image_url")) or None,
                "price": float(price_raw),
                "currency": "USD",
                "volume_ml": volume_ml,
                "ingredients": _parse_ingredients(row.get("ingredients")),
                "rating": _safe_number(row.get("rating")),
                "review_count": int(reviews) if reviews is not None else None,
                "skin_type_names": skin_type_names,
                "concern_names": concern_names,
            }
        )
```

(This replaces the existing dict literal in place — keep every existing key exactly
as it is, only add the two new ones and the `skin_type_names, concern_names = ...`
line right before it.)

- [ ] **Step 6: Write the failing test for `load_product_associations`**

```python
# backend/tests/test_products_ingest.py, add:
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.admin.ingest.products import load_into_database, load_product_associations
from app.services.recommendations.models import ProductConcern, ProductSkinType


async def test_load_product_associations_creates_real_skin_type_and_concern_rows(
    db_session: AsyncSession,
) -> None:
    products = [
        {
            "brand_name": "Test Brand",
            "product_name": "Test Highlight Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 25.0,
            "currency": "USD",
            "volume_ml": None,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": ["Oily", "Combination"],
            "concern_names": ["Acne"],
        }
    ]
    await load_into_database(db_session, products)

    skin_type_created, concern_created = await load_product_associations(db_session, products)

    assert skin_type_created == 2
    assert concern_created == 1

    product_id = (
        await db_session.execute(
            select(Product.product_id).where(Product.product_name == "Test Highlight Product")
        )
    ).scalar_one()
    linked_skin_types = (
        (
            await db_session.execute(
                select(ProductSkinType.skin_type_id).where(ProductSkinType.product_id == product_id)
            )
        )
        .scalars()
        .all()
    )
    assert len(linked_skin_types) == 2


async def test_load_product_associations_is_idempotent(db_session: AsyncSession) -> None:
    products = [
        {
            "brand_name": "Test Brand 2",
            "product_name": "Test Idempotent Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 25.0,
            "currency": "USD",
            "volume_ml": None,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": ["Oily"],
            "concern_names": [],
        }
    ]
    await load_into_database(db_session, products)
    await load_product_associations(db_session, products)

    skin_type_created, concern_created = await load_product_associations(db_session, products)

    assert skin_type_created == 0
    assert concern_created == 0
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -k load_product_associations -v`
Expected: FAIL with `ImportError`.

- [ ] **Step 8: Implement `load_product_associations`**

Add to `backend/app/services/admin/ingest/products.py` (add
`from app.services.recommendations.models import Product, ProductConcern,
ProductIngredient, ProductSkinType` — extending the existing
`recommendations.models` import — and `from app.services.skin_profile.models import
SkinConcern, SkinType`):

```python
async def load_product_associations(
    db: AsyncSession, products: list[dict[str, Any]]
) -> tuple[int, int]:
    """Idempotent - populates product_skin_types/product_concerns for every
    accepted product from this ingest (whether just-created or already present
    from an earlier run), keyed by the same (brand_name, product_name) natural
    key load_into_database uses. Real data only: skin_type_names/concern_names
    come from parse_highlights' honest mapping, never fabricated here."""
    skin_type_id_by_name = dict(
        (await db.execute(select(SkinType.skin_type_name, SkinType.skin_type_id))).all()
    )
    concern_id_by_name = dict(
        (await db.execute(select(SkinConcern.concern_name, SkinConcern.concern_id))).all()
    )
    product_id_by_key = {
        (brand_name, product_name): product_id
        for product_id, brand_name, product_name in (
            await db.execute(
                select(Product.product_id, Product.brand_name, Product.product_name)
            )
        ).all()
    }
    existing_skin_type_pairs = {
        (product_id, skin_type_id)
        for product_id, skin_type_id in (
            await db.execute(select(ProductSkinType.product_id, ProductSkinType.skin_type_id))
        ).all()
    }
    existing_concern_pairs = {
        (product_id, concern_id)
        for product_id, concern_id in (
            await db.execute(select(ProductConcern.product_id, ProductConcern.concern_id))
        ).all()
    }

    skin_type_created = 0
    concern_created = 0
    for entry in products:
        product_id = product_id_by_key.get((entry["brand_name"], entry["product_name"]))
        if product_id is None:
            continue
        for name in entry.get("skin_type_names", []):
            skin_type_id = skin_type_id_by_name.get(name)
            if skin_type_id is None or (product_id, skin_type_id) in existing_skin_type_pairs:
                continue
            db.add(ProductSkinType(product_id=product_id, skin_type_id=skin_type_id))
            existing_skin_type_pairs.add((product_id, skin_type_id))
            skin_type_created += 1
        for name in entry.get("concern_names", []):
            concern_id = concern_id_by_name.get(name)
            if concern_id is None or (product_id, concern_id) in existing_concern_pairs:
                continue
            db.add(ProductConcern(product_id=product_id, concern_id=concern_id))
            existing_concern_pairs.add((product_id, concern_id))
            concern_created += 1

    await db.commit()
    return skin_type_created, concern_created
```

- [ ] **Step 9: Wire into `run()`**

```python
async def run(db: AsyncSession) -> None:
    csv_path = download_dataset()
    df = pd.read_csv(csv_path)
    products, rejected = normalize_rows(df)
    created = await load_into_database(db, products)
    skin_type_created, concern_created = await load_product_associations(db, products)
    report_path = write_ingest_report(products, rejected)
    print(
        f"Ingested {created} new product(s) ({len(products) - created} already present, "
        f"{len(rejected)} rejected). Associations: {skin_type_created} skin-type link(s), "
        f"{concern_created} concern link(s). Report: {report_path}"
    )
```

- [ ] **Step 10: Run tests, then re-run the real ingest to retrofit associations onto the already-loaded catalog**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -v`
Expected: all pass (the two new plus the existing ones from Task 2).

Run: `cd backend && uv run python -m app.services.admin.ingest.products`
Expected: `0` new products (all 2,409 already present from Task 2's run), but a
real, non-zero skin-type/concern association count — paste the actual printed
summary. Note: only ~83% of Skincare rows have a non-null `highlights` value
(2,003 of 2,420 confirmed during investigation) and only a subset of those contain
a mapped phrase, so not every one of the 2,409 products will gain an association —
that's honest, not a bug; paste the real final counts, don't round up.

Then verify against the live DB:
```bash
docker exec ai-skin-intelligence-personalized-skincare-planner--postgres-1 \
  psql -U skinlytics -d skinlytics -c \
  "SELECT st.skin_type_name, count(DISTINCT pst.product_id) FROM product_skin_types pst JOIN skin_types st ON st.skin_type_id = pst.skin_type_id GROUP BY st.skin_type_name;"
```
Paste this output — it should show real counts in the hundreds for at least
Normal/Dry/Oily/Combination (Sensitive will be 0 or near-0, honestly, since no
highlight phrase in this dataset maps to it).

- [ ] **Step 11: Run the full backend suite**

Run: `cd backend && uv run pytest -q`
Expected: all green (aside from the two already-known, unrelated, isolation-flaky ES
tests from `test_ingredients_service.py` — don't chase those, they're
pre-existing and confirmed to pass individually).

- [ ] **Step 12: Commit**

```bash
git add backend/app/services/admin/ingest/products.py backend/tests/test_products_ingest.py
git commit -m "feat(ingest): populate product_skin_types/product_concerns from real highlights data"
```

**Never add a Co-Authored-By trailer or any AI-assistant co-author to this or any
commit message this task creates** — AGENTS.md §6 strictly forbids it.

---

### Task 8: Final-review fixes (safety-gate bypass, gate regressions, alternative scoring)

**Why this exists:** the final whole-branch review (post-Task 6) found one Critical
and several Important/Minor issues in Tasks 1-5's combined diff, independent of
Task 7's junction-population gap above. This task fixes all of them in one pass.

**Files:**
- Modify: `backend/app/services/recommendations/service.py`
- Modify: `backend/tests/test_recommendations_service.py`,
  `backend/tests/test_routines_service.py` (ruff line-length only)
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md` (remove a phantom field
  reference)
- Modify: `web/app/(user)/products/page.tsx` (add the missing `uncategorized` filter
  option — real inventory, 699 products, currently unreachable via the UI filter)

**Interfaces:**
- Consumes: `evaluate_products_suitability` (already exists, already imported in
  `service.py`), `_recommender.score` (Task 4), `list_ingredient_categories_for_products`
  (already exists, already imported).
- Modifies: `_apply_budget_cap`'s signature to also thread through `skin_type_name:
  str | None` (needed for the suitability check) — the one call site in
  `get_recommendations` already has `skin_type_name` in scope from earlier in the
  function.

- [ ] **Step 1: Write the failing test for the Critical safety-gate bypass**

```python
# backend/tests/test_recommendations_service.py, add:
async def test_budget_cap_alternative_never_carries_an_allergy_flagged_product(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """The same release-blocking property
    test_an_allergy_flagged_product_can_never_appear_in_recommendations already
    covers for the main ranking path - this proves the budget-cap alternative path
    respects it too, since it queries candidates independently."""
    niacinamide = (
        await db_session.execute(
            select(Ingredient).where(Ingredient.ingredient_name == "Niacinamide")
        )
    ).scalars().first()
    assert niacinamide is not None

    unsafe_cheap_product = Product(
        brand_name="Test Only",
        product_name="Unsafe Cheap Alternative",
        category="Moisturizer",
        price=5.0,
        currency="USD",
        is_active=True,
    )
    db_session.add(unsafe_cheap_product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=unsafe_cheap_product.product_id, ingredient_id=niacinamide.ingredient_id)
    )
    db_session.add(
        ProductSkinType(product_id=unsafe_cheap_product.product_id, skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await db_session.commit()

    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS, allergies="Niacinamide"),
    )

    results = await get_recommendations(db_session, test_user_id, max_price=1000000.0)

    assert all(
        r.product.product_id != unsafe_cheap_product.product_id for r in results
    ), "an allergy-flagged product must never be served as a budget alternative"
```

(Add `ProductSkinType` to the existing `recommendations.models` import at the top of
the test file if not already imported — check first.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_recommendations_service.py -k budget_cap_alternative_never -v`
Expected: FAIL — with a very high `max_price` (1000000.0) nothing is over budget, so
first adjust: re-read the test once more before running it — the intent is that the
allergy-flagged product must genuinely be a *candidate* the budget-cap logic would
consider (i.e., it needs to compete as a same-category cheap alternative for some
real over-budget entry). If the real seeded/ingested catalog doesn't reliably
produce an over-budget top match for this profile, adjust `max_price` to a low
enough value (e.g. the price of the seeded Moisturizer minus 1) that at least one
Moisturizer entry is genuinely over-budget, so `_apply_budget_cap`'s candidate query
actually runs and could (incorrectly, pre-fix) surface `unsafe_cheap_product`.
Confirm the test fails because the unsafe product *does* appear, not because
nothing in the response is `over_budget` at all — these are different failure modes
and only the first one proves the bug.

- [ ] **Step 3: Fix `_apply_budget_cap` to respect the skin-type and allergy gates**

In `backend/app/services/recommendations/service.py`, thread `skin_type_name: str |
None` into `_apply_budget_cap`'s signature, and change the candidate-selection body
to join `ProductSkinType` and run the same `evaluate_products_suitability` check the
main pipeline uses:

```python
async def _apply_budget_cap(
    db: AsyncSession,
    results: list[RecommendationRead],
    max_price: float,
    profile: SkinProfileRead,
    concern_ids: set[int],
    skin_type_name: str | None,
) -> list[RecommendationRead]:
    """Hard cap (MILESTONE 3.pdf Step 2 "Budget Optimization & Alternatives") - a
    top match over `max_price` is flagged, and the cheapest same-category candidate
    under the cap with the most concern overlap is added alongside it as a real,
    never-fabricated substitute. Candidates go through the SAME stage-1 hard
    safety gates the main ranking pipeline uses (skin-type link + the free-text/
    structured allergy check) - a budget alternative is never exempt from the
    release-blocking allergy guarantee."""
    existing_product_ids = {r.product.product_id for r in results}
    augmented: list[RecommendationRead] = list(results)

    for entry in results:
        price = entry.product.price
        if price is None or float(price) <= max_price:
            continue
        entry.over_budget = True

        candidates_result = await db.execute(
            select(Product)
            .join(ProductSkinType, ProductSkinType.product_id == Product.product_id)
            .where(
                ProductSkinType.skin_type_id == profile.skin_type_id,
                Product.category == entry.product.category,
                Product.product_id.notin_(existing_product_ids),
                Product.is_active.is_(True),
                Product.price.isnot(None),
                Product.price <= max_price,
            )
            .distinct()
        )
        candidates = candidates_result.scalars().all()
        if not candidates:
            continue

        suitability = await evaluate_products_suitability(
            db, [c.product_id for c in candidates], profile, skin_type_name
        )
        safe_candidates = [c for c in candidates if not suitability[c.product_id].any_allergy]
        if not safe_candidates:
            continue

        candidate_concerns = await list_concern_ids_for_products(
            db, [c.product_id for c in safe_candidates]
        )
        candidate_tags = await list_ingredient_categories_for_products(
            db, [c.product_id for c in safe_candidates]
        )

        def _overlap_count(product_id: int, _concerns: dict[int, list[int]] = candidate_concerns) -> int:
            return len([cid for cid in _concerns.get(product_id, []) if cid in concern_ids])

        best = max(safe_candidates, key=lambda c: (_overlap_count(c.product_id), -(c.price or 0.0)))
        best_overlap = _overlap_count(best.product_id)
        weights_for_alt = await get_active_recommendation_weights(db)
        alt_features = RecommendationFeatures(
            concern_overlap=(best_overlap / len(concern_ids)) if concern_ids else 0.0,
            skin_type_fit=suitability[best.product_id].score,
            rating_norm=(float(best.rating) / 5.0 if best.rating is not None else 0.5),
        )
        match_percentage = round(
            _recommender.score(
                alt_features,
                concern_weight=float(weights_for_alt.concern_weight),
                skin_type_fit_weight=float(weights_for_alt.skin_type_fit_weight),
                rating_weight=float(weights_for_alt.rating_weight),
            )
        )

        augmented.append(
            RecommendationRead(
                product=ProductRead.model_validate(best),
                match_percentage=match_percentage,
                reasons=[f"Cheaper alternative under your {max_price:.2f} {best.currency or 'USD'} budget"],
                active_ingredient_tags=sorted(set(candidate_tags.get(best.product_id, []))),
                over_budget=False,
                alternative_for_product_id=entry.product.product_id,
            )
        )
        existing_product_ids.add(best.product_id)

    return augmented
```

Update the one call site in `get_recommendations` to pass `skin_type_name` (already
a local variable in scope earlier in the function):

```python
    if max_price is not None:
        results = await _apply_budget_cap(
            db, results, max_price, profile, concern_ids, skin_type_name
        )
```

Note this reuses `get_active_recommendation_weights`/`ContentBasedRecommender`/
`RecommendationFeatures` (Task 4) so the alternative's `match_percentage` comes from
the SAME config-driven formula as every other entry, not a second ad-hoc one — and
populates `active_ingredient_tags` for real instead of leaving it `[]`.

- [ ] **Step 4: Run the new test, confirm it passes**

Run: `cd backend && uv run pytest tests/test_recommendations_service.py -k budget_cap_alternative_never -v`
Expected: PASS.

- [ ] **Step 5: Bound the candidate query and fix the ruff violations**

Add `.order_by(Product.price).limit(50)` to the candidate query above (right after
`.distinct()`) — a single over-budget entry in a 400-product category shouldn't load
every match.

Run: `cd backend && uv run ruff check . && uv run ruff format --check backend/app/services/recommendations/service.py backend/tests/test_recommendations_service.py backend/tests/test_routines_service.py`
Fix every reported line (all are >100-char lines this branch's earlier commits
introduced via the "Treatment Products" rename or this task's own new code) with
`uv run ruff format <file>` on exactly those three files — do not reformat any file
this branch didn't already touch, to keep the diff minimal.

- [ ] **Step 6: Fix the Task 2 test-wiring gap (deferred minor, cheap to close now)**

In `backend/tests/test_products_ingest.py`'s `test_normalize_rows_accepts_a_valid_row`
(or equivalent fixture-building test), add a real `"tertiary_category": "Face Wash &
Cleansers"` key to the fixture row and assert `product["category"] == "Face Wash"` —
pinning the actual wiring between `tertiary_category` and the `category` field that
the whole of Task 2 was about.

- [ ] **Step 7: Fix the ledger's phantom field reference**

In `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`, row `M3R-P2-T4`'s evidence note
mentions `alternative_category` — this field doesn't exist on `RecommendationRead`
(the contract deliberately dropped the top-level category field, see this plan's
Global Constraints). Delete that phrase from the note.

- [ ] **Step 8: Add the missing `uncategorized` filter option**

In `web/app/(user)/products/page.tsx`'s `CATEGORIES` array, append `"uncategorized"`
as an 8th option — real inventory (699 products after Task 2/7's ingest) that's
currently unreachable through this filter.

- [ ] **Step 9: Run the full backend suite + frontend gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q`
Run: `cd web && npm run typecheck && npm run lint && npm run build`
Expected: all green (aside from the two known-flaky-in-isolation ES tests).

- [ ] **Step 10: Commit**

```bash
git add backend/app/services/recommendations/service.py backend/tests/test_recommendations_service.py \
  backend/tests/test_routines_service.py backend/tests/test_products_ingest.py \
  docs/milestones/milestone_3/M3R_TASK_LEDGER.md "web/app/(user)/products/page.tsx"
git commit -m "fix(recommendations): budget-cap alternatives now pass the same safety gates as the main ranking path"
```

**Never add a Co-Authored-By trailer or any AI-assistant co-author to this or any
commit message this task creates** — AGENTS.md §6 strictly forbids it.

---

### Task 9: Second final-review fixes (allergy gate on routines, uncategorized leak, ingredient normalization, doc honesty)

**Why this exists:** a second final whole-branch review (run after Tasks 7-8 landed)
found no repeat of the exact bug Task 8 fixed, but found four real, separate issues:
(1) the allergy safety check is missing from every routine-editing code path
(generation, add/update-step, search-for-swap) and `products_service.py`'s
`get_alternatives` — pre-existing, but only reachable now that Task 7 gave routines
a 665+-product real candidate pool instead of 16 simple ones; the user decided to
fix this now rather than defer it; (2) `"uncategorized"` (699 real products) is
served as an 8th recommendation category, contradicting the rubric's literal 7 and
this phase's own frozen contract; (3) the real ingest's ingredient-name
normalization has a `.strip().strip("'\"")` ordering bug that leaves stray
whitespace on 17 ingredient names, one of which silently duplicates a curated
ingredient (`"Salicylic Acid "` vs `"Salicylic Acid"`) and would defeat its
avoid-junction entry for any future product linked only to the malformed row; (4)
`M3R_TASK_LEDGER.md`/`M3R_GAP_ANALYSIS.md` never got T7/T8 rows or an honest account
of the safety-gate history and the real Sensitive-skin coverage gap (no `highlights`
phrase in this dataset maps to Sensitive, so Sensitive-skin recommendations are
still effectively the original 16-product catalog).

**Files:**
- Modify: `backend/app/services/routines/service.py`
- Modify: `backend/app/services/recommendations/products_service.py`
- Modify: `backend/app/services/recommendations/service.py`
- Modify: `backend/app/services/admin/ingest/products.py`
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`,
  `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md`,
  `docs/milestones/milestone_3/M3R_API_CONTRACT.md`
- Test: `backend/tests/test_routines_service.py`,
  `backend/tests/test_products_service.py`, `backend/tests/test_recommendations_service.py`,
  `backend/tests/test_products_ingest.py`

**Interfaces:**
- Consumes: `evaluate_products_suitability` (already exists, already imported where
  needed — `recommendations_service` is already imported in `routines/service.py`
  and `products_service.py`).
- `_generate_routine`/`_generate_steps` gain a `profile: SkinProfileRead` parameter
  (threaded from `get_or_generate_routines`, which already fetches it).
- `_assert_product_is_safe`, `search_products_for_edit`, `get_alternatives` use the
  `profile` they already fetch — no new parameters needed there.

- [ ] **Step 1: Write the failing allergy-gate tests for routines**

```python
# backend/tests/test_routines_service.py, add:
async def test_generated_routine_never_contains_an_allergy_flagged_product(
    db_session: AsyncSession,
) -> None:
    """Same release-blocking property recommendations already enforces
    (test_an_allergy_flagged_product_can_never_appear_in_recommendations) - now
    proven for the routine generator too, since it independently selects
    candidates. Real seeded "Niacinamide" ingredient (id 2), linked to a temp
    product that otherwise legitimately matches skin_type_id=1 (Normal)."""
    user_id = f"routine-allergy-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    niacinamide_product = Product(
        brand_name="Test Only",
        product_name="Unsafe Niacinamide Moisturizer",
        category="Moisturizer",
        price=10.0,
        currency="USD",
        is_active=True,
    )
    db_session.add(niacinamide_product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=niacinamide_product.product_id, ingredient_id=2)
    )
    db_session.add(ProductSkinType(product_id=niacinamide_product.product_id, skin_type_id=1))
    await db_session.commit()

    await create_profile(
        db_session, user_id, SkinProfileCreate(skin_type_id=1, allergies="Niacinamide")
    )

    routines = await get_or_generate_routines(db_session, user_id)

    for routine in routines:
        for step in routine.steps:
            for p in step.products:
                assert p.product.product_id != niacinamide_product.product_id, (
                    "an allergy-flagged product must never appear in a generated routine"
                )


async def test_assert_product_is_safe_rejects_an_allergy_flagged_product(
    db_session: AsyncSession,
) -> None:
    user_id = f"assert-allergy-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    niacinamide_product = Product(
        brand_name="Test Only",
        product_name="Unsafe Niacinamide Serum",
        category="Serum",
        price=10.0,
        currency="USD",
        is_active=True,
    )
    db_session.add(niacinamide_product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=niacinamide_product.product_id, ingredient_id=2)
    )
    await db_session.commit()

    await create_profile(
        db_session, user_id, SkinProfileCreate(skin_type_id=1, allergies="Niacinamide")
    )

    with pytest.raises(UnsafeProductError):
        await _assert_product_is_safe(db_session, user_id, niacinamide_product.product_id)


async def test_search_products_for_edit_excludes_an_allergy_flagged_product(
    db_session: AsyncSession,
) -> None:
    user_id = f"search-allergy-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    niacinamide_product = Product(
        brand_name="Test Only",
        product_name="Unsafe Niacinamide Cream",
        category="Moisturizer",
        price=10.0,
        currency="USD",
        is_active=True,
    )
    db_session.add(niacinamide_product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=niacinamide_product.product_id, ingredient_id=2)
    )
    db_session.add(ProductSkinType(product_id=niacinamide_product.product_id, skin_type_id=1))
    await db_session.commit()

    await create_profile(
        db_session, user_id, SkinProfileCreate(skin_type_id=1, allergies="Niacinamide")
    )

    results = await search_products_for_edit(db_session, user_id, "Moisturizer", "")

    assert all(r.product_id != niacinamide_product.product_id for r in results)
```

(Check the top of `test_routines_service.py` for its real existing imports —
`Product`, `ProductIngredient`, `ProductSkinType`, `UnsafeProductError`,
`_assert_product_is_safe`, `search_products_for_edit`, `uuid`, `pytest` may need
adding to the import list; match whatever pattern the file's other tests already use
for creating a temp user/product, don't invent a different one.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_routines_service.py -k allergy_flagged -v`
Expected: FAIL — the allergy-flagged product appears/is accepted where it shouldn't be.

- [ ] **Step 3: Fix `_assert_product_is_safe`**

In `backend/app/services/routines/service.py`:

```python
async def _assert_product_is_safe(db: AsyncSession, user_id: str, product_id: int) -> None:
    """Same hard safety filters _generate_routine enforces at generation time
    (the skin-type avoid-junction AND the allergy check), now enforced on manual
    edits too - a user (or a direct API call) can't add/swap in a product flagged
    unsafe for their own skin type, and can't add one that matches their declared
    allergies either."""
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        raise ValueError("No skin profile yet")
    avoided = await recommendations_service.list_avoided_ingredient_product_ids(
        db, profile.skin_type_id
    )
    if product_id in avoided:
        raise UnsafeProductError("This product isn't safe for your skin type")
    suitability = await recommendations_service.evaluate_products_suitability(
        db, [product_id], profile, None
    )
    if suitability[product_id].any_allergy:
        raise UnsafeProductError("This product matches one of your recorded allergies")
```

- [ ] **Step 4: Fix `search_products_for_edit`**

In the same file:

```python
async def search_products_for_edit(
    db: AsyncSession, user_id: str, category: str, query: str
) -> list[ProductRead]:
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        return []
    candidates = await recommendations_service.list_products_for_skin_type(
        db, profile.skin_type_id, category=category
    )
    avoided = await recommendations_service.list_avoided_ingredient_product_ids(
        db, profile.skin_type_id
    )
    candidate_ids = [p.product_id for p in candidates if p.product_id not in avoided]
    suitability = await recommendations_service.evaluate_products_suitability(
        db, candidate_ids, profile, None
    )
    query_lower = query.strip().lower()
    matches = [
        p
        for p in candidates
        if p.product_id in candidate_ids
        and not suitability[p.product_id].any_allergy
        and (
            not query_lower
            or query_lower in (p.product_name or "").lower()
            or query_lower in (p.brand_name or "").lower()
        )
    ]
    return [ProductRead.model_validate(p) for p in matches[:10]]
```

- [ ] **Step 5: Thread `profile` into `_generate_routine`/`_generate_steps`**

In `_generate_steps`'s signature, add `profile: SkinProfileRead` as a parameter (after
`skin_type_id`), and inside the function, after building
`candidates_by_product_category` (the existing avoid-junction filter loop), add an
allergy filter over the full `all_candidates` list before bucketing by category:

```python
    suitability = await recommendations_service.evaluate_products_suitability(
        db, [p.product_id for p in all_candidates], profile, skin_type_name
    )
    candidates_by_product_category: dict[str, list[Any]] = defaultdict(list)
    for product in all_candidates:
        if (
            product.product_id not in avoided_product_ids
            and not suitability[product.product_id].any_allergy
        ):
            candidates_by_product_category[product.category or ""].append(product)
```

(This replaces the existing `for product in all_candidates: if product.product_id
not in avoided_product_ids: ...` loop — same loop, one more condition. Read the
current function body first to confirm the exact surrounding lines before editing.)

Then update `_generate_steps`'s call signature and its one caller
(`_generate_routine`, which already receives everything else `_generate_steps`
needs) to accept and pass `profile` through. `_generate_routine`'s own signature
gains a `profile: SkinProfileRead` parameter (replacing or alongside its existing
`skin_type_id`/`skin_type_name` params — keep both, `evaluate_products_suitability`
needs the whole profile object, the individual fields are still used elsewhere in
the function). Update all 4 call sites in `get_or_generate_routines` (am, pm,
weekly, seasonal) to pass the already-fetched `profile`.

- [ ] **Step 6: Fix `get_alternatives`**

In `backend/app/services/recommendations/products_service.py`, after the existing
avoid-ids filter block, add:

```python
    if profile is not None:
        avoided_ids = await list_avoided_ingredient_product_ids(db, profile.skin_type_id)
        candidates = [c for c in candidates if c.product_id not in avoided_ids]
        if candidates:
            suitability = await evaluate_products_suitability(
                db, [c.product_id for c in candidates], profile, None
            )
            candidates = [c for c in candidates if not suitability[c.product_id].any_allergy]
    if not candidates:
        return ProductAlternativesRead(alternatives=[])
```

(This replaces the existing `if profile is not None: avoided_ids = ...; candidates =
[...]` block — same shape, extended. Add `evaluate_products_suitability` to this
file's existing `recommendations.service` import if it imports individual functions
rather than the module.)

- [ ] **Step 7: Run the new tests, then the full routines + recommendations + products test files**

Run: `cd backend && uv run pytest tests/test_routines_service.py -v` (timeout: 180000)
Run: `cd backend && uv run pytest tests/test_recommendations_service.py tests/test_products_service.py -v` (timeout: 120000)
Expected: all pass, including the 3 new allergy tests.

- [ ] **Step 8: Fix the `uncategorized`-as-8th-category leak**

In `backend/app/services/recommendations/service.py`, in the per-category grouping
loop (the one building `served_by_category`), skip `None`/`"uncategorized"`:

```python
        served_by_category: dict[str | None, list[tuple[float, Product, list[str]]]] = {}
        for row in ranked:
            category = row[1].category
            if not category or category == "uncategorized":
                continue
            served_by_category.setdefault(category, []).append(row)
```

- [ ] **Step 9: Write the failing test for the uncategorized exclusion**

```python
# backend/tests/test_recommendations_service.py, add:
async def test_recommendations_never_include_an_uncategorized_product(
    db_session: AsyncSession, test_user_id: str
) -> None:
    uncategorized_product = Product(
        brand_name="Test Only",
        product_name="Test Uncategorized Item",
        category="uncategorized",
        price=10.0,
        currency="USD",
        is_active=True,
    )
    db_session.add(uncategorized_product)
    await db_session.flush()
    db_session.add(
        ProductSkinType(product_id=uncategorized_product.product_id, skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await db_session.commit()

    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )

    results = await get_recommendations(db_session, test_user_id)

    assert all(r.product.product_id != uncategorized_product.product_id for r in results)
    assert all(r.product.category != "uncategorized" for r in results)
```

Run: `cd backend && uv run pytest tests/test_recommendations_service.py -k uncategorized -v`
Expected: PASS after Step 8's fix (write this test after the fix, or before-then-fail-then-pass — either order is fine here since it's a simple filter, not a TDD-critical safety path).

- [ ] **Step 10: Fix the ingredient-name normalization bug + one-time data cleanup**

In `backend/app/services/admin/ingest/products.py`'s `_parse_ingredients`, change:
```python
    parts = [
        p.strip().strip("'\"").title()
        for chunk in without_parens.split(",")
        for p in chunk.split(";")
    ]
```
to:
```python
    parts = [
        p.strip(" '\"").title()
        for chunk in without_parens.split(",")
        for p in chunk.split(";")
    ]
```
(A single `.strip(" '\"")` call strips whitespace and quote characters together in
one continuous pass from both ends, so a fragment like `Acid ' ` — space, quote,
space — comes out fully clean. The old two-call sequence could leave a stray space
behind once the quote in between was removed, since the first whitespace-only
`.strip()` never got a second pass after the quote strip exposed a new outer
character.)

Add a regression test:
```python
# backend/tests/test_products_ingest.py, add:
def test_parse_ingredients_strips_trailing_space_after_a_quote() -> None:
    assert _parse_ingredients("[\"Salicylic Acid' \", 'Water']") == ["Salicylic Acid", "Water"]
```
(Import `_parse_ingredients` if not already imported in this test file.)

Then do the one-time live-DB cleanup for rows already created by the buggy version
(17 known-affected names per this investigation). Run this against the live stack
(read the actual polluted rows first, don't guess the list):
```bash
docker exec ai-skin-intelligence-personalized-skincare-planner--postgres-1 \
  psql -U skinlytics -d skinlytics -c \
  "SELECT ingredient_id, ingredient_name, btrim(ingredient_name, ' ''\"') AS cleaned FROM ingredients WHERE ingredient_name != btrim(ingredient_name, ' ''\"');"
```
For any row whose `cleaned` value doesn't already exist as another ingredient's
name, rename in place:
```sql
UPDATE ingredients SET ingredient_name = btrim(ingredient_name, ' ''"')
WHERE ingredient_name != btrim(ingredient_name, ' ''"')
  AND btrim(ingredient_name, ' ''"') NOT IN (SELECT ingredient_name FROM ingredients);
```
For the one row that DOES collide with an existing canonical ingredient (found
during investigation: a malformed `"Salicylic Acid "` distinct from the curated
`ingredient_id=5` `"Salicylic Acid"`), merge instead of rename — repoint
`product_ingredients` from the malformed id to the canonical id (skip on conflict,
since a product might already be linked to both), then delete the now-orphaned
malformed row:
```sql
INSERT INTO product_ingredients (product_id, ingredient_id, concentration_notes)
SELECT pi.product_id, 5, pi.concentration_notes
FROM product_ingredients pi
WHERE pi.ingredient_id = (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'Salicylic Acid ')
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

DELETE FROM product_ingredients
WHERE ingredient_id = (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'Salicylic Acid ');

DELETE FROM ingredients WHERE ingredient_name = 'Salicylic Acid ';
```
(Re-run the first `SELECT` query afterward to confirm zero polluted rows remain.
If the real data has more than one colliding case, repeat the merge pattern for
each — don't assume only one exists without checking.)

- [ ] **Step 11: Fix the documentation to describe the final state honestly**

In `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`:
- Add rows `M3R-P2-T7` (product_skin_types/product_concerns population — Task 7's
  real counts) and `M3R-P2-T8` (safety-gate fixes — mention BOTH the allergy gate
  and the avoid-ingredient gate were found missing from `_apply_budget_cap` across
  two review rounds, plus the routine-interaction test scope fix, plus this Task
  9's routines/get_alternatives allergy-gate fix).
- Correct T6's stale test count/suite-result numbers to the real final numbers.
- Add a plain-language note that Sensitive-skin recommendations still draw only
  from the original 16 hand-seeded products, since no `highlights` phrase in the
  real dataset maps to Sensitive skin — this is an honest, known limitation, not a
  bug, but it must be written down.

In `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md` §2: update the stale
present-tense bullets that still describe the now-fixed 6-factor formula/hardcoded
categories as if they were still open gaps; make clear they're closed, with the
real final architecture described.

In `docs/milestones/milestone_3/M3R_API_CONTRACT.md` §2: fix the internal
contradiction between "excluded from top matches and replaced" and "the product
itself is never dropped from the response" (the code's real behavior is the
latter — flag *and* keep the original, plus add the alternative); update the
`active_ingredient_tags` description to note it's populated for alternatives now
(Task 8) and is often `[]` on real ingested products lacking a curated ingredient
category (an honest data-coverage note, not a bug).

- [ ] **Step 12: Run the full gate**

Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q` (timeout: 1800000)
Run: `cd web && npm run typecheck && npm run lint && npm run build` (timeout: 300000)
Expected: all green (aside from any test failure you can independently confirm is
pre-existing/unrelated the same way prior tasks on this branch have — don't wave
one away without that confirmation).

- [ ] **Step 13: Commit**

Split into logical commits (don't squash into one):
```bash
git add backend/app/services/routines/service.py backend/tests/test_routines_service.py
git commit -m "fix(routines): apply the allergy safety gate to generation, manual edits, and search-for-swap"

git add backend/app/services/recommendations/products_service.py
git commit -m "fix(recommendations): apply the allergy safety gate to get_alternatives"

git add backend/app/services/recommendations/service.py backend/tests/test_recommendations_service.py
git commit -m "fix(recommendations): exclude uncategorized products from the categorized recommendation feed"

git add backend/app/services/admin/ingest/products.py backend/tests/test_products_ingest.py
git commit -m "fix(ingest): fix ingredient-name whitespace-stripping order, clean up 17 affected rows"

git add docs/milestones/milestone_3/M3R_TASK_LEDGER.md docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md docs/milestones/milestone_3/M3R_API_CONTRACT.md
git commit -m "docs(m3r): record P2's full safety-gate history, T7/T8 rows, and the Sensitive-skin coverage gap"
```

**Never add a Co-Authored-By trailer or any AI-assistant co-author to any commit
message this task creates** — AGENTS.md §6 strictly forbids it.

---

## Verification (against the running stack, per the phase file)

Seed/confirm a fixture user (oily skin, acne concern, a real ingested allergen,
a real budget cap below at least one top match's real price): hit
`GET /api/v1/recommendations/me?max_price=<cap>` and paste the JSON response,
showing: results spanning multiple real categories (now genuinely reachable after
Task 7), no allergen-containing product anywhere in the response (including budget
alternatives, per Task 8), at least one `over_budget: true` entry paired with a
cheaper `alternative_for_product_id`-linked entry in the same category.

## Exit

Manual self-review (no `gh`/PR, per Phase 1's recorded decision) → merge
`feat/m3r-p2-recommendation-engine` to `dev` → delete branch → `graphify update .` →
`PROGRESS.md` entry.
