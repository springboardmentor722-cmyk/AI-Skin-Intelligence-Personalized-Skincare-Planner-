from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from datetime import date
from uuid import UUID

class UserProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    timezone: Optional[str] = None
    preferred_language: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: UUID
    user_id: UUID
    
    class Config:
        from_attributes = True
