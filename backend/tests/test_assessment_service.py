"""Milestone 2 P9 — POST /api/v1/assessment/submit (docs/milestones/milestone_2/
MILESTONE_2_MASTER_PROMPT.md P9). Pure functions (prioritize_concerns,
derive_risk_factors, concern_name_to_severity_field) are tested directly, no I/O;
submit_assessment is tested against the real database (tests/conftest.py's
rollback-wrapped db_session) since its whole job is a real multi-table round trip
(skin_profiles, lifestyle_logs, skin_assessments, assessment_submissions); the 422
validation-rule rejections are tested through the real HTTP endpoint (the `client`
fixture) since that's what actually proves the field-level error body a caller
sees, not just that a Python exception was raised somewhere.
"""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.main import app
from app.services.assessment.models import AssessmentSubmission
from app.services.assessment.schemas import (
    AssessmentConcernInput,
    AssessmentLifestyleInput,
    AssessmentSubmitRequest,
)
from app.services.assessment.service import (
    AssessmentValidationError,
    concern_name_to_severity_field,
    derive_risk_factors,
    prioritize_concerns,
    submit_assessment,
)
from app.services.skin_profile.service import (
    get_current_profile,
    list_skin_concerns,
    list_skin_types,
)


async def _as(user_id: str, client: AsyncClient) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": user_id,
        "role": "user",
        "claims": {},
    }


# --- Pure functions ---


def test_prioritize_concerns_ranks_by_severity_descending_with_stable_tie_break() -> None:
    concerns = [
        AssessmentConcernInput(id=1, severity=4),
        AssessmentConcernInput(id=2, severity=7),
        AssessmentConcernInput(id=3, severity=7),  # tied with id=2, selected later
        AssessmentConcernInput(id=4, severity=9),
    ]
    ranked = prioritize_concerns(concerns)
    assert [c.id for c in ranked] == [4, 2, 3, 1]


def test_derive_risk_factors_flags_each_documented_threshold() -> None:
    risky = AssessmentLifestyleInput(
        sleep_hours=5, water_intake_liters=1.0, stress_level=8, sun_exposure="High"
    )
    keys = {r.key for r in derive_risk_factors(risky)}
    assert keys == {"sleep_deficit", "dehydration_risk", "high_stress", "uv_exposure"}


def test_derive_risk_factors_is_empty_for_a_healthy_profile() -> None:
    healthy = AssessmentLifestyleInput(
        sleep_hours=8, water_intake_liters=2.5, stress_level=3, sun_exposure="Low"
    )
    assert derive_risk_factors(healthy) == []


def test_concern_name_to_severity_field_matches_the_seeded_dataset_convention() -> None:
    # web/lib/assessment/skin-concerns.json's own backend_field values, confirmed
    # against the live seeded skin_concerns table this session.
    assert concern_name_to_severity_field("Acne") == "acne_severity"
    assert concern_name_to_severity_field("Hyperpigmentation") == "hyperpigmentation_severity"
    assert concern_name_to_severity_field("Dark Spots") == "dark_spots_severity"
    assert concern_name_to_severity_field("Uneven Skin Tone") == "uneven_skin_tone_severity"


# --- submit_assessment (real DB round trip) ---


async def _oily_type_id(db: AsyncSession) -> int:
    types = await list_skin_types(db)
    return next(t.skin_type_id for t in types if t.skin_type_name == "Oily")


async def _concern_id(db: AsyncSession, name: str) -> int:
    concerns = await list_skin_concerns(db)
    return next(c.concern_id for c in concerns if c.concern_name == name)


async def test_submit_assessment_persists_and_returns_ids(
    db_session: AsyncSession, test_user_id: str
) -> None:
    skin_type_id = await _oily_type_id(db_session)
    acne_id = await _concern_id(db_session, "Acne")

    response = await submit_assessment(
        db_session,
        test_user_id,
        AssessmentSubmitRequest(
            skin_type="Oily",
            concerns=[AssessmentConcernInput(id=acne_id, severity=7)],
            lifestyle=AssessmentLifestyleInput(
                sleep_hours=7.5, water_intake_liters=2.5, stress_level=4, sun_exposure="Moderate"
            ),
        ),
    )

    assert response.assessment_id > 0
    assert response.submission_id > 0

    row = (
        await db_session.execute(
            select(AssessmentSubmission).where(
                AssessmentSubmission.submission_id == response.submission_id
            )
        )
    ).scalar_one()
    assert row.user_id == test_user_id
    assert row.score_id == response.assessment_id
    assert row.raw_payload["skin_type"] == "Oily"

    profile = await get_current_profile(db_session, test_user_id)
    assert profile is not None
    assert profile.skin_type_id == skin_type_id
    assert [c.concern_id for c in profile.concerns] == [acne_id]


async def test_submit_assessment_flat_field_adapter_maps_onto_concerns(
    db_session: AsyncSession, test_user_id: str
) -> None:
    acne_id = await _concern_id(db_session, "Acne")
    hyperpig_id = await _concern_id(db_session, "Hyperpigmentation")

    response = await submit_assessment(
        db_session,
        test_user_id,
        AssessmentSubmitRequest(
            skin_type="Oily",
            acne_severity=7,
            hyperpigmentation_severity=4,
            redness_severity=0,
            wrinkles_severity=0,
            lifestyle=AssessmentLifestyleInput(
                sleep_hours=7.5, water_intake_liters=2.5, stress_level=4, sun_exposure="Moderate"
            ),
        ),
    )

    by_id = {c.concern_id: c.severity for c in response.prioritized_concerns}
    assert by_id == {acne_id: 7, hyperpig_id: 4}


async def test_submit_assessment_docx_worked_example_round_trips(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """MILESTONE 2.docx §"3. How the Payload Sends to the Backend" — the exact
    worked example: skin_type Oily, acne_severity 7, hyperpigmentation_severity 4,
    redness_severity 0, wrinkles_severity 0, sleep_hours 7.5,
    water_intake_liters 2.5, stress_level 4, sun_exposure "Moderate"."""
    acne_id = await _concern_id(db_session, "Acne")
    hyperpig_id = await _concern_id(db_session, "Hyperpigmentation")

    response = await submit_assessment(
        db_session,
        test_user_id,
        AssessmentSubmitRequest(
            skin_type="Oily",
            acne_severity=7,
            hyperpigmentation_severity=4,
            redness_severity=0,
            wrinkles_severity=0,
            lifestyle=AssessmentLifestyleInput(
                sleep_hours=7.5, water_intake_liters=2.5, stress_level=4, sun_exposure="Moderate"
            ),
        ),
    )

    # Prioritised acne (7) ahead of hyperpigmentation (4) — matches the docx's own
    # "prioritize Acne" narrative for this exact example.
    assert [c.concern_id for c in response.prioritized_concerns] == [acne_id, hyperpig_id]
    assert [c.rank for c in response.prioritized_concerns] == [1, 2]
    # Moderate sun exposure is a flagged risk factor; nothing else about this
    # example crosses a risk threshold.
    assert {r.key for r in response.risk_factors} == {"uv_exposure"}


async def test_submit_assessment_rejects_unknown_skin_type(
    db_session: AsyncSession, test_user_id: str
) -> None:
    try:
        await submit_assessment(
            db_session,
            test_user_id,
            AssessmentSubmitRequest(
                skin_type="Reptilian",
                lifestyle=AssessmentLifestyleInput(
                    sleep_hours=7, water_intake_liters=2, stress_level=3, sun_exposure="Low"
                ),
            ),
        )
        raise AssertionError("expected AssessmentValidationError")
    except AssessmentValidationError as exc:
        assert any(e["loc"] == ["body", "skin_type"] for e in exc.errors)


async def test_submit_assessment_rejects_unknown_concern_id(
    db_session: AsyncSession, test_user_id: str
) -> None:
    try:
        await submit_assessment(
            db_session,
            test_user_id,
            AssessmentSubmitRequest(
                skin_type="Oily",
                concerns=[AssessmentConcernInput(id=999_999, severity=5)],
                lifestyle=AssessmentLifestyleInput(
                    sleep_hours=7, water_intake_liters=2, stress_level=3, sun_exposure="Low"
                ),
            ),
        )
        raise AssertionError("expected AssessmentValidationError")
    except AssessmentValidationError as exc:
        assert any("999999" in e["msg"] for e in exc.errors)


# --- HTTP-level 422s (the real field-level error body a caller sees) ---
#
# A plain literal id, not the `test_user_id` fixture: every case here fails
# validation before submit_assessment ever writes anything user-linked (the
# skin_types/skin_concerns lookups it does first are global reference reads), so
# there's no FK-constrained write that would need a real, committed `user` row —
# unlike `test_user_id` (rollback-wrapped `db_session`), which is invisible to the
# separate, real connection `client`'s HTTP requests use via `get_db`.
_HTTP_TEST_USER_ID = "test-assessment-http-422"


async def test_submit_endpoint_rejects_unknown_skin_type_with_422(client: AsyncClient) -> None:
    await _as(_HTTP_TEST_USER_ID, client)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Reptilian",
                "lifestyle": {
                    "sleep_hours": 7,
                    "water_intake_liters": 2,
                    "stress_level": 3,
                    "sun_exposure": "Low",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422
    assert any(e["loc"] == ["body", "skin_type"] for e in response.json()["error"]["details"])


async def test_submit_endpoint_rejects_unknown_concern_id_with_422(client: AsyncClient) -> None:
    await _as(_HTTP_TEST_USER_ID, client)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "concerns": [{"id": 999999, "severity": 5}],
                "lifestyle": {
                    "sleep_hours": 7,
                    "water_intake_liters": 2,
                    "stress_level": 3,
                    "sun_exposure": "Low",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_submit_endpoint_rejects_severity_outside_0_to_10_with_422(
    client: AsyncClient,
) -> None:
    await _as(_HTTP_TEST_USER_ID, client)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "concerns": [{"id": 1, "severity": 11}],
                "lifestyle": {
                    "sleep_hours": 7,
                    "water_intake_liters": 2,
                    "stress_level": 3,
                    "sun_exposure": "Low",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_submit_endpoint_rejects_implausible_sleep_hours_with_422(
    client: AsyncClient,
) -> None:
    await _as(_HTTP_TEST_USER_ID, client)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "lifestyle": {
                    "sleep_hours": 30,
                    "water_intake_liters": 2,
                    "stress_level": 3,
                    "sun_exposure": "Low",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_submit_endpoint_rejects_implausible_water_intake_with_422(
    client: AsyncClient,
) -> None:
    await _as(_HTTP_TEST_USER_ID, client)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "lifestyle": {
                    "sleep_hours": 7,
                    "water_intake_liters": -1,
                    "stress_level": 3,
                    "sun_exposure": "Low",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_submit_endpoint_rejects_unknown_sun_exposure_with_422(client: AsyncClient) -> None:
    await _as(_HTTP_TEST_USER_ID, client)
    try:
        response = await client.post(
            "/api/v1/assessment/submit",
            json={
                "skin_type": "Oily",
                "lifestyle": {
                    "sleep_hours": 7,
                    "water_intake_liters": 2,
                    "stress_level": 3,
                    "sun_exposure": "Extreme",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422
