from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.postgres import get_db
from app.models.user import User, UserRole
from app.models.skin_profile import SkinProfile
from app.models.assessment import SkinAssessment, SkincareRoutine
from app.models.recommendation import ProfessionalRecommendation
from app.models.engagement import Appointment, Notification
from app.models.product import Product
from app.models.consultant_profile import ConsultantProfile
from app.models.dermatologist_profile import DermatologistProfile
from app.models.lifestyle_log import LifestyleLog
from app.services.scoring_engine import calculate_skin_health_score, identify_skin_concerns, get_primary_concern
from app.db.mongo import mongo_db
from datetime import datetime
import io
import os
import uuid
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(tags=["User Portal"])

UPLOAD_DIR = "app/uploads/assessments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. GET /users/profile
@router.get("/users/profile")
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    lifestyle = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id).order_by(LifestyleLog.created_at.desc()).first()
    
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "age": profile.age if profile else None,
        "gender": profile.gender.value if (profile and profile.gender) else None,
        "skin_type": profile.skin_type.value if (profile and profile.skin_type) else None,
        "skin_concerns": profile.skin_concerns if profile else [],
        "allergies": profile.allergies if profile else [],
        "sensitivities": profile.sensitivities if profile else [],
        "has_profile": profile is not None,
        "lifestyle": {
            "water_intake_liters": float(lifestyle.water_intake_liters) if lifestyle else None,
            "sleep_hours": lifestyle.sleep_hours if lifestyle else None,
            "sun_protection_used": lifestyle.sun_protection_used if lifestyle else None
        }
    }

# 1b. PUT /users/profile — update skin profile inline
from pydantic import BaseModel
from typing import Optional, List

class ProfileUpdateRequest(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    skin_type: Optional[str] = None
    skin_concerns: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    sensitivities: Optional[List[str]] = None

@router.put("/users/profile")
def update_user_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.skin_profile import SkinType, Gender
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        profile = SkinProfile(user_id=current_user.id)
        db.add(profile)
    if payload.age is not None:
        profile.age = payload.age
    if payload.gender is not None:
        try:
            profile.gender = Gender(payload.gender)
        except ValueError:
            pass
    if payload.skin_type is not None:
        try:
            profile.skin_type = SkinType(payload.skin_type)
        except ValueError:
            pass
    if payload.skin_concerns is not None:
        profile.skin_concerns = payload.skin_concerns
    if payload.allergies is not None:
        profile.allergies = payload.allergies
    if payload.sensitivities is not None:
        profile.sensitivities = payload.sensitivities
    db.commit()
    db.refresh(profile)
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "age": profile.age,
        "gender": profile.gender.value if profile.gender else None,
        "skin_type": profile.skin_type.value if profile.skin_type else None,
        "skin_concerns": profile.skin_concerns or [],
        "allergies": profile.allergies or [],
        "sensitivities": profile.sensitivities or [],
        "has_profile": True
    }

# 2. POST /skin-analysis/upload
@router.post("/skin-analysis/upload")
def upload_skin_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/uploads/assessments/{filename}"
    
    # Calculate score
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    concerns = profile.skin_concerns if profile else ["acne", "redness"]
    prioritized = identify_skin_concerns({"skin_concerns": concerns})
    primary_concern = get_primary_concern(prioritized)
    
    result = calculate_skin_health_score(
        prioritized_concerns=prioritized,
        sleep_hours=8,
        water_intake_liters=2.0,
        uv_index=3,
        sun_protection_used=True,
        pollution_exposure=False,
        consistency_score=85
    )
    
    # Persist Assessment
    assessment = SkinAssessment(
        user_id=current_user.id,
        overall_score=result["overall_score"],
        score_breakdown=result["breakdown"],
        detected_concerns=prioritized,
        primary_concern=primary_concern,
        image_url=image_url
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {
        "assessment_id": str(assessment.id),
        "overall_score": float(assessment.overall_score),
        "primary_concern": assessment.primary_concern,
        "score_breakdown": assessment.score_breakdown,
        "detected_concerns": assessment.detected_concerns,
        "image_url": assessment.image_url,
        "created_at": assessment.created_at.isoformat()
    }

# 3. GET /skin-analysis/history
@router.get("/skin-analysis/history")
def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessments = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id).order_by(SkinAssessment.created_at.desc()).all()
    return [
        {
            "id": str(a.id),
            "overall_score": float(a.overall_score),
            "primary_concern": a.primary_concern,
            "score_breakdown": a.score_breakdown,
            "detected_concerns": a.detected_concerns,
            "image_url": a.image_url,
            "created_at": a.created_at.isoformat()
        } for a in assessments
    ]

# 4. GET /skin-analysis/latest
@router.get("/skin-analysis/latest")
def get_latest_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id).order_by(SkinAssessment.created_at.desc()).first()
    if not a:
        raise HTTPException(status_code=404, detail="No skin assessment records found.")
    return {
        "id": str(a.id),
        "overall_score": float(a.overall_score),
        "primary_concern": a.primary_concern,
        "score_breakdown": a.score_breakdown,
        "detected_concerns": a.detected_concerns,
        "image_url": a.image_url,
        "created_at": a.created_at.isoformat()
    }

# 5. GET /progress/history
@router.get("/progress/history")
def get_progress_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessments = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id).order_by(SkinAssessment.created_at.asc()).all()
    history = []
    for i, a in enumerate(assessments):
        prev = assessments[i-1] if i > 0 else a
        history.append({
            "date": a.created_at.strftime("%Y-%m-%d"),
            "score": float(a.overall_score),
            "image_url": a.image_url,
            "previous_image_url": prev.image_url,
            "improvement": float(a.overall_score - prev.overall_score)
        })
    return history

# 6. GET /routine
@router.get("/routine")
def get_user_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    routines = db.query(SkincareRoutine).filter(SkincareRoutine.user_id == current_user.id, SkincareRoutine.is_active == True).order_by(SkincareRoutine.step_number).all()
    return [
        {
            "id": str(r.id),
            "time_of_day": r.time_of_day,
            "step_number": r.step_number,
            "step_category": r.step_category
        } for r in routines
    ]

# 7. PUT /routine/status
@router.put("/routine/status")
def update_routine_status(
    step_id: str,
    completed: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    user_id_str = str(current_user.id)
    existing_doc = mongo_db.routine_logs.find_one({"user_id": user_id_str, "log_date": today})

    if not existing_doc:
        mongo_db.routine_logs.insert_one({
            "user_id": user_id_str,
            "log_date": today,
            "completed_steps": [],
            "water_intake_ml": 1500,
            "sleep_hours": 8
        })
        existing_doc = mongo_db.routine_logs.find_one({"user_id": user_id_str, "log_date": today})

    completed_steps = existing_doc.get("completed_steps", [])
    already_logged = any(s["routine_step_id"] == step_id for s in completed_steps)

    if completed and not already_logged:
        completed_steps.append({
            "routine_step_id": step_id,
            "completed_at": datetime.utcnow().isoformat(),
        })
    elif not completed and already_logged:
        completed_steps = [s for s in completed_steps if s["routine_step_id"] != step_id]

    mongo_db.routine_logs.update_one(
        {"user_id": user_id_str, "log_date": today},
        {"$set": {"completed_steps": completed_steps}}
    )
    return {"status": "success", "completed_steps_count": len(completed_steps)}

# 9. GET /consultants
API_BASE_URL = "http://localhost:8000"

@router.get("/consultants")
def list_consultants(db: Session = Depends(get_db)):
    from datetime import date as _date
    today = _date.today()
    users = db.query(User).filter(User.role == UserRole.CONSULTANT, User.status == "approved").all()
    res = []
    for u in users:
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == u.id).first()
        # Try to find any availability today
        try:
            from app.models.availability import ProfessionalAvailability
            has_avail = db.query(ProfessionalAvailability).filter(
                ProfessionalAvailability.professional_id == u.id,
                ProfessionalAvailability.slot_date > today,
                ProfessionalAvailability.is_booked == False
            ).count() > 0
        except Exception:
            has_avail = True
        photo = profile.certificate_url if profile and profile.certificate_url else None
        if photo and not photo.startswith("http"):
            photo = API_BASE_URL + photo
        res.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "specialization": profile.specialization if profile else "Skincare Specialist",
            "experience": profile.years_of_experience if profile else 5,
            "bio": profile.bio if profile else None,
            "certification": profile.certification if profile else None,
            "profile_photo": photo,
            "rating": 4.8,
            "has_availability": has_avail,
        })
    return res

# 10. GET /dermatologists
@router.get("/dermatologists")
def list_dermatologists(db: Session = Depends(get_db)):
    from datetime import date as _date
    today = _date.today()
    users = db.query(User).filter(User.role == UserRole.DERMATOLOGIST, User.status == "approved").all()
    res = []
    for u in users:
        profile = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == u.id).first()
        try:
            from app.models.availability import ProfessionalAvailability
            has_avail = db.query(ProfessionalAvailability).filter(
                ProfessionalAvailability.professional_id == u.id,
                ProfessionalAvailability.slot_date > today,
                ProfessionalAvailability.is_booked == False
            ).count() > 0
        except Exception:
            has_avail = True
        photo = profile.profile_photo_url if profile and profile.profile_photo_url else None
        if photo and not photo.startswith("http"):
            photo = API_BASE_URL + photo
        res.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "specialization": profile.specialization if profile else "Clinical Dermatologist",
            "experience": profile.years_of_experience if profile else 8,
            "clinic": profile.hospital_or_clinic_name if profile else "Skin Care Clinic",
            "bio": profile.bio if profile else None,
            "profile_photo": photo,
            "rating": 4.9,
            "has_availability": has_avail,
        })
    return res

# 11. POST /appointments
@router.post("/appointments")
def book_consultation(
    scheduled_at: str,
    professional_id: str,
    professional_type: str,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        dt = datetime.fromisoformat(scheduled_at)
    except:
        dt = datetime.utcnow()
        
    appt = Appointment(
        user_id=current_user.id,
        professional_id=uuid.UUID(professional_id),
        professional_type=professional_type,
        scheduled_at=dt,
        reason=reason,
        status="pending"
    )
    db.add(appt)
    
    # Trigger notification
    notif = Notification(
        user_id=current_user.id,
        title="Appointment request submitted",
        message=f"Request sent to booking professional.",
        type="appointment",
        is_read=False
    )
    db.add(notif)
    
    db.commit()
    return {"status": "success", "appointment_id": str(appt.id)}

# 12. GET /appointments/user
@router.get("/appointments/user")
def list_user_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appts = db.query(Appointment).filter(Appointment.user_id == current_user.id).order_by(Appointment.scheduled_at.desc()).all()
    res = []
    for a in appts:
        prof = db.query(User).filter(User.id == a.professional_id).first()
        res.append({
            "id": str(a.id),
            "professional_name": prof.full_name if prof else "Expert Consultant",
            "professional_type": a.professional_type,
            "scheduled_at": a.scheduled_at.isoformat(),
            "reason": a.reason,
            "status": a.status
        })
    return res

# 13. GET /doctor/recommendations
@router.get("/doctor/recommendations")
def get_doctor_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recs = db.query(ProfessionalRecommendation).filter(ProfessionalRecommendation.user_id == current_user.id).order_by(ProfessionalRecommendation.created_at.desc()).all()
    result = []
    for r in recs:
        author = db.query(User).filter(User.id == r.author_id).first()
        result.append({
            "id": str(r.id),
            "author_name": author.full_name if author else "Your Specialist",
            "author_role": r.author_role,
            "diagnosis": r.diagnosis,
            "notes": r.notes,
            "recommended_products": r.recommended_products or [],
            "prescription": r.prescription or [],
            "lifestyle_changes": r.lifestyle_changes or [],
            "morning_routine": r.morning_routine or [],
            "evening_routine": r.evening_routine or [],
            "follow_up_date": r.follow_up_date.isoformat() if r.follow_up_date else None,
            "created_at": r.created_at.isoformat()
        })
    return result

# 14. GET /notifications
@router.get("/notifications")
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(15).all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        } for n in notifs
    ]

# 15. GET /reports/{user_id}/download
@router.get("/reports/{user_id}/download")
def download_patient_report(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user access
    if str(current_user.id) != user_id and current_user.role not in (UserRole.ADMIN, UserRole.CONSULTANT, UserRole.DERMATOLOGIST):
        raise HTTPException(status_code=403, detail="Access denied.")
        
    user_obj = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found.")
        
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_obj.id).first()
    assessments = db.query(SkinAssessment).filter(SkinAssessment.user_id == user_obj.id).order_by(SkinAssessment.created_at.desc()).all()
    recs = db.query(ProfessionalRecommendation).filter(ProfessionalRecommendation.user_id == user_obj.id).order_by(ProfessionalRecommendation.created_at.desc()).all()

    # Generate ReportLab PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#8B6FC9'),
        spaceAfter=15
    )
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#E4749B'),
        spaceAfter=10,
        spaceBefore=15
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10.5,
        leading=14,
        spaceAfter=8
    )

    story = []
    
    # Report Title
    story.append(Paragraph("Skin AI Clinical Skincare Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}", body_style))
    story.append(Spacer(1, 15))
    
    # Patient Info
    story.append(Paragraph("Patient Information", section_style))
    story.append(Paragraph(f"<b>Name:</b> {user_obj.full_name}", body_style))
    story.append(Paragraph(f"<b>Email:</b> {user_obj.email}", body_style))
    if profile:
        story.append(Paragraph(f"<b>Age:</b> {profile.age}", body_style))
        story.append(Paragraph(f"<b>Skin Type:</b> {profile.skin_type.upper() if profile.skin_type else 'N/A'}", body_style))
        story.append(Paragraph(f"<b>Concerns:</b> {', '.join(profile.skin_concerns or [])}", body_style))
    
    story.append(Spacer(1, 10))

    # Assessments History
    story.append(Paragraph("AI Skin Diagnostics History", section_style))
    if assessments:
        data = [["Assessment Date", "Skin Score", "Primary Concern"]]
        for a in assessments[:5]:
            data.append([a.created_at.strftime("%Y-%m-%d"), f"{a.overall_score}/100", a.primary_concern or "N/A"])
        
        t = Table(data, colWidths=[150, 150, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#8B6FC9')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#FAF8FC')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#F0E2ED')),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("No assessment records found.", body_style))
        
    story.append(Spacer(1, 10))

    # Professional Recommendations
    story.append(Paragraph("Clinical Treatment Plans & Prescriptions", section_style))
    if recs:
        for r in recs[:3]:
            story.append(Paragraph(f"<b>Diagnosis:</b> {r.diagnosis}", body_style))
            story.append(Paragraph(f"<b>Physician Notes:</b> {r.notes}", body_style))
            if r.prescriptions:
                story.append(Paragraph(f"<b>Prescribed Medication:</b> {r.prescriptions}", body_style))
            story.append(Spacer(1, 5))
    else:
        story.append(Paragraph("No recommendations assigned by clinicians yet.", body_style))

    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=skin_report_{user_id}.pdf"
    })
