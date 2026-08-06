from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base



# ==========================
# User
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    skin_profile = relationship(
        "SkinProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete"
    )

    lifestyle = relationship(
        "Lifestyle",
        back_populates="user",
        uselist=False,
        cascade="all, delete"
    )


# ==========================
# Skin Profile
# ==========================

class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    full_name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    skin_type = Column(String)
    skin_tone = Column(String)
    concerns = Column(String)
    allergies = Column(String)
    medical_conditions = Column(String, nullable=True)
    current_products = Column(String, nullable=True)

    user = relationship("User", back_populates="skin_profile")


# ==========================
# Skin Assessment
# ==========================

class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    skin_score = Column(Integer, nullable=True)
    risk_score = Column(Integer, nullable=True)
    concern_priority = Column(String, nullable=True)
    summary = Column(String, nullable=True)


# ==========================
# Lifestyle
# ==========================

class Lifestyle(Base):
    __tablename__ = "lifestyle"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    sleep_hours = Column(Float)
    water_intake = Column(Float)
    exercise = Column(String)
    stress_level = Column(String)
    outdoor_exposure = Column(String)
    diet = Column(String, nullable=True)
    smoking = Column(Boolean, default=False)
    alcohol = Column(Boolean, default=False)
    sun_exposure = Column(String, nullable=True)
    environment = Column(String, nullable=True)
    occupation = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="lifestyle"
    )


# ==========================
# Product
# ==========================

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_name = Column(String, nullable=False)
    brand = Column(String)
    skin_type = Column(String)
    category = Column(String)
    main_ingredient = Column(String)
    benefit = Column(String)
    price = Column(Float)
    rating = Column(Float)

    ingredients = relationship(
        "ProductIngredient",
        back_populates="product",
        cascade="all, delete"
    )


# ==========================
# Ingredient
# ==========================

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)

    ingredient_name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    benefits = Column(String, nullable=True)
    purpose = Column(String, nullable=True)
    warnings = Column(String, nullable=True)
    compatible_ingredients = Column(String, nullable=True)
    incompatible_ingredients = Column(String, nullable=True)
    pregnancy_safety = Column(String, nullable=True, default="Safe") # Safe, Caution, Avoid
    sensitivity_score = Column(Integer, nullable=True, default=1) # 1-10

    products = relationship(
        "ProductIngredient",
        back_populates="ingredient",
        cascade="all, delete"
    )


# ==========================
# Product Ingredient
# ==========================

class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(Integer, ForeignKey("products.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))

    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship(
        "Product",
        back_populates="ingredients"
    )

    ingredient = relationship(
        "Ingredient",
        back_populates="products"
    )


# ==========================
# Consultant Recommendation
# ==========================

class ConsultantRecommendation(Base):
    __tablename__ = "consultant_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    consultant_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("skin_profiles.id"))

    recommendation = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    consultant = relationship("User")
    patient = relationship("SkinProfile")
# ==========================
# Consultant Profile
# ==========================

class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    full_name = Column(String)
    qualification = Column(String)
    specialization = Column(String)
    experience = Column(Integer)

    hospital = Column(String)
    department = Column(String)
    city = Column(String)
    phone = Column(String)

    available_days = Column(String)
    languages = Column(String)
    
    bio = Column(String, nullable=True)
    clinic_address = Column(String, nullable=True)
    working_hours = Column(String, nullable=True)
    consultation_mode = Column(String, default="Video Call")
    certificate_url = Column(String, nullable=True)
    gov_id_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ==========================
# Dermatologist Profile
# ==========================

class DermatologistProfile(Base):
    __tablename__ = "dermatologist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    full_name = Column(String)
    qualification = Column(String)
    specialization = Column(String)
    license_number = Column(String)
    experience = Column(Integer)
    clinic_name = Column(String)
    city = Column(String)
    phone = Column(String)
    available_days = Column(String)
    languages = Column(String)
    
    bio = Column(String, nullable=True)
    consultation_fee = Column(Float, default=50.0)
    medical_license_url = Column(String, nullable=True)
    gov_id_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    certificates_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ==========================
# Daily Routine Log
# ==========================

class DailyRoutineLog(Base):
    __tablename__ = "daily_routine_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    morning_completed = Column(Boolean, default=False)
    evening_completed = Column(Boolean, default=False)
    weekly_completed = Column(Boolean, default=False)

    user = relationship("User")


# ==========================
# Consultation Booking
# ==========================

class ConsultationBooking(Base):
    __tablename__ = "consultation_bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    specialist_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, nullable=False) # "consultant" or "dermatologist"
    status = Column(String, default="pending") # "pending", "approved", "completed", "escalated"
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    symptoms = Column(String, nullable=True)
    escalation_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    specialist = relationship("User", foreign_keys=[specialist_id])


# ==========================
# Milestone 3: Progress Photos
# ==========================

class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    skin_health_score = Column(Integer, default=75)
    routine_adherence = Column(Float, default=85.0)
    week_number = Column(Integer, default=1)
    tag = Column(String, default="Baseline") # Baseline, Week 1, Week 2, Month 1, Month 2
    notes = Column(String, nullable=True)

    user = relationship("User")


# ==========================
# Milestone 3: Compliance History
# ==========================

class ComplianceHistory(Base):
    __tablename__ = "compliance_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    morning_completed = Column(Boolean, default=False)
    evening_completed = Column(Boolean, default=False)
    weekly_completed = Column(Boolean, default=False)
    compliance_7d = Column(Float, default=80.0)
    compliance_30d = Column(Float, default=85.0)
    compliance_90d = Column(Float, default=88.0)

    user = relationship("User")


# ==========================
# Milestone 3: Prescription Note (Dermatologist)
# ==========================

class PrescriptionNote(Base):
    __tablename__ = "prescription_notes"

    id = Column(Integer, primary_key=True, index=True)
    dermatologist_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    prescription_text = Column(String, nullable=False)
    doctor_notes = Column(String, nullable=True)
    routine_override = Column(String, nullable=True) # JSON or text override
    created_at = Column(DateTime, default=datetime.utcnow)

    dermatologist = relationship("User", foreign_keys=[dermatologist_id])
    patient = relationship("User", foreign_keys=[patient_id])


# ==========================
# Milestone 3: Product Recommendation Tracking
# ==========================

class ProductRecommendation(Base):
    __tablename__ = "product_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    match_percentage = Column(Float, default=90.0)
    safety_badge = Column(String, default="Safe") # Safe, Warning, Caution
    suitable_ingredients = Column(String, nullable=True)
    recommended_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")