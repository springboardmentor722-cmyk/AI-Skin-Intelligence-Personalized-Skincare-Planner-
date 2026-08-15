# backend/app.py

from fastapi import FastAPI, Depends, HTTPException, status, Query, File, Form, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_
import os
import logging
import shutil
import uuid

from backend.database import engine, get_db, Base
from backend.models import (
    User, SkinProfile, ReviewRequest, 
    SkinAssessment, SkincareRoutine, RoutineLog,
    ConsultantProfile, DermatologistProfile,
    Product, ProductRecommendation, Review,
    Ingredient, ProductIngredient, AIAnalysisResult, ProgressPhoto, RoutineStepMatrix,
    Appointment
)
from backend.scoring_engine import calculate_skin_health_score
from backend.assessment import identify_skin_concerns, generate_routine
from backend.recommendation_engine import (
    generate_rule_based_recommendations,
    generate_ai_based_recommendations,
    generate_professional_recommendation,
    get_user_recommendations,
    regenerate_user_recommendations
)
from backend.ingredient_intelligence import analyze_product, get_ingredient_info, filter_products_by_ingredient_safety
from backend.recommendation_engine_v2 import get_product_recommendations, get_concern_categories, get_skin_types
from backend.progress_tracking import (
    calculate_adherence,
    get_score_history,
    get_progress_summary,
    generate_progress_insights
)
from backend.photo_upload import (
    save_uploaded_photo,
    get_user_photos,
    get_before_after_comparison,
    delete_photo,
    ensure_upload_directory
)
from backend.ai_model import predict_skin_concern

# Set up logging
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        user = db.query(User).filter(User.email == email).first()
        return user
    except JWTError:
        return None

app = FastAPI(title="AI Skin Intelligence", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for serving product images
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ============ Pydantic Models ============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    confirm_password: str

class UserCreateProfessional(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    confirm_password: str
    role: str
    license_number: str
    clinic_affiliation: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str
    is_verified: Optional[bool] = True

class SkinProfileCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    skin_type: str
    skin_concerns: str
    water_intake: float
    sleep_duration: float
    exercise_habits: str
    stress_level: str
    environmental_exposure: str
    image_data: Optional[str] = ""
    contact_number: Optional[str] = ""

class ReviewRequestCreate(BaseModel):
    request_type: str

class ReviewComplete(BaseModel):
    recommendation_text: str

class ConsultantProfileCreate(BaseModel):
    phone: str
    bio: str
    years_experience: int
    specialization: str
    salon_affiliation: str
    certification_name: str
    certificate_number: str
    training_institute: str
    profile_photo_url: Optional[str] = ""
    certificate_file_url: Optional[str] = ""

class DermatologistProfileCreate(BaseModel):
    phone: str
    bio: str
    years_experience: int
    specialization: str
    clinic_affiliation: str
    medical_degree: str
    license_number: str
    issuing_council: str
    profile_photo_url: Optional[str] = ""
    license_file_url: Optional[str] = ""

class ConsultationRequestCreate(BaseModel):
    professional_id: int

class ProductResponse(BaseModel):
    id: int
    name: str
    brand: str
    category: Optional[str]
    price: Optional[float]
    rating: Optional[float]
    reviews_count: Optional[int]
    image_url: Optional[str]
    description: Optional[str]
    ingredients_text: Optional[str]

class ProductRecommendationResponse(BaseModel):
    id: int
    product: ProductResponse
    source: str
    recommended_by: Optional[str]
    reason: Optional[str]
    created_at: datetime

class RoutineStepUpdate(BaseModel):
    time_of_day: str
    steps: List[dict]

class ProductRecommendRequest(BaseModel):
    user_id: int
    product_id: int
    reason: Optional[str] = None

class PrescriptionCreate(BaseModel):
    patient_id: int
    treatment_name: str
    dosage: str
    instructions: str
    duration: str
    notes: Optional[str] = None

# ============ APPOINTMENT MODELS ============

class AppointmentCreate(BaseModel):
    professional_id: int
    professional_type: str
    appointment_date: Optional[datetime] = None
    notes: Optional[str] = ""

class AppointmentUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# ============ Authentication ============

@app.get("/")
def read_root():
    return {"message": "AI Skin Intelligence API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    existing = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    hashed = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed,
        role="user",
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "user_id": new_user.id,
        "name": new_user.name,
        "is_verified": new_user.is_verified
    }

@app.post("/register/professional", response_model=Token)
def register_professional(user_data: UserCreateProfessional, db: Session = Depends(get_db)):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    existing = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    allowed_roles = ["consultant", "dermatologist", "admin"]
    if user_data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")
    hashed = get_password_hash(user_data.password)
    is_verified = True if user_data.role == "admin" else False
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed,
        role=user_data.role,
        is_verified=is_verified
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "user_id": new_user.id,
        "name": new_user.name,
        "is_verified": new_user.is_verified
    }

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if user.role == "consultant":
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
        if not profile:
            raise HTTPException(status_code=403, detail="Please complete your professional profile")
        if profile.verification_status == "pending":
            raise HTTPException(status_code=403, detail="Your profile is pending verification")
        if profile.verification_status == "rejected":
            raise HTTPException(status_code=403, detail="Your profile was rejected. Please contact admin.")
    elif user.role == "dermatologist":
        profile = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == user.id).first()
        if not profile:
            raise HTTPException(status_code=403, detail="Please complete your professional profile")
        if profile.verification_status == "pending":
            raise HTTPException(status_code=403, detail="Your profile is pending verification")
        if profile.verification_status == "rejected":
            raise HTTPException(status_code=403, detail="Your profile was rejected. Please contact admin.")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
        "is_verified": user.is_verified
    }


# ============ Skin Profile Endpoints ============

@app.post("/skin-profile")
def create_skin_profile(profile_data: SkinProfileCreate, db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can create skin profiles")
    existing = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skin profile already exists")
    new_profile = SkinProfile(
        user_id=current_user.id,
        full_name=profile_data.full_name,
        age=profile_data.age,
        gender=profile_data.gender,
        contact_number=profile_data.contact_number,
        skin_type=profile_data.skin_type,
        skin_concerns=profile_data.skin_concerns,
        water_intake=profile_data.water_intake,
        sleep_duration=profile_data.sleep_duration,
        exercise_habits=profile_data.exercise_habits,
        stress_level=profile_data.stress_level,
        environmental_exposure=profile_data.environmental_exposure,
        image_data=profile_data.image_data
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return {"message": "Skin profile created", "profile_id": new_profile.id}

@app.get("/skin-profile")
def get_skin_profile(db: Session = Depends(get_db), token: Optional[str] = None, user_id: Optional[int] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own profile")
    
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found")
    return profile

@app.put("/skin-profile")
def update_skin_profile(profile_data: SkinProfileCreate, db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can update skin profiles")
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found")
    profile.full_name = profile_data.full_name
    profile.age = profile_data.age
    profile.gender = profile_data.gender
    profile.contact_number = profile_data.contact_number
    profile.skin_type = profile_data.skin_type
    profile.skin_concerns = profile_data.skin_concerns
    profile.water_intake = profile_data.water_intake
    profile.sleep_duration = profile_data.sleep_duration
    profile.exercise_habits = profile_data.exercise_habits
    profile.stress_level = profile_data.stress_level
    profile.environmental_exposure = profile_data.environmental_exposure
    if profile_data.image_data:
        profile.image_data = profile_data.image_data
    db.commit()
    db.refresh(profile)
    return {"message": "Skin profile updated"}


# ============ User Profile for Experts ============

@app.get("/user/profile")
def get_user_profile(user_id: int, db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role not in ["consultant", "dermatologist", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile


# ============ Review Request Endpoints - DISABLED ============

@app.post("/request-review")
def request_review_legacy(
    request_data: ReviewRequestCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    raise HTTPException(
        status_code=410,
        detail="Separate consultation requests are disabled. Book an appointment instead."
    )


@app.post("/consultation/request")
def request_consultation_legacy(
    request_data: ConsultationRequestCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    raise HTTPException(
        status_code=410,
        detail="Separate consultation requests are disabled. Book an appointment instead."
    )


@app.get("/consultant/reviews")
def get_consultant_reviews(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Consultant access required")

    # Get appointments for THIS consultant only
    appointments = db.query(Appointment).filter(
        Appointment.professional_id == current_user.id,
        Appointment.professional_type == "consultant",
        Appointment.status != "cancelled"
    ).order_by(Appointment.created_at.desc()).all()

    result = []
    seen_patient_ids = set()

    for appointment in appointments:
        if appointment.patient_id in seen_patient_ids:
            continue
        seen_patient_ids.add(appointment.patient_id)

        user = db.query(User).filter(User.id == appointment.patient_id).first()
        if user is None:
            continue

        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
        assessment = db.query(SkinAssessment).filter(
            SkinAssessment.user_id == user.id
        ).order_by(SkinAssessment.created_at.desc()).first()
        ai_result = db.query(AIAnalysisResult).filter(
            AIAnalysisResult.user_id == user.id,
            AIAnalysisResult.is_active == True
        ).order_by(AIAnalysisResult.created_at.desc()).first()

        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user.id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == "consultant"
        ).order_by(ReviewRequest.created_at.desc()).first()

        result.append({
            "request_id": review.id if review else None,
            "appointment_id": appointment.id,
            "user_id": user.id,
            "user_name": user.name,
            "email": user.email,
            "request_type": "consultant",
            "status": appointment.status,
            "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
            "has_appointment": True,
            "profile": {
                "full_name": profile.full_name if profile else None,
                "age": profile.age if profile else None,
                "gender": profile.gender if profile else None,
                "skin_type": profile.skin_type if profile else None,
                "skin_concerns": profile.skin_concerns if profile else None,
            } if profile else None,
            "assessment": {
                "score": assessment.overall_score if assessment else None,
                "detected_concerns": assessment.detected_concerns if assessment else [],
            } if assessment else None,
            "ai_results": {
                "predicted_concern": ai_result.predicted_concern if ai_result else None,
                "confidence": ai_result.confidence if ai_result else None,
                "image_url": ai_result.image_url if ai_result else None,
            } if ai_result else None,
            "created_at": appointment.created_at.isoformat()
        })

    return result


@app.get("/dermatologist/patients")
def get_dermatologist_patients(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Dermatologist access required")

    # Get appointments for THIS dermatologist only
    appointments = db.query(Appointment).filter(
        Appointment.professional_id == current_user.id,
        Appointment.professional_type == "dermatologist",
        Appointment.status != "cancelled"
    ).order_by(Appointment.created_at.desc()).all()

    result = []
    seen_patient_ids = set()

    for appointment in appointments:
        if appointment.patient_id in seen_patient_ids:
            continue
        seen_patient_ids.add(appointment.patient_id)

        user = db.query(User).filter(User.id == appointment.patient_id).first()
        if user is None:
            continue

        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
        assessment = db.query(SkinAssessment).filter(
            SkinAssessment.user_id == user.id
        ).order_by(SkinAssessment.created_at.desc()).first()
        ai_result = db.query(AIAnalysisResult).filter(
            AIAnalysisResult.user_id == user.id,
            AIAnalysisResult.is_active == True
        ).order_by(AIAnalysisResult.created_at.desc()).first()

        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user.id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == "dermatologist"
        ).order_by(ReviewRequest.created_at.desc()).first()

        result.append({
            "request_id": review.id if review else None,
            "appointment_id": appointment.id,
            "user_id": user.id,
            "user_name": user.name,
            "email": user.email,
            "request_type": "dermatologist",
            "status": appointment.status,
            "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
            "has_appointment": True,
            "profile": {
                "full_name": profile.full_name if profile else None,
                "age": profile.age if profile else None,
                "gender": profile.gender if profile else None,
                "skin_type": profile.skin_type if profile else None,
                "skin_concerns": profile.skin_concerns if profile else None,
            } if profile else None,
            "assessment": {
                "score": assessment.overall_score if assessment else None,
                "detected_concerns": assessment.detected_concerns if assessment else [],
            } if assessment else None,
            "ai_results": {
                "predicted_concern": ai_result.predicted_concern if ai_result else None,
                "confidence": ai_result.confidence if ai_result else None,
                "image_url": ai_result.image_url if ai_result else None,
            } if ai_result else None,
            "created_at": appointment.created_at.isoformat()
        })

    return result


@app.post("/expert/complete-review/{review_id}")
def complete_review(
    review_id: int,
    review_data: ReviewComplete,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_user = get_current_user(token, db)
    if current_user is None or current_user.role not in ["consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="Only experts can complete reviews")

    # Verify this review belongs to THIS professional
    review = db.query(ReviewRequest).filter(
        ReviewRequest.id == review_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == current_user.role
    ).first()

    if review is None:
        raise HTTPException(status_code=404, detail="Review not found for this professional")

    review.status = "completed"
    review.recommendation_text = review_data.recommendation_text.strip()
    review.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(review)

    return {
        "message": "Recommendation saved successfully",
        "review_id": review.id,
        "patient_id": review.user_id,
        "professional_id": current_user.id,
        "status": review.status
    }


@app.get("/user/reviews")
def get_user_reviews(db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "user":
        raise HTTPException(status_code=403, detail="User access required")
    reviews = db.query(ReviewRequest).filter(ReviewRequest.user_id == current_user.id).all()
    result = []
    for review in reviews:
        professional = db.query(User).filter(User.id == review.professional_id).first()
        result.append({
            "id": review.id,
            "request_type": review.request_type,
            "status": review.status,
            "recommendation_text": review.recommendation_text,
            "professional_name": professional.name if professional else None,
            "created_at": review.created_at,
            "completed_at": review.completed_at
        })
    return result


# ============ Professional Profile Endpoints ============

@app.post("/professional/profile/consultant")
def create_consultant_profile(
    profile_data: ConsultantProfileCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Only consultants can create consultant profiles")
    existing = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    new_profile = ConsultantProfile(
        user_id=current_user.id,
        phone=profile_data.phone,
        bio=profile_data.bio,
        years_experience=profile_data.years_experience,
        specialization=profile_data.specialization,
        salon_affiliation=profile_data.salon_affiliation,
        certification_name=profile_data.certification_name,
        certificate_number=profile_data.certificate_number,
        training_institute=profile_data.training_institute,
        profile_photo_url=profile_data.profile_photo_url,
        certificate_file_url=profile_data.certificate_file_url,
        verification_status="pending"
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return {"message": "Consultant profile submitted for verification", "profile_id": new_profile.id}

@app.post("/professional/profile/dermatologist")
def create_dermatologist_profile(
    profile_data: DermatologistProfileCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Only dermatologists can create dermatologist profiles")
    existing = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    new_profile = DermatologistProfile(
        user_id=current_user.id,
        phone=profile_data.phone,
        bio=profile_data.bio,
        years_experience=profile_data.years_experience,
        specialization=profile_data.specialization,
        clinic_affiliation=profile_data.clinic_affiliation,
        medical_degree=profile_data.medical_degree,
        license_number=profile_data.license_number,
        issuing_council=profile_data.issuing_council,
        profile_photo_url=profile_data.profile_photo_url,
        license_file_url=profile_data.license_file_url,
        verification_status="pending"
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return {"message": "Dermatologist profile submitted for verification", "profile_id": new_profile.id}

@app.get("/professional/profile/status")
def get_professional_profile_status(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if current_user.role == "consultant":
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == current_user.id).first()
        if not profile:
            return {"has_profile": False, "status": None}
        return {"has_profile": True, "status": profile.verification_status, "type": "consultant"}
    elif current_user.role == "dermatologist":
        profile = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == current_user.id).first()
        if not profile:
            return {"has_profile": False, "status": None}
        return {"has_profile": True, "status": profile.verification_status, "type": "dermatologist"}
    else:
        return {"has_profile": False, "status": None, "type": "user"}


# ============ Admin Professional Management ============

@app.get("/admin/professionals/pending")
def get_pending_professionals_detail(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    consultants = db.query(ConsultantProfile, User).join(User, ConsultantProfile.user_id == User.id).filter(
        ConsultantProfile.verification_status == "pending"
    ).all()
    
    dermatologists = db.query(DermatologistProfile, User).join(User, DermatologistProfile.user_id == User.id).filter(
        DermatologistProfile.verification_status == "pending"
    ).all()
    
    result = []
    for profile, user in consultants:
        result.append({
            "id": profile.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "type": "consultant",
            "certification_name": profile.certification_name,
            "certificate_number": profile.certificate_number,
            "training_institute": profile.training_institute,
            "specialization": profile.specialization,
            "years_experience": profile.years_experience,
            "verification_status": profile.verification_status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None
        })
    for profile, user in dermatologists:
        result.append({
            "id": profile.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "type": "dermatologist",
            "medical_degree": profile.medical_degree,
            "license_number": profile.license_number,
            "issuing_council": profile.issuing_council,
            "clinic_affiliation": profile.clinic_affiliation,
            "specialization": profile.specialization,
            "years_experience": profile.years_experience,
            "verification_status": profile.verification_status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None
        })
    return result

@app.put("/admin/approve-professional/{profile_id}")
def approve_professional(
    profile_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == profile_id).first()
    if consultant:
        if consultant.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Already approved")
        consultant.verification_status = "approved"
        user = db.query(User).filter(User.id == consultant.user_id).first()
        if user:
            user.is_verified = True
        db.commit()
        return {"message": "Consultant approved successfully"}
    
    dermatologist = db.query(DermatologistProfile).filter(DermatologistProfile.id == profile_id).first()
    if dermatologist:
        if dermatologist.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Already approved")
        dermatologist.verification_status = "approved"
        user = db.query(User).filter(User.id == dermatologist.user_id).first()
        if user:
            user.is_verified = True
        db.commit()
        return {"message": "Dermatologist approved successfully"}
    
    raise HTTPException(status_code=404, detail="Professional profile not found")

@app.put("/admin/reject-professional/{profile_id}")
def reject_professional(
    profile_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == profile_id).first()
    if consultant:
        if consultant.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Already rejected")
        consultant.verification_status = "rejected"
        db.commit()
        return {"message": "Consultant rejected successfully"}
    
    dermatologist = db.query(DermatologistProfile).filter(DermatologistProfile.id == profile_id).first()
    if dermatologist:
        if dermatologist.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Already rejected")
        dermatologist.verification_status = "rejected"
        db.commit()
        return {"message": "Dermatologist rejected successfully"}
    
    raise HTTPException(status_code=404, detail="Professional profile not found")


# ============ Admin Stats Endpoint ============

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    total_users = db.query(User).filter(User.role == "user").count()
    total_consultants = db.query(User).filter(User.role == "consultant").count()
    total_dermatologists = db.query(User).filter(User.role == "dermatologist").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_all_users = db.query(User).count()
    pending_consultant = db.query(ReviewRequest).filter(
        ReviewRequest.request_type == "consultant",
        ReviewRequest.status == "pending"
    ).count()
    pending_dermatologist = db.query(ReviewRequest).filter(
        ReviewRequest.request_type == "dermatologist",
        ReviewRequest.status == "pending"
    ).count()
    recent_users = db.query(User).filter(User.role == "user").order_by(User.created_at.desc()).limit(5).all()
    recent_activity = []
    for user in recent_users:
        recent_activity.append({
            "name": user.name,
            "role": user.role,
            "created_at": user.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return {
        "total_users": total_users,
        "total_consultants": total_consultants,
        "total_dermatologists": total_dermatologists,
        "total_admins": total_admins,
        "total_all_users": total_all_users,
        "pending_consultant": pending_consultant,
        "pending_dermatologist": pending_dermatologist,
        "recent_activity": recent_activity
    }


# ============ APPOINTMENT ENDPOINTS ============

@app.post("/appointments/book")
def book_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    if appointment_data.professional_type not in ["consultant", "dermatologist"]:
        raise HTTPException(status_code=400, detail="Professional type must be consultant or dermatologist")

    professional = db.query(User).filter(
        User.id == appointment_data.professional_id,
        User.role == appointment_data.professional_type
    ).first()

    if professional is None:
        raise HTTPException(status_code=404, detail="Professional not found")

    # Check if professional is approved
    if professional.role == "consultant":
        approved_profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.user_id == professional.id,
            ConsultantProfile.verification_status == "approved"
        ).first()
    else:
        approved_profile = db.query(DermatologistProfile).filter(
            DermatologistProfile.user_id == professional.id,
            DermatologistProfile.verification_status == "approved"
        ).first()

    if approved_profile is None:
        raise HTTPException(status_code=403, detail="This professional is not approved for appointments")

    # Create appointment
    new_appointment = Appointment(
        patient_id=current_user.id,
        professional_id=professional.id,
        professional_type=professional.role,
        status="pending",
        appointment_date=appointment_data.appointment_date,
        notes=appointment_data.notes or "",
        created_at=datetime.utcnow()
    )

    db.add(new_appointment)
    db.flush()

    # Create internal review record linked to THIS specific professional
    internal_review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == current_user.id,
        ReviewRequest.professional_id == professional.id,
        ReviewRequest.request_type == professional.role,
        ReviewRequest.status.in_(["pending", "completed"])
    ).order_by(ReviewRequest.created_at.desc()).first()

    if internal_review is None:
        internal_review = ReviewRequest(
            user_id=current_user.id,
            professional_id=professional.id,
            request_type=professional.role,
            status="pending",
            recommendation_text="",
            created_at=datetime.utcnow()
        )
        db.add(internal_review)

    db.commit()
    db.refresh(new_appointment)

    return {
        "message": "Appointment booked successfully",
        "appointment_id": new_appointment.id,
        "status": new_appointment.status,
        "professional_id": professional.id,
        "professional": professional.name,
        "professional_type": professional.role,
        "appointment_date": new_appointment.appointment_date.isoformat() if new_appointment.appointment_date else None
    }


@app.get("/appointments/my-appointments")
def get_my_appointments(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if current_user.role == "user":
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == current_user.id
        ).order_by(Appointment.created_at.desc()).all()
        
        result = []
        for appt in appointments:
            professional = db.query(User).filter(User.id == appt.professional_id).first()
            result.append({
                "id": appt.id,
                "professional_id": appt.professional_id,
                "professional_name": professional.name if professional else "Unknown",
                "professional_type": appt.professional_type,
                "status": appt.status,
                "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
                "notes": appt.notes,
                "created_at": appt.created_at.isoformat()
            })
        return result
    
    elif current_user.role in ["consultant", "dermatologist"]:
        appointments = db.query(Appointment).filter(
            Appointment.professional_id == current_user.id
        ).order_by(Appointment.created_at.desc()).all()
        
        result = []
        for appt in appointments:
            patient = db.query(User).filter(User.id == appt.patient_id).first()
            result.append({
                "id": appt.id,
                "patient_id": appt.patient_id,
                "patient_name": patient.name if patient else "Unknown",
                "status": appt.status,
                "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
                "notes": appt.notes,
                "created_at": appt.created_at.isoformat()
            })
        return result
    
    return []


@app.put("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if current_user.role not in ["consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="Only professionals can update appointment status")
    
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.professional_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = status_data.status
    if status_data.notes:
        appointment.notes = status_data.notes
    appointment.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": f"Appointment status updated to {status_data.status}",
        "appointment_id": appointment.id,
        "status": appointment.status
    }


# ============ Milestone 2 Endpoints ============

@app.get("/api/v1/assessment/score")
def get_skin_score(db: Session = Depends(get_db), token: Optional[str] = None, user_id: Optional[int] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own data")
    
    latest_assessment = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == target_user_id
    ).order_by(SkinAssessment.created_at.desc()).first()
    
    if not latest_assessment:
        return {
            "score": 0,
            "breakdown": {},
            "detected_concerns": [],
            "assessment_id": None,
            "created_at": None
        }
    
    return {
        "score": latest_assessment.overall_score,
        "breakdown": latest_assessment.breakdown,
        "detected_concerns": latest_assessment.detected_concerns,
        "assessment_id": latest_assessment.id,
        "created_at": latest_assessment.created_at
    }

@app.post("/api/v1/assessment/evaluate")
def evaluate_skin(db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Please complete your skin profile first")
    concerns = identify_skin_concerns(profile.skin_concerns)
    detected_concerns = [c["concern"] for c in concerns]
    score_result = calculate_skin_health_score(db, current_user.id)
    new_assessment = SkinAssessment(
        user_id=current_user.id,
        overall_score=score_result["score"],
        detected_concerns=detected_concerns,
        breakdown=score_result["breakdown"]
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    routine_steps = generate_routine(db, current_user.id, profile.skin_type, new_assessment.id)
    for step in routine_steps:
        routine = SkincareRoutine(
            user_id=current_user.id,
            assessment_id=new_assessment.id,
            time_of_day=step["time_of_day"],
            step_number=step["step_number"],
            step_category=step["step_category"],
            step_description=step["step_description"],
            is_active=step["is_active"]
        )
        db.add(routine)
    db.commit()
    return {
        "message": "Assessment completed",
        "assessment_id": new_assessment.id,
        "score": score_result["score"],
        "breakdown": score_result["breakdown"],
        "detected_concerns": detected_concerns,
        "routine": routine_steps,
        "created_at": new_assessment.created_at
    }

@app.get("/api/v1/routine")
def get_routine(db: Session = Depends(get_db), token: Optional[str] = None, user_id: Optional[int] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own routine")
    
    routines = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == target_user_id,
        SkincareRoutine.is_active == True
    ).order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number).all()
    
    if not routines:
        return {"AM": [], "PM": [], "Weekly": []}
    
    today = datetime.utcnow().date()
    logs = db.query(RoutineLog).filter(
        RoutineLog.user_id == target_user_id,
        RoutineLog.log_date == today
    ).all()
    completed_step_ids = [log.routine_step_id for log in logs if log.completed_at is not None]
    
    result = {"AM": [], "PM": [], "Weekly": []}
    for r in routines:
        step = {
            "id": r.id,
            "step_number": r.step_number,
            "step_category": r.step_category,
            "step_description": r.step_description,
            "is_completed": r.id in completed_step_ids
        }
        result[r.time_of_day].append(step)
    return result

@app.post("/api/v1/routine/toggle")
def toggle_routine_step(step_id: int, db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can track routine steps")
    step = db.query(SkincareRoutine).filter(
        SkincareRoutine.id == step_id,
        SkincareRoutine.user_id == current_user.id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Routine step not found")
    today = datetime.utcnow().date()
    log = db.query(RoutineLog).filter(
        RoutineLog.user_id == current_user.id,
        RoutineLog.routine_step_id == step_id,
        RoutineLog.log_date == today
    ).first()
    if log:
        if log.completed_at:
            log.completed_at = None
            message = "Step uncompleted"
        else:
            log.completed_at = datetime.utcnow()
            message = "Step completed"
    else:
        log = RoutineLog(
            user_id=current_user.id,
            routine_step_id=step_id,
            log_date=today,
            completed_at=datetime.utcnow()
        )
        db.add(log)
        message = "Step completed"
    db.commit()
    return {"message": message, "step_id": step_id, "completed": log.completed_at is not None}

@app.get("/api/v1/routine/streak")
def get_routine_streak(db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can view their streak")
    
    logs = db.query(RoutineLog).filter(
        RoutineLog.user_id == current_user.id,
        RoutineLog.completed_at.isnot(None)
    ).order_by(RoutineLog.log_date.desc()).all()
    
    if not logs:
        return {"streak": 0}
    
    completed_dates = set()
    for log in logs:
        completed_dates.add(log.log_date)
    
    sorted_dates = sorted(completed_dates, reverse=True)
    
    if not sorted_dates:
        return {"streak": 0}
    
    current_date = datetime.utcnow().date()
    streak = 0
    
    if sorted_dates[0] == current_date or sorted_dates[0] == current_date - timedelta(days=1):
        streak = 1
        check_date = current_date - timedelta(days=1)
        for date in sorted_dates[1:]:
            if date == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
    else:
        streak = 0
    
    return {"streak": streak}


# ============ Professionals Endpoints ============

@app.get("/professionals/approved")
def get_approved_professionals(db: Session = Depends(get_db), token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    consultants = db.query(ConsultantProfile, User).join(User, ConsultantProfile.user_id == User.id).filter(
        ConsultantProfile.verification_status == "approved"
    ).all()

    dermatologists = db.query(DermatologistProfile, User).join(User, DermatologistProfile.user_id == User.id).filter(
        DermatologistProfile.verification_status == "approved"
    ).all()

    result = []

    for profile, user in consultants:
        result.append({
            "id": user.id,
            "name": user.name,
            "type": "consultant",
            "specialty": profile.specialization,
            "years_experience": profile.years_experience,
            "bio": profile.bio,
            "certification_name": profile.certification_name,
            "training_institute": profile.training_institute,
            "certificate_number": profile.certificate_number,
            "salon_affiliation": profile.salon_affiliation,
            "phone": profile.phone,
            "verified": True,
            "rating": 4.5,
            "reviews": 0,
            "languages": ["English"],
            "consultation_mode": ["Chat", "Video"],
        })

    for profile, user in dermatologists:
        result.append({
            "id": user.id,
            "name": user.name,
            "type": "dermatologist",
            "specialty": profile.specialization,
            "years_experience": profile.years_experience,
            "bio": profile.bio,
            "degree": profile.medical_degree,
            "license_number": profile.license_number,
            "issuing_council": profile.issuing_council,
            "clinic_affiliation": profile.clinic_affiliation,
            "phone": profile.phone,
            "verified": True,
            "rating": 4.7,
            "reviews": 0,
            "languages": ["English"],
            "consultation_mode": ["Video", "In-person"],
        })

    return result


# ============ CONSULTANT ENDPOINTS ============

@app.get("/consultant/clients")
def get_consultant_clients(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Consultant access required")
    
    reviews = db.query(ReviewRequest, User).join(User, ReviewRequest.user_id == User.id).filter(
        ReviewRequest.request_type == "consultant",
        ReviewRequest.professional_id == current_user.id
    ).all()
    
    result = []
    for review, user in reviews:
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
        assessment = db.query(SkinAssessment).filter(
            SkinAssessment.user_id == user.id
        ).order_by(SkinAssessment.created_at.desc()).first()
        ai_result = db.query(AIAnalysisResult).filter(
            AIAnalysisResult.user_id == user.id,
            AIAnalysisResult.is_active == True
        ).order_by(AIAnalysisResult.created_at.desc()).first()
        
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "email": user.email,
            "profile": {
                "full_name": profile.full_name if profile else None,
                "age": profile.age if profile else None,
                "gender": profile.gender if profile else None,
                "skin_type": profile.skin_type if profile else None,
                "skin_concerns": profile.skin_concerns if profile else None,
                "water_intake": profile.water_intake if profile else None,
                "sleep_duration": profile.sleep_duration if profile else None,
                "stress_level": profile.stress_level if profile else None,
                "contact_number": profile.contact_number if profile else None
            } if profile else None,
            "assessment": {
                "score": assessment.overall_score if assessment else None,
                "detected_concerns": assessment.detected_concerns if assessment else [],
                "breakdown": assessment.breakdown if assessment else {},
                "created_at": assessment.created_at.isoformat() if assessment else None
            } if assessment else None,
            "ai_results": {
                "predicted_concern": ai_result.predicted_concern if ai_result else None,
                "confidence": ai_result.confidence if ai_result else None,
                "image_url": ai_result.image_url if ai_result else None,
                "created_at": ai_result.created_at.isoformat() if ai_result else None
            } if ai_result else None,
            "status": review.status,
            "request_id": review.id,
            "created_at": review.created_at.isoformat()
        })
    
    return result


@app.get("/consultant/assessments")
def get_consultant_assessments(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Consultant access required")
    
    reviews = db.query(ReviewRequest, User).join(User, ReviewRequest.user_id == User.id).filter(
        ReviewRequest.request_type == "consultant",
        ReviewRequest.professional_id == current_user.id
    ).all()
    
    user_ids = [user.id for review, user in reviews]
    
    if not user_ids:
        return []
    
    assessments = db.query(SkinAssessment).filter(
        SkinAssessment.user_id.in_(user_ids)
    ).order_by(SkinAssessment.created_at.desc()).all()
    
    result = []
    for assessment in assessments:
        user = db.query(User).filter(User.id == assessment.user_id).first()
        result.append({
            "id": assessment.id,
            "user_id": assessment.user_id,
            "client_name": user.name if user else "Unknown",
            "score": assessment.overall_score,
            "breakdown": assessment.breakdown,
            "detected_concerns": assessment.detected_concerns,
            "primary_concern": assessment.detected_concerns[0] if assessment.detected_concerns else "No concern detected",
            "status": "Reviewed" if assessment.id else "Awaiting Review",
            "created_at": assessment.created_at.isoformat()
        })
    
    return result


@app.get("/consultant/client/{user_id}/routine")
def get_client_routine(
    user_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Consultant access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "consultant"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this client")
    
    routines = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user_id,
        SkincareRoutine.is_active == True
    ).order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number).all()
    
    if not routines:
        return {"AM": [], "PM": [], "Weekly": []}
    
    today = datetime.utcnow().date()
    logs = db.query(RoutineLog).filter(
        RoutineLog.user_id == user_id,
        RoutineLog.log_date == today
    ).all()
    completed_step_ids = [log.routine_step_id for log in logs if log.completed_at is not None]
    
    result = {"AM": [], "PM": [], "Weekly": []}
    for r in routines:
        step = {
            "id": r.id,
            "step_number": r.step_number,
            "step_category": r.step_category,
            "step_description": r.step_description,
            "is_completed": r.id in completed_step_ids
        }
        result[r.time_of_day].append(step)
    
    return result


@app.put("/consultant/client/{user_id}/routine")
def update_client_routine(
    user_id: int,
    routine_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Consultant access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "consultant"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this client")
    
    routines = routine_data.get("routines", {})
    
    for time_of_day, steps in routines.items():
        if time_of_day not in ["AM", "PM", "Weekly"]:
            continue
        
        for step_data in steps:
            step_id = step_data.get("id")
            if step_id:
                step = db.query(SkincareRoutine).filter(
                    SkincareRoutine.id == step_id,
                    SkincareRoutine.user_id == user_id
                ).first()
                if step:
                    step.step_category = step_data.get("step_category", step.step_category)
                    step.step_description = step_data.get("step_description", step.step_description)
            else:
                new_step = SkincareRoutine(
                    user_id=user_id,
                    time_of_day=time_of_day,
                    step_number=len(steps),
                    step_category=step_data.get("step_category", ""),
                    step_description=step_data.get("step_description", ""),
                    is_active=True
                )
                db.add(new_step)
    
    db.commit()
    return {"message": "Routine updated successfully"}


@app.post("/consultant/recommend-product")
def recommend_product_to_client(
    request_data: ProductRecommendRequest,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "consultant":
        raise HTTPException(status_code=403, detail="Consultant access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == request_data.user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "consultant"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this client")
    
    product = db.query(Product).filter(Product.id == request_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = db.query(ProductRecommendation).filter(
        ProductRecommendation.user_id == request_data.user_id,
        ProductRecommendation.product_id == request_data.product_id,
        ProductRecommendation.source == "consultant",
        ProductRecommendation.recommended_by == current_user.id
    ).first()
    
    if existing:
        return {
            "message": "Product already recommended",
            "recommendation_id": existing.id
        }
    
    reason = request_data.reason or f"Recommended by consultant for your skin needs"
    
    recommendation = ProductRecommendation(
        user_id=request_data.user_id,
        product_id=request_data.product_id,
        source="consultant",
        recommended_by=current_user.id,
        reason=reason[:255],
        matching_concerns=[],
        created_at=datetime.utcnow()
    )
    
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    
    return {
        "message": "Product recommended successfully",
        "recommendation_id": recommendation.id,
        "product": product.name,
        "user_id": request_data.user_id
    }


# ============ DERMATOLOGIST ENDPOINTS ============

@app.get("/dermatologist/assessments")
def get_dermatologist_assessments(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Dermatologist access required")
    
    reviews = db.query(ReviewRequest, User).join(User, ReviewRequest.user_id == User.id).filter(
        ReviewRequest.request_type == "dermatologist",
        ReviewRequest.professional_id == current_user.id
    ).all()
    
    user_ids = [user.id for review, user in reviews]
    
    if not user_ids:
        return []
    
    assessments = db.query(SkinAssessment).filter(
        SkinAssessment.user_id.in_(user_ids)
    ).order_by(SkinAssessment.created_at.desc()).all()
    
    result = []
    for assessment in assessments:
        user = db.query(User).filter(User.id == assessment.user_id).first()
        result.append({
            "id": assessment.id,
            "user_id": assessment.user_id,
            "patient_name": user.name if user else "Unknown",
            "score": assessment.overall_score,
            "breakdown": assessment.breakdown,
            "detected_concerns": assessment.detected_concerns,
            "primary_concern": assessment.detected_concerns[0] if assessment.detected_concerns else "No concern detected",
            "status": "Reviewed",
            "created_at": assessment.created_at.isoformat()
        })
    
    return result


@app.get("/dermatologist/patient/{user_id}/treatment-plan")
def get_patient_treatment_plan(
    user_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Dermatologist access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "dermatologist"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this patient")
    
    routines = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user_id,
        SkincareRoutine.is_active == True
    ).order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number).all()
    
    if not routines:
        return {"AM": [], "PM": [], "Weekly": []}
    
    today = datetime.utcnow().date()
    logs = db.query(RoutineLog).filter(
        RoutineLog.user_id == user_id,
        RoutineLog.log_date == today
    ).all()
    completed_step_ids = [log.routine_step_id for log in logs if log.completed_at is not None]
    
    result = {"AM": [], "PM": [], "Weekly": []}
    for r in routines:
        step = {
            "id": r.id,
            "step_number": r.step_number,
            "step_category": r.step_category,
            "step_description": r.step_description,
            "is_completed": r.id in completed_step_ids
        }
        result[r.time_of_day].append(step)
    
    return result


@app.put("/dermatologist/patient/{user_id}/treatment-plan")
def update_patient_treatment_plan(
    user_id: int,
    treatment_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Dermatologist access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "dermatologist"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this patient")
    
    routines = treatment_data.get("routines", {})
    
    for time_of_day, steps in routines.items():
        if time_of_day not in ["AM", "PM", "Weekly"]:
            continue
        
        for step_data in steps:
            step_id = step_data.get("id")
            if step_id:
                step = db.query(SkincareRoutine).filter(
                    SkincareRoutine.id == step_id,
                    SkincareRoutine.user_id == user_id
                ).first()
                if step:
                    step.step_category = step_data.get("step_category", step.step_category)
                    step.step_description = step_data.get("step_description", step.step_description)
            else:
                new_step = SkincareRoutine(
                    user_id=user_id,
                    time_of_day=time_of_day,
                    step_number=len(steps),
                    step_category=step_data.get("step_category", ""),
                    step_description=step_data.get("step_description", ""),
                    is_active=True
                )
                db.add(new_step)
    
    db.commit()
    return {"message": "Treatment plan updated successfully"}


@app.post("/dermatologist/prescription")
def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Dermatologist access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == prescription_data.patient_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "dermatologist"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this patient")
    
    return {
        "message": "Prescription created successfully",
        "patient_id": prescription_data.patient_id,
        "treatment_name": prescription_data.treatment_name,
        "dosage": prescription_data.dosage,
        "instructions": prescription_data.instructions,
        "duration": prescription_data.duration,
        "created_at": datetime.utcnow().isoformat()
    }


@app.get("/dermatologist/prescriptions/{patient_id}")
def get_patient_prescriptions(
    patient_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "dermatologist":
        raise HTTPException(status_code=403, detail="Dermatologist access required")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == patient_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == "dermatologist"
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this patient")
    
    return [
        {
            "id": 1,
            "treatment_name": "Tretinoin 0.05%",
            "dosage": "Apply pea-sized amount nightly",
            "instructions": "Start with 2x per week, increase gradually",
            "duration": "3 months",
            "notes": "Use with moisturizer to reduce irritation",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "treatment_name": "Clindamycin 1%",
            "dosage": "Apply thin layer twice daily",
            "instructions": "Use on clean, dry skin",
            "duration": "2 months",
            "notes": "Avoid sun exposure",
            "created_at": datetime.utcnow().isoformat()
        }
    ]


# ============================================================
# ============ PROFESSIONAL - PATIENT DATA ACCESS ============
# ============================================================

@app.get("/professional/patient/{user_id}/ai-analysis")
def get_patient_ai_analysis(
    user_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if current_user.role not in ["consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="Only professionals can view patient data")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == current_user.role
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this patient's data")
    
    ai_result = db.query(AIAnalysisResult).filter(
        AIAnalysisResult.user_id == user_id,
        AIAnalysisResult.is_active == True
    ).order_by(AIAnalysisResult.created_at.desc()).first()
    
    if not ai_result:
        return {
            "has_results": False,
            "message": "No AI analysis found for this patient"
        }
    
    return {
        "has_results": True,
        "analysis_id": ai_result.id,
        "predicted_concern": ai_result.predicted_concern,
        "confidence": ai_result.confidence,
        "all_predictions": ai_result.all_predictions,
        "recommendations": ai_result.recommendations,
        "routine_suggestions": ai_result.routine_suggestions,
        "general_instructions": ai_result.general_instructions,
        "image_url": ai_result.image_url,
        "created_at": ai_result.created_at.isoformat()
    }


@app.get("/professional/patient/{user_id}/photos")
def get_patient_photos(
    user_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if current_user.role not in ["consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="Only professionals can view patient data")
    
    review = db.query(ReviewRequest).filter(
        ReviewRequest.user_id == user_id,
        ReviewRequest.professional_id == current_user.id,
        ReviewRequest.request_type == current_user.role
    ).first()
    
    if not review:
        raise HTTPException(status_code=403, detail="You don't have access to this patient's data")
    
    photos = db.query(ProgressPhoto).filter(
        ProgressPhoto.user_id == user_id,
        ProgressPhoto.is_active == True
    ).order_by(ProgressPhoto.uploaded_at.desc()).all()
    
    return {
        "total": len(photos),
        "photos": [
            {
                "id": p.id,
                "image_url": p.image_url,
                "thumbnail_url": p.thumbnail_url,
                "tag": p.tag,
                "skin_score": p.skin_score,
                "notes": p.notes,
                "uploaded_at": p.uploaded_at.isoformat()
            }
            for p in photos
        ]
    }


# ============ PRODUCTS ENDPOINTS ============

@app.get("/api/v1/products")
def get_products(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(Product)
    
    if category and category.strip():
        query = query.filter(Product.category.ilike(f"%{category}%"))
    
    if search and search.strip():
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.brand.ilike(f"%{search}%"))
        )
    
    query = query.order_by(Product.rating.desc())
    
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "price": p.price,
                "rating": p.rating,
                "reviews_count": p.reviews_count,
                "image_url": p.image_url,
                "description": p.description[:200] if p.description else None,
                "ingredients_text": p.ingredients_text[:100] + "..." if p.ingredients_text and len(p.ingredients_text) > 100 else p.ingredients_text
            }
            for p in products
        ]
    }


@app.get("/api/v1/products/recommendations")
def get_product_recommendations_old(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    limit: int = 20
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    recommendations = db.query(ProductRecommendation).filter(
        ProductRecommendation.user_id == current_user.id
    ).order_by(
        ProductRecommendation.source
    ).limit(limit).all()
    
    if not recommendations:
        return []
    
    result = []
    for rec in recommendations:
        product = db.query(Product).filter(Product.id == rec.product_id).first()
        if product:
            professional_name = None
            if rec.recommended_by:
                prof = db.query(User).filter(User.id == rec.recommended_by).first()
                if prof:
                    professional_name = prof.name
            
            source_labels = {
                "rule_engine": "AI Suggested",
                "ai_analysis": "AI Analysis",
                "consultant": "Consultant",
                "dermatologist": "Dermatologist"
            }
            
            result.append({
                "id": rec.id,
                "product": {
                    "id": product.id,
                    "name": product.name,
                    "brand": product.brand,
                    "category": product.category,
                    "price": product.price,
                    "rating": product.rating,
                    "reviews_count": product.reviews_count,
                    "image_url": product.image_url,
                    "description": product.description[:200] if product.description else None,
                    "ingredients_text": product.ingredients_text[:100] + "..." if product.ingredients_text and len(product.ingredients_text) > 100 else product.ingredients_text
                },
                "source": rec.source,
                "source_label": source_labels.get(rec.source, rec.source),
                "recommended_by": professional_name,
                "reason": rec.reason,
                "created_at": rec.created_at
            })
    
    return result


@app.post("/api/v1/products/recommend")
def recommend_product(
    request_data: ProductRecommendRequest,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if current_user.role not in ["consultant", "dermatologist"]:
        raise HTTPException(status_code=403, detail="Only consultants and dermatologists can recommend products")
    
    product = db.query(Product).filter(Product.id == request_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    user = db.query(User).filter(User.id == request_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(ProductRecommendation).filter(
        ProductRecommendation.user_id == request_data.user_id,
        ProductRecommendation.product_id == request_data.product_id,
        ProductRecommendation.source == current_user.role,
        ProductRecommendation.recommended_by == current_user.id
    ).first()
    
    if existing:
        return {
            "message": "Product already recommended",
            "recommendation_id": existing.id,
            "product": product.name,
            "user": user.name
        }
    
    if not request_data.reason:
        reason = f"Recommended by {current_user.role} for your skin needs"
    else:
        reason = request_data.reason
    
    recommendation = ProductRecommendation(
        user_id=request_data.user_id,
        product_id=request_data.product_id,
        source=current_user.role,
        recommended_by=current_user.id,
        reason=reason[:255],
        matching_concerns=[],
        created_at=datetime.utcnow()
    )
    
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    
    return {
        "message": "Product recommended successfully",
        "recommendation_id": recommendation.id,
        "product": product.name,
        "user": user.name
    }


@app.get("/api/v1/products/categories")
def get_product_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category).distinct().all()
    result = [c[0] for c in categories if c[0] and c[0].strip()]
    return {"categories": result}


@app.get("/api/v1/products/{product_id}")
def get_product_detail(
    product_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    reviews = db.query(Review).filter(Review.product_id == product_id).limit(10).all()
    
    return {
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "price": product.price,
        "rating": product.rating,
        "reviews_count": product.reviews_count,
        "image_url": product.image_url,
        "description": product.description,
        "how_to_use": product.how_to_use,
        "ingredients_text": product.ingredients_text,
        "highlights": product.highlights,
        "reviews": [
            {
                "rating": r.rating,
                "review_text": r.review_text,
                "skin_type": r.skin_type,
                "submission_time": r.submission_time
            }
            for r in reviews
        ]
    }


# ============ INGREDIENT INTELLIGENCE ENDPOINTS ============

@app.get("/api/v1/ingredient/analyze/{product_id}")
def analyze_product_ingredients(
    product_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    user_id = None
    if token:
        current_user = get_current_user(token, db)
        if current_user:
            user_id = current_user.id
    
    result = analyze_product(db, product_id, user_id)
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    
    return result


@app.get("/api/v1/ingredient/info/{ingredient_name}")
def get_ingredient_details(
    ingredient_name: str,
    db: Session = Depends(get_db)
):
    result = get_ingredient_info(db, ingredient_name)
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    return result


@app.post("/api/v1/ingredient/filter-safe")
def filter_safe_products(
    product_ids: List[int],
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    safe_ids = filter_products_by_ingredient_safety(db, product_ids, current_user.id)
    
    return {
        "total_products": len(product_ids),
        "safe_products": len(safe_ids),
        "safe_product_ids": safe_ids
    }


@app.get("/api/v1/ingredients/search")
def search_ingredients(
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50)
):
    ingredients = db.query(Ingredient).filter(
        Ingredient.name.ilike(f"%{q}%")
    ).limit(limit).all()
    
    return {
        "query": q,
        "total": len(ingredients),
        "ingredients": [
            {
                "id": ing.id,
                "name": ing.name,
                "comedogenicity": ing.comedogenicity,
                "irritancy": ing.irritancy,
                "functions": ing.functions or [],
                "rating": ing.rating,
                "category": ing.category
            }
            for ing in ingredients
        ]
    }


@app.get("/api/v1/ingredients/{ingredient_id}")
def get_ingredient_detail(
    ingredient_id: int,
    db: Session = Depends(get_db)
):
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    product_links = db.query(ProductIngredient).filter(
        ProductIngredient.ingredient_id == ingredient_id
    ).all()
    
    product_ids = [link.product_id for link in product_links]
    products = db.query(Product).filter(Product.id.in_(product_ids)).limit(10).all()
    
    return {
        "id": ingredient.id,
        "name": ingredient.name,
        "comedogenicity": ingredient.comedogenicity,
        "irritancy": ingredient.irritancy,
        "functions": ingredient.functions or [],
        "rating": ingredient.rating,
        "category": ingredient.category,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "image_url": p.image_url
            }
            for p in products
        ],
        "total_products": len(product_links)
    }


@app.get("/api/v1/ingredients/safety-rating/{ingredient_name}")
def get_ingredient_safety(
    ingredient_name: str,
    db: Session = Depends(get_db)
):
    ingredient = db.query(Ingredient).filter(
        Ingredient.name.ilike(f"%{ingredient_name}%")
    ).first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    safety_score = 100
    warnings = []
    
    if ingredient.comedogenicity:
        try:
            val = float(ingredient.comedogenicity)
            if val >= 3:
                safety_score -= 20
                warnings.append(f"High comedogenicity ({ingredient.comedogenicity}) - may clog pores")
            elif val >= 2:
                safety_score -= 10
                warnings.append(f"Moderate comedogenicity ({ingredient.comedogenicity})")
        except:
            pass
    
    if ingredient.irritancy:
        try:
            val = float(ingredient.irritancy)
            if val >= 3:
                safety_score -= 20
                warnings.append(f"High irritancy ({ingredient.irritancy}) - may cause irritation")
            elif val >= 2:
                safety_score -= 10
                warnings.append(f"Moderate irritancy ({ingredient.irritancy})")
        except:
            pass
    
    if safety_score >= 80:
        safety_label = "✅ Safe"
        color = "#28a745"
    elif safety_score >= 60:
        safety_label = "⚠️ Caution"
        color = "#ffc107"
    else:
        safety_label = "❌ Not Recommended"
        color = "#dc3545"
    
    return {
        "name": ingredient.name,
        "safety_score": max(0, safety_score),
        "safety_label": safety_label,
        "color": color,
        "comedogenicity": ingredient.comedogenicity,
        "irritancy": ingredient.irritancy,
        "functions": ingredient.functions or [],
        "warnings": warnings
    }


@app.get("/api/v1/ingredients/{ingredient_id}/products")
def get_products_by_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200)
):
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    product_links = db.query(ProductIngredient).filter(
        ProductIngredient.ingredient_id == ingredient_id
    ).all()
    
    product_ids = [link.product_id for link in product_links]
    products = db.query(Product).filter(Product.id.in_(product_ids)).limit(limit).all()
    
    return {
        "ingredient": ingredient.name,
        "total": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "price": p.price,
                "rating": p.rating,
                "image_url": p.image_url,
                "description": p.description[:150] if p.description else "",
                "ingredients_text": p.ingredients_text[:100] if p.ingredients_text else ""
            }
            for p in products
        ]
    }


# ============ PROGRESS TRACKING ENDPOINTS ============

@app.get("/api/v1/progress/adherence")
def get_adherence(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    user_id: Optional[int] = None,
    days: int = Query(7, ge=1, le=90)
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own data")
    
    result = calculate_adherence(db, target_user_id, days)
    return {
        "user_id": target_user_id,
        "adherence": result
    }


@app.get("/api/v1/progress/score-history")
def get_score_history_endpoint(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(30, ge=1, le=100)
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own data")
    
    result = get_score_history(db, target_user_id, limit)
    return {
        "user_id": target_user_id,
        "history": result
    }


@app.get("/api/v1/progress/summary")
def get_progress_summary_endpoint(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = get_progress_summary(db, current_user.id)
    return {
        "user_id": current_user.id,
        "progress": result
    }


@app.get("/api/v1/progress/insights")
def get_progress_insights(
    db: Session = Depends(get_db),
    token: Optional[str] = None):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = generate_progress_insights(db, current_user.id)
    return {
        "user_id": current_user.id,
        "insights": result
    }


# ============ PHOTO UPLOAD ENDPOINTS ============

@app.post("/api/v1/photos/upload")
async def upload_photo(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    file: UploadFile = File(...),
    tag: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    result = save_uploaded_photo(db, current_user.id, file, tag, notes)
    return {
        "message": "Photo uploaded successfully",
        "photo": result
    }


@app.get("/api/v1/photos")
def get_photos(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    tag: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own photos")
    
    photos = get_user_photos(db, target_user_id, limit, tag)
    return {
        "user_id": target_user_id,
        "total": len(photos),
        "photos": photos
    }


@app.get("/api/v1/photos/comparison")
def get_before_after(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    user_id: Optional[int] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own photos")
    
    result = get_before_after_comparison(db, target_user_id)
    return {
        "user_id": target_user_id,
        "comparison": result
    }


@app.delete("/api/v1/photos/{photo_id}")
def delete_photo_endpoint(
    photo_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    success = delete_photo(db, photo_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {"message": "Photo deleted successfully"}


# ============ AI ANALYSIS ENDPOINTS ============

def generate_routine_suggestions(concern: str) -> list:
    routine_map = {
        'inflammatory acne': [
            {'step': 'Cleansing', 'description': 'Use a gentle salicylic acid cleanser twice daily'},
            {'step': 'Treatment', 'description': 'Apply benzoyl peroxide or adapalene to affected areas'},
            {'step': 'Moisturizing', 'description': 'Use a lightweight, oil-free moisturizer'},
            {'step': 'Sun Protection', 'description': 'Apply SPF 50+ sunscreen every morning'},
            {'step': 'Night Care', 'description': 'Use a retinol or niacinamide serum at night'}
        ],
        'Redness': [
            {'step': 'Cleansing', 'description': 'Use a gentle, fragrance-free cleanser'},
            {'step': 'Treatment', 'description': 'Apply centella asiatica or aloe vera serum'},
            {'step': 'Moisturizing', 'description': 'Use a soothing, calming moisturizer'},
            {'step': 'Sun Protection', 'description': 'Use mineral SPF 50+ sunscreen'},
            {'step': 'Night Care', 'description': 'Apply a calming night cream with ceramides'}
        ],
        'pigmentation': [
            {'step': 'Cleansing', 'description': 'Use a gentle cleanser'},
            {'step': 'Treatment', 'description': 'Apply vitamin C serum in the morning'},
            {'step': 'Treatment PM', 'description': 'Apply niacinamide or alpha arbutin at night'},
            {'step': 'Sun Protection', 'description': 'Apply SPF 50+ sunscreen every day'},
            {'step': 'Exfoliation', 'description': 'Use gentle chemical exfoliant (AHA) 2x per week'}
        ],
        'wrinkles': [
            {'step': 'Cleansing', 'description': 'Use a hydrating cleanser'},
            {'step': 'Treatment AM', 'description': 'Apply vitamin C and hyaluronic acid serum'},
            {'step': 'Treatment PM', 'description': 'Apply retinol or peptides at night'},
            {'step': 'Moisturizing', 'description': 'Use a rich moisturizer with ceramides'},
            {'step': 'Sun Protection', 'description': 'Apply SPF 50+ sunscreen daily'}
        ],
        'pores': [
            {'step': 'Cleansing', 'description': 'Use a salicylic acid cleanser'},
            {'step': 'Treatment', 'description': 'Apply niacinamide serum to reduce pore size'},
            {'step': 'Exfoliation', 'description': 'Use BHA exfoliant 2-3 times per week'},
            {'step': 'Moisturizing', 'description': 'Use an oil-free, lightweight moisturizer'},
            {'step': 'Sun Protection', 'description': 'Apply SPF 30+ sunscreen daily'}
        ],
        'dark spots': [
            {'step': 'Cleansing', 'description': 'Use a gentle cleanser'},
            {'step': 'Treatment AM', 'description': 'Apply vitamin C and ferulic acid serum'},
            {'step': 'Treatment PM', 'description': 'Apply niacinamide or tranexamic acid'},
            {'step': 'Moisturizing', 'description': 'Use a hydrating moisturizer'},
            {'step': 'Sun Protection', 'description': 'Apply SPF 50+ sunscreen every day'}
        ]
    }
    
    concern_lower = concern.lower()
    for key in routine_map:
        if key in concern_lower:
            return routine_map[key]
    
    return [
        {'step': 'Cleansing', 'description': 'Use a gentle cleanser suitable for your skin type'},
        {'step': 'Treatment', 'description': 'Apply targeted treatment for your skin concern'},
        {'step': 'Moisturizing', 'description': 'Use a moisturizer appropriate for your skin type'},
        {'step': 'Sun Protection', 'description': 'Apply SPF 50+ sunscreen daily'},
        {'step': 'Night Care', 'description': 'Use a restorative night cream or serum'}
    ]


def generate_general_instructions(concern: str, skin_type: str = None) -> list:
    instructions_map = {
        'inflammatory acne': [
            {'title': '🫧 Gentle Cleansing', 'instruction': 'Wash your face twice daily with a gentle cleanser. Avoid over-washing which can irritate skin.'},
            {'title': '🧴 Use Non-Comedogenic Products', 'instruction': 'Choose oil-free, non-comedogenic products that won\'t clog pores.'},
            {'title': '💧 Stay Hydrated', 'instruction': 'Drink at least 2.5L of water daily to keep skin hydrated.'},
            {'title': '🌙 Get Adequate Sleep', 'instruction': 'Aim for 7-8 hours of quality sleep for skin repair.'},
            {'title': '🧘 Manage Stress', 'instruction': 'Practice stress management techniques as stress can trigger breakouts.'},
            {'title': '🚫 Don\'t Pop Pimples', 'instruction': 'Avoid popping or picking at pimples to prevent scarring and infection.'}
        ],
        'Redness': [
            {'title': '🧴 Use Gentle Products', 'instruction': 'Avoid products with fragrance, alcohol, and harsh exfoliants.'},
            {'title': '🧊 Cool Compress', 'instruction': 'Apply a cool compress to reduce redness and soothe irritation.'},
            {'title': '💧 Hydrate', 'instruction': 'Use hydrating products containing ceramides to repair skin barrier.'},
            {'title': '☀️ Sun Protection', 'instruction': 'Always use mineral sunscreen to prevent further irritation.'},
            {'title': '🌿 Calming Ingredients', 'instruction': 'Look for products with centella asiatica, aloe vera, or chamomile.'}
        ],
        'pigmentation': [
            {'title': '☀️ Sun Protection is Key', 'instruction': 'Apply SPF 50+ sunscreen every single day, even indoors.'},
            {'title': '🌿 Brightening Ingredients', 'instruction': 'Use products with vitamin C, niacinamide, or alpha arbutin.'},
            {'title': '🧴 Gentle Exfoliation', 'instruction': 'Exfoliate gently 1-2 times per week to remove dead skin cells.'},
            {'title': '💧 Stay Hydrated', 'instruction': 'Keep skin hydrated to support cell turnover.'},
            {'title': '⏳ Be Patient', 'instruction': 'Pigmentation treatment takes time. Consistency is key.'}
        ]
    }
    
    concern_lower = concern.lower()
    for key in instructions_map:
        if key in concern_lower:
            return instructions_map[key]
    
    return [
        {'title': '🧴 Consistent Routine', 'instruction': 'Follow your skincare routine consistently for best results.'},
        {'title': '💧 Stay Hydrated', 'instruction': 'Drink plenty of water to keep skin healthy.'},
        {'title': '😴 Get Enough Sleep', 'instruction': 'Aim for 7-8 hours of sleep for skin repair.'},
        {'title': '☀️ Sun Protection', 'instruction': 'Apply sunscreen daily to protect your skin.'},
        {'title': '🍎 Healthy Diet', 'instruction': 'Eat a balanced diet rich in fruits and vegetables for skin health.'}
    ]


def get_recommendations_by_concern(db: Session, concern: str):
    concern_ingredient_map = {
        'acne': ['salicylic acid', 'benzoyl peroxide', 'niacinamide', 'zinc'],
        'inflammatory acne': ['salicylic acid', 'benzoyl peroxide', 'niacinamide', 'zinc'],
        'non inflammatory acne black heads': ['salicylic acid', 'glycolic acid', 'niacinamide'],
        'non inflammatory acne white heads': ['salicylic acid', 'glycolic acid', 'niacinamide'],
        'pigmentation': ['vitamin c', 'niacinamide', 'alpha arbutin', 'kojic acid'],
        'dark spots': ['vitamin c', 'niacinamide', 'alpha arbutin', 'tranexamic acid'],
        'redness': ['centella asiatica', 'aloe vera', 'niacinamide', 'chamomile'],
        'pores': ['niacinamide', 'salicylic acid', 'glycolic acid', 'retinol'],
        'wrinkles': ['retinol', 'peptides', 'hyaluronic acid', 'vitamin c'],
        'Redness': ['centella asiatica', 'aloe vera', 'niacinamide', 'chamomile'],
    }
    
    concern_lower = concern.lower()
    ingredients = concern_ingredient_map.get(concern_lower, [])
    
    if not ingredients:
        for key, value in concern_ingredient_map.items():
            if key in concern_lower:
                ingredients = value
                break
    
    if not ingredients:
        return []
    
    products = []
    for ingredient in ingredients:
        results = db.query(Product).filter(
            Product.ingredients_text.ilike(f"%{ingredient}%")
        ).limit(10).all()
        
        for p in results:
            if p.id not in [prod['id'] for prod in products]:
                products.append({
                    'id': p.id,
                    'name': p.name,
                    'brand': p.brand,
                    'category': p.category,
                    'price': p.price,
                    'rating': p.rating,
                    'image_url': p.image_url,
                    'ingredient_matched': ingredient
                })
    
    products.sort(key=lambda x: x['rating'] or 0, reverse=True)
    return products[:10]


@app.post("/api/v1/ai-analyze")
async def analyze_skin(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        temp_dir = os.path.join(os.path.dirname(__file__), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        temp_filename = f"{uuid.uuid4().hex}.{ext}"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        result = predict_skin_concern(temp_path)
        
        try:
            os.remove(temp_path)
        except:
            pass
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        predicted_concern = result['predicted_class']
        recommendations = get_recommendations_by_concern(db, predicted_concern)
        routine_suggestions = generate_routine_suggestions(predicted_concern)
        
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
        skin_type = profile.skin_type if profile else None
        general_instructions = generate_general_instructions(predicted_concern, skin_type)
        
        image_filename = f"ai_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        ai_dir = os.path.join(STATIC_DIR, "ai_analysis")
        os.makedirs(ai_dir, exist_ok=True)
        image_path = os.path.join(ai_dir, image_filename)
        
        await file.seek(0)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        image_url = f"/static/ai_analysis/{image_filename}"
        
        ai_result = AIAnalysisResult(
            user_id=current_user.id,
            image_url=image_url,
            predicted_concern=predicted_concern,
            confidence=result['confidence'],
            all_predictions=result['all_predictions'],
            recommendations=recommendations,
            routine_suggestions=routine_suggestions,
            general_instructions=general_instructions,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(ai_result)
        db.commit()
        db.refresh(ai_result)
        
        return {
            "success": True,
            "user_id": current_user.id,
            "analysis_id": ai_result.id,
            "predicted_concern": predicted_concern,
            "confidence": result['confidence'],
            "all_predictions": result['all_predictions'],
            "recommendations": recommendations,
            "routine_suggestions": routine_suggestions,
            "general_instructions": general_instructions,
            "image_url": image_url,
            "message": f"AI detected: {predicted_concern} ({result['confidence']:.1f}% confidence)"
        }
        
    except Exception as e:
        logger.error(f"AI Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")


@app.get("/api/v1/ai-analysis/latest")
def get_latest_ai_analysis(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    user_id: Optional[int] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    target_user_id = user_id if user_id else current_user.id
    
    if user_id and current_user.role in ["consultant", "dermatologist"]:
        review = db.query(ReviewRequest).filter(
            ReviewRequest.user_id == user_id,
            ReviewRequest.professional_id == current_user.id,
            ReviewRequest.request_type == current_user.role
        ).first()
        if not review:
            raise HTTPException(status_code=403, detail="You don't have access to this user's data")
    elif user_id and current_user.role == "user" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users can only view their own data")
    
    result = db.query(AIAnalysisResult).filter(
        AIAnalysisResult.user_id == target_user_id,
        AIAnalysisResult.is_active == True
    ).order_by(AIAnalysisResult.created_at.desc()).first()
    
    if not result:
        return {
            "has_results": False,
            "message": "No AI analysis results found"
        }
    
    return {
        "has_results": True,
        "analysis_id": result.id,
        "predicted_concern": result.predicted_concern,
        "confidence": result.confidence,
        "all_predictions": result.all_predictions,
        "recommendations": result.recommendations,
        "routine_suggestions": result.routine_suggestions,
        "general_instructions": result.general_instructions,
        "image_url": result.image_url,
        "created_at": result.created_at.isoformat()
    }


@app.post("/api/v1/ai-analysis/feedback")
def submit_ai_feedback(
    feedback_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    analysis_id = feedback_data.get('analysis_id')
    if not analysis_id:
        raise HTTPException(status_code=400, detail="Analysis ID required")
    
    analysis = db.query(AIAnalysisResult).filter(
        AIAnalysisResult.id == analysis_id,
        AIAnalysisResult.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis.user_feedback = feedback_data.get('feedback', {})
    db.commit()
    
    return {"message": "Feedback submitted successfully"}


# ============ RECOMMENDATION ENGINE V2 ENDPOINTS ============

@app.get("/api/v1/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: float = Query(0, ge=0, le=5),
    categories: Optional[str] = None,
):
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required - token missing")
    
    current_user = get_current_user(token, db)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Invalid token - user not found")
    
    category_list = None
    if categories:
        category_list = [c.strip() for c in categories.split(',') if c.strip()]
    
    recommendations = get_product_recommendations(
        db=db,
        user_id=current_user.id,
        limit=limit,
        max_price=max_price,
        min_rating=min_rating,
        categories=category_list
    )
    
    return {
        "user_id": current_user.id,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations
    }


@app.get("/api/v1/recommendations/concerns")
def get_available_concerns():
    return {"concerns": get_concern_categories()}


@app.get("/api/v1/recommendations/skin-types")
def get_available_skin_types():
    return {"skin_types": get_skin_types()}


@app.get("/api/v1/recommendations/categories")
def get_product_categories_with_filter(
    db: Session = Depends(get_db)
):
    categories = db.query(Product.category).distinct().all()
    result = [c[0] for c in categories if c[0] and c[0].strip()]
    return {"categories": result}


# ============ ADMIN - ROLE & PERMISSIONS ENDPOINTS ============

@app.get("/admin/professionals/pending")
def get_pending_professionals_detail(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    consultants = db.query(ConsultantProfile, User).join(User, ConsultantProfile.user_id == User.id).filter(
        ConsultantProfile.verification_status == "pending"
    ).all()
    
    dermatologists = db.query(DermatologistProfile, User).join(User, DermatologistProfile.user_id == User.id).filter(
        DermatologistProfile.verification_status == "pending"
    ).all()
    
    result = []
    for profile, user in consultants:
        result.append({
            "id": profile.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "type": "consultant",
            "qualification": profile.certification_name,
            "license_number": profile.certificate_number,
            "training_institute": profile.training_institute,
            "affiliation": profile.salon_affiliation,
            "specialization": profile.specialization,
            "years_experience": profile.years_experience,
            "verification_status": profile.verification_status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None
        })
    for profile, user in dermatologists:
        result.append({
            "id": profile.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "type": "dermatologist",
            "qualification": profile.medical_degree,
            "license_number": profile.license_number,
            "training_institute": profile.issuing_council,
            "affiliation": profile.clinic_affiliation,
            "specialization": profile.specialization,
            "years_experience": profile.years_experience,
            "verification_status": profile.verification_status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None
        })
    return result


@app.put("/admin/approve-professional/{profile_id}")
def approve_professional(
    profile_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == profile_id).first()
    if consultant:
        if consultant.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Already approved")
        consultant.verification_status = "approved"
        user = db.query(User).filter(User.id == consultant.user_id).first()
        if user:
            user.is_verified = True
        db.commit()
        return {"message": "Consultant approved successfully"}
    
    dermatologist = db.query(DermatologistProfile).filter(DermatologistProfile.id == profile_id).first()
    if dermatologist:
        if dermatologist.verification_status == "approved":
            raise HTTPException(status_code=400, detail="Already approved")
        dermatologist.verification_status = "approved"
        user = db.query(User).filter(User.id == dermatologist.user_id).first()
        if user:
            user.is_verified = True
        db.commit()
        return {"message": "Dermatologist approved successfully"}
    
    raise HTTPException(status_code=404, detail="Professional profile not found")


@app.put("/admin/reject-professional/{profile_id}")
def reject_professional(
    profile_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == profile_id).first()
    if consultant:
        if consultant.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Already rejected")
        consultant.verification_status = "rejected"
        db.commit()
        return {"message": "Consultant rejected successfully"}
    
    dermatologist = db.query(DermatologistProfile).filter(DermatologistProfile.id == profile_id).first()
    if dermatologist:
        if dermatologist.verification_status == "rejected":
            raise HTTPException(status_code=400, detail="Already rejected")
        dermatologist.verification_status = "rejected"
        db.commit()
        return {"message": "Dermatologist rejected successfully"}
    
    raise HTTPException(status_code=404, detail="Professional profile not found")


# ============ ADMIN - REPORTS ENDPOINT ============

@app.get("/admin/reports/data")
def get_admin_report_data(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from sqlalchemy import func
    
    total_users = db.query(User).count()
    total_customers = db.query(User).filter(User.role == "user").count()
    total_consultants = db.query(User).filter(User.role == "consultant").count()
    total_dermatologists = db.query(User).filter(User.role == "dermatologist").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    
    total_assessments = db.query(SkinAssessment).count()
    
    completed = total_assessments
    in_progress = db.query(SkinProfile).filter(
        SkinProfile.skin_type.isnot(None),
        SkinProfile.skin_type != ""
    ).count()
    not_started = total_users - in_progress
    
    active_routines = db.query(SkincareRoutine).filter(SkincareRoutine.is_active == True).count()
    total_products = db.query(Product).count()
    
    pending_consultant = db.query(ConsultantProfile).filter(
        ConsultantProfile.verification_status == "pending"
    ).count()
    pending_dermatologist = db.query(DermatologistProfile).filter(
        DermatologistProfile.verification_status == "pending"
    ).count()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    users_growth = db.query(
        func.date_trunc('week', User.created_at).label('week'),
        func.count(User.id).label('count')
    ).filter(User.created_at >= thirty_days_ago).group_by('week').order_by('week').all()
    
    growth_data = []
    for row in users_growth:
        growth_data.append({
            "date": row.week.isoformat() if row.week else None,
            "count": row.count
        })
    
    assessments = db.query(SkinAssessment).all()
    concerns_count = {}
    for assessment in assessments:
        if assessment.detected_concerns:
            for concern in assessment.detected_concerns:
                concerns_count[concern] = concerns_count.get(concern, 0) + 1
    
    top_concerns = sorted(concerns_count.items(), key=lambda x: x[1], reverse=True)[:5]
    top_concerns_data = [{"name": c[0], "count": c[1]} for c in top_concerns]
    
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    recent_activity = []
    for user in recent_users:
        recent_activity.append({
            "name": user.name,
            "role": user.role,
            "action": "registered",
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_consultants": total_consultants,
        "total_dermatologists": total_dermatologists,
        "total_admins": total_admins,
        "total_assessments": total_assessments,
        "completed_assessments": completed,
        "in_progress_assessments": in_progress,
        "not_started_assessments": not_started,
        "active_routines": active_routines,
        "total_products": total_products,
        "pending_consultant": pending_consultant,
        "pending_dermatologist": pending_dermatologist,
        "user_growth": growth_data,
        "top_concerns": top_concerns_data,
        "recent_activity": recent_activity
    }


# ============ ADMIN - USER MANAGEMENT ENDPOINTS ============

@app.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    search: Optional[str] = None,
    role_filter: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%"))
        )
    
    if role_filter and role_filter != "All":
        query = query.filter(User.role == role_filter.lower())
    
    users = query.order_by(User.created_at.desc()).all()
    
    result = []
    for user in users:
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
        has_profile = profile is not None
        has_assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == user.id).first() is not None
        
        is_approved = user.is_verified
        if user.role == "consultant":
            prof = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
            if prof:
                is_approved = prof.verification_status == "approved"
        elif user.role == "dermatologist":
            prof = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == user.id).first()
            if prof:
                is_approved = prof.verification_status == "approved"
        
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_approved": is_approved,
            "has_profile": has_profile,
            "has_assessment": has_assessment,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return result


@app.put("/admin/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = not user.is_verified
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_verified else 'deactivated'} successfully",
        "user_id": user.id,
        "is_active": user.is_verified
    }


# ============ ADMIN - ASSESSMENTS ENDPOINT ============

@app.get("/admin/assessments/all")
def get_all_assessments(
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    assessments = db.query(SkinAssessment).order_by(
        SkinAssessment.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for assessment in assessments:
        user = db.query(User).filter(User.id == assessment.user_id).first()
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == assessment.user_id).first()
        result.append({
            "id": assessment.id,
            "user_id": assessment.user_id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "skin_type": profile.skin_type if profile else "Unknown",
            "score": assessment.overall_score,
            "detected_concerns": assessment.detected_concerns,
            "breakdown": assessment.breakdown,
            "created_at": assessment.created_at.isoformat() if assessment.created_at else None
        })
    
    return {
        "total": db.query(SkinAssessment).count(),
        "assessments": result
    }


# ============ ADMIN - ROUTINE MANAGEMENT ENDPOINTS ============

@app.get("/admin/routines/matrix")
def get_routine_matrix(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    steps = db.query(RoutineStepMatrix).order_by(
        RoutineStepMatrix.skin_type,
        RoutineStepMatrix.time_of_day,
        RoutineStepMatrix.step_order
    ).all()
    
    result = []
    for step in steps:
        result.append({
            "id": step.id,
            "skin_type": step.skin_type,
            "time_of_day": step.time_of_day,
            "step_order": step.step_order,
            "step_category": step.step_category,
            "step_description": step.step_description,
            "is_harsh": step.is_harsh
        })
    
    return {"steps": result}


@app.post("/admin/routines/matrix")
def add_routine_step(
    step_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_step = RoutineStepMatrix(
        skin_type=step_data.get("skin_type"),
        time_of_day=step_data.get("time_of_day"),
        step_order=step_data.get("step_order", 1),
        step_category=step_data.get("step_category"),
        step_description=step_data.get("step_description"),
        is_harsh=step_data.get("is_harsh", False)
    )
    db.add(new_step)
    db.commit()
    db.refresh(new_step)
    
    return {"message": "Step added successfully", "step": {
        "id": new_step.id,
        "skin_type": new_step.skin_type,
        "time_of_day": new_step.time_of_day,
        "step_order": new_step.step_order,
        "step_category": new_step.step_category,
        "step_description": new_step.step_description,
        "is_harsh": new_step.is_harsh
    }}


@app.put("/admin/routines/matrix/{step_id}")
def update_routine_step(
    step_id: int,
    step_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    step = db.query(RoutineStepMatrix).filter(RoutineStepMatrix.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    step.skin_type = step_data.get("skin_type", step.skin_type)
    step.time_of_day = step_data.get("time_of_day", step.time_of_day)
    step.step_order = step_data.get("step_order", step.step_order)
    step.step_category = step_data.get("step_category", step.step_category)
    step.step_description = step_data.get("step_description", step.step_description)
    step.is_harsh = step_data.get("is_harsh", step.is_harsh)
    
    db.commit()
    
    return {"message": "Step updated successfully"}


@app.delete("/admin/routines/matrix/{step_id}")
def delete_routine_step(
    step_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    step = db.query(RoutineStepMatrix).filter(RoutineStepMatrix.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    db.delete(step)
    db.commit()
    
    return {"message": "Step deleted successfully"}


# ============ ADMIN - PRODUCT MANAGEMENT ENDPOINTS ============

@app.post("/admin/products")
def add_product(
    product_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_product = Product(
        name=product_data.get("name"),
        brand=product_data.get("brand"),
        category=product_data.get("category"),
        price=product_data.get("price", 0),
        rating=product_data.get("rating", 0),
        reviews_count=product_data.get("reviews_count", 0),
        image_url=product_data.get("image_url", ""),
        description=product_data.get("description", ""),
        ingredients_text=product_data.get("ingredients_text", ""),
        how_to_use=product_data.get("how_to_use", ""),
        source="admin",
        availability="in_stock",
        currency="USD"
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return {"message": "Product added successfully", "product_id": new_product.id}


@app.put("/admin/products/{product_id}")
def update_product(
    product_id: int,
    product_data: dict,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.name = product_data.get("name", product.name)
    product.brand = product_data.get("brand", product.brand)
    product.category = product_data.get("category", product.category)
    product.price = product_data.get("price", product.price)
    product.rating = product_data.get("rating", product.rating)
    product.reviews_count = product_data.get("reviews_count", product.reviews_count)
    product.image_url = product_data.get("image_url", product.image_url)
    product.description = product_data.get("description", product.description)
    product.ingredients_text = product_data.get("ingredients_text", product.ingredients_text)
    product.how_to_use = product_data.get("how_to_use", product.how_to_use)
    
    db.commit()
    
    return {"message": "Product updated successfully"}


@app.delete("/admin/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}


# ============ ADMIN - SYSTEM HEALTH CHECK ============

@app.get("/admin/health")
def get_system_health(
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    current_user = get_current_user(token, db)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    health_status = {
        "database": {"status": "healthy", "message": "Connected"},
        "api": {"status": "healthy", "message": "Running"},
        "storage": {"status": "healthy", "message": "Available"},
        "overall": "healthy"
    }
    
    try:
        db.execute("SELECT 1")
        health_status["database"]["status"] = "healthy"
        health_status["database"]["message"] = "Connected"
    except Exception as e:
        health_status["database"]["status"] = "unhealthy"
        health_status["database"]["message"] = str(e)
        health_status["overall"] = "unhealthy"
    
    try:
        test_path = os.path.join(STATIC_DIR, "health_test.txt")
        with open(test_path, "w") as f:
            f.write("test")
        os.remove(test_path)
        health_status["storage"]["status"] = "healthy"
        health_status["storage"]["message"] = "Available"
    except Exception as e:
        health_status["storage"]["status"] = "unhealthy"
        health_status["storage"]["message"] = str(e)
        health_status["overall"] = "unhealthy"
    
    return health_status


# ============ DATABASE CHECK ENDPOINT ============

@app.get("/api/v1/db-check")
def db_check(db: Session = Depends(get_db)):
    try:
        user_count = db.query(User).count()
        product_count = db.query(Product).count()
        assessment_count = db.query(SkinAssessment).count()
        routine_count = db.query(SkincareRoutine).count()
        review_count = db.query(ReviewRequest).count()
        ai_count = db.query(AIAnalysisResult).count()
        photo_count = db.query(ProgressPhoto).count()
        appointment_count = db.query(Appointment).count()
        
        return {
            "status": "connected",
            "counts": {
                "users": user_count,
                "products": product_count,
                "assessments": assessment_count,
                "routines": routine_count,
                "reviews": review_count,
                "ai_analysis": ai_count,
                "photos": photo_count,
                "appointments": appointment_count
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)