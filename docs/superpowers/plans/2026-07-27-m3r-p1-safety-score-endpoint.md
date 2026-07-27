# M3R Phase 1 — Safety Score Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close M3R-P1-T3/T4/T5 (`docs/milestones/milestone_3/M3R_TASK_LEDGER.md`) — add
the rubric's Safety Score endpoint (`MILESTONE 3.pdf` Step 1: "Safety Score Endpoint")
by composing the already-real allergy-matching (`app/ai/suitability.py`) and
pairwise-interaction (`app/ai/interactions.py`) engines, with config-driven score
thresholds mirroring the existing `scoring_weights` pattern.

**Architecture:** Pure extension of `backend/app/services/ingredients/` (router.py,
service.py, schemas.py, models.py) — no new service module, no parallel engine. The
"same routine step" scoping the rubric asks for comes for free from the endpoint's own
request shape (`ingredient_ids` + one `routine_time` value = "these are all in the same
step"), so no changes to `app/ai/interactions.py`'s pairwise data are needed — see
`M3R_GAP_ANALYSIS.md` §1 for why this was reclassified from "needs a new conflict-matrix
table" to "compose what exists."

**Tech Stack:** FastAPI + SQLAlchemy async + Alembic (existing backend stack, no new
dependency).

## Global Constraints

- Score 0-100, label exactly `Safe` / `Warning` / `Unsafe` (rubric literal).
- Response carries a `confidence` field; "not medical advice" disclaimer is a frontend
  concern (P4/P5), not this endpoint's job.
- Role: `user` (own profile) + `consultant`/`dermatologist` for assigned clients via
  `clinical_review`'s ownership check (per `M3R_API_CONTRACT.md` §1, frozen in P0).
- Config-driven thresholds/deductions (PG row, `CHECK` constraint, one active row) —
  same philosophy as `scoring_weights` (AGENTS.md §2 rule 7) — never hardcoded Python
  literals for the tunable numbers.
- Any schema change: Alembic migration + same-change update to
  `database_schemas/skinlytics_postgresql_schema_v3.sql` (AGENTS.md §5).
- Real-store fixtures in tests, no mocks (repo convention, `backend/tests/test_ingredients_service.py`).
- `ruff` + `mypy --strict` + `pytest` green before this phase closes.
- Real seeded ingredient ids used throughout (confirmed via `backend/tests/test_ingredients_service.py`):
  Retinol=1, Niacinamide=2, Ascorbic Acid=3, Hyaluronic Acid=4, Glycolic Acid=9.
  Retinol+Glycolic Acid is a real curated `avoid` pair (`app/ai/interactions.py:20-27`).
  "Vitamin C" is a real curated free-text synonym for Ascorbic Acid
  (`app/ai/ingredient_synonyms.py:11`).

**Contract refinement (discovered during planning, corrects `M3R_API_CONTRACT.md` §1):**
`AllergyAlert` drops the speculative `matched_allergen`/`via_alias` fields (there's no
clean way to derive them without parsing free text) in favor of directly reusing
`SuitabilityResult`'s existing `reasons[0]` + `confidence` — same honesty standard as
`InteractionWarning`. Update `M3R_API_CONTRACT.md` in Task 3's commit.

---

### Task 1: Config-driven safety-score thresholds

**Files:**
- Modify: `backend/app/services/ingredients/models.py` (add `IngredientSafetyConfig`)
- Create: `backend/app/migrations/versions/<new>_add_ingredient_safety_config.py`
- Modify: `database_schemas/skinlytics_postgresql_schema_v3.sql` (mirror + seed INSERT,
  near the existing `scoring_weights` block at line 288)
- Modify: `backend/app/services/ingredients/service.py` (add `get_active_safety_config`)
- Test: `backend/tests/test_ingredients_service.py`

**Interfaces:**
- Produces: `IngredientSafetyConfig` (SQLAlchemy model, `ingredient_safety_config` table)
  with columns `config_id: int`, `avoid_deduction: float`, `caution_deduction: float`,
  `allergy_deduction: float`, `safe_threshold: float`, `warning_threshold: float`,
  `is_active: bool | None`, `created_at: datetime | None`.
- Produces: `async def get_active_safety_config(db: AsyncSession) -> IngredientSafetyConfig`
  — raises `ValueError("No active ingredient_safety_config row — seed data is missing")`
  if none found (mirrors `scores/service.py:44-49`'s `get_active_weights`).

- [ ] **Step 1: Write the failing test**

```python
# in backend/tests/test_ingredients_service.py, near the top-level imports add:
# from app.services.ingredients.service import get_active_safety_config

async def test_get_active_safety_config_returns_the_seeded_active_row(
    db_session: AsyncSession,
) -> None:
    config = await service.get_active_safety_config(db_session)

    assert config.is_active is True
    assert 0 < float(config.warning_threshold) < float(config.safe_threshold) <= 100
    assert float(config.avoid_deduction) > 0
    assert float(config.caution_deduction) > 0
    assert float(config.allergy_deduction) > 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_ingredients_service.py::test_get_active_safety_config_returns_the_seeded_active_row -v`
Expected: FAIL with `AttributeError: module 'app.services.ingredients.service' has no attribute 'get_active_safety_config'`

- [ ] **Step 3: Add the model**

Add to `backend/app/services/ingredients/models.py` (after the existing three classes):

```python
from sqlalchemy import CheckConstraint, Index, Numeric, text


class IngredientSafetyConfig(Base):
    """Tunable numeric parameters for the Safety Score endpoint (MILESTONE 3.pdf
    Step 1) — same config-driven philosophy as scores/models.py's ScoringWeights
    (AGENTS.md §2 rule 7): retuning is a DB update, not a deploy. The pairwise
    chemistry facts themselves stay in app/ai/interactions.py's hand-curated dict
    (its own docstring explains why — vetted facts, not tunable weights); only the
    score-formula's deductions/thresholds live here."""

    __tablename__ = "ingredient_safety_config"
    __table_args__ = (
        CheckConstraint(
            "safe_threshold > warning_threshold", name="chk_safety_thresholds_ordered"
        ),
        Index(
            "uq_ingredient_safety_config_one_active",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )

    config_id: Mapped[int] = mapped_column(primary_key=True)
    avoid_deduction: Mapped[float] = mapped_column(Numeric(5, 2), default=40.0)
    caution_deduction: Mapped[float] = mapped_column(Numeric(5, 2), default=15.0)
    allergy_deduction: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0)
    safe_threshold: Mapped[float] = mapped_column(Numeric(5, 2), default=80.0)
    warning_threshold: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
```

(Add `import datetime` at the top of `models.py` alongside the existing imports if not
already present — check the file first, it already imports `datetime` at line 1.)

- [ ] **Step 4: Generate and edit the migration**

Run: `cd backend && uv run alembic revision -m "add ingredient safety config"`

Edit the generated file (fill in `upgrade`/`downgrade`, following
`c6e4d32b96b3_add_routine_step_category_rationale_.py`'s docstring style):

```python
"""add ingredient safety config

Revision ID: <generated>
Revises: <previous head>
Create Date: <generated>

M3R Phase 1 (MILESTONE 3.pdf Step 1, "Safety Score Endpoint") — a config-driven
thresholds table for the safety-score formula, same philosophy as scoring_weights.
Seeds one active row with the current default deductions/thresholds.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "<generated>"
down_revision: str | Sequence[str] | None = "<previous head>"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ingredient_safety_config",
        sa.Column("config_id", sa.Integer(), primary_key=True),
        sa.Column("avoid_deduction", sa.Numeric(5, 2), nullable=False, server_default="40.0"),
        sa.Column("caution_deduction", sa.Numeric(5, 2), nullable=False, server_default="15.0"),
        sa.Column("allergy_deduction", sa.Numeric(5, 2), nullable=False, server_default="50.0"),
        sa.Column("safe_threshold", sa.Numeric(5, 2), nullable=False, server_default="80.0"),
        sa.Column("warning_threshold", sa.Numeric(5, 2), nullable=False, server_default="50.0"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.CheckConstraint(
            "safe_threshold > warning_threshold", name="chk_safety_thresholds_ordered"
        ),
    )
    op.create_index(
        "uq_ingredient_safety_config_one_active",
        "ingredient_safety_config",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )
    op.execute(
        "INSERT INTO ingredient_safety_config "
        "(avoid_deduction, caution_deduction, allergy_deduction, safe_threshold, "
        "warning_threshold, is_active) VALUES (40.0, 15.0, 50.0, 80.0, 50.0, TRUE)"
    )


def downgrade() -> None:
    op.drop_index("uq_ingredient_safety_config_one_active", table_name="ingredient_safety_config")
    op.drop_table("ingredient_safety_config")
```

Run: `cd backend && uv run alembic upgrade head`
Expected: applies cleanly against the running docker-compose Postgres, no errors.

- [ ] **Step 5: Mirror the canonical SQL doc**

Add to `database_schemas/skinlytics_postgresql_schema_v3.sql` right after the
`scoring_weights` table definition (after line 301, before `CREATE TABLE skin_assessments`):

```sql
CREATE TABLE ingredient_safety_config (
    config_id SERIAL PRIMARY KEY,
    avoid_deduction DECIMAL(5,2) NOT NULL DEFAULT 40.0,
    caution_deduction DECIMAL(5,2) NOT NULL DEFAULT 15.0,
    allergy_deduction DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    safe_threshold DECIMAL(5,2) NOT NULL DEFAULT 80.0,
    warning_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_safety_thresholds_ordered CHECK (safe_threshold > warning_threshold)
);
```

And add the matching seed INSERT next to the existing `scoring_weights` INSERT
(near line 636):

```sql
INSERT INTO ingredient_safety_config
    (avoid_deduction, caution_deduction, allergy_deduction, safe_threshold, warning_threshold, is_active)
VALUES (40.0, 15.0, 50.0, 80.0, 50.0, TRUE);
```

- [ ] **Step 6: Add the service getter**

Add to `backend/app/services/ingredients/service.py` (near the top, after the existing
imports — add `from app.services.ingredients.models import IngredientSafetyConfig`
alongside the existing model imports):

```python
async def get_active_safety_config(db: AsyncSession) -> IngredientSafetyConfig:
    result = await db.execute(
        select(IngredientSafetyConfig).where(IngredientSafetyConfig.is_active.is_(True))
    )
    config = result.scalars().first()
    if config is None:
        raise ValueError("No active ingredient_safety_config row — seed data is missing")
    return config
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_ingredients_service.py::test_get_active_safety_config_returns_the_seeded_active_row -v`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/app/services/ingredients/models.py backend/app/migrations/versions/ \
  database_schemas/skinlytics_postgresql_schema_v3.sql backend/app/services/ingredients/service.py \
  backend/tests/test_ingredients_service.py
git commit -m "feat(ingredients): add config-driven safety-score thresholds table"
```

---

### Task 2: Safety score schemas + scoring function

**Files:**
- Modify: `backend/app/services/ingredients/schemas.py`
- Modify: `backend/app/services/ingredients/service.py`
- Test: `backend/tests/test_ingredients_service.py`

**Interfaces:**
- Consumes: `get_active_safety_config(db)` (Task 1), `_suitability.evaluate(...)`
  (`app/ai/suitability.py`, already imported in `service.py` as `_suitability`),
  `get_interaction(name_a, name_b)` (`app/ai/interactions.py`, already imported),
  `skin_profile_service.get_current_profile(db, user_id)` (already imported).
- Produces: `SafetyScoreRequest`, `AllergyAlert`, `InteractionWarning`, `SafetyScoreRead`
  (schemas); `async def compute_safety_score(db: AsyncSession, ingredient_ids: list[int],
  routine_time: Literal["AM", "PM"], user_id: str) -> SafetyScoreRead` — raises
  `ValueError` for unknown ingredient ids (router maps this to `422`).

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_ingredients_service.py`:

```python
_RETINOL_ID = 1  # already defined above in the file — reuse, don't redefine
_GLYCOLIC_ACID_ID = 9  # already defined above in the file — reuse, don't redefine
_ASCORBIC_ACID_ID = 3
_NIACINAMIDE_ID = 2  # already defined above in the file — reuse, don't redefine


async def test_compute_safety_score_flags_a_known_unsafe_pairing(
    db_session: AsyncSession,
) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    result = await service.compute_safety_score(
        db_session, [_RETINOL_ID, _GLYCOLIC_ACID_ID], "PM", user_id
    )

    assert result.label in ("Warning", "Unsafe")
    assert result.score < 100
    assert len(result.interaction_warnings) == 1
    warning = result.interaction_warnings[0]
    assert warning.verdict == "avoid"
    assert {warning.ingredient_id_a, warning.ingredient_id_b} == {
        _RETINOL_ID,
        _GLYCOLIC_ACID_ID,
    }


async def test_compute_safety_score_flags_allergy_via_free_text_synonym(
    db_session: AsyncSession,
) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, allergies="Vitamin C")

    result = await service.compute_safety_score(db_session, [_ASCORBIC_ACID_ID], "AM", user_id)

    assert len(result.allergy_alerts) == 1
    assert result.allergy_alerts[0].ingredient_id == _ASCORBIC_ACID_ID
    assert result.score < 100


async def test_compute_safety_score_clean_list_scores_safe(db_session: AsyncSession) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    result = await service.compute_safety_score(db_session, [_NIACINAMIDE_ID], "AM", user_id)

    assert result.score == 100
    assert result.label == "Safe"
    assert result.allergy_alerts == []
    assert result.interaction_warnings == []


async def test_compute_safety_score_rejects_unknown_ingredient_id(
    db_session: AsyncSession,
) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    try:
        await service.compute_safety_score(db_session, [999_999], "AM", user_id)
        raise AssertionError("expected ValueError for unknown ingredient id")
    except ValueError:
        pass
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_ingredients_service.py -k compute_safety_score -v`
Expected: FAIL with `AttributeError: module 'app.services.ingredients.service' has no attribute 'compute_safety_score'`

- [ ] **Step 3: Add the schemas**

Add to `backend/app/services/ingredients/schemas.py` (at the end of the file):

```python
class SafetyScoreRequest(BaseModel):
    ingredient_ids: list[int]
    routine_time: Literal["AM", "PM"]


class AllergyAlert(BaseModel):
    ingredient_id: int
    ingredient_name: str
    reason: str
    confidence: float


class InteractionWarning(BaseModel):
    ingredient_id_a: int
    ingredient_id_b: int
    ingredient_name_a: str
    ingredient_name_b: str
    verdict: Literal["avoid", "caution"]
    reason: str | None


class SafetyScoreRead(BaseModel):
    score: int
    label: Literal["Safe", "Warning", "Unsafe"]
    confidence: float
    allergy_alerts: list[AllergyAlert]
    interaction_warnings: list[InteractionWarning]
```

- [ ] **Step 4: Implement `compute_safety_score`**

Add to `backend/app/services/ingredients/service.py` (add
`from typing import Literal` to the existing `from typing import Any` import line, and
add `AllergyAlert, InteractionWarning, SafetyScoreRead` to the existing schemas import):

```python
async def compute_safety_score(
    db: AsyncSession, ingredient_ids: list[int], routine_time: Literal["AM", "PM"], user_id: str
) -> SafetyScoreRead:
    # `routine_time` narrows the request to "these ingredients are all used in the
    # same routine step" by construction — that IS the rubric's "same evening step"
    # scoping; no separate step-aware conflict table needed (M3R_GAP_ANALYSIS.md §1).
    rows = (
        await db.execute(select(Ingredient).where(Ingredient.ingredient_id.in_(ingredient_ids)))
    ).scalars().all()
    by_id = {row.ingredient_id: row for row in rows}
    missing = [i for i in ingredient_ids if i not in by_id]
    if missing:
        raise ValueError(f"Unknown ingredient_ids: {missing}")

    profile = await skin_profile_service.get_current_profile(db, user_id)
    allergies = profile.allergies if profile else None
    sensitivities = profile.sensitivities if profile else None
    structured_allergies = (
        [(a.ingredient_id, a.ingredient_name) for a in profile.allergy_ingredients]
        if profile
        else []
    )

    config = await get_active_safety_config(db)
    score = 100.0
    allergy_alerts: list[AllergyAlert] = []
    for ingredient_id in ingredient_ids:
        ingredient = by_id[ingredient_id]
        result = _suitability.evaluate(
            ingredient_name=ingredient.ingredient_name,
            inci_name=ingredient.inci_name,
            skin_type_name=None,
            allergies=allergies,
            sensitivities=sensitivities,
            avoid_reason=None,
            structured_allergy_ingredients=structured_allergies,
            candidate_ingredient_id=ingredient_id,
        )
        if result.allergy_flag:
            allergy_alerts.append(
                AllergyAlert(
                    ingredient_id=ingredient_id,
                    ingredient_name=ingredient.ingredient_name,
                    reason=result.reasons[0],
                    confidence=result.confidence,
                )
            )
            score -= float(config.allergy_deduction)

    interaction_warnings: list[InteractionWarning] = []
    for index, id_a in enumerate(ingredient_ids):
        for id_b in ingredient_ids[index + 1 :]:
            ingredient_a, ingredient_b = by_id[id_a], by_id[id_b]
            interaction = get_interaction(ingredient_a.ingredient_name, ingredient_b.ingredient_name)
            if interaction is None or interaction["verdict"] == "synergy":
                continue
            interaction_warnings.append(
                InteractionWarning(
                    ingredient_id_a=id_a,
                    ingredient_id_b=id_b,
                    ingredient_name_a=ingredient_a.ingredient_name,
                    ingredient_name_b=ingredient_b.ingredient_name,
                    verdict=interaction["verdict"],
                    reason=interaction["reason"],
                )
            )
            deduction = (
                config.avoid_deduction
                if interaction["verdict"] == "avoid"
                else config.caution_deduction
            )
            score -= float(deduction)

    score = max(0.0, min(100.0, score))
    label: Literal["Safe", "Warning", "Unsafe"] = (
        "Safe"
        if score >= float(config.safe_threshold)
        else "Warning"
        if score >= float(config.warning_threshold)
        else "Unsafe"
    )
    confidences = [alert.confidence for alert in allergy_alerts]
    if interaction_warnings:
        confidences.append(0.95)  # curated-fact confidence, app/ai/interactions.py
    overall_confidence = min(confidences) if confidences else 0.9

    return SafetyScoreRead(
        score=round(score),
        label=label,
        confidence=overall_confidence,
        allergy_alerts=allergy_alerts,
        interaction_warnings=interaction_warnings,
    )
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_ingredients_service.py -k compute_safety_score -v`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/ingredients/schemas.py backend/app/services/ingredients/service.py \
  backend/tests/test_ingredients_service.py
git commit -m "feat(ingredients): compute_safety_score composing suitability + interactions"
```

---

### Task 3: Router endpoint + professional access + contract doc fix

**Files:**
- Modify: `backend/app/services/ingredients/router.py`
- Modify: `backend/app/services/clinical_review/service.py` (add public wrapper)
- Modify: `docs/milestones/milestone_3/M3R_API_CONTRACT.md` (AllergyAlert shape fix)
- Test: `backend/tests/test_ingredients_service.py` (router-level, via the existing
  test app fixture — check the top of the test file / `conftest.py` for the fixture
  name, e.g. `client` or `async_client`, and follow that file's existing router-test
  pattern before writing these)

**Interfaces:**
- Consumes: `compute_safety_score` (Task 2), `require_role` (`app.core.security`).
- Produces: `verify_assignment(db, professional_id, user_id) -> ConsultantClient` in
  `clinical_review/service.py` (public wrapper around the existing `_verify_assignment`,
  raises `ValueError` on no assignment — same as the private one).
  `POST /api/v1/ingredients/safety-score` route.

- [ ] **Step 1: Add the public ownership-check wrapper**

Add to `backend/app/services/clinical_review/service.py`, directly after
`_verify_assignment`'s definition (around line 109):

```python
async def verify_assignment(db: AsyncSession, professional_id: str, user_id: str) -> None:
    """Public entry point for other services to reuse this ownership check
    (single-writer rule, AGENTS.md §2 rule 4) — `_verify_assignment` stays private
    to this module's own callers; this is the cross-service interface (first real
    consumer: ingredients/router.py's safety-score endpoint, M3R Phase 1)."""
    await _verify_assignment(db, professional_id, user_id)
```

- [ ] **Step 2: Write the failing router test**

`backend/tests/test_ingredients_router.py` already has the exact fixture pattern to
follow (`client: AsyncClient` fixture + `require_user` dependency override, per its
own docstring: "Role/auth matrix lives in test_rbac.py alongside every other
service's"). Add to `backend/tests/test_ingredients_router.py`:

```python
async def test_safety_score_flags_a_known_unsafe_pairing(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            json={"ingredient_ids": [1, 9], "routine_time": "PM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    body = response.json()
    assert body["label"] in ("Warning", "Unsafe")
    assert len(body["interaction_warnings"]) == 1


async def test_safety_score_rejects_empty_ingredient_list(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            json={"ingredient_ids": [], "routine_time": "AM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_safety_score_professional_without_assignment_gets_404(
    client: AsyncClient,
) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": "consultant_1",
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            params={"client_user_id": "some-unassigned-user"},
            json={"ingredient_ids": [2], "routine_time": "AM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404
```

Then add one row to the existing `test_admin_only_routes_reject_non_admin_roles`-style
matrix in `backend/tests/test_rbac.py` — this endpoint is user+consultant+dermatologist,
never admin, so add a new parametrized test mirroring that file's existing structure
(same file, same `client`/`require_user`-override pattern already shown above at
lines 168-183 of that file):

```python
@pytest.mark.parametrize(
    "method,path,json_body",
    [
        ("POST", "/api/v1/ingredients/safety-score", {"ingredient_ids": [1], "routine_time": "AM"}),
    ],
)
async def test_safety_score_route_rejects_admin_role(
    client: AsyncClient, method: str, path: str, json_body: dict[str, Any] | None
) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": "admin_1",
        "role": "admin",
        "claims": {},
    }
    try:
        response = await client.request(method, path, json=json_body)
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 403, f"{method} {path} returned {response.status_code}"
```

A "consultant with a real assignment gets 200" case belongs in
`backend/tests/test_clinical_review_service.py`-style integration tests (needs a real
seeded `consultant_clients` row via `clinical_review.service.create_assignment` plus a
real user/profile, more setup than the router-contract file's other tests do) — add it
to `backend/tests/test_ingredients_service.py` instead, as a service-level test calling
`compute_safety_score` directly after a real `create_assignment` call, matching Task 2's
existing test style rather than going through the HTTP layer a second time.

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_ingredients_service.py -k safety_score -v`
Expected: FAIL (404 Not Found — route doesn't exist yet)

- [ ] **Step 4: Add the router endpoint**

Add to `backend/app/services/ingredients/router.py` (add
`SafetyScoreRead, SafetyScoreRequest` to the existing schemas import, and add
`from app.services.clinical_review import service as clinical_review_service` to the
imports):

```python
@router.post("/ingredients/safety-score")
async def get_safety_score(
    payload: SafetyScoreRequest,
    user: Annotated[
        dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    client_user_id: Annotated[str | None, Query()] = None,
) -> SafetyScoreRead:
    if not 1 <= len(payload.ingredient_ids) <= 20:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "ingredient_ids must contain 1-20 values"
        )

    if user["role"] in ("consultant", "dermatologist"):
        if client_user_id is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "client_user_id is required for professional access",
            )
        try:
            await clinical_review_service.verify_assignment(db, user["id"], client_user_id)
        except ValueError as exc:
            raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
        target_user_id = client_user_id
    else:
        target_user_id = user["id"]

    try:
        return await service.compute_safety_score(
            db, payload.ingredient_ids, payload.routine_time, target_user_id
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_ingredients_service.py -k safety_score -v`
Expected: all pass

- [ ] **Step 6: Fix the frozen contract doc**

In `docs/milestones/milestone_3/M3R_API_CONTRACT.md` §1, replace the `allergy_alerts`
example object and its bullet with:

```json
{ "ingredient_id": 3, "ingredient_name": "Ascorbic Acid", "reason": "Possible allergy match: 'Ascorbic Acid' overlaps a tag in your recorded allergies. Check with a professional before using.", "confidence": 0.7 }
```

Update the surrounding prose bullet to say `allergy_alerts` reuses
`SuitabilityResult`'s existing `reasons[0]` + `confidence` directly, rather than trying
to derive a separate matched-allergen/alias-flag pair.

- [ ] **Step 7: Regenerate OpenAPI types**

Run: `make openapi` (from repo root)
Expected: `web/lib/api-types.ts` gains the new `SafetyScoreRequest`/`SafetyScoreRead`
types with no unrelated diff.

- [ ] **Step 8: Commit**

```bash
git add backend/app/services/ingredients/router.py backend/app/services/clinical_review/service.py \
  backend/tests/test_ingredients_service.py docs/milestones/milestone_3/M3R_API_CONTRACT.md \
  web/lib/api-types.ts
git commit -m "feat(ingredients): mount POST /ingredients/safety-score, user + professional access"
```

---

### Task 4: Full gate + ledger close-out

**Files:**
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`

- [ ] **Step 1: Run the full backend gate**

Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q`
Expected: all green, 0 failures (baseline was 507; this phase adds ~8 new tests).

- [ ] **Step 2: Update the ledger**

In `M3R_TASK_LEDGER.md`, change rows `M3R-P1-T3`, `M3R-P1-T4`, `M3R-P1-T5` from `TODO`
to `DONE`, each with a one-line evidence note (endpoint path, test names, migration
revision id).

- [ ] **Step 3: Commit**

```bash
git add docs/milestones/milestone_3/M3R_TASK_LEDGER.md
git commit -m "docs(m3r): close P1 ledger rows - safety score endpoint shipped"
```

---

## Verification (against the running stack, per the phase file)

`curl -X POST http://localhost:8000/api/v1/ingredients/safety-score` (with a real user
JWT) three times: (a) `{"ingredient_ids":[1,9],"routine_time":"PM"}` → `Unsafe`/`Warning`
naming the Retinol/Glycolic Acid interaction; (b) a list containing an ingredient that
matches a seeded user allergy → `allergy_alerts` populated; (c) `{"ingredient_ids":[2],
"routine_time":"AM"}` → `Safe`, score 100. Paste the three responses into the phase
report before merging.

## Exit

Manual self-review (no `gh`/PR — decision recorded in `M3R_TASK_LEDGER.md`) → merge
`feat/m3r-p1-ingredient-intelligence` to `dev` → delete branch → `graphify update .` →
`PROGRESS.md` entry.
