from typing import List
from sqlalchemy import String, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

# Association table for User <-> Role many-to-many relationship
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role", secondary=user_roles, back_populates="users"
    )
    
    skin_profile: Mapped["SkinProfile"] = relationship("SkinProfile", back_populates="user", uselist=False)
    lifestyle_profile: Mapped["LifestyleProfile"] = relationship("LifestyleProfile", back_populates="user", uselist=False)
    environment_profile: Mapped["EnvironmentProfile"] = relationship("EnvironmentProfile", back_populates="user", uselist=False)
    user_profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False)
