"""Pydantic schemas for the Lifestyle Tracking module."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LifestyleLogBase(BaseModel):
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_liters: Optional[float] = Field(None, ge=0, le=20)
    exercise_minutes: Optional[int] = Field(None, ge=0, le=1440)
    stress_level: Optional[str] = Field(None, description="Low, Moderate, High")
    smoking: Optional[bool] = False
    alcohol: Optional[bool] = False
    diet_quality: Optional[str] = None
    outdoor_exposure_hours: Optional[float] = Field(None, ge=0, le=24)
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)


class LifestyleLogCreate(LifestyleLogBase):
    pass


class LifestyleLogUpdate(LifestyleLogBase):
    pass


class LifestyleLogResponse(LifestyleLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    logged_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
