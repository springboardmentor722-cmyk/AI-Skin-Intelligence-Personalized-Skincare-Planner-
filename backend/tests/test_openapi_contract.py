"""Milestone 2 P13 (MILESTONE_2_MASTER_PROMPT.md P13: "contract tests asserting
every response matches openapi.json"). Real HTTP round trips through the three
P9-P11 core endpoints (`POST /assessment/submit`, `GET /assessment/score/{id}`,
`POST /routine/generate`) validate their JSON response bodies against the exact
Pydantic response models that generated those `openapi.json` schema components
in the first place — the strongest form of "matches the contract" available
without adding a new dependency (Pydantic already round-trips the identical
validation `openapi.json`'s schema was derived from; a generic JSON-Schema
validator would only ever re-check a copy of the same rules).

Milestone 2 P14 correction: this file originally also compared a committed
`openapi.json` against `app.openapi()` for staleness — but `.gitignore` deliberately
excludes `/openapi.json` (only `web/lib/api-types.ts` is a committed artifact,
per its own comment: "regenerate with `make openapi`; web/lib/api-types.ts IS
committed"). That test would `FileNotFoundError` on any fresh checkout/CI run
where `openapi.json` was never locally regenerated — removed rather than kept
passing by accident locally. Staying in sync is still real, just enforced by
discipline (regenerate both together, as every M2 phase touching the API
surface has done) rather than a committed-file diff.
"""

import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from pydantic import TypeAdapter
from sqlalchemy import delete

from app.core.security import require_user
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.assessment.schemas import AssessmentSubmitResponse
from app.services.routines.schemas import RoutineRead
from app.services.scores.schemas import ScoreRead


@pytest.fixture
async def contract_test_user() -> AsyncGenerator[str, None]:
    # Same real-committed-row-then-cascade-delete pattern as
    # test_progress_router.py's router_test_user — the `client` fixture hits the
    # real `get_db` (no rollback wrapper), and every domain table FKs to
    # `user.id` with ON DELETE CASCADE (skin_profiles, skincare_routines,
    # skin_assessments, assessment_submissions), so deleting the user row alone
    # cleans up every Postgres row this test creates.
    user_id = f"test-contract-{uuid.uuid4().hex[:16]}"
    async with async_session_factory() as session:
        await session.execute(
            external_user_table.insert().values(
                id=user_id,
                email=f"{user_id}@test.invalid",
                name="Contract Test",
                emailVerified=False,
            )
        )
        await session.commit()
    try:
        yield user_id
    finally:
        async with async_session_factory() as session:
            await session.execute(
                delete(external_user_table).where(external_user_table.c.id == user_id)
            )
            await session.commit()
        await get_mongo_db()["lifestyle_logs"].delete_many({"user_id": user_id})


async def _as(user_id: str) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": user_id,
        "role": "user",
        "claims": {},
    }


async def test_assessment_submit_response_matches_its_openapi_schema(
    client: AsyncClient, contract_test_user: str
) -> None:
    """MILESTONE 2.docx's worked example, over real HTTP — same payload
    test_assessment_service.py's service-level test uses."""
    await _as(contract_test_user)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "acne_severity": 7,
                "hyperpigmentation_severity": 4,
                "redness_severity": 0,
                "wrinkles_severity": 0,
                "lifestyle": {
                    "sleep_hours": 7.5,
                    "water_intake_liters": 2.5,
                    "stress_level": 4,
                    "sun_exposure": "Moderate",
                },
            },
        )
        assert response.status_code == 200
        parsed = AssessmentSubmitResponse.model_validate(response.json())
        assert parsed.score.overall_score is not None
    finally:
        app.dependency_overrides.pop(require_user, None)


async def test_assessment_score_by_id_response_matches_its_openapi_schema(
    client: AsyncClient, contract_test_user: str
) -> None:
    await _as(contract_test_user)
    try:
        submit_response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Dry",
                "acne_severity": 2,
                "hyperpigmentation_severity": 2,
                "redness_severity": 2,
                "wrinkles_severity": 2,
                "lifestyle": {
                    "sleep_hours": 8,
                    "water_intake_liters": 3,
                    "stress_level": 2,
                    "sun_exposure": "Low",
                },
            },
        )
        assert submit_response.status_code == 200
        assessment_id = submit_response.json()["assessment_id"]

        response = await client.get(f"/api/v1/assessment/score/{assessment_id}")
        assert response.status_code == 200
        ScoreRead.model_validate(response.json())
    finally:
        app.dependency_overrides.pop(require_user, None)


async def test_routine_generate_response_matches_its_openapi_schema(
    client: AsyncClient, contract_test_user: str
) -> None:
    await _as(contract_test_user)
    try:
        submit_response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "acne_severity": 5,
                "hyperpigmentation_severity": 0,
                "redness_severity": 0,
                "wrinkles_severity": 0,
                "lifestyle": {
                    "sleep_hours": 7,
                    "water_intake_liters": 2,
                    "stress_level": 3,
                    "sun_exposure": "Moderate",
                },
            },
        )
        assert submit_response.status_code == 200

        response = await client.post("/api/v1/routine/generate")
        assert response.status_code == 200
        routines = TypeAdapter(list[RoutineRead]).validate_python(response.json())
        assert {r.routine_type for r in routines} == {"AM", "PM", "Weekly", "Seasonal"}
    finally:
        app.dependency_overrides.pop(require_user, None)
