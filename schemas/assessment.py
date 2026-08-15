"""Pydantic schemas for the Skin Assessment Engine — Milestone 2."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SkinConcernInput(BaseModel):
    """One self-reported concern from the multi-step assessment wizard."""

    name: str = Field(..., description="e.g. Acne, Hyperpigmentation, Dark Spots, Dry Skin, Oily Skin, Sensitive Skin, Wrinkles, Fine Lines, Redness, Uneven Skin Tone")
    severity: str = Field(..., description="High, Medium, or Low")
    is_active_flare: bool = Field(False, description="Is this concern an active flare-up right now?")


class AssessmentEvaluateRequest(BaseModel):
    """Payload submitted by the Step 5.1 multi-step assessment wizard."""

    skin_type: str = Field(..., description="Normal, Dry, Oily, Combination, or Sensitive")
    concerns: list[SkinConcernInput] = Field(default_factory=list)

    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_ml: Optional[float] = Field(None, ge=0, le=10000)

    uv_exposure: Optional[str] = Field(None, description="Low, Moderate, or High")
    sun_protection_used: bool = False
    smoking: bool = False
    alcohol: bool = False
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    exercise_minutes: Optional[float] = Field(None, ge=0, le=1440)

    is_highly_sensitive: bool = Field(
        False, description="Flag used by the routine safety check in Step 4.1"
    )


class ScoreBreakdown(BaseModel):
    skin_condition_score: float
    lifestyle_score: float
    sleep_score: float
    consistency_score: float
    hydration_score: float
    overall_score: float


class AssessmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    overall_score: float
    detected_concerns: list[dict]
    primary_concern: Optional[str] = None
    skin_type: Optional[str] = None
    is_highly_sensitive: bool
    breakdown: ScoreBreakdown
    created_at: datetime

    class Config:
        from_attributes = True
