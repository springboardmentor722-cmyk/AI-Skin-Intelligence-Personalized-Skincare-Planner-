from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class LifestyleLogBase(BaseModel):
    sleep_duration: Optional[float] = None
    water_intake: Optional[float] = None
    exercise: Optional[str] = None
    stress: Optional[str] = None
    diet: Optional[str] = None
    working_hours: Optional[str] = None
    outdoor_time: Optional[str] = None
    sun_exposure: Optional[str] = None
    uv_exposure: Optional[str] = None
    pollution_exposure: Optional[str] = None
    humidity_exposure: Optional[str] = None
    screen_time: Optional[float] = None
    night_shift: Optional[bool] = False
    hydration_level: Optional[str] = None

class LifestyleLogCreate(LifestyleLogBase):
    pass

class LifestyleLogUpdate(LifestyleLogBase):
    pass

class LifestyleLogResponse(LifestyleLogBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
