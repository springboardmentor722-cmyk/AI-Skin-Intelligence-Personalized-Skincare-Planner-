"""Milestone 1 audit: scores/service.py — the module computing the weighted Skin
Health Score (AGENTS.md, docs/ARCHITECTURE.md §7's "skin_condition 0.35 · lifestyle
0.20 · sleep_quality 0.15 · routine_adherence 0.20 · hydration 0.10") — had 19% test
coverage, the lowest of any service and the most business-critical. The five
`_..._score` helpers are pure functions (no I/O), tested directly against the exact
formulas documented in docs/AI_ML.md; `compute_and_store_score`/`get_active_weights`
are tested against the real database (tests/conftest.py's rollback-wrapped
`db_session`) since their whole job is the DB round trip (versioned upsert, weights
lookup) that a pure-function test can't exercise.
"""

import datetime
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.services.routines.service import get_or_generate_routines, toggle_step_completion
from app.services.scores.models import SkinScore
from app.services.scores.service import (
    _hydration_score,
    _lifestyle_score,
    _routine_adherence_score,
    _skin_condition_score,
    _sleep_quality_score,
    compute_and_store_score,
    get_active_weights,
)
from app.services.skin_profile.schemas import (
    EnvironmentalExposure,
    LifestyleLogCreate,
    SkinProfileConcernInput,
    SkinProfileCreate,
)
from app.services.skin_profile.service import create_profile, upsert_lifestyle_log

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1


class _FakeConcern:
    def __init__(self, severity_rating: int | None) -> None:
        self.severity_rating = severity_rating


@pytest.fixture
async def scored_test_user_id(test_user_id: str) -> AsyncGenerator[str, None]:
    """Mongo isn't covered by `db_session`'s rollback (that only wraps Postgres) —
    same manual-cleanup pattern as test_skin_profile_service.py's `lifestyle_test_user`,
    extended to also clean up the new `routine_logs` collection this session adds."""
    try:
        yield test_user_id
    finally:
        await get_mongo_db()["lifestyle_logs"].delete_many({"user_id": test_user_id})
        await get_mongo_db()["routine_logs"].delete_many({"user_id": test_user_id})


# --- _skin_condition_score — Milestone 2 Step 3.1: tiered High/Medium/Low deduction ---


def test_skin_condition_score_no_concerns_is_perfect() -> None:
    assert _skin_condition_score([]) == 100.0


def test_skin_condition_score_deducts_fifteen_per_high_severity_concern() -> None:
    # severity 8-10 = High = -15 each
    assert _skin_condition_score([_FakeConcern(8), _FakeConcern(9)]) == 70.0


def test_skin_condition_score_deducts_seven_per_medium_severity_concern() -> None:
    # severity 4-7 = Medium = -7 each
    assert _skin_condition_score([_FakeConcern(4), _FakeConcern(7)]) == 86.0


def test_skin_condition_score_low_severity_costs_nothing() -> None:
    # severity 1-3 = Low = no deduction
    assert _skin_condition_score([_FakeConcern(1), _FakeConcern(3)]) == 100.0


def test_skin_condition_score_mixes_tiers() -> None:
    # one High (-15) + one Medium (-7) = 100 - 22 = 78
    assert _skin_condition_score([_FakeConcern(9), _FakeConcern(5)]) == 78.0


def test_skin_condition_score_clamps_at_zero() -> None:
    # 7 High-severity concerns would be 100 - 105 = -5, never negative
    assert _skin_condition_score([_FakeConcern(10)] * 7) == 0.0


def test_skin_condition_score_defaults_missing_severity_to_medium() -> None:
    # missing severity defaults to 5 (Medium) -> -7
    assert _skin_condition_score([_FakeConcern(None)]) == 93.0


# --- _lifestyle_score — equal-weighted exercise/stress/diet/sun-hygiene ---


def test_lifestyle_score_no_logs_is_neutral() -> None:
    assert _lifestyle_score([]) == 50.0


def test_lifestyle_score_best_case_is_near_ceiling() -> None:
    # exercise 5x/week=100, stress 1 (lowest)=100, diet 10=100, 0 sun hours=100
    log = {"exercise_frequency": 5, "stress_level": 1, "diet_quality": 10}
    assert _lifestyle_score([log]) == pytest.approx(100.0)


def test_lifestyle_score_sun_hygiene_penalizes_sun_hours() -> None:
    # A log with only sun_hours set: exercise/stress/diet all fall back to their "no
    # data" defaults (0, missing keys use `or 0`), so sun_hygiene = 100 - 10*10 = 0 is
    # the one component pulling this measurably below the 50-neutral of an empty log.
    log = {"environmental_exposure": {"sun_hours": 10}}
    score = _lifestyle_score([log])
    assert 0.0 <= score < 50.0


# --- _lifestyle_score's uv_index param — Milestone 2 Step 3.1's real "high
# unprotected UV index exposure" signal (weather_service.get_latest_uv_index) ---


def test_lifestyle_score_high_uv_with_sun_exposure_applies_extra_penalty() -> None:
    log = {
        "exercise_frequency": 5,
        "stress_level": 1,
        "diet_quality": 10,
        "environmental_exposure": {"sun_hours": 1},
    }
    without_uv = _lifestyle_score([log])
    with_high_uv = _lifestyle_score([log], uv_index=8.0)  # WHO "Very High"
    assert with_high_uv == pytest.approx(without_uv - 20.0)


def test_lifestyle_score_moderate_uv_applies_no_extra_penalty() -> None:
    log = {"environmental_exposure": {"sun_hours": 1}}
    # 5.0 is WHO "Moderate", below the 6.0 "High" threshold this component uses.
    assert _lifestyle_score([log], uv_index=5.0) == _lifestyle_score([log], uv_index=None)


def test_lifestyle_score_high_uv_with_no_sun_exposure_applies_no_extra_penalty() -> None:
    # A real high UV reading doesn't matter if the user reported zero sun exposure —
    # "unprotected exposure" requires both signals, not UV index alone.
    log = {"environmental_exposure": {"sun_hours": 0}}
    assert _lifestyle_score([log], uv_index=9.0) == _lifestyle_score([log], uv_index=None)


def test_lifestyle_score_uv_index_none_is_unchanged_from_before() -> None:
    # The honest-degrade case: no OpenUV reading was ever captured for this user.
    log = {"exercise_frequency": 3, "stress_level": 4, "diet_quality": 6}
    assert _lifestyle_score([log], uv_index=None) == _lifestyle_score([log])


# --- _sleep_quality_score — 60% duration (7-9h band) + 40% self-rated quality ---


def test_sleep_quality_score_no_logs_is_neutral() -> None:
    assert _sleep_quality_score([]) == 50.0


def test_sleep_quality_score_in_band_full_duration_credit() -> None:
    # 8h (in the 7-9 band) = 100 duration; quality 10/10 = 100 quality
    log = {"sleep_hours": 8, "sleep_quality": 10}
    assert _sleep_quality_score([log]) == pytest.approx(100.0)


def test_sleep_quality_score_penalizes_short_sleep() -> None:
    # 5h: 100 - (7-5)*20 = 60 duration; quality defaults to 5/10*100=50
    log = {"sleep_hours": 5}
    assert _sleep_quality_score([log]) == pytest.approx(0.6 * 60 + 0.4 * 50)


def test_sleep_quality_score_penalizes_long_sleep() -> None:
    # 11h: 100 - (11-9)*20 = 60 duration
    log = {"sleep_hours": 11}
    assert _sleep_quality_score([log]) == pytest.approx(0.6 * 60 + 0.4 * 50)


def test_sleep_quality_score_uses_most_recent_log_only() -> None:
    recent = {"sleep_hours": 8, "sleep_quality": 10}
    older = {"sleep_hours": 3, "sleep_quality": 1}
    assert _sleep_quality_score([recent, older]) == pytest.approx(100.0)


# --- _hydration_score — glasses/liters, 7-day window ---


def test_hydration_score_no_logs_is_neutral() -> None:
    assert _hydration_score([]) == 50.0


def test_hydration_score_two_liters_is_full_credit() -> None:
    # docs/AI_ML.md: min(100, glasses/8*100); 2L == 8 glasses (250ml/glass)
    assert _hydration_score([{"water_intake_liters": 2.0}]) == 100.0


def test_hydration_score_caps_at_one_hundred() -> None:
    assert _hydration_score([{"water_intake_liters": 5.0}]) == 100.0


def test_hydration_score_only_averages_last_seven_days() -> None:
    good_week = [{"water_intake_liters": 2.0}] * 7
    bad_extra_day = [{"water_intake_liters": 0.0}]
    assert _hydration_score(good_week + bad_extra_day) == 100.0


# --- _routine_adherence_score — real completed/scheduled from Mongo routine_logs ---


async def test_routine_adherence_score_neutral_with_no_routine(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    assert await _routine_adherence_score(db_session, scored_test_user_id) == 50.0


async def test_routine_adherence_score_neutral_with_routine_but_no_logs(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    await create_profile(
        db_session,
        scored_test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )
    await get_or_generate_routines(db_session, scored_test_user_id)

    assert await _routine_adherence_score(db_session, scored_test_user_id) == 50.0


async def test_routine_adherence_score_is_full_when_every_step_checked_today(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    await create_profile(
        db_session,
        scored_test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )
    routines = await get_or_generate_routines(db_session, scored_test_user_id)

    for routine in routines:
        for step in routine.steps:
            await toggle_step_completion(scored_test_user_id, step.step_id, True)

    assert await _routine_adherence_score(db_session, scored_test_user_id) == 100.0


async def test_routine_adherence_score_is_partial_when_half_checked(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    await create_profile(
        db_session,
        scored_test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )
    routines = await get_or_generate_routines(db_session, scored_test_user_id)
    all_steps = [step for routine in routines for step in routine.steps]

    for step in all_steps[: len(all_steps) // 2]:
        await toggle_step_completion(scored_test_user_id, step.step_id, True)

    score = await _routine_adherence_score(db_session, scored_test_user_id)
    assert score == pytest.approx(50.0, abs=100.0 / len(all_steps))


async def test_routine_adherence_score_unchecking_a_step_removes_credit(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    await create_profile(
        db_session,
        scored_test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )
    routines = await get_or_generate_routines(db_session, scored_test_user_id)
    first_step = routines[0].steps[0]

    await toggle_step_completion(scored_test_user_id, first_step.step_id, True)
    await toggle_step_completion(scored_test_user_id, first_step.step_id, False)

    assert await _routine_adherence_score(db_session, scored_test_user_id) == 0.0


# --- get_active_weights / compute_and_store_score — real DB round trip ---


async def test_get_active_weights_matches_scoring_weights_sum_to_one(
    db_session: AsyncSession,
) -> None:
    weights = await get_active_weights(db_session)
    total = (
        float(weights.skin_condition_weight)
        + float(weights.lifestyle_weight)
        + float(weights.sleep_quality_weight)
        + float(weights.routine_adherence_weight)
        + float(weights.hydration_weight)
    )
    # chk_weights_sum (the DB CHECK constraint) already guarantees this at the SQL
    # level — asserted here too so a regression shows up as a fast unit-test failure,
    # not just a future INSERT rejection.
    assert total == pytest.approx(1.00)


async def test_compute_and_store_score_persists_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=1,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=5, priority_level=5)],
        ),
    )

    result = await compute_and_store_score(db_session, test_user_id)

    overall_score = result.overall_score
    assert overall_score is not None
    assert 0.0 <= overall_score <= 100.0
    # weight_id was recorded — the score is traceable to the exact weights row used to
    # compute it (docs/ARCHITECTURE.md §7's config-driven scoring requirement).
    stored = await db_session.execute(select(SkinScore).where(SkinScore.user_id == test_user_id))
    row = stored.scalar_one()
    assert row.weight_id is not None
    row_overall_score = row.overall_score
    assert row_overall_score is not None
    # row.overall_score is a Decimal (Numeric column); result.overall_score is the
    # Pydantic schema's float — cast both sides so pytest.approx compares numerically
    # instead of raising on the mixed type.
    assert float(row_overall_score) == pytest.approx(float(overall_score))


async def test_compute_and_store_score_is_perfect_for_an_ideal_profile(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    """Milestone 2 Step 6.1 Test 1: a perfect data input outputs a perfect score.
    Zero concerns (skin_condition=100), one lifestyle log with ideal values covers
    lifestyle/sleep/hydration in one shot (they all read the same `logs` list), and
    every generated routine step checked off today gives 100% routine_adherence."""
    await create_profile(
        db_session,
        scored_test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )
    await upsert_lifestyle_log(
        scored_test_user_id,
        LifestyleLogCreate(
            log_date=datetime.datetime.now(datetime.UTC).date(),
            sleep_hours=8,
            sleep_quality=10,
            water_intake_liters=2.0,
            stress_level=1,
            diet_quality=10,
            exercise_frequency=5,
        ),
    )
    routines = await get_or_generate_routines(db_session, scored_test_user_id)
    for routine in routines:
        for step in routine.steps:
            await toggle_step_completion(scored_test_user_id, step.step_id, True)

    result = await compute_and_store_score(db_session, scored_test_user_id)

    assert result.overall_score == pytest.approx(100.0)


async def test_compute_and_store_score_reflects_a_real_captured_uv_reading(
    db_session: AsyncSession, scored_test_user_id: str
) -> None:
    """End-to-end: a real weather_uv_logs document (as weather/service.py's own
    get_weather_uv would have written) measurably lowers the stored lifestyle_score
    once real sun exposure is also logged — not just the pure-function unit tests
    above."""
    await create_profile(
        db_session,
        scored_test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
    )
    await upsert_lifestyle_log(
        scored_test_user_id,
        LifestyleLogCreate(
            log_date=datetime.datetime.now(datetime.UTC).date(),
            sleep_hours=8,
            sleep_quality=10,
            water_intake_liters=2.0,
            stress_level=1,
            diet_quality=10,
            exercise_frequency=5,
            environmental_exposure=EnvironmentalExposure(sun_hours=2),
        ),
    )

    try:
        without_uv = await compute_and_store_score(db_session, scored_test_user_id)

        await get_mongo_db()["weather_uv_logs"].insert_one(
            {
                "user_id": scored_test_user_id,
                "location": "12.9,77.6",
                "uv_index": 9.0,
                "captured_at": datetime.datetime.now(datetime.UTC),
            }
        )
        with_uv = await compute_and_store_score(db_session, scored_test_user_id)

        assert without_uv.lifestyle_score is not None
        assert with_uv.lifestyle_score == pytest.approx(without_uv.lifestyle_score - 20.0)
    finally:
        await get_mongo_db()["weather_uv_logs"].delete_many({"user_id": scored_test_user_id})


async def test_compute_and_store_score_upserts_same_day_instead_of_duplicating(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(skin_type_id=1, concerns=[]),
    )

    first = await compute_and_store_score(db_session, test_user_id)
    second = await compute_and_store_score(db_session, test_user_id)

    # Same calendar day -> same row updated in place (service.py's own documented
    # "one row per user per day" behavior), not a second history entry.
    assert first.score_id == second.score_id
    count_result = await db_session.execute(
        select(SkinScore).where(SkinScore.user_id == test_user_id)
    )
    assert len(count_result.scalars().all()) == 1


async def test_compute_and_store_score_requires_a_skin_profile(
    db_session: AsyncSession, test_user_id: str
) -> None:
    with pytest.raises(ValueError, match="No skin profile"):
        await compute_and_store_score(db_session, test_user_id)
