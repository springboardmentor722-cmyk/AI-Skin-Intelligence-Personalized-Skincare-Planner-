import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Integer, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class SkinType(str, enum.Enum):
    NORMAL = "normal"
    DRY = "dry"
    OILY = "oily"
    COMBINATION = "combination"
    SENSITIVE = "sensitive"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    age = Column(Integer, nullable=True)
    gender = Column(Enum(Gender), nullable=True)
    skin_type = Column(Enum(SkinType), nullable=True)

    # Stored as arrays of text for simplicity in Milestone 1
    skin_concerns = Column(ARRAY(String), default=list)
    allergies = Column(ARRAY(String), default=list)
    sensitivities = Column(ARRAY(String), default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="skin_profile")