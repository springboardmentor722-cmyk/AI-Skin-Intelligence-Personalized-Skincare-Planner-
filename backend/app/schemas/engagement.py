# app/schemas/engagement.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    professional_id: str
    professional_type: str  # "consultant" | "dermatologist"
    scheduled_at: datetime
    reason: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str  # confirmed | completed | cancelled


class AssignmentRequest(BaseModel):
    professional_id: str  # consultant_id or dermatologist_id depending on endpoint


class AssignmentStatusUpdate(BaseModel):
    status: str  # active | ended


class ConsultationMessageCreate(BaseModel):
    message: str


class ConsultationComplete(BaseModel):
    summary: Optional[str] = None


class SkinAssessmentReviewUpdate(BaseModel):
    status: str  # reviewed
    reviewer_notes: Optional[str] = None