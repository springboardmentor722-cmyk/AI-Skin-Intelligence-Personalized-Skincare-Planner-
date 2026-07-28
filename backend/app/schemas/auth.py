# app/schemas/auth.py
import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.USER

    class Config:
        use_enum_values = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    status: str
    is_verified: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ConsultantApplicationRequest(BaseModel):
    specialization: str
    years_of_experience: int
    certification: str
    bio: Optional[str] = None
    government_id_url: str


class DermatologistApplicationRequest(BaseModel):
    medical_license_number: str
    medical_council_registration: str
    hospital_or_clinic_name: str
    specialization: str
    years_of_experience: int
    bio: Optional[str] = None
    government_id_url: str
    medical_degree_certificate_url: str
    medical_license_upload_url: str
    profile_photo_url: Optional[str] = None


class ApprovalDecisionRequest(BaseModel):
    decision: str  # "approve" | "reject" | "request_info"
    notes: Optional[str] = None