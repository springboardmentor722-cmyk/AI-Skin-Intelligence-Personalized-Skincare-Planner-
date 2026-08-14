from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth / Users ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"   # user, consultant, dermatologist (admin created separately)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    verification_status: str = "not_applicable"
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Skin Profile ----------
class SkinProfileIn(BaseModel):
    skin_type: str
    age_group: str
    skin_concerns: List[str] = []
    allergies: List[str] = []
    sensitivities: List[str] = []
    lifestyle_habits: List[str] = []
    sleep_quality: str = "average"
    sleep_hours: float = 7.0
    water_intake_liters: float = 2.0
    environmental_exposure: List[str] = []
    budget_range: str = "medium"


class SkinProfileOut(SkinProfileIn):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Assessment ----------
class AssessmentOut(BaseModel):
    id: int
    user_id: int
    concerns_identified: List[str]
    condition_scores: Dict[str, float]
    overall_condition_score: float
    prioritized_concerns: List[str]
    risk_factors: List[str]
    scoring_method: str = "rules"
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Routine ----------
class RoutineStep(BaseModel):
    order: int
    category: str
    product_category: str
    instruction: str


class RoutineOut(BaseModel):
    id: int
    user_id: int
    routine_type: str
    steps: List[dict]
    season: Optional[str]
    is_active: bool
    generated_at: datetime

    class Config:
        from_attributes = True


# ---------- Ingredients ----------
class IngredientOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    description: Optional[str]
    benefits: List[str] = []
    good_for_concerns: List[str] = []
    good_for_skin_types: List[str] = []
    cautions: List[str] = []
    conflicts_with: List[str] = []

    class Config:
        from_attributes = True


class IngredientCheckRequest(BaseModel):
    ingredient_names: List[str]


# ---------- Products ----------
class ProductOut(BaseModel):
    id: int
    name: str
    brand: Optional[str]
    category: Optional[str]
    price: float
    key_ingredients: List[str] = []
    suitable_skin_types: List[str] = []
    suitable_concerns: List[str] = []
    description: Optional[str]

    class Config:
        from_attributes = True


class ProductRecommendationOut(BaseModel):
    product: ProductOut
    suitability_score: float
    reason: str
    method: str = "rules"


# ---------- Scoring ----------
class SkinHealthScoreOut(BaseModel):
    id: int
    user_id: int
    condition_score: float
    lifestyle_score: float
    sleep_score: float
    routine_consistency_score: float
    hydration_score: float
    overall_score: float
    computed_at: datetime

    class Config:
        from_attributes = True


# ---------- Progress ----------
class ProgressLogIn(BaseModel):
    routine_adherence_percent: float = Field(ge=0, le=100)
    mood_or_notes: Optional[str] = None
    photo_url: Optional[str] = None


class ProgressLogOut(ProgressLogIn):
    id: int
    user_id: int
    log_date: datetime

    class Config:
        from_attributes = True


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Photo-based skin analysis ----------
class SkinPhotoOut(BaseModel):
    id: int
    user_id: int
    uploaded_at: datetime
    analyzed: bool
    face_detected: bool
    redness_score: Optional[float] = None
    texture_score: Optional[float] = None
    evenness_score: Optional[float] = None
    oiliness_score: Optional[float] = None
    analysis_notes: List[str] = []

    class Config:
        from_attributes = True


# ---------- Dermatologist / consultant professional verification ----------
class VerificationSubmit(BaseModel):
    license_number: str
    credential_notes: str


class VerificationReviewOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    verification_status: str
    license_number: Optional[str] = None
    credential_notes: Optional[str] = None

    class Config:
        from_attributes = True


class VerificationDecision(BaseModel):
    approve: bool
    reviewer_note: Optional[str] = None
