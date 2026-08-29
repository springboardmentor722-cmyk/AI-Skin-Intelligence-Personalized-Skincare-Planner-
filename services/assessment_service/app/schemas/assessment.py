from typing import Literal, Optional
from pydantic import BaseModel, Field

SkinType = Literal["Oily", "Dry", "Combination", "Sensitive", "Normal"]
SunExposure = Literal["Low", "Medium", "High"]


class AssessmentSubmit(BaseModel):
    skin_type: SkinType

    # Severity sliders, 0-10. Omitted/0 means "not a concern for this user".
    acne_severity: int = Field(0, ge=0, le=10)
    hyperpigmentation_severity: int = Field(0, ge=0, le=10)
    redness_severity: int = Field(0, ge=0, le=10)
    wrinkles_severity: int = Field(0, ge=0, le=10)

    sleep_hours: float = Field(..., ge=0, le=24)
    water_intake_liters: float = Field(..., ge=0)
    sun_exposure: SunExposure = "Medium"


class ConcernOut(BaseModel):
    name: str
    severity: int
    level: str  # High / Medium / Low / None


class ScoreBreakdown(BaseModel):
    id: int
    overall_score: float
    condition_score: float
    lifestyle_score: float
    sleep_score: float
    consistency_score: float
    hydration_score: float
    primary_concern: Optional[str]
    detected_concerns: list[ConcernOut]
    created_at: str
