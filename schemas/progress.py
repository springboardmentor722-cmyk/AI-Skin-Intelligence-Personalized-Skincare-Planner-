"""Pydantic schemas for Progress Tracking & the photo pipeline — Milestone 3."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProgressPhotoResponse(BaseModel):
    id: uuid.UUID
    photo_url: str
    tag: Optional[str] = None
    skin_health_score_at_upload: Optional[float] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ScoreTimelinePoint(BaseModel):
    created_at: datetime
    overall_score: float


class ImprovementStats(BaseModel):
    starting_score: float
    latest_score: float
    delta_points: float
    delta_percent: float
    trend: str  # Improving, Stable, Declining
    since: datetime


class ProgressAnalyticsResponse(BaseModel):
    score_timeline: list[ScoreTimelinePoint]
    adherence: dict
    photos: list[ProgressPhotoResponse]
    improvement: Optional[ImprovementStats] = None
