# app/routes/consultant.py
import os
import shutil
import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.postgres import get_db
from app.core.rbac import require_role, require_approved
from app.models.user import User, UserRole
from app.models.consultant_profile import ConsultantProfile
from app.models.engagement import (
    UserConsultantLink,
    Appointment,
    Notification,
    SkinAssessmentReview,
    Consultation,
)
from app.models.skin_profile import SkinProfile
from app.models.assessment import SkinAssessment, SkincareRoutine
from app.models.lifestyle_log import LifestyleLog
from app.models.recommendation import ProfessionalRecommendation
from app.models.progress_log import ProgressLog

router = APIRouter(prefix="/consultant", tags=["consultant"])

UPLOAD_DIR = "app/uploads/consultant"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ConsultantNotesRequest(BaseModel):
    user_id: str
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    recommended_products: Optional[List[dict]] = None
    lifestyle_changes: Optional[List[str]] = None
    morning_routine: Optional[List[dict]] = None
    evening_routine: Optional[List[dict]] = None

class ProductRecommendationPayload(BaseModel):
    clientId: str
    products: List[dict]
    notes: Optional[str] = None
    createdBy: str

class RoutineUpdateRequest(BaseModel):
    morningRoutine: Optional[List[dict]] = None
    eveningRoutine: Optional[List[dict]] = None
    products: Optional[List[dict]] = None
    medications: Optional[List[dict]] = None
    instructions: Optional[str] = None
    reviewDate: Optional[datetime] = None
    status: Optional[str] = None


def _save_file(upload_file: UploadFile) -> str:
    ext = os.path.splitext(upload_file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return f"/uploads/consultant/{filename}"


@router.post("/apply", status_code=status.HTTP_201_CREATED)
def submit_consultant_application(
    specialization: str = Form(...),
    years_of_experience: int = Form(...),
    certification: str = Form(...),
    bio: str = Form(None),
    government_id: UploadFile = File(...),
    certificate: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.CONSULTANT)),
):
    existing = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Application already submitted.")

    profile = ConsultantProfile(
        user_id=user.id,
        specialization=specialization,
        years_of_experience=years_of_experience,
        certification=certification,
        bio=bio,
        government_id_url=_save_file(government_id),
    )
    profile.certificate_url = _save_file(certificate)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {"message": "Application submitted. Awaiting admin approval.", "status": user.status}


@router.get("/my-status")
def my_status(user: User = Depends(require_role(UserRole.CONSULTANT))):
    return {"status": user.status}


@router.get("/my-application")
def my_application(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.CONSULTANT))):
    profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
    if not profile:
        return {"submitted": False}
    return {
        "submitted": True,
        "specialization": profile.specialization,
        "years_of_experience": profile.years_of_experience,
        "certification": profile.certification,
        "admin_notes": profile.admin_notes,
    }


# ============================================================
# NEW DASHBOARD & MANAGEMENT ROUTE INTEGRATIONS (NO MOCK DATA)
# ============================================================

@router.get("/dashboard")
def get_consultant_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    # 1. Total Assigned Users
    links = db.query(UserConsultantLink).filter(UserConsultantLink.consultant_id == current_user.id).all()
    assigned_user_ids = [link.user_id for link in links]
    active_user_ids = [link.user_id for link in links if link.status == "active"]

    # 2. Today's Consultations
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    today_appts = db.query(Appointment).filter(
        Appointment.professional_id == current_user.id,
        Appointment.scheduled_at >= today_start,
        Appointment.scheduled_at <= today_end,
        Appointment.status != "cancelled"
    ).all()

    # 3. Pending Reviews
    pending_reviews = db.query(SkinAssessmentReview).filter(
        SkinAssessmentReview.reviewer_id == current_user.id,
        SkinAssessmentReview.status == "pending"
    ).count()

    # 4. Completed Consultations
    completed_consultations = db.query(Consultation).filter(
        Consultation.professional_id == current_user.id,
        Consultation.status == "completed"
    ).count()

    # 5. Active Skincare Plans
    # A user has an active skincare plan if they have active routines
    active_plans = 0
    if active_user_ids:
        active_plans = db.query(func.count(func.distinct(SkincareRoutine.user_id))).filter(
            SkincareRoutine.user_id.in_(active_user_ids),
            SkincareRoutine.is_active == True
        ).scalar() or 0

    # 6. Average User Improvement
    # Calculate improvement as current_score - initial_score
    total_improvement = 0.0
    improvement_count = 0
    for uid in active_user_ids:
        scores = db.query(SkinAssessment.overall_score).filter(
            SkinAssessment.user_id == uid
        ).order_by(SkinAssessment.created_at.asc()).all()
        if len(scores) >= 2:
            initial = float(scores[0][0])
            latest = float(scores[-1][0])
            total_improvement += (latest - initial)
            improvement_count += 1
    avg_improvement = round(total_improvement / improvement_count, 1) if improvement_count > 0 else 0.0

    # Recent Notifications
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(10).all()

    return {
        "stats": {
            "total_assigned_users": len(links),
            "todays_consultations": len(today_appts),
            "pending_reviews": pending_reviews,
            "completed_consultations": completed_consultations,
            "active_skincare_plans": active_plans,
            "average_user_improvement": avg_improvement,
        },
        "notifications": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifications
        ],
    }


@router.get("/users")
def get_assigned_users(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    # Find all clients linked to this consultant
    links = db.query(UserConsultantLink).filter(UserConsultantLink.consultant_id == current_user.id).all()
    user_ids = [l.user_id for l in links]

    if not user_ids:
        return []

    query = db.query(User).filter(User.id.in_(user_ids))
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    users = query.all()
    results = []

    for u in users:
        # Get skin profile
        sp = db.query(SkinProfile).filter(SkinProfile.user_id == u.id).first()
        # Get latest skin assessment
        latest_assess = db.query(SkinAssessment).filter(
            SkinAssessment.user_id == u.id
        ).order_by(SkinAssessment.created_at.desc()).first()

        # Inferred progress status
        progress_status = "Stable"
        scores = db.query(SkinAssessment.overall_score).filter(SkinAssessment.user_id == u.id).order_by(SkinAssessment.created_at.asc()).all()
        if len(scores) >= 2:
            initial = float(scores[0][0])
            latest = float(scores[-1][0])
            if latest > initial + 5:
                progress_status = "Improving"
            elif latest < initial - 5:
                progress_status = "Needs Attention"

        link_status = next((l.status for l in links if l.user_id == u.id), "pending")

        # Get routine progress
        progress_log = db.query(ProgressLog).filter(ProgressLog.user_id == u.id).order_by(ProgressLog.log_date.desc()).first()
        routine_progress = progress_log.routine_adherence_percent if progress_log and progress_log.routine_adherence_percent is not None else 0

        results.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "age": sp.age if sp else None,
            "gender": sp.gender.value if sp and sp.gender else None,
            "skin_type": sp.skin_type.value if sp and sp.skin_type else None,
            "primary_concern": latest_assess.primary_concern if latest_assess else (sp.skin_concerns[0] if sp and sp.skin_concerns else None),
            "current_score": float(latest_assess.overall_score) if latest_assess else None,
            "progress_status": progress_status,
            "last_assessment_date": latest_assess.created_at if latest_assess else None,
            "status": link_status,
            "routine_progress": routine_progress,
        })

    return results


@router.get("/users/{user_id}")
def get_assigned_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    # Verify link
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == user_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Access denied. User is not assigned to you.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()

    # Lifestyle Logs
    lifestyle = db.query(LifestyleLog).filter(
        LifestyleLog.user_id == user.id
    ).order_by(LifestyleLog.created_at.desc()).first()

    # Assessment History
    assessments = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == user.id
    ).order_by(SkinAssessment.created_at.desc()).all()

    # Routine
    routines = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user.id,
        SkincareRoutine.is_active == True
    ).order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number).all()

    # Uploaded progress images
    progress_logs = db.query(ProgressLog).filter(
        ProgressLog.user_id == user.id
    ).order_by(ProgressLog.log_date.desc()).all()

    # Previous Consultant/Doctor Notes (Professional Recommendations)
    notes = db.query(ProfessionalRecommendation).filter(
        ProfessionalRecommendation.user_id == user.id
    ).order_by(ProfessionalRecommendation.created_at.desc()).all()

    return {
        "user_info": {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "age": profile.age if profile else None,
            "gender": profile.gender.value if profile and profile.gender else None,
            "skin_type": profile.skin_type.value if profile and profile.skin_type else None,
            "allergies": profile.allergies if profile else [],
            "sensitivities": profile.sensitivities if profile else [],
            "skin_concerns": profile.skin_concerns if profile else [],
        },
        "lifestyle": {
            "sleep_hours": lifestyle.sleep_hours if lifestyle else None,
            "water_intake_liters": lifestyle.water_intake_liters if lifestyle else None,
            "exercise_minutes": lifestyle.exercise_minutes if lifestyle else None,
            "stress_level": lifestyle.stress_level if lifestyle else None,
            "environmental_exposure": lifestyle.environmental_exposure if lifestyle else None,
            "last_updated": lifestyle.created_at if lifestyle else None,
        },
        "assessments": [
            {
                "id": str(a.id),
                "overall_score": float(a.overall_score),
                "score_breakdown": a.score_breakdown,
                "detected_concerns": a.detected_concerns,
                "primary_concern": a.primary_concern,
                "created_at": a.created_at,
            }
            for a in assessments
        ],
        "routine": [
            {
                "id": str(r.id),
                "time_of_day": r.time_of_day,
                "step_number": r.step_number,
                "step_category": r.step_category,
            }
            for r in routines
        ],
        "images": [
            {
                "id": str(p.id),
                "log_date": p.log_date,
                "photo_url": p.photo_url,
                "skin_condition_notes": p.skin_condition_notes,
            }
            for p in progress_logs if p.photo_url
        ],
        "recommendations": [
            {
                "id": str(n.id),
                "author_name": db.query(User.full_name).filter(User.id == n.author_id).scalar(),
                "author_role": n.author_role,
                "diagnosis": n.diagnosis,
                "notes": n.notes,
                "recommended_products": n.recommended_products,
                "lifestyle_changes": n.lifestyle_changes,
                "morning_routine": n.morning_routine,
                "evening_routine": n.evening_routine,
                "prescription": n.prescription,
                "created_at": n.created_at,
            }
            for n in notes
        ],
    }


@router.get("/appointments")
def get_consultant_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    appointments = db.query(Appointment).filter(
        Appointment.professional_id == current_user.id
    ).order_by(Appointment.scheduled_at.desc()).all()

    upcoming = []
    completed = []
    cancelled = []

    for a in appointments:
        u = db.query(User).filter(User.id == a.user_id).first()
        appt_data = {
            "id": str(a.id),
            "user_id": str(a.user_id),
            "user_name": u.full_name if u else "Unknown Client",
            "user_email": u.email if u else "",
            "scheduled_at": a.scheduled_at,
            "reason": a.reason,
            "status": a.status,
        }
        if a.status in ("pending", "confirmed"):
            upcoming.append(appt_data)
        elif a.status == "completed":
            completed.append(appt_data)
        elif a.status == "cancelled":
            cancelled.append(appt_data)

    return {
        "upcoming": upcoming,
        "completed": completed,
        "cancelled": cancelled,
    }


@router.post("/notes")
def save_consultant_notes(
    payload: ConsultantNotesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    # Verify client link
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == payload.user_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="User is not assigned to you.")

    # Create new recommendation entry
    rec = ProfessionalRecommendation(
        user_id=payload.user_id,
        author_id=current_user.id,
        author_role="consultant",
        diagnosis=payload.diagnosis,
        notes=payload.notes,
        recommended_products=payload.recommended_products,
        lifestyle_changes=payload.lifestyle_changes,
        morning_routine=payload.morning_routine,
        evening_routine=payload.evening_routine,
    )
    db.add(rec)

    # Notify patient
    db.add(Notification(
        user_id=payload.user_id,
        title="New Consultant Notes Added",
        message=f"Your consultant {current_user.full_name} has updated your skincare routine and added new notes.",
        type="notes"
    ))

    db.commit()
    db.refresh(rec)
    return {"message": "Notes saved successfully.", "recommendation_id": str(rec.id)}

@router.get("/clients/{client_id}")
def get_client_profile(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == client_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="User is not assigned to you.")

    user = db.query(User).filter(User.id == client_id).first()
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == client_id).first()
    latest_assess = db.query(SkinAssessment).filter(SkinAssessment.user_id == client_id).order_by(SkinAssessment.created_at.desc()).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "id": str(user.id),
        "fullName": user.full_name,
        "avatar": user.profile_picture_url,
        "age": profile.age if profile else None,
        "gender": profile.gender.value if profile and profile.gender else None,
        "skinType": profile.skin_type.value if profile and profile.skin_type else None,
        "skinConcerns": profile.skin_concerns if profile else [],
        "allergies": profile.allergies if profile else [],
        "sensitivity": profile.sensitivities if profile else [],
        "currentScore": float(latest_assess.overall_score) if latest_assess else None,
        "lastAssessmentDate": latest_assess.created_at.isoformat() if latest_assess else None
    }

@router.post("/product-recommendations")
def save_product_recommendation(
    payload: ProductRecommendationPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == payload.clientId
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="User is not assigned to you.")

    rec = ProfessionalRecommendation(
        user_id=payload.clientId,
        author_id=current_user.id,
        author_role="consultant",
        notes=payload.notes,
        recommended_products=payload.products,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"message": "Product recommendation saved successfully", "id": str(rec.id)}

@router.get("/clients/{client_id}/ai-suggest")
def get_ai_suggestion(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == client_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="User is not assigned to you.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == client_id).first()
    if not profile:
        return {"suggestion": "General maintenance routine recommended for unprofiled skin."}

    skin_type = profile.skin_type.value if profile.skin_type else "normal"
    concerns = ", ".join(profile.skin_concerns) if profile.skin_concerns else "no specific concerns"
    
    suggestion = f"Recommended because client has {skin_type} skin and {concerns}."
    return {"suggestion": suggestion}

@router.get("/routines/{routine_id}")
def get_routine(
    routine_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == routine_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="User is not assigned to you.")

    user = db.query(User).filter(User.id == routine_id).first()
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == routine_id).first()

    rec = db.query(ProfessionalRecommendation).filter(
        ProfessionalRecommendation.user_id == routine_id,
        ProfessionalRecommendation.author_id == current_user.id
    ).order_by(desc(ProfessionalRecommendation.created_at)).first()

    return {
        "routineId": routine_id,
        "patient": user.full_name if user else "Unknown",
        "skinType": profile.skin_type.value if profile and profile.skin_type else "Unknown",
        "concerns": ", ".join(profile.skin_concerns) if profile and profile.skin_concerns else "None",
        "morningRoutine": rec.morning_routine if rec and rec.morning_routine else ["", "", "", ""],
        "eveningRoutine": rec.evening_routine if rec and rec.evening_routine else ["", "", "", ""],
        "products": rec.recommended_products if rec and rec.recommended_products else [],
        "medications": rec.prescription if rec and rec.prescription else [],
        "instructions": rec.notes if rec and rec.notes else "",
        "reviewDate": rec.follow_up_date.isoformat() if rec and rec.follow_up_date else None,
        "status": "active" if rec else "draft"
    }

@router.put("/routines/{routine_id}")
def update_routine(
    routine_id: str,
    payload: RoutineUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved(UserRole.CONSULTANT)),
):
    link = db.query(UserConsultantLink).filter(
        UserConsultantLink.consultant_id == current_user.id,
        UserConsultantLink.user_id == routine_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="User is not assigned to you.")

    rec = db.query(ProfessionalRecommendation).filter(
        ProfessionalRecommendation.user_id == routine_id,
        ProfessionalRecommendation.author_id == current_user.id
    ).order_by(desc(ProfessionalRecommendation.created_at)).first()

    if not rec:
        rec = ProfessionalRecommendation(
            user_id=routine_id,
            author_id=current_user.id,
            author_role="consultant"
        )
        db.add(rec)
    
    rec.morning_routine = payload.morningRoutine
    rec.evening_routine = payload.eveningRoutine
    rec.recommended_products = payload.products
    rec.prescription = payload.medications
    rec.notes = payload.instructions
    rec.follow_up_date = payload.reviewDate

    db.commit()
    db.refresh(rec)
    return {"message": "Routine updated successfully"}