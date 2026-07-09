import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VerificationStatus = Literal[
    "pending", "approved", "rejected", "more_info_requested", "suspended", "deactivated"
]

DocumentType = Literal[
    "government_id", "professional_certificate", "medical_license", "supporting_document"
]

# Every field the mega-prompt's Consultant onboarding list names, minus the ones
# Better Auth already owns (full name -> user.name, email -> user.email). All
# optional at the Pydantic layer except the handful a professional profile is
# meaningless without (qualifications, years_of_experience, phone) — matches the
# model's own nullability (database_schemas/skinlytics_postgresql_schema_v3.sql).


class ConsultantProfileSubmit(BaseModel):
    qualifications: str = Field(min_length=1)
    years_of_experience: int = Field(ge=0, le=80)
    current_organization: str | None = None
    license_number: str | None = None
    specializations: list[str] = Field(min_length=1)
    areas_of_expertise: list[str] | None = None
    languages: list[str] = Field(min_length=1)
    consultation_modes: list[str] = Field(min_length=1)
    availability: str | None = None
    biography: str = Field(min_length=1)
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    clinic_address: str | None = None
    location: str | None = None
    phone: str = Field(min_length=1)


class ConsultantProfileUpdate(BaseModel):
    """PATCH — every field optional; only supplied fields change. Never touches
    verification_status (that's the admin review actions' job, admin/router.py)."""

    profile_image_url: str | None = None
    qualifications: str | None = None
    years_of_experience: int | None = Field(default=None, ge=0, le=80)
    current_organization: str | None = None
    license_number: str | None = None
    specializations: list[str] | None = None
    areas_of_expertise: list[str] | None = None
    languages: list[str] | None = None
    consultation_modes: list[str] | None = None
    availability: str | None = None
    biography: str | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    clinic_address: str | None = None
    location: str | None = None
    phone: str | None = None


class ConsultantProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    profile_image_url: str | None
    qualifications: str | None
    years_of_experience: int | None
    current_organization: str | None
    license_number: str | None
    specializations: list[str] | None
    areas_of_expertise: list[str] | None
    languages: list[str] | None
    consultation_modes: list[str] | None
    availability: str | None
    biography: str | None
    linkedin_url: str | None
    portfolio_url: str | None
    clinic_address: str | None
    location: str | None
    phone: str | None
    verification_status: VerificationStatus
    reviewed_by: str | None
    reviewed_at: datetime.datetime | None
    rejection_reason: str | None
    submitted_at: datetime.datetime | None
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


class VerificationDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    document_type: DocumentType
    original_filename: str | None
    uploaded_at: datetime.datetime | None
    verified_at: datetime.datetime | None
