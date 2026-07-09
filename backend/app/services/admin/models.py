import datetime
from typing import Any

from sqlalchemy import CheckConstraint, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Owned by the Admin service (ADR-005) — both tables are cross-cutting (any service
# can trigger an audit-log write, any professional profile can attach a document) but
# the *write* interface and the Admin review UI both live here, matching the pattern
# recommendations/service.py already sets for "the service that reads/ranks something
# others own."


class VerificationDocument(Base):
    """Polymorphic across ConsultantProfile/DermatologistProfile via `owner_user_id`,
    not a profile FK — one table for government ID / professional certificate /
    medical license / supporting-document uploads for either role. `storage_key` is
    the object key in the S3-compatible store (core/storage.py), never a raw
    filesystem path."""

    __tablename__ = "verification_documents"
    __table_args__ = (
        CheckConstraint(
            "document_type IN "
            "('government_id', 'professional_certificate', "
            "'medical_license', 'supporting_document')",
            name="ck_verification_documents_type",
        ),
        Index("idx_verification_documents_owner", "owner_user_id"),
    )

    document_id: Mapped[int] = mapped_column(primary_key=True)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    document_type: Mapped[str] = mapped_column()
    storage_key: Mapped[str] = mapped_column()
    original_filename: Mapped[str | None] = mapped_column(default=None)
    uploaded_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    verified_by: Mapped[str | None] = mapped_column(ForeignKey("user.id"), default=None)
    verified_at: Mapped[datetime.datetime | None] = mapped_column(default=None)


class AuditLog(Base):
    """General-purpose system audit log — Admin's "Audit Logs"/"Activity Logs"
    screens, and every verification-workflow transition
    (submitted/approved/rejected/more_info_requested/suspended/deactivated/
    role_changed/banned/...). `metadata_` (mapped to the real `metadata` column —
    `metadata` is a reserved attribute name on SQLAlchemy's DeclarativeBase) is the
    one JSONB column in this schema by design: an event log is genuinely unstructured
    per action, unlike the typed relational tables everywhere else in this project."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_actor", "actor_user_id"),
        Index("idx_audit_logs_target", "target_type", "target_id"),
        Index("idx_audit_logs_created", "created_at"),
    )

    audit_log_id: Mapped[int] = mapped_column(primary_key=True)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("user.id"), default=None)
    action: Mapped[str] = mapped_column()
    target_type: Mapped[str | None] = mapped_column(default=None)
    target_id: Mapped[str | None] = mapped_column(default=None)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB, default=None)
    ip_address: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
