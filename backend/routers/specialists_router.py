from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import SessionLocal
from models import (
    ConsultantProfile,
    DermatologistProfile,
    ConsultationBooking,
    ConsultantRecommendation,
    User,
    SkinProfile,
    SkinAssessment,
    Lifestyle
)
from role_auth import role_required
from schemas import (
    ConsultantProfileCreate,
    ConsultantProfileResponse,
    DermatologistProfileCreate,
    DermatologistProfileResponse,
    ConsultationBookingCreate,
    ConsultationBookingResponse
)
from utils import get_user_id, get_user_role, get_display_name

router = APIRouter(tags=["Specialists & Consultations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class EscalationRequest(BaseModel):
    escalation_notes: str
    dermatologist_id: Optional[int] = None


class RecommendationSubmitRequest(BaseModel):
    patient_id: int
    recommendation: str
    diagnosis: Optional[str] = "Clinical Dermatological Review"
    morning_cleanser: Optional[str] = None
    morning_serum: Optional[str] = None
    morning_moisturizer: Optional[str] = None
    evening_treatment: Optional[str] = None
    evening_night_cream: Optional[str] = None
    remarks: Optional[str] = None
    follow_up: Optional[str] = None


# Consultant Endpoints
@router.post("/consultant-profile", response_model=ConsultantProfileResponse)
def create_consultant_profile(
    profile: ConsultantProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required(["consultant", "admin"]))
):
    uid = get_user_id(user)
    existing = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == uid).first() if uid else None
    if existing:
        for key, value in profile.dict().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    new_profile = ConsultantProfile(user_id=uid, **profile.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@router.get("/consultants", response_model=List[ConsultantProfileResponse])
def get_all_consultants(db: Session = Depends(get_db)):
    return db.query(ConsultantProfile).all()


# Dermatologist Endpoints
@router.post("/dermatologist-profile", response_model=DermatologistProfileResponse)
def create_dermatologist_profile(
    profile: DermatologistProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required(["dermatologist", "admin"]))
):
    uid = get_user_id(user)
    existing = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == uid).first() if uid else None
    if existing:
        for key, value in profile.dict().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    new_profile = DermatologistProfile(user_id=uid, **profile.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@router.get("/dermatologists", response_model=List[DermatologistProfileResponse])
def get_all_dermatologists(db: Session = Depends(get_db)):
    return db.query(DermatologistProfile).all()


# Booking System & Workflows
@router.post("/bookings", response_model=ConsultationBookingResponse)
def create_booking(
    booking: ConsultationBookingCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required(["user", "admin"]))
):
    uid = get_user_id(user)
    new_booking = ConsultationBooking(
        user_id=uid,
        specialist_id=booking.specialist_id,
        role=booking.role,
        symptoms=booking.symptoms,
        scheduled_date=booking.scheduled_date or datetime.utcnow(),
        status="pending"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/bookings/user/latest")
def get_user_latest_booking(
    db: Session = Depends(get_db),
    user=Depends(role_required(["user", "admin"]))
):
    uid = get_user_id(user)
    booking = db.query(ConsultationBooking).filter(
        ConsultationBooking.user_id == uid
    ).order_by(ConsultationBooking.created_at.desc()).first() if uid else None

    rec = None
    if booking:
        # Check skin profile id for user
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == uid).first() if uid else None
        profile_id = profile.id if profile else uid
        
        rec = db.query(ConsultantRecommendation).filter(
            (ConsultantRecommendation.patient_id == profile_id) | (ConsultantRecommendation.patient_id == uid)
        ).order_by(ConsultantRecommendation.created_at.desc()).first()

    doctor_name = "Dr. Specialist"
    if rec and rec.consultant_id:
        doc = db.query(User).filter(User.id == rec.consultant_id).first()
        if doc:
            doctor_name = f"Dr. {doc.name}"

    formatted_rec = None
    if rec:
        formatted_rec = {
            "id": rec.id,
            "doctor_name": doctor_name,
            "recommendation": rec.recommendation,
            "remarks": rec.recommendation,
            "created_at": rec.created_at,
            "morning": {
                "cleanser": "Gentle Barrier Cleanse",
                "serum": "Niacinamide 10% + Zinc",
                "moisturizer": "Ceramide Hydra Cream"
            },
            "evening": {
                "treatment": "Retinoid 0.5% Night Cream",
                "night_cream": "Deep Barrier Restorative Balm"
            },
            "follow_up": "In 2 Weeks"
        }

    return {
        "booking": booking,
        "recommendation": formatted_rec
    }


# Consultant Dashboard Workflows
@router.get("/bookings/consultant")
def get_consultant_bookings(
    db: Session = Depends(get_db),
    user=Depends(role_required(["consultant", "admin"]))
):
    uid = get_user_id(user)
    bookings = db.query(ConsultationBooking).filter(
        (ConsultationBooking.specialist_id == uid) | (ConsultationBooking.role == "consultant")
    ).order_by(ConsultationBooking.created_at.desc()).all() if uid else []

    results = []
    for b in bookings:
        patient = db.query(User).filter(User.id == b.user_id).first()
        skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == b.user_id).first()
        assess = db.query(SkinAssessment).filter(SkinAssessment.user_id == b.user_id).order_by(SkinAssessment.uploaded_at.desc()).first()
        life = db.query(Lifestyle).filter(Lifestyle.user_id == b.user_id).first()

        results.append({
            "id": b.id,
            "user_id": b.user_id,
            "patient_name": get_display_name(patient, skin_prof),
            "patient_email": patient.email if patient else "",
            "status": b.status,
            "symptoms": b.symptoms,
            "scheduled_date": b.scheduled_date,
            "skin_type": skin_prof.skin_type if skin_prof else "Normal",
            "concerns": skin_prof.concerns if skin_prof else "General",
            "skin_score": assess.skin_score if assess else 78,
            "risk_score": assess.risk_score if assess else 22,
            "sleep_hours": life.sleep_hours if life else 7.5,
            "water_intake": life.water_intake if life else 2.5,
            "escalation_notes": b.escalation_notes
        })

    return results


@router.post("/bookings/{booking_id}/escalate")
def escalate_booking_to_dermatologist(
    booking_id: int,
    req: EscalationRequest,
    db: Session = Depends(get_db),
    user=Depends(role_required(["consultant", "admin"]))
):
    booking = db.query(ConsultationBooking).filter(ConsultationBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "escalated"
    booking.escalation_notes = req.escalation_notes
    if req.dermatologist_id:
        booking.specialist_id = req.dermatologist_id

    db.commit()
    db.refresh(booking)
    return {"message": "Case escalated to Dermatologist successfully", "booking": booking}


# Dermatologist Dashboard Workflows
@router.get("/bookings/dermatologist")
def get_dermatologist_queue(
    db: Session = Depends(get_db),
    user=Depends(role_required(["dermatologist", "admin"]))
):
    uid = get_user_id(user)
    bookings = db.query(ConsultationBooking).filter(
        (ConsultationBooking.specialist_id == uid) |
        (ConsultationBooking.role == "dermatologist") |
        (ConsultationBooking.status == "escalated")
    ).order_by(ConsultationBooking.created_at.desc()).all() if uid else []

    results = []
    for b in bookings:
        patient = db.query(User).filter(User.id == b.user_id).first()
        skin_prof = db.query(SkinProfile).filter(SkinProfile.user_id == b.user_id).first()
        assess = db.query(SkinAssessment).filter(SkinAssessment.user_id == b.user_id).order_by(SkinAssessment.uploaded_at.desc()).first()
        life = db.query(Lifestyle).filter(Lifestyle.user_id == b.user_id).first()

        results.append({
            "id": b.id,
            "user_id": b.user_id,
            "patient_name": get_display_name(patient, skin_prof),
            "patient_email": patient.email if patient else "",
            "status": b.status,
            "symptoms": b.symptoms,
            "scheduled_date": b.scheduled_date,
            "skin_type": skin_prof.skin_type if skin_prof else "Normal",
            "concerns": skin_prof.concerns if skin_prof else "General",
            "allergies": skin_prof.allergies if skin_prof else "None",
            "skin_score": assess.skin_score if assess else 78,
            "risk_score": assess.risk_score if assess else 22,
            "sleep_hours": life.sleep_hours if life else 7.5,
            "water_intake": life.water_intake if life else 2.5,
            "escalation_notes": b.escalation_notes
        })

    return results


# Submit Professional Recommendation (Syncs to User Dashboard)
@router.post("/consultant-recommendations")
def submit_professional_recommendation(
    req: RecommendationSubmitRequest,
    db: Session = Depends(get_db),
    user=Depends(role_required(["consultant", "dermatologist", "admin"]))
):
    uid = get_user_id(user)
    profile = db.query(SkinProfile).filter(
        (SkinProfile.user_id == req.patient_id) | (SkinProfile.id == req.patient_id)
    ).first()
    
    patient_skin_profile_id = profile.id if profile else req.patient_id

    new_rec = ConsultantRecommendation(
        consultant_id=uid,
        patient_id=patient_skin_profile_id,
        recommendation=f"[{req.diagnosis}] {req.recommendation} | Remarks: {req.remarks or 'Follow prescribed regimen.'}"
    )

    # Mark any open booking as completed
    booking = db.query(ConsultationBooking).filter(
        ConsultationBooking.user_id == (profile.user_id if profile else req.patient_id),
        ConsultationBooking.status.in_(["pending", "escalated"])
    ).first()
    if booking:
        booking.status = "completed"

    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return {"message": "Professional Recommendation submitted & synced to User Dashboard!", "recommendation": new_rec}
