import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.seeding import seeded_random
from app.services.scores.models import ScoringWeights, SkinScore
from app.services.scores.schemas import ScoreRead, ScoreWeightsRead
from app.services.skin_profile import service as skin_profile_service


async def get_active_weights(db: AsyncSession) -> ScoringWeights:
    result = await db.execute(select(ScoringWeights).where(ScoringWeights.is_active.is_(True)))
    weights = result.scalars().first()
    if weights is None:
        raise ValueError("No active scoring_weights row — seed data is missing")
    return weights


def _skin_condition_score(concerns: list[Any]) -> float:
    """docs/AI_ML.md: '100 - mean(active concern severities scaled x10)'. M1 has no
    real assessment yet (Skin Assessment is separate scope, ADR-007) — the stubbed
    ConcernDetector 'echoes the profile's declared concerns with fixed severities'
    (AI_ML.md stub semantics), so the declared skin_profile_concerns severities *are*
    that stub's output; no extra randomization layered on top."""
    if not concerns:
        return 100.0
    mean_severity = sum(c.severity_rating or 5 for c in concerns) / len(concerns)
    return max(0.0, 100.0 - mean_severity * 10)


def _lifestyle_score(logs: list[dict[str, Any]]) -> float:
    """docs/AI_ML.md names the 4 components (exercise, stress inverted, diet quality,
    sun-exposure hygiene) but not their sub-weights — equal-weighted here, a documented
    assumption (PROGRESS.md), not an invented schema field."""
    if not logs:
        return 50.0
    total = 0.0
    for log in logs:
        exercise = min(100.0, (log.get("exercise_frequency") or 0) / 5 * 100)
        stress = max(0.0, min(100.0, (10 - (log.get("stress_level") or 5)) / 9 * 100))
        diet = max(0.0, min(100.0, (log.get("diet_quality") or 5) / 10 * 100))
        sun_hours = (log.get("environmental_exposure") or {}).get("sun_hours") or 0
        sun_hygiene = max(0.0, 100.0 - sun_hours * 10)
        total += (exercise + stress + diet + sun_hygiene) / 4
    return total / len(logs)


def _sleep_quality_score(logs: list[dict[str, Any]]) -> float:
    """docs/AI_ML.md: '60% duration score (7-9h band=100, linear falloff) + 40% self-
    rated quality'. Uses the most recent log — a 'today' figure — since the doc gives
    no window for this component (unlike lifestyle's 30-day / hydration's 7-day)."""
    if not logs:
        return 50.0
    latest = logs[0]
    hours = latest.get("sleep_hours")
    if hours is None:
        duration_score = 50.0
    elif 7 <= hours <= 9:
        duration_score = 100.0
    elif hours < 7:
        duration_score = max(0.0, 100.0 - (7 - hours) * 20)
    else:
        duration_score = max(0.0, 100.0 - (hours - 9) * 20)
    quality_score = ((latest.get("sleep_quality") or 5) / 10) * 100
    return 0.6 * duration_score + 0.4 * quality_score


def _hydration_score(logs: list[dict[str, Any]]) -> float:
    """docs/AI_ML.md: 'min(100, glasses/day / 8 * 100), 7-day average'. lifestyle_logs
    stores liters, not glasses — converted via the standard 250ml glass (8 glasses =
    2L/day), not an invented ratio."""
    window = logs[:7]
    if not window:
        return 50.0
    total = sum(
        min(100.0, ((log.get("water_intake_liters") or 0) / 2.0) * 100) for log in window
    )
    return total / len(window)


def _routine_adherence_score(user_id: str) -> float:
    """No completed-checklist-steps tracking exists anywhere in the documented schema
    (database_schemas/ — routines/routine_steps have no completion state, no Mongo
    collection for it either) — treated as an ADR-007 deterministic stub, the same
    pattern the docs already sanction for unbuilt AI/data surfaces, rather than
    inventing new persistence here. Tracked as a known gap in PROGRESS.md."""
    return seeded_random(user_id, "routine_adherence").uniform(40.0, 90.0)


async def compute_and_store_score(db: AsyncSession, user_id: str) -> ScoreRead:
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        raise ValueError("No skin profile yet")

    weights = await get_active_weights(db)
    logs = await skin_profile_service.list_recent_lifestyle_logs(user_id, limit=30)

    skin_condition = _skin_condition_score(profile.concerns)
    lifestyle = _lifestyle_score(logs)
    sleep_quality = _sleep_quality_score(logs)
    hydration = _hydration_score(logs)
    routine_adherence = _routine_adherence_score(user_id)

    overall = (
        float(weights.skin_condition_weight) * skin_condition
        + float(weights.lifestyle_weight) * lifestyle
        + float(weights.sleep_quality_weight) * sleep_quality
        + float(weights.routine_adherence_weight) * routine_adherence
        + float(weights.hydration_weight) * hydration
    )

    # Collapse to one row per user per day (mirrors lifestyle_logs' own "one doc per
    # user per day" shape) — repeated dashboard views update today's row in place
    # rather than spamming skin_scores with near-identical history.
    today = datetime.date.today()
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
    score history through this, never the `skin_scores` table directly."""
    since = datetime.datetime.now(datetime.UTC).replace(tzinfo=None) - datetime.timedelta(
        days=days
    )
    result = await db.execute(
        select(SkinScore)
        .where(SkinScore.user_id == user_id, SkinScore.calculated_at >= since)
        .order_by(SkinScore.calculated_at.asc())
    )
    return list(result.scalars().all())
