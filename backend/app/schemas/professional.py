from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProfessionalProfileBase(BaseModel):
    qualifications: str
    registration_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    years_of_experience: int = 0
    specialization: Optional[str] = None
    consultation_mode: Optional[str] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    bio: Optional[str] = None

class ProfessionalProfileResponse(ProfessionalProfileBase):
    id: UUID
    user_id: UUID
    verification_status: str
    
    class Config:
        from_attributes = True

class ProfessionalUserResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    roles: List[str] = []
    profile: Optional[ProfessionalProfileResponse] = None
