import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types throughout this module match database_schemas/
# skinlytics_postgresql_schema_v3.sql's literal DDL exactly (e.g. columns with only a
# DEFAULT and no NOT NULL stay Optional here) — confirmed against a live database that
# was loaded directly from that file, not guessed.


class SkinType(Base):
    """Taxonomy/reference table — seeded, rarely written after (Normal/Dry/Oily/
    Combination/Sensitive)."""

    __tablename__ = "skin_types"

    skin_type_id: Mapped[int] = mapped_column(primary_key=True)
    skin_type_name: Mapped[str | None] = mapped_column(unique=True, default=None)
    description: Mapped[str | None] = mapped_column(Text, default=None)


class SkinConcern(Base):
    """Taxonomy/reference table — seeded (Acne, Hyperpigmentation, ...)."""

    __tablename__ = "skin_concerns"

    concern_id: Mapped[int] = mapped_column(primary_key=True)
    concern_name: Mapped[str | None] = mapped_column(unique=True, default=None)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    category: Mapped[str | None] = mapped_column(default=None)


class SkinProfile(Base):
    """One row per saved profile version — `is_current` marks the active one, prior
    versions are kept (is_current=False) rather than overwritten. Owned exclusively by
    the Skin Profile service (ADR-005)."""

    __tablename__ = "skin_profiles"
    # idx_ naming to match the live database — see user/models.py's note.
    __table_args__ = (Index("idx_skin_profiles_user", "user_id"),)

    skin_profile_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    skin_type_id: Mapped[int] = mapped_column(ForeignKey("skin_types.skin_type_id"))
    age_group: Mapped[str | None] = mapped_column(default=None)
    allergies: Mapped[str | None] = mapped_column(Text, default=None)
    sensitivities: Mapped[str | None] = mapped_column(Text, default=None)
    is_current: Mapped[bool | None] = mapped_column(server_default=text("true"))
    is_deleted: Mapped[bool | None] = mapped_column(server_default=text("false"))
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class SkinProfileConcern(Base):
    __tablename__ = "skin_profile_concerns"
    # No uniqueness constraint on (skin_profile_id, concern_id) in the source schema —
    # not adding one here either (CONVENTIONS.md: DDL source of truth is the SQL file).
    # idx_ naming to match the live database — see user/models.py's note.
    __table_args__ = (
        CheckConstraint("severity_rating BETWEEN 1 AND 10", name="ck_concern_severity"),
        CheckConstraint("priority_level BETWEEN 1 AND 10", name="ck_concern_priority"),
        Index("idx_skin_profile_concerns_profile", "skin_profile_id"),
    )

    profile_concern_id: Mapped[int] = mapped_column(primary_key=True)
    skin_profile_id: Mapped[int] = mapped_column(
        ForeignKey("skin_profiles.skin_profile_id", ondelete="CASCADE")
    )
    concern_id: Mapped[int] = mapped_column(ForeignKey("skin_concerns.concern_id"))
    severity_rating: Mapped[int | None] = mapped_column(default=None)
    priority_level: Mapped[int | None] = mapped_column(default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
