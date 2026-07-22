import datetime

from pydantic import BaseModel


class ScoreAdherencePoint(BaseModel):
    date: datetime.date
    overall_score: float | None
    adherence_ratio: float | None


class CorrelationInsight(BaseModel):
    """Every field is a real, computed claim (same discipline as
    app/ai/schemas.py's SuitabilityResult/TrendInsight) — `correlation` is a plain
    Pearson r over the user's own real history, `confidence` is r² (the standard
    "fraction of variance explained" reading of a correlation coefficient), never
    a guessed number. `None` when there isn't enough history yet — an honest empty
    state, not a fabricated value (milestone_3.md §M3-F acceptance criteria)."""

    label: str
    data_source: str
    correlation: float | None
    confidence: float | None
    summary: str


class AnalyticsMeRead(BaseModel):
    score_vs_adherence: list[ScoreAdherencePoint]
    correlations: list[CorrelationInsight]


class RecommendationAcceptanceRead(BaseModel):
    total_feedback_events: int
    accepted_count: int
    acceptance_rate: float | None  # None when there's no feedback yet at all


class AdherenceDistributionBucket(BaseModel):
    range_label: str
    user_count: int


class LatencyStatsRead(BaseModel):
    """Real, measured request-duration percentiles (app/core/metrics.py's
    rolling Redis sample store, M3-G) — `None` fields mean no samples exist
    yet, never a guessed number."""

    sample_count: int
    p50_ms: float | None
    p95_ms: float | None


class AnalyticsAdminRead(BaseModel):
    total_assessments: int
    recommendation_acceptance: RecommendationAcceptanceRead
    adherence_distribution: list[AdherenceDistributionBucket]
    api_latency: LatencyStatsRead
    recommendation_latency: LatencyStatsRead
    dashboard_tti: LatencyStatsRead
