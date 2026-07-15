import uuid
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class DecisionMatrix(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "decision_matrix"

    skin_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    primary_concern: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sensitivity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    routine_template: Mapped[dict] = mapped_column(JSON, nullable=False)
    # Expected JSON structure:
    # {
    #   "morning": [{"step": 1, "category": "Cleanser", "ingredient": "..."}],
    #   "night": [...]
    # }
