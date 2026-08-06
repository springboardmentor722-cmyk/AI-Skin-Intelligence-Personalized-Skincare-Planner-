from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class LifestyleTrackingCreate(BaseModel):
    """Schema for creating lifestyle log"""
    tracking_date: date
    sleep_duration: Optional[float] = None
    sleep_quality: Optional[str] = None
    water_intake: Optional[int] = None
    exercise_duration: Optional[int] = None
    exercise_type: Optional[str] = None
    stress_level: Optional[int] = None
    environmental_exposure: Optional[str] = None
    notes: Optional[str] = None


class LifestyleTrackingUpdate(BaseModel):
    """Schema for updating lifestyle log"""
    sleep_duration: Optional[float] = None
    sleep_quality: Optional[str] = None
    water_intake: Optional[int] = None
    exercise_duration: Optional[int] = None
    exercise_type: Optional[str] = None
    stress_level: Optional[int] = None
    environmental_exposure: Optional[str] = None
    notes: Optional[str] = None


class LifestyleTrackingResponse(BaseModel):
    """Schema for lifestyle log response"""
    tracking_id: int
    user_id: int
    tracking_date: date
    sleep_duration: Optional[float]
    sleep_quality: Optional[str]
    water_intake: Optional[int]
    exercise_duration: Optional[int]
    exercise_type: Optional[str]
    stress_level: Optional[int]
    environmental_exposure: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True