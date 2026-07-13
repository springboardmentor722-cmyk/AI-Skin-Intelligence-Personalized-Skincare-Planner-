import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's
# literal DDL exactly, same discipline as every other service's models.py. Named
# `consultant_*` in the real schema but generic in practice — shared by both
# Consultant and Dermatologist roles (docs/ARCHITECTURE.md §2 calls this
# `consultant_assignments`, a stale name; the real DDL and this model use
# `consultant_clients`). No separate dermatologist-specific tables exist.


class ConsultantClient(Base):
    """One row per professional-client assignment. `status` gates whether the
    professional can currently review this client — created out-of-band today
    (Admin's `POST /admin/consultant-clients`, backend/app/services/admin/), no
    self-service "request a consultant" flow exists yet."""

    __tablename__ = "consultant_clients"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'paused', 'ended')", name="ck_consultant_clients_status"
        ),
        UniqueConstraint("consultant_id", "user_id"),
        Index("idx_consultant_clients_consultant", "consultant_id"),
    )

    assignment_id: Mapped[int] = mapped_column(primary_key=True)
    consultant_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    status: Mapped[str | None] = mapped_column(default="active")
    assigned_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class ConsultantNote(Base):
    __tablename__ = "consultant_notes"
    __table_args__ = (Index("idx_consultant_notes_user", "user_id"),)

    note_id: Mapped[int] = mapped_column(primary_key=True)
    consultant_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    note_text: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
