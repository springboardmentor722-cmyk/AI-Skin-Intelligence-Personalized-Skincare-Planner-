from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class GeminiConditionAnalysis(BaseModel):
    condition_score: float = Field(ge=0, le=100)
    severity: Literal["Low", "Moderate", "High"]
    risk_level: Literal["Low", "Moderate", "High"]
    primary_concerns: list[str]
    condition_summary: str
    observations: list[str]
    recommendations: list[str]
    morning_routine: list[str]
    night_routine: list[str]
    ingredients_to_look_for: list[str]
    ingredients_to_avoid: list[str]
    disclaimer: str


class SkinAssessmentResponse(GeminiConditionAnalysis):
    assessment_date: date
    lifestyle_score: float
    routine_score: float
    sleep_score: float
    hydration_score: float
    final_score: float
