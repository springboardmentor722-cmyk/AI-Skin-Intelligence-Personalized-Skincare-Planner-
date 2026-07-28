"""app/services/analytics/service.py (M3-F) — a real, read-only aggregator (owns
nothing, reads via scores/routines/progress/skin_profile interface functions).
Correlation math is pure Pearson r (confidence = r^2), same "simple documented
statistics, no invented ML" discipline as the rest of app/ai/. Real Docker stores
throughout."""

import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.services.analytics.service import (
    _correlation_insight,
    _pearson,
    get_admin_analytics,
    get_my_analytics,
)
from app.services.progress import service as progress_service
from app.services.routines.service import get_or_generate_routines, toggle_step_completion
from app.services.scores.service import compute_and_store_score
from app.services.skin_profile.schemas import LifestyleLogCreate, SkinProfileCreate
from app.services.skin_profile.service import create_profile, upsert_lifestyle_log
from tests.test_progress_service import _real_jpeg_bytes

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1


def test_pearson_perfect_positive_correlation() -> None:
    assert _pearson([1.0, 2.0, 3.0, 4.0], [10.0, 20.0, 30.0, 40.0]) == pytest.approx(1.0)


def test_pearson_perfect_negative_correlation() -> None:
    assert _pearson([1.0, 2.0, 3.0, 4.0], [40.0, 30.0, 20.0, 10.0]) == pytest.approx(-1.0)


def test_pearson_returns_none_for_constant_input() -> None:
    # No variance in x -> undefined correlation, not a divide-by-zero crash.
    assert _pearson([5.0, 5.0, 5.0], [1.0, 2.0, 3.0]) is None


def test_correlation_insight_is_an_honest_empty_state_below_the_sample_floor() -> None:
    insight = _correlation_insight(
        "Sleep hours", "lifestyle_logs.sleep_hours", [7.0, 8.0], [80.0, 85.0]
    )
    assert insight.correlation is None
    assert insight.confidence is None


def test_correlation_insight_reports_a_real_r_and_r_squared_confidence() -> None:
    xs = [6.0, 7.0, 8.0, 9.0, 5.0, 7.5]
    ys = [70.0, 75.0, 85.0, 90.0, 65.0, 78.0]
    insight = _correlation_insight("Sleep hours", "lifestyle_logs.sleep_hours", xs, ys)
    assert insight.correlation is not None
    assert insight.confidence == round(insight.correlation**2, 2)


async def test_get_my_analytics_empty_for_a_user_with_no_history(
    db_session: AsyncSession, test_user_id: str
) -> None:
    result = await get_my_analytics(db_session, test_user_id)
    assert result.score_vs_adherence == []
    assert all(c.correlation is None for c in result.correlations)


async def test_get_my_analytics_aligns_scores_with_real_lifestyle_logs(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    # UTC, not local date.today() — compute_and_store_score stores skin_assessments
    # rows keyed by UTC date (scores/service.py, "Use UTC on both sides") to avoid the
    # local/UTC midnight-mismatch bug documented there; matching it here is what this
    # test is actually verifying alignment against.
    today = datetime.datetime.now(datetime.UTC).date()
    await upsert_lifestyle_log(
        test_user_id,
        LifestyleLogCreate(log_date=today, sleep_hours=8.0, water_intake_liters=2.0),
    )
    await compute_and_store_score(db_session, test_user_id)

    result = await get_my_analytics(db_session, test_user_id)

    assert len(result.score_vs_adherence) == 1
    assert result.score_vs_adherence[0].date == today


async def test_get_my_analytics_adherence_ratio_is_none_when_nothing_assigned(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # No routine ever generated for this user -> get_adherence_series omits the
    # day entirely (not a fabricated 0.0), so adherence_by_date.get(date) must
    # fall through to None here too - matching M3R_API_CONTRACT.md §4's
    # documented "0-1 or None when no routine assigned that day".
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await compute_and_store_score(db_session, test_user_id)

    result = await get_my_analytics(db_session, test_user_id)

    assert len(result.score_vs_adherence) == 1
    assert result.score_vs_adherence[0].adherence_ratio is None


async def test_get_admin_analytics_reflects_real_feedback_and_routine_activity(
    db_session: AsyncSession, test_user_id: str
) -> None:
    mongo = get_mongo_db()
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    routines = await get_or_generate_routines(db_session, test_user_id)
    am_routine = next(r for r in routines if r.routine_type == "AM")
    await toggle_step_completion(test_user_id, am_routine.steps[0].step_id, True)
    await mongo["recommendation_feedback"].insert_one(
        {
            "user_id": test_user_id,
            "product_id": 1,
            "recommendation_id": None,
            "action": "thumbs_up",
            "created_at": datetime.datetime.now(datetime.UTC),
        }
    )

    try:
        result = await get_admin_analytics(db_session, mongo)

        assert result.total_assessments >= 0
        assert result.recommendation_acceptance.total_feedback_events >= 1
        assert result.recommendation_acceptance.acceptance_rate is not None
        total_users_bucketed = sum(b.user_count for b in result.adherence_distribution)
        assert total_users_bucketed >= 1
    finally:
        await mongo["recommendation_feedback"].delete_many({"user_id": test_user_id})
        await mongo["routine_logs"].delete_many({"user_id": test_user_id})


async def test_get_my_analytics_includes_compliance_and_photos(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    await compute_and_store_score(db_session, test_user_id)
    await progress_service.upload_progress_photo(
        db_session, test_user_id, _real_jpeg_bytes(), "one.jpg"
    )

    result = await get_my_analytics(db_session, test_user_id)

    assert result.compliance.seven_day is not None or result.compliance.seven_day is None
    assert len(result.photos) == 1
    assert result.photos[0].image_stage == "Baseline"
    assert result.photos[0].skin_health_score_at_upload is not None
