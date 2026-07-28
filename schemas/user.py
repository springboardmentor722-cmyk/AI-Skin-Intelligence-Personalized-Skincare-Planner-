"""Pydantic schemas for user profile management."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone_number: str
    gender: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    profile_photo_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("role", mode="before")
    @classmethod
    def coerce_role(cls, value):
        """Accept either a role name string or the ORM Role object directly."""
        return getattr(value, "name", value)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserListItem(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("role", mode="before")
    @classmethod
    def coerce_role(cls, value):
        """Accept either a role name string or the ORM Role object directly."""
        return getattr(value, "name", value)
