import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.routines import service as routines_service
from app.services.scores.models import ScoringWeights, SkinScore
from app.services.scores.schemas import ScoreRead, ScoreWeightsRead
from app.services.skin_profile import service as skin_profile_service


async def get_active_weights(db: AsyncSession) -> ScoringWeights:
    result = await db.execute(select(ScoringWeights).where(ScoringWeights.is_active.is_(True)))
    weights = result.scalars().first()
    if weights is None:
        raise ValueError("No active scoring_weights row — seed data is missing")
    return weights


_HIGH_SEVERITY_DEDUCTION = 15.0
_MEDIUM_SEVERITY_DEDUCTION = 7.0


def _skin_condition_score(concerns: list[Any]) -> float:
    """Milestone 2 Step 3.1's tiered deduction: start at 100, subtract 15 pts per
    High-severity concern (severity_rating 8-10) and 7 pts per Medium (4-7); Low (1-3)
    costs nothing. Missing severity defaults to 5 (Medium), matching the prior
    formula's same default. Concern *identification* itself stays the ADR-007 stub
    (ConcernDetector echoes the profile's declared concerns) — this only changes how
    the declared severities convert into a condition score, per docs/AI_ML.md (updated
    to match)."""
    if not concerns:
        return 100.0
    deduction = 0.0
    for c in concerns:
        severity = c.severity_rating or 5
        if severity >= 8:
            deduction += _HIGH_SEVERITY_DEDUCTION
        elif severity >= 4:
            deduction += _MEDIUM_SEVERITY_DEDUCTION
    return max(0.0, 100.0 - deduction)


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


async def _routine_adherence_score(db: AsyncSession, user_id: str) -> float:
    """docs/AI_ML.md: 'completed checklist steps / scheduled steps, trailing 30 days'.
    Real implementation now that routine_logs (Mongo, M2) persists checklist
    completion (routines/service.py's toggle_step_completion) — replaces the ADR-007
    seeded_random stub. No active routine yet, or a routine with no logged days in the
    trailing-30-day window, stays a neutral 50.0 — the same "no data" convention
    _lifestyle_score/_sleep_quality_score/_hydration_score above already use in this
    file, not a punitive 0 or a random guess."""
    step_ids = await routines_service.list_active_step_ids(db, user_id)
    if not step_ids:
        return 50.0
    logs = await routines_service.list_recent_routine_logs(user_id, days=30)
    if not logs:
        return 50.0
    active_step_ids = set(step_ids)
    completed_count = sum(
        1
        for log in logs
        for entry in log.get("completed_steps", [])
        if entry.get("routine_step_id") in active_step_ids
    )
    scheduled = len(step_ids) * len(logs)
    return min(100.0, (completed_count / scheduled) * 100) if scheduled else 50.0


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
    routine_adherence = await _routine_adherence_score(db, user_id)

    overall = (
        float(weights.skin_condition_weight) * skin_condition
        + float(weights.lifestyle_weight) * lifestyle
        + float(weights.sleep_quality_weight) * sleep_quality
        + float(weights.routine_adherence_weight) * routine_adherence
        + float(weights.hydration_weight) * hydration
    )

    # Collapse to one row per user per day (mirrors lifestyle_logs' own "one doc per
    # user per day" shape) — repeated dashboard views update today's row in place
    # rather than spamming skin_scores with near-identical history. `calculated_at`
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
