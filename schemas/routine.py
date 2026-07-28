"""Pydantic schemas for Personalized Skincare Routine Generation — Milestone 2."""

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class RoutineGenerateRequest(BaseModel):
    """
    Optional override payload for POST /api/v1/routine/generate.

    In the normal flow the routine is generated automatically right after
    an assessment is evaluated (using that assessment's skin_type /
    primary_concern / is_highly_sensitive), so every field here is
    optional — pass nothing to regenerate from the latest assessment.
    """

    skin_type: Optional[str] = None
    primary_concern: Optional[str] = None
    is_highly_sensitive: Optional[bool] = None


class RoutineStep(BaseModel):
    id: uuid.UUID
    step_number: int
    step_category: str
    time_of_day: str
    is_active: bool
    completed_today: bool = False

    class Config:
        from_attributes = True


class RoutineResponse(BaseModel):
    assessment_id: Optional[uuid.UUID] = None
    skin_type: Optional[str] = None
    seasonal_tip: Optional[str] = None
    am: list[RoutineStep] = Field(default_factory=list)
    pm: list[RoutineStep] = Field(default_factory=list)
    weekly: list[RoutineStep] = Field(default_factory=list)
    generated_at: Optional[datetime] = None


class RoutineLogRequest(BaseModel):
    """Fired on every checkbox toggle in the Daily Planner dashboard."""

    routine_step_id: str
    log_date: Optional[date] = None
    completed: bool


class RoutineLogResponse(BaseModel):
    log_date: date
    completed_steps: list[str]
    water_intake_ml: Optional[float] = None
    sleep_hours: Optional[float] = None
