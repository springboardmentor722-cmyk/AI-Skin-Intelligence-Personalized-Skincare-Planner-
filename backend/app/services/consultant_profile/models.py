import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's
# literal DDL exactly, same discipline as skin_profile/models.py. Owned exclusively by
# the Consultant Profile service (ADR-005) — Admin's verification review reads this
# through this service's own functions, never the model directly.


class ConsultantProfile(Base):
    """One row per consultant (`user.role == "consultant"`), created at onboarding
    submission. `verification_status` gates every *operational* consultant feature
    (enforced by `require_verified_professional`, core/security.py) — it does not
    gate this profile's own management endpoints, which stay reachable in every
    status so a pending/rejected consultant can still view/edit their profile and
    upload missing documents."""

    __tablename__ = "consultant_profiles"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN "
            "('pending', 'approved', 'rejected', "
            "'more_info_requested', 'suspended', 'deactivated')",
            name="ck_consultant_profiles_status",
        ),
        Index("idx_consultant_profiles_status", "verification_status"),
    )

    consultant_profile_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), unique=True)
    profile_image_url: Mapped[str | None] = mapped_column(default=None)
    qualifications: Mapped[str | None] = mapped_column(Text, default=None)
    years_of_experience: Mapped[int | None] = mapped_column(default=None)
    current_organization: Mapped[str | None] = mapped_column(default=None)
    license_number: Mapped[str | None] = mapped_column(default=None)
    specializations: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    areas_of_expertise: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    languages: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    consultation_modes: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    availability: Mapped[str | None] = mapped_column(Text, default=None)
    biography: Mapped[str | None] = mapped_column(Text, default=None)
    linkedin_url: Mapped[str | None] = mapped_column(default=None)
    portfolio_url: Mapped[str | None] = mapped_column(default=None)
    clinic_address: Mapped[str | None] = mapped_column(Text, default=None)
    location: Mapped[str | None] = mapped_column(default=None)
    phone: Mapped[str | None] = mapped_column(default=None)
    verification_status: Mapped[str] = mapped_column(default="pending")
    reviewed_by: Mapped[str | None] = mapped_column(ForeignKey("user.id"), default=None)
    reviewed_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
    rejection_reason: Mapped[str | None] = mapped_column(Text, default=None)
    submitted_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
