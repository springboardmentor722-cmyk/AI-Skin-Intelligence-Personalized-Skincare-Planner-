import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.lifestyle_log import StressLevel


class LifestyleLogCreate(BaseModel):
    log_date: Optional[date] = None  # defaults to today if not provided
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_liters: Optional[float] = Field(None, ge=0, le=15)
    exercise_minutes: Optional[int] = Field(None, ge=0, le=1440)
    stress_level: Optional[StressLevel] = None
    environmental_exposure: Optional[str] = None

    # Milestone 2 additions
    smoking: Optional[bool] = None
    alcohol: Optional[bool] = None
    alcohol_mls: Optional[float] = Field(None, ge=0)
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    sun_protection_used: Optional[bool] = None
    sun_exposure_minutes: Optional[int] = Field(None, ge=0)
    uv_index: Optional[float] = Field(None, ge=0, le=20)
    pollution_exposure: Optional[str] = None  # "low" | "moderate" | "high"
    diet_quality: Optional[int] = Field(None, ge=1, le=5)


class LifestyleLogUpdate(BaseModel):
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_liters: Optional[float] = Field(None, ge=0, le=15)
    exercise_minutes: Optional[int] = Field(None, ge=0, le=1440)
    stress_level: Optional[StressLevel] = None
    environmental_exposure: Optional[str] = None
    smoking: Optional[bool] = None
    alcohol: Optional[bool] = None
    alcohol_mls: Optional[float] = Field(None, ge=0)
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    sun_protection_used: Optional[bool] = None
    sun_exposure_minutes: Optional[int] = Field(None, ge=0)
    uv_index: Optional[float] = Field(None, ge=0, le=20)
    pollution_exposure: Optional[str] = None
    diet_quality: Optional[int] = Field(None, ge=1, le=5)


class LifestyleLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    log_date: date
    sleep_hours: Optional[float]
    water_intake_liters: Optional[float]
    exercise_minutes: Optional[int]
    stress_level: Optional[StressLevel]
    environmental_exposure: Optional[str]
    smoking: Optional[bool]
    alcohol: Optional[bool]
    alcohol_mls: Optional[float]
    screen_time_hours: Optional[float]
    sun_protection_used: Optional[bool]
    sun_exposure_minutes: Optional[int]
    uv_index: Optional[float]
    pollution_exposure: Optional[str]
    diet_quality: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True