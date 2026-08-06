from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserProfileCreate(BaseModel):
    """Schema for creating user profile"""
    skin_type: str
    skin_tone: Optional[str] = None
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    skin_type: Optional[str] = None
    skin_tone: Optional[str] = None
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None


class UserProfileResponse(BaseModel):
    """Schema for user profile response"""
    profile_id: int
    user_id: int
    skin_type: Optional[str]
    skin_tone: Optional[str]
    allergies: Optional[str]
    sensitivities: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True