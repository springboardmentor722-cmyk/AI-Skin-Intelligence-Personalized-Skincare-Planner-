import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.skin_profile import SkinType, Gender


class SkinProfileCreate(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[Gender] = None
    skin_type: Optional[SkinType] = None
    skin_concerns: List[str] = []
    allergies: List[str] = []
    sensitivities: List[str] = []


class SkinProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[Gender] = None
    skin_type: Optional[SkinType] = None
    skin_concerns: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    sensitivities: Optional[List[str]] = None


class SkinProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    age: Optional[int]
    gender: Optional[Gender]
    skin_type: Optional[SkinType]
    skin_concerns: List[str]
    allergies: List[str]
    sensitivities: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True