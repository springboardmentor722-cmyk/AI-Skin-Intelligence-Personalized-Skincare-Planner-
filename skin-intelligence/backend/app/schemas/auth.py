import uuid
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: UserRole = UserRole.USER  # consultant/dermatologist/admin creation should be gated in production


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True
