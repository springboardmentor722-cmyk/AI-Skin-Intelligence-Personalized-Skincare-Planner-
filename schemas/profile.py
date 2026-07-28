"""Pydantic schemas for the Skin Profile module."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SkinProfileBase(BaseModel):
    skin_type: Optional[str] = Field(None, description="Normal, Dry, Oily, Combination, Sensitive")
    skin_concerns: Optional[str] = None
    allergies: Optional[str] = None
    sensitivity_level: Optional[str] = None
    current_products: Optional[str] = None
    hydration_level: Optional[str] = None
    water_intake_liters: Optional[float] = Field(None, ge=0, le=20)
    sun_exposure: Optional[str] = None
    occupation: Optional[str] = None
    environment: Optional[str] = None


class SkinProfileCreate(SkinProfileBase):
    pass


class SkinProfileUpdate(SkinProfileBase):
    pass


class SkinProfileResponse(SkinProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    skin_photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
