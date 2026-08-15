# backend/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Date, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


# ============ USER & AUTHENTICATION ============

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # user, consultant, dermatologist, admin
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False)
    assessments = relationship("SkinAssessment", back_populates="user")
    routines = relationship("SkincareRoutine", back_populates="user")
    routine_logs = relationship("RoutineLog", back_populates="user")
    consultant_profile = relationship("ConsultantProfile", back_populates="user", uselist=False)
    dermatologist_profile = relationship("DermatologistProfile", back_populates="user", uselist=False)
    
    # Recommendations - as patient
    product_recommendations = relationship("ProductRecommendation", foreign_keys="ProductRecommendation.user_id", back_populates="user")
    # Recommendations - as professional
    professional_recommendations = relationship("ProductRecommendation", foreign_keys="ProductRecommendation.recommended_by", back_populates="professional")
    
    # Appointments
    appointments_as_patient = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")
    appointments_as_professional = relationship("Appointment", foreign_keys="Appointment.professional_id", back_populates="professional")
    
    # AI Analysis
    ai_analysis_results = relationship("AIAnalysisResult", back_populates="user")
    
    # Photos
    progress_photos = relationship("ProgressPhoto", back_populates="user")
    
    # Reviews requested - UPDATED with professional_id
    review_requests_as_patient = relationship("ReviewRequest", foreign_keys="ReviewRequest.user_id", back_populates="patient")
    review_requests_as_professional = relationship("ReviewRequest", foreign_keys="ReviewRequest.professional_id", back_populates="professional")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, default="")
    age = Column(Integer, default=0)
    gender = Column(String, default="")
    contact_number = Column(String, default="")
    skin_type = Column(String, default="")
    skin_concerns = Column(String, default="")
    allergies = Column(String, default="")
    sensitivities = Column(String, default="")
    water_intake = Column(Float, default=0.0)
    sleep_duration = Column(Float, default=0.0)
    exercise_habits = Column(String, default="")
    stress_level = Column(String, default="")
    environmental_exposure = Column(String, default="")
    image_data = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="skin_profile")


# ============ APPOINTMENTS ============

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    professional_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    professional_type = Column(String, nullable=False)  # consultant or dermatologist
    status = Column(String, default="pending")  # pending, confirmed, completed, cancelled
    appointment_date = Column(DateTime, nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments_as_patient")
    professional = relationship("User", foreign_keys=[professional_id], back_populates="appointments_as_professional")


# ============ REVIEW REQUESTS - UPDATED with professional_id ============

class ReviewRequest(Base):
    __tablename__ = "review_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # The professional who received the patient's appointment
    professional_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    
    request_type = Column(String, nullable=False)  # consultant or dermatologist
    status = Column(String, default="pending")
    recommendation_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    patient = relationship("User", foreign_keys=[user_id], back_populates="review_requests_as_patient")
    professional = relationship("User", foreign_keys=[professional_id], back_populates="review_requests_as_professional")


# ============ PROFESSIONAL PROFILES ============

class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String, default="")
    bio = Column(Text, default="")
    years_experience = Column(Integer, default=0)
    specialization = Column(String, default="")
    salon_affiliation = Column(String, default="")
    profile_photo_url = Column(String, default="")
    certification_name = Column(String, nullable=False)
    certificate_number = Column(String, nullable=False)
    training_institute = Column(String, nullable=False)
    certificate_file_url = Column(String, default="")
    verification_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="consultant_profile")


class DermatologistProfile(Base):
    __tablename__ = "dermatologist_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String, default="")
    bio = Column(Text, default="")
    years_experience = Column(Integer, default=0)
    specialization = Column(String, default="")
    clinic_affiliation = Column(String, nullable=False)
    profile_photo_url = Column(String, default="")
    medical_degree = Column(String, nullable=False)
    license_number = Column(String, nullable=False)
    issuing_council = Column(String, nullable=False)
    license_file_url = Column(String, default="")
    verification_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="dermatologist_profile")


# ============ SKIN ASSESSMENTS ============

class SkinAssessment(Base):
    __tablename__ = "skin_assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    detected_concerns = Column(JSONB, default=[])
    breakdown = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="assessments")
    routines = relationship("SkincareRoutine", back_populates="assessment")


# ============ ROUTINES ============

class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("skin_assessments.id"), nullable=True)
    time_of_day = Column(String, nullable=False)
    step_number = Column(Integer, nullable=False)
    step_category = Column(String, nullable=False)
    step_description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="routines")
    assessment = relationship("SkinAssessment", back_populates="routines")
    logs = relationship("RoutineLog", back_populates="routine_step")


class RoutineLog(Base):
    __tablename__ = "routine_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    routine_step_id = Column(Integer, ForeignKey("skincare_routines.id"), nullable=False)
    log_date = Column(Date, default=datetime.utcnow().date)
    completed_at = Column(DateTime, nullable=True)
    water_intake_ml = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="routine_logs")
    routine_step = relationship("SkincareRoutine", back_populates="logs")


class RoutineStepMatrix(Base):
    __tablename__ = "routine_step_matrix"
    id = Column(Integer, primary_key=True, index=True)
    skin_type = Column(String, nullable=False)
    time_of_day = Column(String, nullable=False)
    step_order = Column(Integer, nullable=False)
    step_category = Column(String, nullable=False)
    step_description = Column(Text, nullable=True)
    is_harsh = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============ PRODUCTS & INGREDIENTS ============

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=True)
    sub_category = Column(String, nullable=True)
    sub_category_2 = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    how_to_use = Column(Text, nullable=True)
    highlights = Column(JSONB, default=[])
    ingredients_text = Column(Text, nullable=True)
    suitable_skin_types = Column(JSONB, default=[])
    image_url = Column(String, nullable=True)
    source = Column(String, default="thebeautyapi")
    external_id = Column(String, nullable=True)
    sku = Column(String, nullable=True)
    upc = Column(String, nullable=True)
    asin = Column(String, nullable=True)
    availability = Column(String, default="in_stock")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    recommendations = relationship("ProductRecommendation", back_populates="product")
    reviews = relationship("Review", back_populates="product")
    product_ingredients = relationship("ProductIngredient", back_populates="product")


class Ingredient(Base):
    __tablename__ = "ingredients_master"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    comedogenicity = Column(String, nullable=True)
    irritancy = Column(String, nullable=True)
    functions = Column(JSONB, default=[])
    rating = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    products = relationship("ProductIngredient", back_populates="ingredient")


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients_master.id"), nullable=False)
    position = Column(Integer, default=0)
    
    product = relationship("Product", back_populates="product_ingredients")
    ingredient = relationship("Ingredient", back_populates="products")


class IngredientKnowledge(Base):
    __tablename__ = "ingredient_knowledge"
    id = Column(Integer, primary_key=True, index=True)
    age_group = Column(String, nullable=True)
    skin_type = Column(String, nullable=True)
    skin_subtype = Column(String, nullable=True)
    sensitivity = Column(Boolean, default=False)
    concern = Column(String, nullable=False)
    internal_type = Column(String, nullable=True)
    ingredient_combination = Column(Text, nullable=False)
    effects = Column(Text, nullable=True)
    parsed_ingredients = Column(JSONB, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)


class ProductRecommendation(Base):
    __tablename__ = "product_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # The patient
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    source = Column(String, nullable=False)  # rule_engine, ai_analysis, consultant, dermatologist
    recommended_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # The professional
    reason = Column(Text, nullable=True)
    matching_concerns = Column(JSONB, default=[])
    is_viewed = Column(Boolean, default=False)
    is_clicked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="product_recommendations")
    professional = relationship("User", foreign_keys=[recommended_by], back_populates="professional_recommendations")
    product = relationship("Product", back_populates="recommendations")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    author_id = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)
    is_recommended = Column(Boolean, default=True)
    helpfulness = Column(Integer, default=0)
    total_feedback_count = Column(Integer, default=0)
    total_neg_feedback_count = Column(Integer, default=0)
    total_pos_feedback_count = Column(Integer, default=0)
    review_text = Column(Text, nullable=True)
    review_title = Column(String, nullable=True)
    skin_tone = Column(String, nullable=True)
    skin_type = Column(String, nullable=True)
    eye_color = Column(String, nullable=True)
    hair_color = Column(String, nullable=True)
    submission_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="reviews")


# ============ AI ANALYSIS ============

class AIAnalysisResult(Base):
    __tablename__ = "ai_analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String, nullable=True)
    predicted_concern = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    all_predictions = Column(JSONB, default=[])
    recommendations = Column(JSONB, default=[])
    routine_suggestions = Column(JSONB, default=[])
    general_instructions = Column(JSONB, default=[])
    user_feedback = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="ai_analysis_results")


# ============ PHOTOS ============

class ProgressPhoto(Base):
    __tablename__ = "progress_photos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    tag = Column(String, nullable=True)
    skin_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="progress_photos")