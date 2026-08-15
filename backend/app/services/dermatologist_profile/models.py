import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Same discipline as consultant_profile/models.py — separate table, not shared, since
# the field sets are genuinely different (medical registration/council vs. license/
# consultation modes), not optional decoration on each other.


class DermatologistProfile(Base):
    """One row per dermatologist (`user.role == "dermatologist"`). Same verification
    lifecycle as ConsultantProfile — see that model's docstring for the gating
    contract with `require_verified_professional`."""

    __tablename__ = "dermatologist_profiles"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN "
            "('pending', 'approved', 'rejected', "
            "'more_info_requested', 'suspended', 'deactivated')",
            name="ck_dermatologist_profiles_status",
        ),
        Index("idx_dermatologist_profiles_status", "verification_status"),
    )

    dermatologist_profile_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), unique=True)
    profile_image_url: Mapped[str | None] = mapped_column(default=None)
    medical_registration_number: Mapped[str | None] = mapped_column(default=None)
    medical_council: Mapped[str | None] = mapped_column(default=None)
    hospital_clinic: Mapped[str | None] = mapped_column(default=None)
    years_of_practice: Mapped[int | None] = mapped_column(default=None)
    degrees: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    board_certifications: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    specializations: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    research_interests: Mapped[str | None] = mapped_column(Text, default=None)
    professional_biography: Mapped[str | None] = mapped_column(Text, default=None)
    consultation_modes: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    phone: Mapped[str | None] = mapped_column(default=None)
    location: Mapped[str | None] = mapped_column(default=None)
    verification_status: Mapped[str] = mapped_column(default="pending")
    reviewed_by: Mapped[str | None] = mapped_column(ForeignKey("user.id"), default=None)
    reviewed_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
    rejection_reason: Mapped[str | None] = mapped_column(Text, default=None)
    submitted_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
