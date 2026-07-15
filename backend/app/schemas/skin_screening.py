from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class SkinScreeningBase(BaseModel):
    skin_type: Optional[str] = None
    primary_concern: Optional[str] = None
    secondary_concern: Optional[str] = None
    skin_goals: Optional[Dict[str, Any]] = None
    skin_sensitivity: Optional[str] = None
    allergies: Optional[str] = None
    previous_treatments: Optional[str] = None
    current_routine: Optional[str] = None
    dermatologist_consultation_history: Optional[str] = None
    pregnancy_status: Optional[str] = None
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    current_medications: Optional[str] = None
    stress_level: Optional[str] = None

class SkinScreeningCreate(SkinScreeningBase):
    image_base64: Optional[str] = None

class SkinScreeningUpdate(SkinScreeningBase):
    pass

class SkinScreeningResponse(SkinScreeningBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
