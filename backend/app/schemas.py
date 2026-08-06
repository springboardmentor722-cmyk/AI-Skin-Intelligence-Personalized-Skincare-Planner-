from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from datetime import date


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    age: int
    gender: str

class UserUpdate(BaseModel):
    full_name: str
    age: int
    gender: str
    

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    age: int
    gender: str
    
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

    class Config:
        from_attributes = True

class SkinProfileCreate(BaseModel):
    skin_type: str
    skin_tone: str
    skin_concerns: str
    allergies: str | None = None
    sensitivity: str

class SkinProfileUpdate(BaseModel):
    skin_type: str
    skin_tone: str
    skin_concerns: str
    allergies: str | None = None
    sensitivity: str

class SkinProfileResponse(BaseModel):
    id: int
    skin_type: str
    skin_tone: str
    skin_concerns: str
    allergies: str | None = None
    sensitivity: str

    

    class Config:
        from_attributes = True

class LifestyleCreate(BaseModel):
    sleep_duration: int
    water_intake: float
    exercise_habits: str
    stress_level: str
    environmental_exposure: str


class LifestyleUpdate(BaseModel):
    sleep_duration: int
    water_intake: float
    exercise_habits: str
    stress_level: str
    environmental_exposure: str


class LifestyleResponse(BaseModel):
    id: int
    sleep_duration: int
    water_intake: float
    exercise_habits: str
    stress_level: str
    environmental_exposure: str

    class Config:
        from_attributes = True

from typing import Optional
from pydantic import BaseModel

class ProductBase(BaseModel):
    product_id: str
    product_name: str

    brand_name: Optional[str] = None

    category: Optional[str] = None

    skin_type: Optional[str] = None

    skin_concern: Optional[str] = None

    ingredients: Optional[str] = None

    description: Optional[str] = None

    usage: Optional[str] = None

    price: Optional[float] = None

    rating: Optional[float] = None

    
    image_url: Optional[str] = None

    product_url: Optional[str] = None


class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

# -----------------------------
# Ingredient Schemas
# -----------------------------

class IngredientBase(BaseModel):
    ingredient_name: str
    substance_id: str | None = None
    cas_no: str | None = None
    ec_no: str | None = None
    pubchem_cid: str | None = None
    pubchem_url: str | None = None
    category: str | None = None
    functions: str | None = None
    benefits: str | None = None
    suitable_skin_types: str | None = None
    skin_concerns: str | None = None
    comedogenic_rating: int | None = None
    irritation_level: str | None = None
    description: str | None = None


class IngredientResponse(IngredientBase):
    id: int

    class Config:
        from_attributes = True

from datetime import datetime
from pydantic import BaseModel

class ProgressBase(BaseModel):
    acne_level: int
    hydration_level: int
    pigmentation: int
    redness: int
    notes: str | None = None
    image_url: str | None = None


class ProgressCreate(ProgressBase):
    pass


class ProgressUpdate(ProgressBase):
    pass


class ProgressResponse(ProgressBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RoleUpdate(BaseModel):
    role: str


# -----------------------------
# Role Request Schemas
# -----------------------------

from datetime import datetime


class RoleRequestCreate(BaseModel):
    requested_role: str
    qualification: str
    license_number: str
    experience: str


class RoleRequestUpdate(BaseModel):
    status: str


class RoleRequestResponse(BaseModel):
    id: int
    user_id: int

    requested_role: str

    qualification: str

    license_number: str

    experience: str

    certificate: str | None = None

    id_proof: str | None = None

    status: str

    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import datetime


class SkinAssessmentResponse(BaseModel):
    id: int
    user_id: int
    image_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# -----------------------------
# Appointment Schemas
# -----------------------------

class AppointmentCreate(BaseModel):
    dermatologist_id: int
    appointment_date: datetime
    reason: str


class AppointmentUpdate(BaseModel):
    appointment_date: datetime | None = None
    reason: str | None = None
    status: str | None = None
    consultant_notes: str | None = None
    dermatologist_recommended: bool | None = None


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    consultant_id: int | None = None
    dermatologist_id: int | None = None

    appointment_date: datetime
    reason: str

    status: str

    consultant_notes: str | None = None

    dermatologist_recommended: bool

    created_at: datetime

    class Config:
        from_attributes = True

class ConsultantReview(BaseModel):

    status: str

    consultant_notes: str

    dermatologist_recommended: bool

# --------------------------
# Notification
# --------------------------

class NotificationCreate(BaseModel):
    appointment_id: int
    title: str
    message: str


class NotificationResponse(BaseModel):
    id: int
    appointment_id: int

    title: str
    message: str

    is_read: bool

    created_at: datetime

    class Config:
        from_attributes = True


# =====================================
# Consultant Recommendation Schemas
# =====================================

class ConsultantRecommendationCreate(BaseModel):
    recommendation: str
    recommend_dermatologist: bool


class ConsultantRecommendationResponse(BaseModel):
    id: int

    user_id: int

    consultant_id: int

    assessment_id: int

    recommendation: str

    recommend_dermatologist: bool

    status: str

    created_at: datetime

    class Config:
        from_attributes = True

from datetime import date

class DermatologistTreatmentCreate(BaseModel):

    diagnosis: str

    medicines: str

    morning_routine: str

    night_routine: str

    lifestyle_advice: str

    follow_up_date: date


class DermatologistTreatmentResponse(BaseModel):

    id: int

    appointment_id: int

    user_id: int

    dermatologist_id: int

    diagnosis: str

    medicines: str

    morning_routine: str

    night_routine: str

    lifestyle_advice: str

    follow_up_date: date

    created_at: datetime

    class Config:
        from_attributes = True

class DermatologistDiagnosisCreate(BaseModel):

    diagnosis: str

    treatment_plan: str

    medications: str

    advice: str

    follow_up_date: date


class DermatologistDiagnosisResponse(BaseModel):

    id: int

    appointment_id: int

    user_id: int

    dermatologist_id: int

    diagnosis: str

    treatment_plan: str

    medications: str

    advice: str

    follow_up_date: date

    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    product_id: str

    product_name: str

    brand_name: str

    category: str

    skin_type: Optional[str] = None

    skin_concern: Optional[str] = None

    ingredients: Optional[str] = None

    description: Optional[str] = None

    usage: Optional[str] = None

    price: float

    rating: Optional[float] = None

    image_url: Optional[str] = None

    product_url: Optional[str] = None


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True



class RoutineCheckRequest(BaseModel):
    routine_time: str
    step: str
    completed: bool