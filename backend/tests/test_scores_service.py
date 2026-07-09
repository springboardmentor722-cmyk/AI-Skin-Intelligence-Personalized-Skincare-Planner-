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

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.services.skin_profile.schemas import SkinProfileConcernInput, SkinProfileCreate
from app.services.skin_profile.service import create_profile


class _FakeConcern:
    def __init__(self, severity_rating: int | None) -> None:
        self.severity_rating = severity_rating


# --- _skin_condition_score — docs/AI_ML.md: "100 - mean(severities x10)" ---


def test_skin_condition_score_no_concerns_is_perfect() -> None:
    assert _skin_condition_score([]) == 100.0


def test_skin_condition_score_averages_severity() -> None:
    # mean severity 5 -> 100 - 50 = 50
    assert _skin_condition_score([_FakeConcern(5), _FakeConcern(5)]) == 50.0


def test_skin_condition_score_clamps_at_zero() -> None:
    # mean severity 10 would be 100 - 100 = 0, never negative
    assert _skin_condition_score([_FakeConcern(10), _FakeConcern(10)]) == 0.0


def test_skin_condition_score_defaults_missing_severity_to_five() -> None:
    assert _skin_condition_score([_FakeConcern(None)]) == 50.0


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


# --- _routine_adherence_score — deterministic ADR-007 stub ---


def test_routine_adherence_score_is_deterministic_per_user() -> None:
    assert _routine_adherence_score("user-abc") == _routine_adherence_score("user-abc")


def test_routine_adherence_score_stays_in_documented_range() -> None:
    for uid in ("user-1", "user-2", "user-3", "totally-different-id"):
        score = _routine_adherence_score(uid)
        assert 40.0 <= score <= 90.0


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
