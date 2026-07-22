import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.scores import scoring_engine
from app.services.scores.models import ScoringWeights, SkinScore
from app.services.scores.schemas import ScoreRead, ScoreWeightsRead
from app.services.scores.scoring_engine import (
    _hydration_score,
    _lifestyle_score,
    _routine_adherence_score,
    _skin_condition_score,
    _sleep_quality_score,
)
from app.services.skin_profile import service as skin_profile_service
from app.services.weather import service as weather_service

# The Weighted Scoring Model's math (the 5 sub-score functions + the weighted-sum
# equation) lives in scoring_engine.py (mile_2.docx Step 3.1's explicit "In a file
# named scoring_engine.py..." requirement) — this module owns fetching the raw
# inputs and persisting the result, never the calculation itself.


async def get_active_weights(db: AsyncSession) -> ScoringWeights:
    result = await db.execute(select(ScoringWeights).where(ScoringWeights.is_active.is_(True)))
    weights = result.scalars().first()
    if weights is None:
        raise ValueError("No active scoring_weights row — seed data is missing")
    return weights


async def compute_and_store_score(db: AsyncSession, user_id: str) -> ScoreRead:
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        raise ValueError("No skin profile yet")

    weights = await get_active_weights(db)
    logs = await skin_profile_service.list_recent_lifestyle_logs(user_id, limit=30)
    uv_index = await weather_service.get_latest_uv_index(user_id)

    skin_condition = _skin_condition_score(profile.concerns)
    lifestyle = _lifestyle_score(logs, uv_index=uv_index)
    sleep_quality = _sleep_quality_score(logs)
    hydration = _hydration_score(logs)
    routine_adherence = await _routine_adherence_score(db, user_id)

    overall = scoring_engine.calculate_skin_health_score(
        skin_condition=skin_condition,
        lifestyle=lifestyle,
        sleep_quality=sleep_quality,
        routine_adherence=routine_adherence,
        hydration=hydration,
        skin_condition_weight=float(weights.skin_condition_weight),
        lifestyle_weight=float(weights.lifestyle_weight),
        sleep_quality_weight=float(weights.sleep_quality_weight),
        routine_adherence_weight=float(weights.routine_adherence_weight),
        hydration_weight=float(weights.hydration_weight),
    )

    # Collapse to one row per user per day (mirrors lifestyle_logs' own "one doc per
    # user per day" shape) — repeated dashboard views update today's row in place
    # rather than spamming skin_assessments with near-identical history. `calculated_at`
    # is `server_default=func.now()`, i.e. the DB server's (UTC, in Docker Postgres)
    # clock — comparing it against local `date.today()` caused duplicate rows for
    # ~5-6 hours daily whenever local time had crossed midnight but UTC hadn't yet
    # (or vice versa). Use UTC on both sides, matching `get_recent_scores` below.
    today = datetime.datetime.now(datetime.UTC).date()
    existing_result = await db.execute(
        select(SkinScore)
        .where(SkinScore.user_id == user_id)
        .order_by(SkinScore.calculated_at.desc().nulls_last())
        .limit(1)
    )
    existing = existing_result.scalars().first()

    if (
        existing is not None
        and existing.calculated_at is not None
        and existing.calculated_at.date() == today
    ):
        score = existing
    else:
        score = SkinScore(user_id=user_id)
        db.add(score)

    score.skin_condition_score = skin_condition
    score.lifestyle_score = lifestyle
    score.sleep_quality_score = sleep_quality
    score.hydration_score = hydration
    score.routine_adherence_score = routine_adherence
    score.overall_score = overall
    score.weight_id = weights.weight_id

    await db.commit()
    await db.refresh(score)

    return ScoreRead(
        score_id=score.score_id,
        skin_condition_score=score.skin_condition_score,
        lifestyle_score=score.lifestyle_score,
        sleep_quality_score=score.sleep_quality_score,
        hydration_score=score.hydration_score,
        routine_adherence_score=score.routine_adherence_score,
        overall_score=score.overall_score,
        weights=ScoreWeightsRead.model_validate(weights),
        calculated_at=score.calculated_at,
    )


async def get_recent_scores(db: AsyncSession, user_id: str, days: int = 30) -> list[SkinScore]:
    """Interface function (ADR-005) — Progress Tracking's dashboard summary reads
    score history through this, never the `skin_assessments` table directly."""
    since = datetime.datetime.now(datetime.UTC).replace(tzinfo=None) - datetime.timedelta(days=days)
    result = await db.execute(
        select(SkinScore)
        .where(SkinScore.user_id == user_id, SkinScore.calculated_at >= since)
        .order_by(SkinScore.calculated_at.asc())
    )
    return list(result.scalars().all())


async def count_all_assessments(db: AsyncSession) -> int:
    """Interface function (ADR-005) — Analytics' admin platform-wide metric
    (M3-F, PDF §8 "assessment counts") reads this real count through here, never
    `skin_assessments` directly."""
    return (await db.execute(select(func.count()).select_from(SkinScore))).scalar_one()
