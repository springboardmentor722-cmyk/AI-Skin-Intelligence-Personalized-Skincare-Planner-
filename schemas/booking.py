"""Pydantic schemas for the two booking flows — Milestone 3."""

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from schemas.progress import ProgressPhotoResponse


class ProviderSummary(BaseModel):
    """A consultant or dermatologist as shown in the user's booking picker."""

    id: uuid.UUID
    full_name: str
    email: EmailStr
    city: Optional[str] = None

    class Config:
        from_attributes = True


# --- Consultant assignment (ongoing, no schedule) ---


class ConsultantBookingRequest(BaseModel):
    consultant_id: uuid.UUID
    message: Optional[str] = Field(None, max_length=500)


class ConsultantAssignmentResponse(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    client_id: uuid.UUID
    status: str
    message: Optional[str] = None
    consultant_name: Optional[str] = None
    client_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dermatologist appointment (scheduled, status workflow) ---


class AppointmentBookingRequest(BaseModel):
    dermatologist_id: uuid.UUID
    appointment_date: date
    appointment_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$", description="24h HH:MM")
    reason: Optional[str] = Field(None, max_length=255)


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., description="Pending, Confirmed, Completed, or Cancelled")


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    dermatologist_id: uuid.UUID
    patient_id: uuid.UUID
    appointment_date: date
    appointment_time: str
    reason: Optional[str] = None
    status: str
    dermatologist_name: Optional[str] = None
    patient_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Cross-role client/patient snapshot (consultant & dermatologist read access) ---


class LifestyleLogSummary(BaseModel):
    id: uuid.UUID
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    exercise_minutes: Optional[int] = None
    stress_level: Optional[str] = None
    smoking: bool
    alcohol: bool
    screen_time_hours: Optional[float] = None
    logged_at: datetime

    class Config:
        from_attributes = True


class ClientSnapshot(BaseModel):
    """Read-only view a consultant/dermatologist sees of an assigned client/patient."""

    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    age: Optional[int] = None
    gender: Optional[str] = None

    skin_type: Optional[str] = None
    skin_concerns: Optional[str] = None
    allergies: Optional[str] = None
    skin_photo_url: Optional[str] = None

    latest_overall_score: Optional[float] = None
    latest_primary_concern: Optional[str] = None
    detected_concerns: list[dict] = Field(default_factory=list)

    lifestyle_logs: list[LifestyleLogSummary] = Field(default_factory=list)
    appointments: list[AppointmentResponse] = Field(default_factory=list)
    progress_photos: list[ProgressPhotoResponse] = Field(default_factory=list)
    adherence: Optional[dict] = None
    improvement: Optional[dict] = None
