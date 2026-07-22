import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ScoreTrendPoint(BaseModel):
    date: datetime.date
    overall_score: float | None


class AdherenceDay(BaseModel):
    """One cell of the wireframe's "Routine Adherence" heat grid — real signal from
    `routine_logs` via the routines service interface (`list_active_step_ids` +
    `list_recent_routine_logs`), never fabricated."""

    date: datetime.date
    completed_ratio: float  # 0-1


class TrendInsightRead(BaseModel):
    direction: Literal["improving", "declining", "stable"]
    magnitude: float
    confidence: float
    summary: str
    # Mirrors app/ai/schemas.py's TrendInsight — a UI-facing flag so the frontend
    # never has to hardcode the 0.6 threshold itself (milestone_3.md §8).
    low_confidence: bool


class Milestone(BaseModel):
    label: str
    achieved_on: datetime.date


class ProgressSummaryRead(BaseModel):
    """Contract kept additive (milestone_3.md §M3-E: "progress/me/summary
    unchanged" contract) — `points` is the original M1 field; everything else is
    new and optional/empty-default, never breaking an existing consumer."""

    points: list[ScoreTrendPoint]
    adherence: list[AdherenceDay] = []
    insight: TrendInsightRead | None = None
    milestones: list[Milestone] = []


class ProgressPhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    progress_image_id: int
    image_stage: str | None
    uploaded_at: datetime.datetime
    url: str  # presigned — computed per-request, never a public/stored URL


class ProgressPhotosRead(BaseModel):
    photos: list[ProgressPhotoRead]
    before: ProgressPhotoRead | None
    after: ProgressPhotoRead | None


class ConcernChangeRead(BaseModel):
    concern: str
    before: int
    after: int


class ProgressLogCreate(BaseModel):
    # milestone_3.md's own "notes, self-assessment" phrasing for the Features bullet
    # — the only field a user actually authors; before/after images, improvement
    # score, concern_changes, and trend_summary are all computed server-side from
    # real data (never user-supplied), documented in
    # database_schemas/skinlytics_mongodb_schema_v3.txt's progress_logs entry
    # alongside this addition.
    notes: str | None = None


class ProgressLogRead(BaseModel):
    week_number: int
    before_image_url: str | None
    after_image_url: str | None
    improvement_score: float | None
    concern_changes: list[ConcernChangeRead]
    trend_summary: str | None
    notes: str | None
    created_at: datetime.datetime
