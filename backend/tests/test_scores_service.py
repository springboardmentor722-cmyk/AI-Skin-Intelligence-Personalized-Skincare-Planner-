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
import math
import random
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.mongo import get_mongo_db
from app.db.postgres import external_user_table
from app.main import app
from app.services.routines.service import get_or_generate_routines, toggle_step_completion
from app.services.scores import constants
from app.services.scores.models import SkinScore
from app.services.scores.scoring_engine import (
    _hydration_score,
    _lifestyle_score,
    _routine_adherence_score,
    _skin_condition_score,
    _sleep_quality_score,
    calculate_skin_health_score,
    derive_skin_age,
    representative_age_for_group,
    score_band,
)
from app.services.scores.service import (
    compute_and_store_score,
    count_all_assessments,
    get_active_weights,
    get_recent_scores,
    get_recent_scores_for_users,
    get_score_by_id,
)
from app.services.skin_profile.schemas import (
    EnvironmentalExposure,
    LifestyleLogCreate,
    SkinProfileConcernInput,
    SkinProfileCreate,
)
from app.services.skin_profile.service import create_profile, upsert_lifestyle_log

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1
_DOC_WEIGHTS = {
    "skin_condition_weight": constants.SKIN_CONDITION_WEIGHT,
    "lifestyle_weight": constants.LIFESTYLE_WEIGHT,
    "sleep_quality_weight": constants.SLEEP_QUALITY_WEIGHT,
    "routine_adherence_weight": constants.ROUTINE_ADHERENCE_WEIGHT,
    "hydration_weight": constants.HYDRATION_WEIGHT,
}


class _FakeConcern:
    def __init__(self, severity_rating: int | None, concern_name: str | None = None) -> None:
        self.severity_rating = severity_rating
        self.concern_name = concern_name


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


def test_skin_condition_score_exactly_100_deduction_is_exactly_zero() -> None:
    # ADR-034: deduction <= 100 is still bit-for-bit the docx's literal formula, no
    # saturation involved, right up to and including the boundary. 2 High (-30) +
    # 10 Medium (-70) = exactly 100 deduction.
    concerns = [_FakeConcern(10)] * 2 + [_FakeConcern(5)] * 10
    assert _skin_condition_score(concerns) == 0.0


def test_skin_condition_score_past_the_floor_keeps_discriminating() -> None:
    # ADR-034 (M2_RECOVERY_AND_REVIEW.md §5 item 2): 7 High-severity concerns is
    # 105 deduction — past the docx's specified range entirely. Previously this
    # clamped to a flat 0, indistinguishable from 8, 9, or 10 High concerns. Now it
    # decays from 0 toward, never reaching, -CONDITION_SATURATION_TAIL_SCALE (5.0) —
    # continuous with the linear branch's boundary value (see the continuity test
    # below), not a jump up to +5.0.
    seven_high = _skin_condition_score([_FakeConcern(10)] * 7)
    eight_high = _skin_condition_score([_FakeConcern(10)] * 8)
    ten_high = _skin_condition_score([_FakeConcern(10)] * 10)
    assert seven_high == pytest.approx(-5.0 * (1 - math.exp(-1)), abs=1e-9)
    assert -5.0 < ten_high < eight_high < seven_high < 0.0


def test_skin_condition_score_is_continuous_at_the_saturation_boundary() -> None:
    # Regression test: the original tail formula started at +CONDITION_SATURATION_TAIL_SCALE
    # for any deduction just past 100, while the linear branch is exactly 0 at
    # deduction==100 — a worse profile (higher deduction) briefly scored *better*
    # right at the seam (e.g. deduction 101 scored ~4.09 while deduction 97 scored
    # 3.0). The tail must start at 0 and only ever move the score down from there.
    deduction_97 = _skin_condition_score([_FakeConcern(10)] * 6 + [_FakeConcern(5)])
    deduction_100 = _skin_condition_score([_FakeConcern(10)] * 2 + [_FakeConcern(5)] * 10)
    deduction_101 = _skin_condition_score([_FakeConcern(10)] * 3 + [_FakeConcern(5)] * 8)
    assert deduction_97 == 3.0
    assert deduction_100 == 0.0
    assert deduction_101 == pytest.approx(-5.0 * (1 - math.exp(-1 / 5)), abs=1e-9)
    assert deduction_101 < deduction_100 < deduction_97


def test_skin_condition_score_defaults_missing_severity_to_medium() -> None:
    # missing severity defaults to 5 (Medium) -> -7
    assert _skin_condition_score([_FakeConcern(None)]) == 93.0


def test_skin_condition_score_collapses_synonym_pair_to_higher_severity() -> None:
    # Hyperpigmentation (High) + Dark Spots (Medium) is one condition split across
    # two cards (web/lib/assessment/skin-concerns.json) -> counted once, at High.
    concerns = [
        _FakeConcern(9, concern_name="Hyperpigmentation"),
        _FakeConcern(5, concern_name="Dark Spots"),
    ]
    assert _skin_condition_score(concerns) == 85.0


def test_skin_condition_score_synonym_pair_does_not_double_count_at_max_severity() -> None:
    # Both Wrinkles and Fine Lines at severity 8 must cost -15 once, not -30.
    concerns = [
        _FakeConcern(8, concern_name="Wrinkles"),
        _FakeConcern(8, concern_name="Fine Lines"),
    ]
    assert _skin_condition_score(concerns) == 85.0


def test_skin_condition_score_unrelated_concerns_still_count_separately() -> None:
    # Acne and Redness share no synonym group -> both deducted independently.
    concerns = [
        _FakeConcern(9, concern_name="Acne"),
        _FakeConcern(9, concern_name="Redness"),
    ]
    assert _skin_condition_score(concerns) == 70.0


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


def test_hydration_score_three_liters_is_full_credit() -> None:
    # MILESTONE 2.docx §2's "3.0 L daily fluid benchmark" (ADR-028 — this was a
    # hardcoded 2.0L bug before P10).
    assert _hydration_score([{"water_intake_liters": 3.0}]) == 100.0


def test_hydration_score_two_liters_is_not_quite_full_credit() -> None:
    # 2L / 3L benchmark = 66.67, not 100 — the pre-P10 bug would have wrongly
    # given this full credit.
    assert _hydration_score([{"water_intake_liters": 2.0}]) == pytest.approx(66.67, abs=0.01)


def test_hydration_score_caps_at_one_hundred() -> None:
    assert _hydration_score([{"water_intake_liters": 5.0}]) == 100.0


def test_hydration_score_only_averages_last_seven_days() -> None:
    good_week = [{"water_intake_liters": 3.0}] * 7
    bad_extra_day = [{"water_intake_liters": 0.0}]
    assert _hydration_score(good_week + bad_extra_day) == 100.0


# --- _routine_adherence_score — pure function (Milestone 2 P10's own purity
# guardrail: no I/O, no clock read; scores/service.py fetches step_ids/logs and
# owns the 14-day window). ADR-028: no active routine, or no logged days in the
# window, defaults to 100 (MILESTONE 2.docx's literal "defaults to 100% for a
# new assessment with no history") — the pre-P10 code defaulted to a neutral 50,
# matching the *other*, non-canonical mile_2.docx instead. The real end-to-end
# round trip (routine generation + Mongo completion logs feeding a real score)
# stays covered by test_compute_and_store_score_is_perfect_for_an_ideal_profile
# below, which already exercises the full path.


def test_routine_adherence_score_defaults_to_100_with_no_active_routine() -> None:
    assert _routine_adherence_score([], []) == 100.0


def test_routine_adherence_score_defaults_to_100_with_a_routine_but_no_logs() -> None:
    assert _routine_adherence_score([1, 2, 3], []) == 100.0


def test_routine_adherence_score_is_full_when_every_step_checked_every_day() -> None:
    logs = [{"completed_steps": [{"routine_step_id": 1}, {"routine_step_id": 2}]}] * 14
    assert _routine_adherence_score([1, 2], logs) == 100.0


def test_routine_adherence_score_is_partial_when_half_checked() -> None:
    logs = [{"completed_steps": [{"routine_step_id": 1}]}] * 14  # only step 1 of 2, every day
    assert _routine_adherence_score([1, 2], logs) == 50.0


def test_routine_adherence_score_ignores_a_completed_step_no_longer_active() -> None:
    # A step logged as completed that isn't in the *current* active step set
    # (e.g. the routine was regenerated) shouldn't count toward adherence.
    logs = [{"completed_steps": [{"routine_step_id": 999}]}] * 14
    assert _routine_adherence_score([1, 2], logs) == 0.0


def test_routine_adherence_score_counts_unlogged_days_as_missed_not_excluded() -> None:
    # Regression (bug_report.md 2026-07-30, bug #1): `scheduled` used to be
    # len(step_ids) * len(logs), so a user who only opened the app 2 of the 14 window
    # days (and did everything both times) scored 100% adherence — identical to
    # someone logging honestly every day. Unlogged days shrank the denominator
    # instead of counting as misses.
    logs = [{"completed_steps": [{"routine_step_id": 1}, {"routine_step_id": 2}]}] * 2
    assert _routine_adherence_score([1, 2], logs) == pytest.approx(2 / 14 * 100)


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


async def test_get_recent_scores_for_users_matches_the_per_user_call(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """The bulk helper exists to remove an unbounded N+1 from
    `clinical_review.get_portfolio_stats`, so it has to be a drop-in for the
    per-user `get_recent_scores` it replaced — same rows, same ascending
    `calculated_at` order."""
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=1,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=5, priority_level=5)],
        ),
    )
    await compute_and_store_score(db_session, test_user_id)

    single = await get_recent_scores(db_session, test_user_id, days=90)
    bulk = await get_recent_scores_for_users(db_session, [test_user_id], days=90)

    assert [s.score_id for s in bulk[test_user_id]] == [s.score_id for s in single]
    assert single  # the fixture above really did store a row, so this isn't vacuous


async def test_get_recent_scores_for_users_returns_an_entry_for_every_requested_user(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """Callers index the result directly, so a user with no scores in the window
    must map to `[]` rather than be missing — and an empty request short-circuits
    instead of issuing an `IN ()`."""
    result = await get_recent_scores_for_users(db_session, [test_user_id, "no-such-user"], days=90)

    assert set(result) == {test_user_id, "no-such-user"}
    assert result["no-such-user"] == []
    assert await get_recent_scores_for_users(db_session, [], days=90) == {}


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
            water_intake_liters=3.0,
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


async def test_count_all_assessments_increases_after_a_real_score_is_stored(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # Analytics' admin platform-wide metric (M3-F, PDF §8 "assessment counts") —
    # real Postgres COUNT(*), not an estimate.
    before = await count_all_assessments(db_session)

    await create_profile(db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[]))
    await compute_and_store_score(db_session, test_user_id)

    after = await count_all_assessments(db_session)
    assert after == before + 1


# --- Milestone 2 P10 mandated tests (MILESTONE_2_MASTER_PROMPT.md P10) ---


def test_scoring_accuracy_test_optimal_parameters_yield_the_maximum_weighted_score() -> None:
    """MANDATED — mile_2.docx §5 "Automated Testing & QA Criteria (Pytest)": the
    "Scoring Accuracy Test". Every sub-score at its ceiling (100) must yield the
    composite's own ceiling. Weights sum to 1.00 (chk_weights_sum), so this is
    exactly 100.0, not an approximation of it."""
    overall = calculate_skin_health_score(
        skin_condition=100.0,
        lifestyle=100.0,
        sleep_quality=100.0,
        routine_adherence=100.0,
        hydration=100.0,
        **_DOC_WEIGHTS,
    )
    assert overall == pytest.approx(100.0)


def test_worst_case_inputs_floor_the_composite_at_zero() -> None:
    overall = calculate_skin_health_score(
        skin_condition=0.0,
        lifestyle=0.0,
        sleep_quality=0.0,
        routine_adherence=0.0,
        hydration=0.0,
        **_DOC_WEIGHTS,
    )
    assert overall == pytest.approx(0.0)


@pytest.mark.parametrize(
    "key",
    [
        "skin_condition_weight",
        "lifestyle_weight",
        "sleep_quality_weight",
        "routine_adherence_weight",
        "hydration_weight",
    ],
)
def test_each_weight_contributes_exactly_its_documented_share(key: str) -> None:
    """Isolate one sub-score at 100 with every other at 0 — the composite must
    equal exactly that one weight's documented share (0.35/0.20/0.15/0.20/0.10 *
    100), proving no weight silently contributes more or less than the doc says."""
    sub_scores = {
        "skin_condition": 0.0,
        "lifestyle": 0.0,
        "sleep_quality": 0.0,
        "routine_adherence": 0.0,
        "hydration": 0.0,
    }
    sub_score_key = key.removesuffix("_weight")
    sub_scores[sub_score_key] = 100.0

    overall = calculate_skin_health_score(**sub_scores, **_DOC_WEIGHTS)

    assert overall == pytest.approx(_DOC_WEIGHTS[key] * 100.0)


def test_composite_stays_within_bounds_across_a_wide_randomised_sweep() -> None:
    """500+ random profiles, deterministically seeded (reproducible, not flaky) —
    the composite of any combination of five 0-100 sub-scores must stay in [0,100]."""
    rng = random.Random(20260724)
    for _ in range(500):
        overall = calculate_skin_health_score(
            skin_condition=rng.uniform(0.0, 100.0),
            lifestyle=rng.uniform(0.0, 100.0),
            sleep_quality=rng.uniform(0.0, 100.0),
            routine_adherence=rng.uniform(0.0, 100.0),
            hydration=rng.uniform(0.0, 100.0),
            **_DOC_WEIGHTS,
        )
        assert 0.0 <= overall <= 100.0


def test_calculate_skin_health_score_is_deterministic() -> None:
    """Guardrail: the sub-score functions (and the composite) are pure — same
    input, same output, always, across repeated calls."""
    kwargs = {
        "skin_condition": 62.5,
        "lifestyle": 71.0,
        "sleep_quality": 88.0,
        "routine_adherence": 40.0,
        "hydration": 66.67,
        **_DOC_WEIGHTS,
    }
    results = {calculate_skin_health_score(**kwargs) for _ in range(50)}
    assert len(results) == 1


def test_sub_score_functions_are_deterministic() -> None:
    concerns = [_FakeConcern(8), _FakeConcern(4)]
    log = {
        "exercise_frequency": 3,
        "stress_level": 6,
        "diet_quality": 7,
        "sleep_hours": 6.5,
        "sleep_quality": 6,
        "water_intake_liters": 1.5,
        "environmental_exposure": {"sun_hours": 2},
    }
    assert len({_skin_condition_score(concerns) for _ in range(20)}) == 1
    assert len({_lifestyle_score([log], uv_index=7.0) for _ in range(20)}) == 1
    assert len({_sleep_quality_score([log]) for _ in range(20)}) == 1
    assert len({_hydration_score([log]) for _ in range(20)}) == 1
    assert len({_routine_adherence_score([1, 2], [log]) for _ in range(20)}) == 1


async def test_a_new_user_with_no_completion_logs_receives_adherence_100(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """MILESTONE 2.docx §2: "defaults to 100% for a new assessment with no
    history" — a brand-new profile, no routine ever generated, through the real
    compute_and_store_score path (not just the pure function in isolation)."""
    await create_profile(db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[]))

    result = await compute_and_store_score(db_session, test_user_id)

    assert result.routine_adherence_score == pytest.approx(100.0)


# --- score_band — the P1 Good/Fair/Poor ramp ---


def test_score_band_boundaries() -> None:
    assert score_band(100) == "Good"
    assert score_band(75) == "Good"
    assert score_band(74) == "Fair"
    assert score_band(60) == "Fair"
    assert score_band(59) == "Poor"
    assert score_band(0) == "Poor"


# --- Skin Age (decision C6, ADR-028) ---


def test_representative_age_for_group_matches_every_band() -> None:
    assert representative_age_for_group("Under 18") == 16.0
    assert representative_age_for_group("18-24") == 21.0
    assert representative_age_for_group("25-34") == 29.5
    assert representative_age_for_group("65+") == 70.0


def test_representative_age_for_group_is_none_for_unset_or_unknown() -> None:
    assert representative_age_for_group(None) is None
    assert representative_age_for_group("not-a-real-band") is None


def test_derive_skin_age_matches_actual_age_for_a_perfect_condition_score() -> None:
    assert derive_skin_age(skin_condition_score=100.0, actual_age=30.0) == pytest.approx(30.0)


def test_derive_skin_age_ages_up_by_the_max_penalty_for_a_zero_condition_score() -> None:
    assert derive_skin_age(skin_condition_score=0.0, actual_age=30.0) == pytest.approx(
        30.0 + constants.SKIN_AGE_MAX_PENALTY_YEARS
    )


def test_derive_skin_age_is_monotonic_with_condition_score() -> None:
    better = derive_skin_age(skin_condition_score=80.0, actual_age=30.0)
    worse = derive_skin_age(skin_condition_score=40.0, actual_age=30.0)
    assert better < worse


async def test_compute_and_store_score_includes_skin_age_when_age_group_is_set(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(skin_type_id=1, age_group="25-34", concerns=[]),
    )

    result = await compute_and_store_score(db_session, test_user_id)

    assert result.skin_age is not None
    assert result.band in ("Good", "Fair", "Poor")


async def test_compute_and_store_score_skin_age_is_none_without_an_age_group(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[]))

    result = await compute_and_store_score(db_session, test_user_id)

    assert result.skin_age is None


# --- GET /api/v1/assessment/score/{id} (P10) ---


async def test_get_score_by_id_returns_none_for_an_unknown_id(
    db_session: AsyncSession, test_user_id: str
) -> None:
    assert await get_score_by_id(db_session, test_user_id, 999_999) is None


async def test_get_score_by_id_returns_none_for_another_users_score(
    db_session: AsyncSession, test_user_id: str
) -> None:
    other_user_id = f"{test_user_id}-other"

    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other User",
            emailVerified=False,
        )
    )
    await db_session.flush()
    await create_profile(db_session, other_user_id, SkinProfileCreate(skin_type_id=1, concerns=[]))
    other_score = await compute_and_store_score(db_session, other_user_id)

    assert await get_score_by_id(db_session, test_user_id, other_score.score_id) is None


async def test_get_score_by_id_returns_the_real_score_for_its_owner(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[]))
    stored = await compute_and_store_score(db_session, test_user_id)

    fetched = await get_score_by_id(db_session, test_user_id, stored.score_id)

    assert fetched is not None
    assert fetched.score_id == stored.score_id
    assert fetched.overall_score == pytest.approx(stored.overall_score)


async def test_score_by_id_endpoint_404s_for_an_unknown_id(client: AsyncClient) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": "test-score-endpoint-404",
        "role": "user",
        "claims": {},
    }
    try:
        response = await client.get("/api/v1/assessment/score/999999999")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404
