from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AppointmentCreate(BaseModel):
    professional_id: UUID
    screening_request_id: Optional[UUID] = None
    appointment_date: datetime
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    professional_id: UUID
    screening_request_id: Optional[UUID] = None
    appointment_date: datetime
    status: str
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
