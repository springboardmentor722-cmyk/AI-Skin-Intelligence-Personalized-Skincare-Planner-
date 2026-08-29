from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Literal

RoleType = Literal["user", "consultant", "dermatologist", "admin"]


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: RoleType = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    id: int
    full_name: str

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str