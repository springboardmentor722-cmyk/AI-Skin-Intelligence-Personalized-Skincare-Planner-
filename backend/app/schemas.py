from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models import AppointmentStatusEnum, RoleEnum, SkinTypeEnum


# ---------- Auth ----------
class UserRegister(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=72)
    role: RoleEnum = RoleEnum.user


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
    assigned_dermatologist_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Dermatologist Contact ----------
class DermatologistContactOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    clinic_name: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    accepting_new_patients: bool = True
    certificate_url: Optional[str] = None

    class Config:
        from_attributes = True


class AssignDermatologistIn(BaseModel):
    dermatologist_id: str


class DermatologistProfileIn(BaseModel):
    phone: Optional[str] = Field(None, max_length=30)
    clinic_name: Optional[str] = Field(None, max_length=200)
    specialty: Optional[str] = Field(None, max_length=150)
    bio: Optional[str] = None
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    accepting_new_patients: bool = True
    certificate_url: Optional[str] = Field(None, max_length=500)


class DermatologistProfileOut(DermatologistProfileIn):
    id: str
    user_id: str
    full_name: str
    email: EmailStr


class ConsultantProfileIn(BaseModel):
    phone: Optional[str] = Field(None, max_length=30)
    organization_name: Optional[str] = Field(None, max_length=200)
    specialization: Optional[str] = Field(None, max_length=150)
    bio: Optional[str] = None
    website: Optional[str] = Field(None, max_length=500)


class ConsultantProfileOut(ConsultantProfileIn):
    id: str
    user_id: str
    full_name: str
    email: EmailStr


# ---------- Appointments ----------
class AppointmentRequestCreate(BaseModel):
    request_message: Optional[str] = Field(None, max_length=1000)


class AppointmentDecisionIn(BaseModel):
    status: AppointmentStatusEnum
    response_message: Optional[str] = Field(None, max_length=1000)


class AppointmentRequestOut(BaseModel):
    id: str
    patient_user_id: str
    patient_name: str
    patient_email: EmailStr
    dermatologist_user_id: str
    dermatologist_name: str
    dermatologist_email: EmailStr
    status: AppointmentStatusEnum
    request_message: Optional[str] = None
    response_message: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ---------- Skin Profile ----------
class SkinProfileIn(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    skin_type: Optional[SkinTypeEnum] = None
    skin_concerns: Optional[str] = None
    allergies: Optional[str] = None
    skin_sensitivities: Optional[str] = None


class SkinProfileOut(SkinProfileIn):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Lifestyle ----------
class LifestyleEntryIn(BaseModel):
    entry_date: date
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    exercise_minutes: Optional[int] = None
    stress_level: Optional[int] = Field(None, ge=1, le=5)
    environmental_exposure: Optional[str] = None


class LifestyleEntryOut(LifestyleEntryIn):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Progress ----------
class ProgressEntryIn(BaseModel):
    entry_date: date
    notes: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    hydration_score: Optional[int] = Field(None, ge=0, le=10)
    breakout_count: Optional[int] = Field(None, ge=0)


class ProgressEntryOut(ProgressEntryIn):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Workspace ----------
class PatientMessageIn(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)


class PatientMessageOut(BaseModel):
    id: str
    dermatologist_user_id: str
    patient_user_id: str
    sender_user_id: str
    sender_name: str
    recipient_user_id: str
    recipient_name: str
    body: str
    created_at: datetime


class DermatologistPatientSummaryOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    skin_profile: Optional[SkinProfileOut] = None
    lifestyle_entries: list[LifestyleEntryOut]
    progress_entries: list[ProgressEntryOut]
    latest_appointment_status: Optional[AppointmentStatusEnum] = None
    recent_messages: list[PatientMessageOut]


# ---------- Product Recommendations ----------
class ProductRecommendationOut(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    suitable_skin_types: list[str]
    key_ingredients: list[str]
    price_inr: float
    description: str
    match_score: int
    matched_concerns: list[str]
    rating: Optional[float] = 4.5
    budget_flag: Optional[str] = "Within Budget"
    is_above_budget: Optional[bool] = False



class RecommendationsOut(BaseModel):
    skin_type: str
    skin_concerns: list[str]
    recommendations: list[ProductRecommendationOut]


class ProductCreateIn(BaseModel):
    name: str
    brand: str
    category: str
    suitable_skin_types: list[str]
    key_ingredients: list[str]
    price_inr: float
    description: str


# ---------- Milestone 2: Assessment & Routine ----------
class ConcernSeverityIn(BaseModel):
    concern: str
    severity: str  # "low", "medium", "high"
    is_active_flareup: bool = False


class AssessmentEvaluateIn(BaseModel):
    skin_type: SkinTypeEnum
    concerns: list[ConcernSeverityIn] = []
    sleep_hours: float
    water_intake_liters: float
    environmental_exposure: Optional[str] = None
    stress_level: int
    allergies: Optional[str] = None
    skin_sensitivities: Optional[str] = None


class ScoreBreakdownOut(BaseModel):
    id: str
    user_id: str
    overall_score: float
    skin_condition_score: float
    lifestyle_score: float
    sleep_score: float
    consistency_score: float
    hydration_score: float
    detected_concerns: Optional[list[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SkincareRoutineStepOut(BaseModel):
    id: str
    user_id: str
    assessment_id: Optional[str] = None
    time_of_day: str
    step_number: int
    step_category: str
    is_active: bool

    class Config:
        from_attributes = True


class RoutineStepLogIn(BaseModel):
    routine_step_id: str
    completed: bool
    log_date: Optional[str] = None  # YYYY-MM-DD


# ---------- Professional Messaging ----------
class ProfessionalMessageIn(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)


class ProfessionalMessageOut(BaseModel):
    id: str
    consultant_id: str
    consultant_name: str
    dermatologist_id: str
    dermatologist_name: str
    sender_user_id: str
    sender_name: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultantPatientOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    skin_profile: Optional[SkinProfileOut] = None
    assigned_dermatologist: Optional[DermatologistContactOut] = None
    lifestyle_entries: list[LifestyleEntryOut] = []
    progress_entries: list[ProgressEntryOut] = []
    latest_score: Optional[float] = None


# ---------- Admin Dashboard Schemas ----------
class AdminUserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserListOut(BaseModel):
    users: list[AdminUserOut]
    total_count: int
    page: int
    pages: int


class UpdateUserRoleIn(BaseModel):
    role: RoleEnum


class UpdateUserStatusIn(BaseModel):
    is_active: bool


class AdminDermatologistOut(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    clinic_name: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    accepting_new_patients: bool = True
    certificate_url: Optional[str] = None

    class Config:
        from_attributes = True


class UpdateDermatologistIn(BaseModel):
    phone: Optional[str] = None
    clinic_name: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    accepting_new_patients: Optional[bool] = None


class AdminStatsOut(BaseModel):
    total_users_by_role: dict[str, int]
    total_dermatologists: int
    total_products: int



