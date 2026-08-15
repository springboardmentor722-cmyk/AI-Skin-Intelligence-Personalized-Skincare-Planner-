import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ProviderRole = Literal["consultant", "dermatologist"]
ConsultationMode = Literal["video", "in_person", "chat"]
AppointmentStatus = Literal["pending", "confirmed", "completed", "cancelled", "no_show"]


class AvailabilityRule(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_of_week: int = Field(ge=0, le=6)
    start_time: datetime.time
    end_time: datetime.time
    slot_duration_minutes: int = Field(default=30, ge=5, le=240)


class AvailabilityRead(BaseModel):
    rules: list[AvailabilityRule]


class AvailabilityUpdate(BaseModel):
    rules: list[AvailabilityRule]


class AvailabilityExceptionCreate(BaseModel):
    exception_date: datetime.date
    start_time: datetime.time | None = None
    end_time: datetime.time | None = None
    reason: str | None = None


class AvailabilityExceptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    exception_id: int
    exception_date: datetime.date
    start_time: datetime.time | None
    end_time: datetime.time | None
    reason: str | None


class ProviderSummaryRead(BaseModel):
    provider_id: str
    name: str | None
    role: ProviderRole
    biography: str | None
    specializations: list[str] | None
    consultation_modes: list[str] | None
    years_experience: int | None


class SlotRead(BaseModel):
    start_time: datetime.datetime
    end_time: datetime.datetime


class AppointmentCreate(BaseModel):
    provider_id: str
    start_time: datetime.datetime
    consultation_mode: ConsultationMode


class AppointmentRead(BaseModel):
    appointment_id: int
    user_id: str
    provider_id: str
    provider_role: ProviderRole
    consultation_mode: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    status: AppointmentStatus
    cancellation_reason: str | None
    original_start_time: datetime.datetime | None
    notes: str | None
    other_party_name: str | None


class AppointmentCancelUpdate(BaseModel):
    reason: str | None = None


class AppointmentRescheduleUpdate(BaseModel):
    start_time: datetime.datetime


class AppointmentCompleteUpdate(BaseModel):
    notes: str | None = None
