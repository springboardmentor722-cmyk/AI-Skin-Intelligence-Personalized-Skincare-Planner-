from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime
from datetime import date

from app.database import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Text, Float
from sqlalchemy.sql import func
from sqlalchemy import Boolean
from sqlalchemy import Date


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(100), unique=True, nullable=False)

    password = Column(String(255), nullable=False)

    age = Column(Integer, nullable=False)

    gender = Column(String(20), nullable=False)

    

    role = Column(String(20), default="user")

    skin_profile = relationship(
    "SkinProfile",
    back_populates="user",
    uselist=False
    )

    lifestyle = relationship(
    "Lifestyle",
    back_populates="user",
    uselist=False
)
    progress = relationship(
    "ProgressTracking",
    back_populates="user",
    cascade="all, delete-orphan"
)
    skin_assessments = relationship(
    "SkinAssessment",
    back_populates="user",
    cascade="all, delete-orphan"
)
    recommendations = relationship(
    "UserRecommendation",
    back_populates="user",
    cascade="all, delete-orphan"
)
    
    appointments = relationship(
    "Appointment",
    foreign_keys="Appointment.user_id",
    cascade="all, delete-orphan"
)
    
    
    

    created_at = Column(DateTime, default=datetime.utcnow)

    


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    skin_type = Column(String(50), nullable=False)

    skin_tone = Column(String(50), nullable=False)

    skin_concerns = Column(String(255), nullable=False)

    allergies = Column(String(255), nullable=True)

    sensitivity = Column(String(50), nullable=False)

    user = relationship(
    "User",
    back_populates="skin_profile"
)
    
class Lifestyle(Base):
    __tablename__ = "lifestyle"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    sleep_duration = Column(Integer, nullable=False)

    water_intake = Column(Float, nullable=False)

    exercise_habits = Column(String(100), nullable=False)

    stress_level = Column(String(50), nullable=False)

    environmental_exposure = Column(String(100), nullable=False)

    user = relationship(
        "User",
        back_populates="lifestyle"
    )

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(String(20), unique=True, nullable=False)

    product_name = Column(String(255), nullable=False)

    brand_name = Column(String(100))

    category = Column(String(100))

    skin_type = Column(String(100))

    skin_concern = Column(String(100))

    ingredients = Column(Text)

    description = Column(Text)

    usage = Column(Text)

    price = Column(Float)

    rating = Column(Float)

    image_url = Column(Text)

    product_url = Column(String(500))




class UserRecommendation(Base):
    __tablename__ = "user_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )

    product_type = Column(String, nullable=False)

    score = Column(Integer, nullable=False)

    confidence = Column(Integer, nullable=False)

    budget = Column(String)

    reason = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship("User", back_populates="recommendations")

    product = relationship("Product")

class RoutineLog(Base):

    __tablename__ = "routine_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    date = Column(
        Date,
        nullable=False
    )

    routine_time = Column(
        String(20),
        nullable=False
    )

    step = Column(
        String(100),
        nullable=False
    )

    completed = Column(
        Boolean,
        default=True
    )

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)

    ingredient_name = Column(String(255), unique=True, nullable=False)

    substance_id = Column(String(100), unique=True)

    cas_no = Column(String(100))

    ec_no = Column(String(100))

    pubchem_cid = Column(String(100))

    pubchem_url = Column(Text)

    # Fields we'll enrich later
    category = Column(String(100))

    functions = Column(Text)

    benefits = Column(Text)

    suitable_skin_types = Column(String(255))

    skin_concerns = Column(String(255))

    comedogenic_rating = Column(Integer)

    irritation_level = Column(String(50))

    description = Column(Text)

from datetime import datetime

class ProgressTracking(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    acne_level = Column(Integer)

    hydration_level = Column(Integer)

    pigmentation = Column(Integer)

    redness = Column(Integer)

    notes = Column(Text)

    image_url = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="progress"
    )

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    consultant_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    dermatologist_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    appointment_date = Column(DateTime, nullable=False)

    reason = Column(Text, nullable=False)

    status = Column(
        String,
        default="PENDING"
    )

    consultant_notes = Column(
    Text,
    nullable=True
)

    dermatologist_recommended = Column(
    Boolean,
    default=False
)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User",
        foreign_keys=[user_id]
    )

    consultant = relationship(
        "User",
        foreign_keys=[consultant_id]
    )

    dermatologist = relationship(
        "User",
        foreign_keys=[dermatologist_id]
    )

class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    image_path = Column(String(255), nullable=False)

    acne_score = Column(Integer)

    pigmentation_score = Column(Integer)

    redness_score = Column(Integer)

    wrinkles_score = Column(Integer)

    dark_circle_score = Column(Integer)

    skin_type = Column(String(50))

    overall_score = Column(Integer)
    

    ai_summary = Column(Text)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship(
    "User",
    back_populates="skin_assessments"
)

class RoleRequest(Base):
    __tablename__ = "role_requests"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    requested_role = Column(String(50), nullable=False)

    qualification = Column(String(255), nullable=True)

    license_number = Column(String(100), nullable=True)

    experience = Column(String(255), nullable=True)

    certificate = Column(String(255), nullable=True)

    id_proof = Column(String(255), nullable=True)

    status = Column(
        String(30),
        default="Pending"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship("User")




class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    consultant_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    dermatologist_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    appointment_id = Column(Integer, ForeignKey("appointments.id"))

    title = Column(String(255))

    message = Column(Text)

    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ConsultantRecommendation(Base):
    __tablename__ = "consultant_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    consultant_id = Column(Integer, ForeignKey("users.id"))

    assessment_id = Column(
        Integer,
        ForeignKey("skin_assessments.id")
    )

    recommendation = Column(Text)

    recommend_dermatologist = Column(
        Boolean,
        default=False
    )

    status = Column(
        String,
        default="PENDING"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class DermatologistTreatment(Base):
    __tablename__ = "dermatologist_treatments"

    id = Column(Integer, primary_key=True, index=True)

    appointment_id = Column(
        Integer,
        ForeignKey("appointments.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    dermatologist_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    diagnosis = Column(Text)

    medicines = Column(Text)

    morning_routine = Column(Text)

    night_routine = Column(Text)

    lifestyle_advice = Column(Text)

    follow_up_date = Column(Date)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class DermatologistDiagnosis(Base):
    __tablename__ = "dermatologist_diagnosis"

    id = Column(Integer, primary_key=True, index=True)

    appointment_id = Column(
        Integer,
        ForeignKey("appointments.id"),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    dermatologist_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    diagnosis = Column(Text)

    treatment_plan = Column(Text)

    medications = Column(Text)

    advice = Column(Text)

    follow_up_date = Column(Date)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )