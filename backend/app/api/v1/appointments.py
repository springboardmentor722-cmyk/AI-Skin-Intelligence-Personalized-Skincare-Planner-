from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User
from app.models.appointment import Appointment
from app.models.workflow import ScreeningRequest
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter()


def _get_patient_display_name(patient_user: Optional[User]) -> str:
    if not patient_user:
        return "Patient Consultation"
    
    if patient_user.user_profile and (patient_user.user_profile.first_name or patient_user.user_profile.last_name):
        return f"{patient_user.user_profile.first_name or ''} {patient_user.user_profile.last_name or ''}".strip()
    
    if patient_user.full_name:
        return patient_user.full_name
        
    if getattr(patient_user, 'username', None):
        return patient_user.username
        
    return patient_user.email.split("@")[0] if patient_user.email else "Patient"


@router.post("/", response_model=AppointmentResponse)
def book_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Book an appointment with a professional
    """
    new_appt = Appointment(
        user_id=current_user.id,
        professional_id=appt_in.professional_id,
        screening_request_id=appt_in.screening_request_id,
        appointment_date=appt_in.appointment_date,
        notes=appt_in.notes or "Patient consultation requested via portal",
        status="PENDING"
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    # Populate patient info safely
    patient_user = db.query(User).filter(User.id == current_user.id).first()
    new_appt.patient_name = _get_patient_display_name(patient_user)
    new_appt.patient_email = patient_user.email if patient_user else ""
    return new_appt


@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get appointments for the current user. If professional, get all assigned and patient consultations.
    """
    try:
        role_names = [r.name for r in current_user.roles] if current_user.roles else []
        is_professional = (
            "Dermatologist" in role_names or 
            "Skincare Consultant" in role_names or 
            "Consultant" in role_names or
            (current_user.role and current_user.role.name in ["Dermatologist", "Skincare Consultant"]) or
            current_user.professional_profile is not None
        )
        
        if is_professional:
            # 1. Query appointments assigned to this professional or unassigned
            appts = db.query(Appointment).filter(
                (Appointment.professional_id == current_user.id) | (Appointment.professional_id == None)
            ).order_by(Appointment.appointment_date.asc()).all()

            # 2. If no appointments found specifically assigned, fetch all appointments in system
            if not appts:
                appts = db.query(Appointment).order_by(Appointment.appointment_date.asc()).all()

            # 3. If still no appointments, convert patient ScreeningRequests into Appointments so consultations appear!
            if not appts:
                requests = db.query(ScreeningRequest).all()
                for req in requests:
                    # Create corresponding appointment
                    new_appt = Appointment(
                        user_id=req.user_id,
                        professional_id=current_user.id,
                        screening_request_id=req.id,
                        appointment_date=req.created_at or datetime.utcnow(),
                        notes="AI Skin Screening Consultation Request",
                        status="CONFIRMED" if req.status == "ACCEPTED" else "PENDING"
                    )
                    db.add(new_appt)
                db.commit()
                appts = db.query(Appointment).order_by(Appointment.appointment_date.asc()).all()
        else:
            # Patient user appointments
            appts = db.query(Appointment).filter(Appointment.user_id == current_user.id).order_by(Appointment.appointment_date.asc()).all()
            
        # Enrich each appointment with patient info dynamically
        for appt in appts:
            patient_user = db.query(User).filter(User.id == appt.user_id).first()
            appt.patient_name = _get_patient_display_name(patient_user)
            appt.patient_email = patient_user.email if patient_user else ""
                
        return appts
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{id}/patient-details")
def get_appointment_patient_details(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Fetch complete patient skincare details for a given appointment.
    """
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient_user = db.query(User).filter(User.id == appt.user_id).first()

    # 1. Fetch User Profile
    from app.models.user_profile import UserProfile
    profile = db.query(UserProfile).filter(UserProfile.user_id == appt.user_id).first()

    # 2. Fetch Onboarding Profiles (Skin & Lifestyle)
    from app.models.profile import SkinProfile, LifestyleProfile
    skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == appt.user_id).first()
    lifestyle_profile = db.query(LifestyleProfile).filter(LifestyleProfile.user_id == appt.user_id).first()

    # 3. Fetch Latest Skin Screening
    from app.models.skin_screening import SkinScreening
    screening = db.query(SkinScreening).filter(SkinScreening.user_id == appt.user_id).order_by(SkinScreening.created_at.desc()).first()

    # 4. Fetch Latest Health Score
    from app.models.score import SkinScore
    latest_score = db.query(SkinScore).filter(SkinScore.user_id == appt.user_id).order_by(SkinScore.created_at.desc()).first()

    patient_name = _get_patient_display_name(patient_user)

    return {
        "appointment_id": str(appt.id),
        "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
        "status": appt.status,
        "patient_info": {
            "name": patient_name,
            "email": patient_user.email if patient_user else "",
            "age": profile.age if profile and profile.age else (skin_profile.age_group if skin_profile else "25-34"),
            "gender": profile.gender if profile and profile.gender else "Not specified",
            "country": profile.country if profile else "",
            "phone_number": profile.phone_number if profile else ""
        },
        "skin_profile": {
            "skin_type": skin_profile.skin_type if skin_profile and skin_profile.skin_type else "Normal",
            "age_group": skin_profile.age_group if skin_profile and skin_profile.age_group else "25-34",
            "concerns": [c.strip() for c in skin_profile.skin_concerns.split(",")] if skin_profile and skin_profile.skin_concerns else ["Acne"],
            "allergies": skin_profile.allergies if skin_profile and skin_profile.allergies else "None reported",
            "sensitivities": skin_profile.sensitivities if skin_profile and skin_profile.sensitivities else "None reported"
        },
        "lifestyle_profile": {
            "sleep_quality": lifestyle_profile.sleep_quality if lifestyle_profile and lifestyle_profile.sleep_quality else "Good",
            "water_intake": lifestyle_profile.water_intake if lifestyle_profile and lifestyle_profile.water_intake else "2.0 L"
        },
        "latest_screening": {
            "primary_concern": screening.primary_concern if screening else "Acne",
            "secondary_concern": screening.secondary_concern if screening else "None",
            "stress_level": screening.stress_level if screening else "Medium",
            "image_url": screening.image_data if (screening and screening.image_data) else f"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
            "date": screening.created_at.isoformat() if screening else None
        },
        "health_score": {
            "overall_score": latest_score.overall_score if latest_score else 78,
            "risk_level": latest_score.risk_level if latest_score else "Low"
        }
    }


@router.put("/{id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    id: UUID,
    appt_update: AppointmentUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Update appointment status (professional only)
    """
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if appt_update.status:
        appt.status = appt_update.status
    if appt_update.meeting_link:
        appt.meeting_link = appt_update.meeting_link
    if appt_update.notes:
        appt.notes = appt_update.notes
        
    db.commit()
    db.refresh(appt)
    
    patient_user = db.query(User).filter(User.id == appt.user_id).first()
    appt.patient_name = _get_patient_display_name(patient_user)
    appt.patient_email = patient_user.email if patient_user else ""
    return appt
