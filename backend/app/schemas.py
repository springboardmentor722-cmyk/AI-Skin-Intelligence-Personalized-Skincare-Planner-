"""Pydantic request/response schemas."""
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ----- Auth -----------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role: str = "user"  # dermatologist/consultant registrations require admin approval


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(ORM):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserUpdateIn(BaseModel):
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


# ----- Skin profile & lifestyle ----------------------------------------------
class SkinProfileIn(BaseModel):
    age: int | None = Field(default=None, ge=1, le=120)
    gender: str | None = None
    skin_type: str | None = None
    skin_tone: str | None = None
    concerns: str | None = None
    allergies: str | None = None
    sensitivities: str | None = None
    medical_history: str | None = None
    current_products: str | None = None
    goals: str | None = None


class SkinProfileOut(ORM, SkinProfileIn):
    id: int
    user_id: int
    updated_at: datetime


class LifestyleIn(BaseModel):
    log_date: date | None = None
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    water_intake_l: float | None = Field(default=None, ge=0, le=20)
    exercise_minutes: int | None = Field(default=None, ge=0, le=1440)
    stress_level: int | None = Field(default=None, ge=1, le=10)
    environment_exposure: str | None = None
    notes: str | None = None


class LifestyleOut(ORM, LifestyleIn):
    id: int
    user_id: int
    log_date: date


# ----- Dermatologists ---------------------------------------------------------
class SlotIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    slot_minutes: int = Field(default=30, ge=10, le=120)


class SlotOut(ORM, SlotIn):
    id: int


class DermProfileIn(BaseModel):
    qualification: str | None = None
    specialization: str | None = None
    experience_years: int | None = Field(default=None, ge=0, le=70)
    clinic_name: str | None = None
    location: str | None = None
    languages: str | None = None
    consultation_fee: float | None = Field(default=None, ge=0)
    consultation_types: str | None = None
    bio: str | None = None


class DermOut(ORM):
    id: int
    user_id: int
    full_name: str = ""
    qualification: str | None = None
    specialization: str | None = None
    experience_years: int | None = None
    clinic_name: str | None = None
    location: str | None = None
    languages: str | None = None
    consultation_fee: float | None = None
    consultation_types: str | None = None
    bio: str | None = None
    rating: float
    is_approved: bool
    vacation_mode: bool


# ----- Appointments -----------------------------------------------------------
class AppointmentIn(BaseModel):
    dermatologist_user_id: int
    appt_date: date
    appt_time: time
    consultation_type: str = "video"
    reason: str | None = None


class AppointmentUpdateIn(BaseModel):
    action: str  # cancel / reschedule / accept / reject / complete / add_notes
    appt_date: date | None = None
    appt_time: time | None = None
    doctor_notes: str | None = None


class AppointmentOut(ORM):
    id: int
    patient_id: int
    dermatologist_id: int
    patient_name: str = ""
    dermatologist_name: str = ""
    appt_date: date
    appt_time: time
    consultation_type: str
    reason: str | None
    status: str
    doctor_notes: str | None
    created_at: datetime


# ----- Consultants & routines ---------------------------------------------------
class ConsultantOut(ORM):
    id: int
    user_id: int
    full_name: str = ""
    expertise: str | None
    languages: str | None
    bio: str | None
    rating: float
    is_approved: bool


class ConsultationRequestIn(BaseModel):
    consultant_user_id: int | None = None
    request_type: str = "routine_planning"
    details: str | None = None
    preferred_date: date | None = None
    preferred_time: time | None = None


class ConsultationRequestUpdateIn(BaseModel):
    action: str  # accept / reject / complete / cancel


class ConsultationRequestOut(ORM):
    id: int
    patient_id: int
    consultant_id: int | None
    patient_name: str = ""
    consultant_name: str = ""
    request_type: str
    details: str | None
    preferred_date: date | None
    preferred_time: time | None
    status: str
    created_at: datetime


class RoutineIn(BaseModel):
    patient_id: int
    title: str = "Personalized Routine"
    morning_steps: list[str] = []
    night_steps: list[str] = []
    weekly_steps: list[str] = []
    lifestyle_advice: str | None = None


class RoutineOut(ORM):
    id: int
    patient_id: int
    consultant_id: int | None
    title: str
    morning_steps: str | None
    night_steps: str | None
    weekly_steps: str | None
    lifestyle_advice: str | None
    created_at: datetime


# ----- Products -----------------------------------------------------------------
class IngredientOut(ORM):
    id: int
    name: str
    benefits: str | None
    cautions: str | None
    description: str | None = None
    scientific_category: str | None = None
    side_effects: str | None = None
    skin_type_compat: str | None = None
    concern_compat: str | None = None
    comedogenic_rating: int | None = None
    references: str | None = None


class ProductIn(BaseModel):
    name: str
    brand: str | None = None
    category: str | None = None
    price: float | None = Field(default=None, ge=0)
    tier: str | None = "budget"
    suitable_for: str | None = None
    description: str | None = None
    ingredient_names: list[str] = []


class ProductOut(ORM):
    id: int
    name: str
    brand: str | None
    category: str | None
    price: float | None
    tier: str | None
    suitable_for: str | None
    description: str | None
    skin_type_compat: str | None = None
    concern_compat: str | None = None
    key_ingredients: str | None = None
    ingredient_list: str | None = None
    ingredient_benefits: str | None = None
    usage_time: str | None = None
    warnings: str | None = None
    contraindications: str | None = None
    image_url: str | None = None
    rating: float | None = None
    review_count: int | None = None
    ingredients: list[IngredientOut] = []


class ProductPageOut(BaseModel):
    """Paginated product search response (Milestone 3, Part 3)."""
    items: list[ProductOut] = []
    total: int = 0
    page: int = 1
    page_size: int = 12
    total_pages: int = 0
    facets: dict = {}


# ----- Progress & notifications ----------------------------------------------------
class ProgressIn(BaseModel):
    entry_date: date | None = None
    skin_score: int | None = Field(default=None, ge=0, le=100)
    hydration: int | None = Field(default=None, ge=0, le=100)
    acne_level: int | None = Field(default=None, ge=0, le=10)
    pigmentation_level: int | None = Field(default=None, ge=0, le=10)
    notes: str | None = None


class ProgressOut(ORM, ProgressIn):
    id: int
    user_id: int
    entry_date: date


class NotificationOut(ORM):
    id: int
    title: str
    body: str | None
    kind: str
    is_read: bool
    created_at: datetime


# ----- Admin ---------------------------------------------------------------------
class AdminUserIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: str = "user"


class AdminUserUpdateIn(BaseModel):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


class AuditLogOut(ORM):
    id: int
    actor_email: str | None
    action: str
    entity: str | None
    entity_id: str | None
    old_value: str | None
    new_value: str | None
    ip: str | None
    status: str
    created_at: datetime


class BroadcastIn(BaseModel):
    title: str
    body: str = ""
    role: str | None = None  # None = everyone


# ============================================================================
# MILESTONE 2 — Assessment, Scoring & Routine schemas
# ============================================================================

class AssessmentIn(BaseModel):
    """Payload from the multi-step assessment wizard.

    Every field is optional so a partially-filled wizard still evaluates — the
    engine simply gives no credit for data it never received.
    """
    age: int | None = Field(default=None, ge=1, le=120)
    gender: str | None = None
    skin_type: str | None = None                 # oily/dry/combination/sensitive/normal
    concerns: str | None = None                  # free text or comma list
    concern_severities: dict[str, str] = {}      # {"Acne": "high"} — wins over free text
    sensitivities: str | None = None
    allergies: str | None = None

    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    water_intake_l: float | None = Field(default=None, ge=0, le=20)
    exercise_minutes: int | None = Field(default=None, ge=0, le=1440)
    stress_level: int | None = Field(default=None, ge=1, le=10)
    environment_exposure: str | None = None      # low / moderate / high
    uses_sunscreen: bool = True
    smokes: bool = False

    generate_routine: bool = True                # build the plan in the same call


class ConcernOut(BaseModel):
    name: str
    severity: str
    weight: float = 0
    source: str = ""


class ScoreComponent(BaseModel):
    score: float
    weight: float
    contribution: float


class ScoreBreakdownOut(BaseModel):
    skin_condition: ScoreComponent
    lifestyle: ScoreComponent
    sleep: ScoreComponent
    consistency: ScoreComponent
    hydration: ScoreComponent


class AssessmentOut(BaseModel):
    id: str
    user_id: int
    overall_score: float
    band: str = ""
    skin_type: str | None = None
    primary_concern: str | None = None
    detected_concerns: list[ConcernOut] = []
    breakdown: ScoreBreakdownOut | None = None
    recommendations: list[str] = []
    created_at: datetime
    consistency_source: str = ""


class RoutineStepOut(ORM):
    id: str
    time_of_day: str
    step_number: int
    step_category: str
    instruction: str | None = None
    is_active: bool = True
    completed: bool = False        # merged in from today's routine_logs


class RoutinePlanOut(BaseModel):
    assessment_id: str | None = None
    generated_at: datetime | None = None
    AM: list[RoutineStepOut] = []
    PM: list[RoutineStepOut] = []
    Weekly: list[RoutineStepOut] = []
    Seasonal: list[RoutineStepOut] = []
    completion_percent: float = 0
    completed_today: int = 0
    total_daily_steps: int = 0


class RoutineGenerateIn(BaseModel):
    """Regenerate the plan. Omit fields to reuse the stored skin profile."""
    skin_type: str | None = None
    assessment_id: str | None = None


class StepCompletionIn(BaseModel):
    routine_step_id: str
    completed: bool
    log_date: date | None = None      # defaults to today


class RoutineLogOut(BaseModel):
    user_id: str
    log_date: str
    completed_steps: list[dict] = []
    water_intake_ml: int | None = None
    sleep_hours: float | None = None
    storage: str = ""


# ============================================================================
# MILESTONE 3, Parts 4-8 — AI skin analysis
# ============================================================================

class SkinTypeDistributionItem(BaseModel):
    label: str
    probability: float


class DetectedConcernItem(BaseModel):
    name: str
    confidence: float
    severity: str


class SkinAnalysisOut(BaseModel):
    id: str
    user_id: int
    analysis_type: str
    detected_skin_type: str | None = None
    skin_type_confidence: float | None = None
    skin_type_distribution: list[SkinTypeDistributionItem] = []
    detected_concerns: list[DetectedConcernItem] = []
    priority_concern: str | None = None
    concern_scores: list[dict] = []
    features: dict = {}
    explanation: str | None = None
    backend: str | None = None
    face_found: bool = False
    created_at: datetime
