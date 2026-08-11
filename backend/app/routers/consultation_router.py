from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.consultation import Consultation
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.lifestyle import Lifestyle
from app.models.progress import Progress

from app.schemas.consultation_schema import ConsultationCreate

from app.utils.auth import get_current_user

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

    expert = db.query(User).filter(
        User.id == request.expert_id
    ).first()

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

    consultation = Consultation(
        user_id=current_user.id,
        expert_id=expert.id,
        status="Pending"
    )

    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "message": "Consultation request sent successfully.",
        "consultation_id": consultation.id
    }


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

    if current_user.role != "DERMATOLOGIST":
        raise HTTPException(status_code=403, detail="Dermatologist access required.")

    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.expert_id == current_user.id
    ).first()

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

    return {
        "consultation": consultation,
        "user": user,
        "skin_profile": skin,
        "lifestyle": lifestyle,
        "progress": progress
    }


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

    }
