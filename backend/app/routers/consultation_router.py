from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.consultation import Consultation
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.lifestyle import Lifestyle
from app.models.progress import Progress

from app.schemas.consultation_schema import ConsultationCreate, ConsultantReviewCreate

from app.utils.auth import get_current_user
from app.services.notification_service import create_notification

router = APIRouter(
    prefix="/consultations",
    tags=["Consultations"]
)


# ==========================================
# USER SEND CONSULTATION REQUEST
# ==========================================

@router.post("/request")
def send_request(
    request: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "USER":
        raise HTTPException(status_code=403, detail="Only users can request consultations.")

    if request.expert_id is None:
        expert = db.query(User).filter(User.id == 13, User.role == "CONSULTANT").first()
        if expert is None:
            raise HTTPException(status_code=503, detail="The system consultant is not available yet.")
    else:
        expert = db.query(User).filter(User.id == request.expert_id).first()

    if expert is None:
        raise HTTPException(
            status_code=404,
            detail="Expert not found"
        )

    if expert.role not in ["CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(
            status_code=400,
            detail="Selected user is not an expert."
        )

    if expert.role == "CONSULTANT" and expert.id != 13:
        raise HTTPException(status_code=409, detail="Consultant requests are always assigned to the system consultant.")

    if expert.role == "DERMATOLOGIST":
        referral = db.query(Consultation).filter(
            Consultation.user_id == current_user.id,
            Consultation.expert_id == 13,
            Consultation.requires_dermatologist.is_(True)
        ).first()
        if referral is None:
            raise HTTPException(status_code=403, detail="A consultant recommendation is required before requesting a dermatologist review.")

    if expert.role == "CONSULTANT":
        active = db.query(Consultation).filter(
            Consultation.user_id == current_user.id,
            Consultation.expert_id == 13,
            Consultation.status.in_(["Pending", "In Review"])
        ).order_by(Consultation.id.desc()).first()
        if active:
            return {"message": "You already have an active consultant request.", "consultation_id": active.id, "status": active.status}

    consultation = Consultation(
        user_id=current_user.id,
        expert_id=expert.id,
        status="Pending"
    )

    db.add(consultation)
    if expert.role == "CONSULTANT":
        create_notification(db, current_user.id, "Consultation Request Submitted", "Your consultation request has been submitted to our skincare consultant.", "consultation_request")
        create_notification(db, 13, "New Consultation Request", "A user has submitted a new skincare consultation request.", "consultation_request")
    else:
        create_notification(db, expert.id, "New Dermatologist Referral", "A consultant has referred a user for dermatologist review.", "dermatologist_referral")
    db.commit()
    db.refresh(consultation)

    return {
        "message": "Consultation request sent successfully.",
        "consultation_id": consultation.id
    }


@router.get("/consultant")
def get_system_consultant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consultant = db.query(User).filter(User.role == "CONSULTANT").first()
    if consultant is None:
        raise HTTPException(status_code=404, detail="The system consultant is not available yet.")
    return consultant


# ==========================================
# USER VIEW ALL REQUESTS
# ==========================================

@router.get("/my-requests")
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return db.query(Consultation).filter(
        Consultation.user_id == current_user.id
    ).all()


# ==========================================
# CONSULTANT / DERMATOLOGIST
# VIEW PENDING REQUESTS
# ==========================================

@router.get("/pending")
def pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in ["CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(status_code=403, detail="Professional access required.")

    return db.query(Consultation).filter(
        Consultation.expert_id == current_user.id,
        Consultation.status == "Pending"
    ).all()


# ==========================================
# ACCEPT REQUEST
# ==========================================

@router.put("/accept/{id}")
def accept_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in ["CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(status_code=403, detail="Professional access required.")

    consultation = db.query(Consultation).filter(Consultation.id == id, Consultation.expert_id == current_user.id).first()

    if consultation is None:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    consultation.status = "Accepted"

    db.commit()

    return {
        "message": "Consultation accepted."
    }


# ==========================================
# REJECT REQUEST
# ==========================================

@router.put("/reject/{id}")
def reject_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in ["CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(status_code=403, detail="Professional access required.")

    consultation = db.query(Consultation).filter(Consultation.id == id, Consultation.expert_id == current_user.id).first()

    if consultation is None:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    consultation.status = "Rejected"

    db.commit()

    return {
        "message": "Request rejected."
    }


# ==========================================
# VIEW COMPLETE USER CASE
# ==========================================

@router.get("/case/{consultation_id}")
def get_case_details(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in ["DERMATOLOGIST", "CONSULTANT"]:
        raise HTTPException(status_code=403, detail="Professional access required.")

    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.expert_id == current_user.id).first()

    if consultation is None:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    user = db.query(User).filter(
        User.id == consultation.user_id
    ).first()

    skin = db.query(SkinProfile).filter(
        SkinProfile.user_id == consultation.user_id
    ).first()

    lifestyle = db.query(Lifestyle).filter(
        Lifestyle.user_id == consultation.user_id
    ).first()

    progress = db.query(Progress).filter(
        Progress.user_id == consultation.user_id
    ).order_by(Progress.assessment_date, Progress.progress_id).all()
    from app.models.skin_assessment import SkinAssessment
    assessment = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == consultation.user_id
    ).order_by(SkinAssessment.assessment_date.desc(), SkinAssessment.assessment_id.desc()).first()

    return {
        "consultation": consultation,
        "user": user,
        "skin_profile": skin,
        "lifestyle": lifestyle,
        "progress": progress,
        "ai_assessment": assessment,
        "consultation_history": db.query(Consultation).filter(Consultation.user_id == consultation.user_id).order_by(Consultation.id.desc()).all()
    }


@router.put("/{consultation_id}/review")
def submit_consultant_review(
    consultation_id: int,
    data: ConsultantReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "CONSULTANT" or current_user.id != 13:
        raise HTTPException(status_code=403, detail="Only the system consultant can submit consultant reviews.")
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.expert_id == 13).first()
    if consultation is None:
        raise HTTPException(status_code=404, detail="Consultation not found")
    from datetime import datetime, timezone
    was_referred = consultation.requires_dermatologist
    for field, value in data.model_dump().items():
        setattr(consultation, field, value)
    consultation.status = "Dermatologist Recommended" if data.requires_dermatologist else "Completed"
    consultation.reviewed_at = datetime.now(timezone.utc)
    create_notification(db, consultation.user_id, "Consultation Reviewed", "Your skincare consultation has been reviewed. Please check your consultation details.", "consultation_review")
    if data.requires_dermatologist and not was_referred:
        create_notification(db, consultation.user_id, "Dermatologist Recommended", "Our consultant recommends that you consult a dermatologist. Please check your consultation for the next step.", "dermatologist_recommended")
    db.commit(); db.refresh(consultation)
    return {"message": "Consultant review saved.", "consultation": consultation}


@router.get("/consultant/dashboard")
def consultant_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "CONSULTANT" or current_user.id != 13:
        raise HTTPException(status_code=403, detail="System consultant access required.")
    consultations = db.query(Consultation).filter(Consultation.expert_id == 13).order_by(Consultation.id.desc()).all()
    from app.models.skin_assessment import SkinAssessment
    clients = []
    seen = set()
    for consultation in consultations:
        if consultation.user_id in seen: continue
        seen.add(consultation.user_id)
        user = db.query(User).filter(User.id == consultation.user_id).first()
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == consultation.user_id).first()
        assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == consultation.user_id).order_by(SkinAssessment.assessment_date.desc()).first()
        clients.append({"consultation_id": consultation.id, "user_id": consultation.user_id, "name": user.name if user else "Unknown", "email": user.email if user else "", "skin_type": profile.skin_type if profile else None, "skin_concerns": profile.skin_concerns if profile else None, "skin_score": assessment.final_score if assessment else None, "assessment_date": assessment.assessment_date if assessment else None, "status": consultation.status, "requires_dermatologist": consultation.requires_dermatologist})
    return {"total_assigned_users": len(clients), "pending_requests": sum(c.status == "Pending" for c in consultations), "completed_reviews": sum(c.status == "Completed" for c in consultations), "dermatologist_recommended": sum(c.requires_dermatologist for c in consultations), "clients": clients}


# ==========================================
# SAVE RECOMMENDATION
# ==========================================

@router.put("/recommend/{consultation_id}")
def save_recommendation(
    consultation_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in ["CONSULTANT", "DERMATOLOGIST"]:
        raise HTTPException(status_code=403, detail="Professional access required.")

    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.expert_id == current_user.id
    ).first()

    if consultation is None:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    consultation.recommendation = data["recommendation"]

    consultation.status = "Completed"

    db.commit()

    return {
        "message": "Recommendation saved successfully."
    }


# ==========================================
# USER VIEW CONSULTATION RESULT
# ==========================================

@router.get("/my-consultation")
def my_consultation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    consultation = db.query(Consultation).filter(
        Consultation.user_id == current_user.id
    ).order_by(
        Consultation.id.desc()
    ).first()

    if consultation is None:
        return {
            "message": "No consultation found."
        }

    expert = db.query(User).filter(
        User.id == consultation.expert_id
    ).first()

    return {

        "status": consultation.status,

        "recommendation": consultation.recommendation,

        "expert_name": expert.name if expert else "-",

        "expert_role": expert.role if expert else "-"
        ,"consultant_notes": consultation.consultant_notes
        ,"progress_observations": consultation.progress_observations
        ,"routine_suggestions": consultation.routine_suggestions
        ,"follow_up_suggestion": consultation.follow_up_suggestion
        ,"requires_dermatologist": consultation.requires_dermatologist
        ,"consultation_id": consultation.id

    }
