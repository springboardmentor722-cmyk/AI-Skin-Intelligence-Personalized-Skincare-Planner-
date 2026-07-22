from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.metrics import get_latency_stats
from app.services.analytics.schemas import (
    AdherenceDistributionBucket,
    AnalyticsAdminRead,
    AnalyticsMeRead,
    CorrelationInsight,
    LatencyStatsRead,
    RecommendationAcceptanceRead,
    ScoreAdherencePoint,
)
from app.services.progress import service as progress_service
from app.services.routines import service as routines_service
from app.services.scores import service as scores_service
from app.services.skin_profile import service as skin_profile_service

# Analytics owns nothing (docs/ARCHITECTURE.md §4 #10) — every value here is read
# through another service's interface function, never a table this module maps
# itself. "Simple documented statistics, no invented ML" (milestone_3.md §M3-F):
# a plain Pearson correlation coefficient, confidence = r^2 (the standard
# "fraction of variance explained" reading), same discipline as
# app/ai/trend.py's R²-as-confidence.
_MIN_POINTS_FOR_CORRELATION = 5
_ADHERENCE_BUCKETS = ("0-25%", "25-50%", "50-75%", "75-100%")
_ADHERENCE_WINDOW_DAYS = 7


def _pearson(xs: list[float], ys: list[float]) -> float | None:
    n = len(xs)
    if n < 2:
        return None
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=True))
    variance_x = sum((x - mean_x) ** 2 for x in xs)
    variance_y = sum((y - mean_y) ** 2 for y in ys)
    if variance_x == 0 or variance_y == 0:
        return None
    return float(covariance / (variance_x**0.5 * variance_y**0.5))


def _correlation_insight(
    label: str, data_source: str, xs: list[float], ys: list[float]
) -> CorrelationInsight:
    name = label.lower()
    if len(xs) < _MIN_POINTS_FOR_CORRELATION:
        return CorrelationInsight(
            label=label,
            data_source=data_source,
            correlation=None,
            confidence=None,
            summary=f"Not enough logged {name} history yet to correlate with your Skin Score.",
        )
    r = _pearson(xs, ys)
    if r is None:
        return CorrelationInsight(
            label=label,
            data_source=data_source,
            correlation=None,
            confidence=None,
            summary=f"Not enough variation in {name} yet to correlate with your Skin Score.",
        )
    direction = "higher" if r > 0 else "lower"
    strength = "Strong" if abs(r) > 0.6 else "Moderate" if abs(r) > 0.3 else "Weak"
    summary = f"{strength} link: {direction} {name} tends to track with a {direction} Skin Score."
    rounded_r = round(r, 2)
    return CorrelationInsight(
        label=label,
        data_source=data_source,
        correlation=rounded_r,
        # Squares the already-rounded r (not the raw value) so confidence always
        # matches what a reader would compute from the displayed correlation.
        confidence=round(rounded_r**2, 2),
        summary=summary,
    )


async def get_my_analytics(db: AsyncSession, user_id: str, days: int = 90) -> AnalyticsMeRead:
    """`GET /analytics/me` (milestone_3.md §M3-F) — score trajectory vs adherence,
    hydration/sleep correlations. Every input read via its owning service's
    interface function (scores/routines-via-progress/skin_profile), never a table
    this module maps itself."""
    scores = await scores_service.get_recent_scores(db, user_id, days=days)
    adherence = await progress_service.get_adherence_series(db, user_id, days=days)
    adherence_by_date = {day.date: day.completed_ratio for day in adherence}
    lifestyle_logs = await skin_profile_service.list_recent_lifestyle_logs(user_id, limit=days)
    lifestyle_by_date = {log["log_date"].date(): log for log in lifestyle_logs}

    points: list[ScoreAdherencePoint] = []
    sleep_hours: list[float] = []
    scores_for_sleep: list[float] = []
    water_liters: list[float] = []
    scores_for_water: list[float] = []

    for score in scores:
        if score.calculated_at is None or score.overall_score is None:
            continue
        date = score.calculated_at.date()
        points.append(
            ScoreAdherencePoint(
                date=date,
                overall_score=score.overall_score,
                adherence_ratio=adherence_by_date.get(date),
            )
        )

        log = lifestyle_by_date.get(date)
        if log and log.get("sleep_hours") is not None:
            sleep_hours.append(log["sleep_hours"])
            scores_for_sleep.append(score.overall_score)
        if log and log.get("water_intake_liters") is not None:
            water_liters.append(log["water_intake_liters"])
            scores_for_water.append(score.overall_score)

    correlations = [
        _correlation_insight(
            "Sleep hours", "lifestyle_logs.sleep_hours", sleep_hours, scores_for_sleep
        ),
        _correlation_insight(
            "Water intake", "lifestyle_logs.water_intake_liters", water_liters, scores_for_water
        ),
    ]
    return AnalyticsMeRead(score_vs_adherence=points, correlations=correlations)


async def _get_recommendation_acceptance(mongo: Any) -> RecommendationAcceptanceRead:
    collection = mongo["recommendation_feedback"]
    total = await collection.count_documents({})
    if total == 0:
        return RecommendationAcceptanceRead(
            total_feedback_events=0, accepted_count=0, acceptance_rate=None
        )
    accepted = await collection.count_documents({"action": {"$in": ["thumbs_up", "saved"]}})
    return RecommendationAcceptanceRead(
        total_feedback_events=total,
        accepted_count=accepted,
        acceptance_rate=round(accepted / total, 2),
    )


async def _get_adherence_distribution(db: AsyncSession) -> list[AdherenceDistributionBucket]:
    """A per-user last-7-day completion ratio, bucketed — the same
    completed/scheduled formula scores/scoring_engine.py's `_routine_adherence_score`
    already uses per-user, applied across every user in two bulk queries (never a
    per-user loop, milestone_3.md's own "where cheap")."""
    step_counts = await routines_service.list_active_step_counts_by_user(db)
    if not step_counts:
        return []
    completed_counts = await routines_service.count_completed_steps_by_user(
        list(step_counts.keys()), days=_ADHERENCE_WINDOW_DAYS
    )
    buckets: dict[str, int] = dict.fromkeys(_ADHERENCE_BUCKETS, 0)
    for user_id, total_steps in step_counts.items():
        if total_steps == 0:
            continue
        scheduled = total_steps * _ADHERENCE_WINDOW_DAYS
        ratio = min(1.0, completed_counts.get(user_id, 0) / scheduled)
        if ratio < 0.25:
            buckets["0-25%"] += 1
        elif ratio < 0.5:
            buckets["25-50%"] += 1
        elif ratio < 0.75:
            buckets["50-75%"] += 1
        else:
            buckets["75-100%"] += 1
    return [
        AdherenceDistributionBucket(range_label=label, user_count=count)
        for label, count in buckets.items()
    ]


def _latency_read(stats: Any) -> LatencyStatsRead:
    return LatencyStatsRead(
        sample_count=stats.sample_count, p50_ms=stats.p50_ms, p95_ms=stats.p95_ms
    )


async def get_admin_analytics(db: AsyncSession, mongo: Any) -> AnalyticsAdminRead:
    """`GET /analytics/admin` (milestone_3.md §M3-F, latency fields added M3-G) —
    platform-wide aggregates, admin-role-gated. Never exposes per-user rows
    (ARCHITECTURE.md §2's clinical-access rules stay untouched by this read-only
    aggregator). Latency stats are read-only here too — the write path lives in
    app/services/instrumentation/ (dashboard TTI) and app/core/logging.py's
    middleware (api/recommendations), never this module (M3-F's own
    grep-verifiable "no analytics write path" holds)."""
    return AnalyticsAdminRead(
        total_assessments=await scores_service.count_all_assessments(db),
        recommendation_acceptance=await _get_recommendation_acceptance(mongo),
        adherence_distribution=await _get_adherence_distribution(db),
        api_latency=_latency_read(await get_latency_stats("api")),
        recommendation_latency=_latency_read(await get_latency_stats("recommendations")),
        dashboard_tti=_latency_read(await get_latency_stats("dashboard_tti")),
    )
