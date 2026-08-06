from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from datetime import datetime

# ==========================
# User Schemas
# ==========================

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    role: Literal[
        "user",
        "consultant",
        "dermatologist",
        "admin"
    ] = "user"


class UserLogin(BaseModel):
    email: str | None = None
    username: str | None = None
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    profile_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    profile_completed: bool = False
    next_page: str = "/dashboard"
    user: UserResponse


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"



# ==========================
# Skin Profile
# ==========================

class SkinProfileCreate(BaseModel):
    full_name: str
    age: int
    gender: str

    skin_type: str
    skin_tone: str

    concerns: str
    allergies: str
    medical_conditions: str | None = None
    current_products: str | None = None

class SkinProfileResponse(BaseModel):
    id: int
    user_id: int | None = None

    full_name: str
    age: int
    gender: str

    skin_type: str
    skin_tone: str

    concerns: str
    allergies: str
    medical_conditions: str | None = None
    current_products: str | None = None

    class Config:
        from_attributes = True

# ==========================
# Lifestyle
# ==========================

class LifestyleCreate(BaseModel):
    sleep_hours: float
    water_intake: float
    exercise: str
    stress_level: str
    outdoor_exposure: str
    diet: str | None = None
    smoking: bool | None = False
    alcohol: bool | None = False
    sun_exposure: str | None = None
    environment: str | None = None
    occupation: str | None = None


class LifestyleResponse(LifestyleCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================
# Skin Assessment
# ==========================

class SkinAssessmentCreate(BaseModel):
    image_path: str | None = None
    skin_score: int | None = None
    risk_score: int | None = None
    concern_priority: str | None = None
    summary: str | None = None


class SkinAssessmentResponse(BaseModel):
    id: int
    user_id: int
    image_path: str | None = None
    uploaded_at: datetime
    skin_score: int | None = None
    risk_score: int | None = None
    concern_priority: str | None = None
    summary: str | None = None

    class Config:
        from_attributes = True


# ==========================
# Product
# ==========================

class ProductCreate(BaseModel):
    product_name: str
    brand: str
    category: str
    skin_type: str
    main_ingredient: str
    benefit: str
    price: float
    rating: float = 0.0


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True

# ==========================
# Ingredient
# ==========================

class IngredientCreate(BaseModel):
    ingredient_name: str
    description: str
    benefits: str

class IngredientResponse(IngredientCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================
# Product Ingredient
# ==========================

class ProductIngredientCreate(BaseModel):
    product_id: int
    ingredient_id: int


class ProductIngredientResponse(ProductIngredientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ConsultantRecommendationCreate(BaseModel):
    patient_id: int
    recommendation: str


class ConsultantRecommendationResponse(BaseModel):
    id: int
    consultant_id: int
    patient_id: int
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True










class ConsultantProfileCreate(BaseModel):
    full_name: str
    phone: str
    city: str
    qualification: str
    specialization: str
    experience: int
    hospital: str
    department: str
    available_days: str
    languages: str
    
    bio: str | None = None
    clinic_address: str | None = None
    working_hours: str | None = None
    consultation_mode: str | None = "Video Call"
    certificate_url: str | None = None
    gov_id_url: str | None = None
    photo_url: str | None = None


class ConsultantProfileResponse(ConsultantProfileCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DermatologistProfileCreate(BaseModel):
    full_name: str
    qualification: str
    specialization: str
    license_number: str
    experience: int
    clinic_name: str
    city: str
    phone: str
    available_days: str
    languages: str
    
    bio: str | None = None
    consultation_fee: float = 50.0
    medical_license_url: str | None = None
    gov_id_url: str | None = None
    photo_url: str | None = None
    certificates_url: str | None = None


class DermatologistProfileResponse(DermatologistProfileCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================
# Consultation Booking Schemas
# ==========================

class ConsultationBookingCreate(BaseModel):
    specialist_id: int
    role: str # "consultant" or "dermatologist"
    scheduled_date: str | None = None
    symptoms: str | None = None


class ConsultationBookingResponse(BaseModel):
    id: int
    user_id: int
    specialist_id: int
    role: str
    status: str
    scheduled_date: datetime
    symptoms: str | None = None
    escalation_notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DailyRoutineLogCreate(BaseModel):
    morning_completed: bool
    evening_completed: bool
    weekly_completed: bool


class DailyRoutineLogResponse(DailyRoutineLogCreate):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: str


class UserStatusUpdate(BaseModel):
    is_active: bool


# ==========================
# Combined Registration Schemas
# ==========================

class ConsultantRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    city: str
    qualification: str
    specialization: str
    experience: int
    hospital: str
    department: str
    available_days: str
    languages: str
    
    bio: str | None = None
    clinic_address: str | None = None
    working_hours: str | None = None
    consultation_mode: str | None = "Video Call"
    certificate_url: str | None = None
    gov_id_url: str | None = None
    photo_url: str | None = None


class DermatologistRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    qualification: str
    specialization: str
    license_number: str
    experience: int
    clinic_name: str
    city: str
    phone: str
    available_days: str
    languages: str
    
    bio: str | None = None
    consultation_fee: float = 50.0
    medical_license_url: str | None = None
    gov_id_url: str | None = None
    photo_url: str | None = None
    certificates_url: str | None = None