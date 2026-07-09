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
    `email`/`role`/`is_active` briefly existed here as schema drift (duplicating
    Better Auth's own `"user"` table, against ADR-003) — dropped in migration
    c21b3568fc1a once confirmed nothing read them and Better Auth's `"user"` table
    already had identical values.
    """

    __tablename__ = "user_profiles"
    # Index/constraint names match the live database exactly (idx_* naming, not
    # CONVENTIONS.md's ix_<table>_<cols> rule — a doc-vs-reality mismatch reconciled in
    # docs/CONVENTIONS.md rather than renaming a working index).
    __table_args__ = (
        Index("idx_user_profiles_user", "user_id"),
        UniqueConstraint("user_id", name="user_profiles_user_id_key"),
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
