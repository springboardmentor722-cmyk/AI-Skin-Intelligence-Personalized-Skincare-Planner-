import datetime

from sqlalchemy import ForeignKey, Index, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class UserProfile(Base):
    """database_schemas/skinlytics_postgresql_schema_v3.sql — extends the Better Auth
    `user` table with app-specific personal info. Owned exclusively by the User
    service (ADR-005) — other services read it only through this service's functions,
    never this table directly.

    Nullability matches the SQL file's DDL exactly, not "sensible" defaults — e.g.
    created_at/updated_at have a DEFAULT but no NOT NULL, so they stay Optional here.
    `email`/`role`/`is_active` are NOT in the documented v3 schema; they exist on the
    live database (confirmed with the user: loaded directly from the SQL file, so
    presumably a leftover from an earlier v2-era load) — added here to match reality
    per the "stamp baseline, no DDL" reconciliation, but flagged in PROGRESS.md as
    schema drift to resolve later, not accepted as correct design (ADR-003: role lives
    on Better Auth's user.role, not duplicated here).
    """

    __tablename__ = "user_profiles"
    # Index/constraint names match the live database exactly (idx_* naming, not
    # CONVENTIONS.md's ix_<table>_<cols> rule — another doc-vs-reality mismatch found
    # while reconciling, flagged in PROGRESS.md rather than silently picking one).
    # user_id and email each carry *two* separate index objects on the live db (a plain
    # index plus a same-column unique constraint) rather than one combined unique
    # index — reproduced exactly rather than collapsed into SQLAlchemy's usual shorthand.
    __table_args__ = (
        Index("idx_user_profiles_user", "user_id"),
        UniqueConstraint("user_id", name="user_profiles_user_id_key"),
        Index("ix_user_profiles_email", "email"),
        Index("user_profiles_email_key", "email", unique=True),
    )

    profile_id: Mapped[int] = mapped_column(primary_key=True)
    # References Better Auth's "user" table — owned by the Better Auth CLI's migration
    # stream, not Alembic's (CONVENTIONS.md). No SQLAlchemy model for it exists here on
    # purpose; the FK still renders correctly by table/column name string alone.
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    first_name: Mapped[str | None] = mapped_column(default=None)
    last_name: Mapped[str | None] = mapped_column(default=None)
    profile_image_url: Mapped[str | None] = mapped_column(default=None)
    date_of_birth: Mapped[datetime.date | None] = mapped_column(default=None)
    gender: Mapped[str | None] = mapped_column(default=None)
    phone_number: Mapped[str | None] = mapped_column(default=None)
    location: Mapped[str | None] = mapped_column(default=None)
    bio: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())

    # --- Not in the documented v3 schema — schema drift, see class docstring ---
    email: Mapped[str | None] = mapped_column(default=None)
    role: Mapped[str | None] = mapped_column(default="user")
    is_active: Mapped[bool | None] = mapped_column(server_default="true")
