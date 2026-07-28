"""Pydantic schemas for authentication endpoints."""

import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str
    gender: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    role: str = Field(..., description="One of: User, Skincare Consultant, Dermatologist, Administrator")
    terms_accepted: bool

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        return value

    @field_validator("terms_accepted")
    @classmethod
    def must_accept_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("You must accept the terms and conditions")
        return value

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info):
        password = info.data.get("password")
        if password and value != password:
            raise ValueError("Passwords do not match")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
