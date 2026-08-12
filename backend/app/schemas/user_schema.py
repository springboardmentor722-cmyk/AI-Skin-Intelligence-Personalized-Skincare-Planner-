from pydantic import BaseModel, EmailStr
from typing import Optional


# ============================
# Register Schema
# ============================

class UserCreate(BaseModel):

    name: str

    email: EmailStr

    password: str

    role: str

    qualification: Optional[str] = None

    experience: Optional[int] = None

    specialization: Optional[str] = None

    license_number: Optional[str] = None

    organization: Optional[str] = None


# ============================
# User Response Schema
# ============================

class UserResponse(BaseModel):

    id: int

    name: str

    email: EmailStr

    role: str

    qualification: Optional[str] = None

    experience: Optional[int] = None

    specialization: Optional[str] = None

    license_number: Optional[str] = None

    organization: Optional[str] = None

    verification_status: Optional[str] = None

    class Config:
        from_attributes = True