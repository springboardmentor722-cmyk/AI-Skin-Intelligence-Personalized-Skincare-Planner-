from typing import Any
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    id: Any
    __name__: str

    # Generate __tablename__ automatically if not overridden
    @classmethod
    def __declare_last__(cls):
        if not hasattr(cls, '__tablename__'):
            cls.__tablename__ = cls.__name__.lower()

class TimestampMixin:
    """Mixin to add created_at and updated_at columns"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

class UUIDMixin:
    """Mixin to add a UUID primary key"""
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
