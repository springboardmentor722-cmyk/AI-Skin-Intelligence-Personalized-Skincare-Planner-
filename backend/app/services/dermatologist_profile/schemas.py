import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VerificationStatus = Literal[
    "pending", "approved", "rejected", "more_info_requested", "suspended", "deactivated"
]

DocumentType = Literal[
    "government_id", "professional_certificate", "medical_license", "supporting_document"
]

# Every field the mega-prompt's Dermatologist onboarding list names, minus what
# Better Auth already owns (full name -> user.name, email -> user.email) and what's a
# document upload rather than a form field (profile photo, government ID, medical
# license, supporting documents). Matches DermatologistProfile's own nullability
# (database_schemas/skinlytics_postgresql_schema_v3.sql) — a distinct field set from
# ConsultantProfileSubmit, not a shared/parameterized one, since the two roles'
# real-world fields genuinely differ (medical registration/council vs. license/
# consultation modes).


class DermatologistProfileSubmit(BaseModel):
    medical_registration_number: str = Field(min_length=1)
    medical_council: str = Field(min_length=1)
    hospital_clinic: str | None = None
    years_of_practice: int = Field(ge=0, le=80)
    degrees: list[str] = Field(min_length=1)
    board_certifications: list[str] | None = None
    specializations: list[str] = Field(min_length=1)
    research_interests: str | None = None
    professional_biography: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    location: str | None = None


class DermatologistProfileUpdate(BaseModel):
    """PATCH — every field optional; only supplied fields change. Never touches
    verification_status (that's the admin review actions' job, admin/router.py)."""

    profile_image_url: str | None = None
    medical_registration_number: str | None = None
    medical_council: str | None = None
    hospital_clinic: str | None = None
    years_of_practice: int | None = Field(default=None, ge=0, le=80)
    degrees: list[str] | None = None
    board_certifications: list[str] | None = None
    specializations: list[str] | None = None
    research_interests: str | None = None
    professional_biography: str | None = None
    phone: str | None = None
    location: str | None = None


class DermatologistProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    profile_image_url: str | None
    medical_registration_number: str | None
    medical_council: str | None
    hospital_clinic: str | None
    years_of_practice: int | None
    degrees: list[str] | None
    board_certifications: list[str] | None
    specializations: list[str] | None
    research_interests: str | None
    professional_biography: str | None
    phone: str | None
    location: str | None
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
