import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from .database import Base


class RoleEnum(str, enum.Enum):
    user = "user"
    consultant = "consultant"
    dermatologist = "dermatologist"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.user, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Professional verification, relevant for consultant/dermatologist roles.
    verification_status = Column(String, default="not_applicable")  # not_applicable, pending, verified, rejected
    license_number = Column(String, nullable=True)
    credential_notes = Column(Text, nullable=True)  # e.g. qualifications, clinic affiliation
    verification_reviewed_by = Column(Integer, nullable=True)  # admin user id
    verification_reviewed_at = Column(DateTime, nullable=True)

    profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assessments = relationship("SkinAssessment", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("Routine", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    scores = relationship("SkinHealthScore", back_populates="user", cascade="all, delete-orphan")
    photos = relationship("SkinPhoto", back_populates="user", cascade="all, delete-orphan")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    skin_type = Column(String)               # oily, dry, combination, normal, sensitive
    age_group = Column(String)                # teen, 20s, 30s, 40s, 50+
    skin_concerns = Column(JSON, default=list)      # ["acne", "dark_spots", ...]
    allergies = Column(JSON, default=list)
    sensitivities = Column(JSON, default=list)
    lifestyle_habits = Column(JSON, default=list)   # ["smoking", "high_stress", "outdoor_work", ...]
    sleep_quality = Column(String)            # poor, average, good, excellent
    sleep_hours = Column(Float, default=7.0)
    water_intake_liters = Column(Float, default=2.0)
    environmental_exposure = Column(JSON, default=list)  # ["high_pollution", "high_uv", "dry_climate", ...]
    budget_range = Column(String, default="medium")  # low, medium, high
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    concerns_identified = Column(JSON, default=list)
    condition_scores = Column(JSON, default=dict)     # {"acne": 62, "hydration": 40, ...}
    overall_condition_score = Column(Float, default=0.0)
    prioritized_concerns = Column(JSON, default=list)  # ordered list, most urgent first
    risk_factors = Column(JSON, default=list)
    scoring_method = Column(String, default="rules")  # "ml" if the trained XGBoost model was used, else "rules"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")


class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    routine_type = Column(String)   # morning, evening, weekly, seasonal
    steps = Column(JSON, default=list)  # [{"order":1,"category":"Cleansing","product_category":"Face Wash","instruction": "..."}]
    season = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="routines")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String)    # Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, etc.
    description = Column(Text)
    benefits = Column(JSON, default=list)
    good_for_concerns = Column(JSON, default=list)
    good_for_skin_types = Column(JSON, default=list)
    cautions = Column(JSON, default=list)          # e.g. "avoid with vitamin C", "not for pregnancy"
    conflicts_with = Column(JSON, default=list)     # ingredient names that shouldn't be combined


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand = Column(String)
    category = Column(String)  # Face Wash, Moisturizer, Sunscreen, Serum, Toner, Treatment, Face Mask
    price = Column(Float, default=0.0)
    key_ingredients = Column(JSON, default=list)
    suitable_skin_types = Column(JSON, default=list)
    suitable_concerns = Column(JSON, default=list)
    description = Column(Text)


class SkinHealthScore(Base):
    __tablename__ = "skin_health_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    condition_score = Column(Float)     # 35%
    lifestyle_score = Column(Float)     # 20%
    sleep_score = Column(Float)         # 15%
    routine_consistency_score = Column(Float)  # 20%
    hydration_score = Column(Float)     # 10%
    overall_score = Column(Float)
    computed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scores")


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    log_date = Column(DateTime, default=datetime.utcnow)
    routine_adherence_percent = Column(Float, default=0.0)  # 0-100 self reported for the day
    mood_or_notes = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)

    user = relationship("User", back_populates="progress_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    type = Column(String)   # routine_reminder, replenishment, hydration, sleep, progress_alert, platform
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class SkinPhoto(Base):
    __tablename__ = "skin_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    file_path = Column(String, nullable=False)      # path on disk under app/media/uploads
    content_type = Column(String, default="image/jpeg")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Computer-vision analysis results (see app/cv_engine.py). These are
    # visual SIGNAL ESTIMATES from classic image-processing heuristics
    # (color-space + texture analysis), not a medical diagnosis.
    analyzed = Column(Boolean, default=False)
    face_detected = Column(Boolean, default=False)
    redness_score = Column(Float, nullable=True)
    texture_score = Column(Float, nullable=True)
    evenness_score = Column(Float, nullable=True)
    oiliness_score = Column(Float, nullable=True)
    analysis_notes = Column(JSON, default=list)

    user = relationship("User", back_populates="photos")
