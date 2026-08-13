"""SQLAlchemy ORM models — Milestone 1 schema + Milestone 2 additions."""
import uuid
from datetime import datetime, date, time

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, Time, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Role:
    USER = "user"
    DERMATOLOGIST = "dermatologist"
    CONSULTANT = "consultant"
    ADMIN = "admin"
    ALL = [USER, DERMATOLOGIST, CONSULTANT, ADMIN]


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default=Role.USER, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    skin_profile: Mapped["SkinProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    derm_profile: Mapped["DermatologistProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    consultant_profile: Mapped["ConsultantProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    age: Mapped[int | None] = mapped_column(Integer)
    gender: Mapped[str | None] = mapped_column(String(30))
    skin_type: Mapped[str | None] = mapped_column(String(30))       # oily / dry / combination / normal / sensitive
    skin_tone: Mapped[str | None] = mapped_column(String(30))
    concerns: Mapped[str | None] = mapped_column(Text)              # comma separated: acne, pigmentation, ageing...
    allergies: Mapped[str | None] = mapped_column(Text)
    sensitivities: Mapped[str | None] = mapped_column(Text)
    medical_history: Mapped[str | None] = mapped_column(Text)
    current_products: Mapped[str | None] = mapped_column(Text)
    goals: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="skin_profile")


class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"
    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_lifestyle_user_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    log_date: Mapped[date] = mapped_column(Date, default=date.today)
    sleep_hours: Mapped[float | None] = mapped_column(Float)
    water_intake_l: Mapped[float | None] = mapped_column(Float)
    exercise_minutes: Mapped[int | None] = mapped_column(Integer)
    stress_level: Mapped[int | None] = mapped_column(Integer)       # 1–10
    environment_exposure: Mapped[str | None] = mapped_column(String(60))  # low / moderate / high pollution & sun
    notes: Mapped[str | None] = mapped_column(Text)


class DermatologistProfile(Base):
    __tablename__ = "dermatologist_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(200))
    specialization: Mapped[str | None] = mapped_column(String(200))
    experience_years: Mapped[int | None] = mapped_column(Integer, default=0)
    clinic_name: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    languages: Mapped[str | None] = mapped_column(String(200))
    consultation_fee: Mapped[float | None] = mapped_column(Float, default=0)
    consultation_types: Mapped[str | None] = mapped_column(String(120), default="video,clinic")
    bio: Mapped[str | None] = mapped_column(Text)
    rating: Mapped[float] = mapped_column(Float, default=4.8)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    vacation_mode: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="derm_profile")
    slots: Mapped[list["AvailabilitySlot"]] = relationship(back_populates="dermatologist", cascade="all, delete-orphan")


class AvailabilitySlot(Base):
    """Weekly recurring availability. day_of_week: 0 = Monday … 6 = Sunday."""
    __tablename__ = "availability_slots"

    id: Mapped[int] = mapped_column(primary_key=True)
    dermatologist_id: Mapped[int] = mapped_column(ForeignKey("dermatologist_profiles.id"), index=True)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_minutes: Mapped[int] = mapped_column(Integer, default=30)

    dermatologist: Mapped[DermatologistProfile] = relationship(back_populates="slots")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    dermatologist_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    appt_date: Mapped[date] = mapped_column(Date, nullable=False)
    appt_time: Mapped[time] = mapped_column(Time, nullable=False)
    consultation_type: Mapped[str] = mapped_column(String(30), default="video")   # video / clinic
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    # pending -> confirmed | rejected ; confirmed -> completed | cancelled
    doctor_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    dermatologist: Mapped[User] = relationship(foreign_keys=[dermatologist_id])


class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    expertise: Mapped[str | None] = mapped_column(String(255))
    languages: Mapped[str | None] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text)
    rating: Mapped[float] = mapped_column(Float, default=4.7)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="consultant_profile")


class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    consultant_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    request_type: Mapped[str] = mapped_column(String(40), default="routine_planning")
    # one_to_one / routine_planning / lifestyle / product / diet / anti_aging / sensitive_skin
    details: Mapped[str | None] = mapped_column(Text)
    preferred_date: Mapped[date | None] = mapped_column(Date)
    preferred_time: Mapped[time | None] = mapped_column(Time)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    consultant: Mapped[User] = relationship(foreign_keys=[consultant_id])


class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    consultant_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(160), default="My Routine")
    morning_steps: Mapped[str | None] = mapped_column(Text)   # JSON-encoded list
    night_steps: Mapped[str | None] = mapped_column(Text)     # JSON-encoded list
    weekly_steps: Mapped[str | None] = mapped_column(Text)    # JSON-encoded list
    lifestyle_advice: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(120))
    category: Mapped[str | None] = mapped_column(String(60), index=True)   # cleanser / serum / moisturizer / sunscreen...
    price: Mapped[float | None] = mapped_column(Float)
    tier: Mapped[str | None] = mapped_column(String(20), default="budget") # budget / premium
    suitable_for: Mapped[str | None] = mapped_column(String(120))          # skin types
    description: Mapped[str | None] = mapped_column(Text)

    # --- Extended catalogue fields (Milestone 3, Part 1) ---
    skin_type_compat: Mapped[str | None] = mapped_column(String(160), index=True)  # comma list: oily,dry,...
    concern_compat: Mapped[str | None] = mapped_column(String(255), index=True)    # comma list: acne,redness,...
    ingredient_list: Mapped[str | None] = mapped_column(Text)               # full INCI list, raw
    key_ingredients: Mapped[str | None] = mapped_column(String(255))        # comma list of hero actives
    ingredient_benefits: Mapped[str | None] = mapped_column(Text)
    usage_time: Mapped[str | None] = mapped_column(String(20), default="both", index=True)  # AM | PM | both
    warnings: Mapped[str | None] = mapped_column(Text)
    contraindications: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    rating: Mapped[float | None] = mapped_column(Float, index=True)
    review_count: Mapped[int | None] = mapped_column(Integer, default=0)
    source: Mapped[str | None] = mapped_column(String(60), default="seed")  # seed | imported:<dataset>
    external_id: Mapped[str | None] = mapped_column(String(120), index=True)  # dedup key from source dataset

    ingredients: Mapped[list["ProductIngredient"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    benefits: Mapped[str | None] = mapped_column(Text)
    cautions: Mapped[str | None] = mapped_column(Text)

    # --- Ingredient knowledge base (Milestone 3, Part 2) ---
    description: Mapped[str | None] = mapped_column(Text)
    scientific_category: Mapped[str | None] = mapped_column(String(80), index=True)  # humectant, retinoid, AHA...
    side_effects: Mapped[str | None] = mapped_column(Text)
    skin_type_compat: Mapped[str | None] = mapped_column(String(160))     # comma list
    concern_compat: Mapped[str | None] = mapped_column(String(255))       # comma list
    comedogenic_rating: Mapped[int | None] = mapped_column(Integer, index=True)  # 0-5
    references: Mapped[str | None] = mapped_column(Text)                  # citations / URLs
    source: Mapped[str | None] = mapped_column(String(60), default="seed")


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"
    __table_args__ = (UniqueConstraint("product_id", "ingredient_id", name="uq_product_ingredient"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), index=True)

    product: Mapped[Product] = relationship(back_populates="ingredients")
    ingredient: Mapped[Ingredient] = relationship()


class ProgressEntry(Base):
    __tablename__ = "progress_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, default=date.today)
    skin_score: Mapped[int | None] = mapped_column(Integer)          # 0–100
    hydration: Mapped[int | None] = mapped_column(Integer)           # 0–100
    acne_level: Mapped[int | None] = mapped_column(Integer)          # 0–10 (lower is better)
    pigmentation_level: Mapped[int | None] = mapped_column(Integer)  # 0–10 (lower is better)
    notes: Mapped[str | None] = mapped_column(Text)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str | None] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(30), default="info")  # info / appointment / consultation / routine / system
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    actor_email: Mapped[str | None] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity: Mapped[str | None] = mapped_column(String(80))
    entity_id: Mapped[str | None] = mapped_column(String(40))
    old_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)
    ip: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(20), default="success")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


# ============================================================================
# MILESTONE 2 — Assessment, Scoring & Routine Generation
# Additive only: no Milestone 1 table is modified.
# ============================================================================

class SkinAssessment(Base):
    """A historical snapshot of one skin-health evaluation (spec Step 3.2)."""
    __tablename__ = "skin_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    overall_score: Mapped[float] = mapped_column(Float, nullable=False)

    # Sub-scores, each 0-100 before its weight is applied
    condition_score: Mapped[float] = mapped_column(Float, default=0)    # 35%
    lifestyle_score: Mapped[float] = mapped_column(Float, default=0)    # 20%
    consistency_score: Mapped[float] = mapped_column(Float, default=0)  # 20%
    sleep_score: Mapped[float] = mapped_column(Float, default=0)        # 15%
    hydration_score: Mapped[float] = mapped_column(Float, default=0)    # 10%

    detected_concerns: Mapped[str] = mapped_column(Text, default="[]")   # JSON array
    primary_concern: Mapped[str | None] = mapped_column(String(60))
    skin_type: Mapped[str | None] = mapped_column(String(30))
    recommendations: Mapped[str] = mapped_column(Text, default="[]")     # JSON array

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship()
    routine_steps: Mapped[list["SkincareRoutine"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan")


class SkincareRoutine(Base):
    """One generated routine STEP (spec Step 4).

    Distinct from the Milestone 1 `routines` table, which stores consultant-authored
    plans — that feature is untouched and continues to work exactly as before.
    """
    __tablename__ = "skincare_routines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    assessment_id: Mapped[str] = mapped_column(ForeignKey("skin_assessments.id"), index=True, nullable=False)

    time_of_day: Mapped[str] = mapped_column(String(12), index=True)   # AM | PM | Weekly | Seasonal
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    step_category: Mapped[str] = mapped_column(String(60), nullable=False)
    instruction: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    assessment: Mapped[SkinAssessment] = relationship(back_populates="routine_steps")


class RoutineTemplate(Base):
    """The seeded decision matrix (spec Step 1.3)."""
    __tablename__ = "routine_templates"
    __table_args__ = (UniqueConstraint("skin_type", "time_of_day", name="uq_template_type_phase"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    skin_type: Mapped[str] = mapped_column(String(30), index=True)
    time_of_day: Mapped[str] = mapped_column(String(12))
    steps: Mapped[str] = mapped_column(Text)   # JSON array of step categories


class SkinAnalysis(Base):
    """A stored AI facial-analysis result (Milestone 3, Parts 4-8).

    Persists every image analysis so the user has a history and the dashboard can
    display the latest result. The image itself is stored as a saved file path,
    not in the row.
    """
    __tablename__ = "skin_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    analysis_type: Mapped[str] = mapped_column(String(20), default="full", index=True)  # skin-type | skin-concern | full

    detected_skin_type: Mapped[str | None] = mapped_column(String(30))
    skin_type_confidence: Mapped[float | None] = mapped_column(Float)
    skin_type_distribution: Mapped[str | None] = mapped_column(Text)   # JSON

    detected_concerns: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of objects
    priority_concern: Mapped[str | None] = mapped_column(String(60))
    concern_scores: Mapped[str | None] = mapped_column(Text)            # JSON

    features: Mapped[str | None] = mapped_column(Text)                  # JSON of extracted signals
    explanation: Mapped[str | None] = mapped_column(Text)
    backend: Mapped[str | None] = mapped_column(String(20))             # onnx | heuristic
    face_found: Mapped[bool] = mapped_column(Boolean, default=False)
    image_path: Mapped[str | None] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship()
