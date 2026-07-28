# app/schemas/assessment.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============================================================
# ASSESSMENT EVALUATE (existing endpoint)
# ============================================================

class AssessmentEvaluateRequest(BaseModel):
    skin_type: str
    skin_concerns: List[str] = []
    flare_ups: List[str] = []                       # concerns actively flaring right now
    severity_overrides: Optional[Dict[str, str]] = None   # e.g. {"acne": "high"}
    severity_scores: Optional[Dict[str, int]] = None      # 0-10 slider values {"acne": 7}

    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None

    uv_index: Optional[float] = None
    sun_protection_used: Optional[bool] = None
    pollution_exposure: Optional[str] = None         # "low" | "moderate" | "high"

    # Milestone 2 lifestyle additions
    smoking: Optional[bool] = None
    alcohol: Optional[bool] = None
    screen_time_hours: Optional[float] = None


class ScoreBreakdown(BaseModel):
    condition: float
    lifestyle: float
    sleep: float
    consistency: float
    hydration: float


class AssessmentEvaluateResponse(BaseModel):
    assessment_id: str
    overall_score: float
    breakdown: ScoreBreakdown
    detected_concerns: List[dict]
    primary_concern: Optional[str]
    risk_level: Optional[str] = None
    health_category: Optional[str] = None
    improvement_suggestions: Optional[List[str]] = None


# ============================================================
# ASSESSMENT SUBMIT (spec endpoint — combined atomic workflow)
# ============================================================

class AssessmentSubmitRequest(BaseModel):
    """
    POST /api/v1/assessment/submit
    All-in-one payload: profile + lifestyle + scoring inputs.
    Backend handles: save profile → save lifestyle → score → generate routine atomically.
    """
    # Profile fields
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = None
    skin_type: str
    skin_concerns: List[str] = []
    allergies: Optional[List[str]] = []
    sensitivities: Optional[List[str]] = []

    # Severity sliders (0–10 per concern)
    severity_scores: Optional[Dict[str, int]] = None

    # Lifestyle
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_liters: Optional[float] = Field(None, ge=0, le=15)
    exercise_minutes: Optional[int] = Field(None, ge=0, le=1440)
    stress_level: Optional[str] = None              # "low" | "moderate" | "high"
    environmental_exposure: Optional[str] = None
    smoking: Optional[bool] = None
    alcohol: Optional[bool] = None
    screen_time_hours: Optional[float] = Field(None, ge=0, le=24)
    sun_protection_used: Optional[bool] = None
    pollution_exposure: Optional[str] = None
    uv_index: Optional[float] = None

    # Safety flags
    is_pregnant: Optional[bool] = False
    broken_skin: Optional[bool] = False


class AssessmentSubmitResponse(BaseModel):
    assessment_id: str
    overall_score: float
    breakdown: ScoreBreakdown
    detected_concerns: List[dict]
    primary_concern: Optional[str]
    risk_level: str
    health_category: str
    improvement_suggestions: List[str]
    routine_generated: bool
    safety_warnings: List[str]
    blocked_ingredients: List[str]


# ============================================================
# ROUTINE GENERATION
# ============================================================

class RoutineGenerateRequest(BaseModel):
    assessment_id: Optional[str] = None
    skin_type: str
    is_highly_sensitive: bool = False


class RoutineStepOut(BaseModel):
    id: str
    step_number: int
    step_category: str
    time_of_day: str
    is_active: bool


class RoutineGenerateResponse(BaseModel):
    routine: List[RoutineStepOut]


class RoutineStepLogRequest(BaseModel):
    routine_step_id: str
    completed: bool
    water_intake_ml: Optional[int] = None
    sleep_hours: Optional[float] = None


# ============================================================
# REPORT
# ============================================================

class AssessmentReportResponse(BaseModel):
    assessment_id: str
    created_at: str
    overall_score: float
    risk_level: str
    health_category: str
    improvement_suggestions: List[str]
    breakdown: Dict[str, Any]
    skin_type: Optional[str]
    selected_concerns: List[Dict[str, Any]]
    primary_concern: Optional[str]
    lifestyle_summary: Dict[str, Any]
    routine_summary: List[Dict[str, Any]]
    safety_warnings: List[str]
    blocked_ingredients: List[str]