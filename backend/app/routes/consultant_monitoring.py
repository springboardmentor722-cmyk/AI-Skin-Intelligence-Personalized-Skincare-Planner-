from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    User,
    SkinAssessment,
    SkinProfile,
    Lifestyle,
    ProgressTracking,
    ConsultantRecommendation,
    Notification,
)

from app.schemas import ConsultantRecommendationCreate

router = APIRouter(
    prefix="/consultant-monitoring",
    tags=["Consultant Monitoring"],
)


@router.get("/patients")
def get_monitored_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    assessments = (
        db.query(SkinAssessment)
        .order_by(
            SkinAssessment.user_id,
            desc(SkinAssessment.created_at),
        )
        .all()
    )

    latest_users = {}

    for assessment in assessments:
        if assessment.user_id not in latest_users:
            latest_users[assessment.user_id] = assessment

    patients = []

    for assessment in latest_users.values():

        user = (
            db.query(User)
            .filter(User.id == assessment.user_id)
            .first()
        )

        if not user:
            continue

        score = assessment.overall_score or 0

        if score >= 80:
            risk = "LOW"
        elif score >= 60:
            risk = "MODERATE"
        elif score >= 40:
            risk = "HIGH"
        else:
            risk = "SEVERE"

        patients.append(
            {
                "user_id": user.id,
                "name": user.full_name,
                "email": user.email,
                "overall_score": score,
                "risk": risk,
                "assessment_id": assessment.id,
            }
        )

    risk_order = {
        "SEVERE": 0,
        "HIGH": 1,
        "MODERATE": 2,
        "LOW": 3,
    }

    patients.sort(
        key=lambda x: (
            risk_order[x["risk"]],
            x["overall_score"],
        )
    )

    return patients


@router.get("/patient/{user_id}")
def get_patient_monitoring_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    skin_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == user.id)
        .first()
    )

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user.id)
        .first()
    )

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    progress = (
        db.query(ProgressTracking)
        .filter(ProgressTracking.user_id == user.id)
        .order_by(ProgressTracking.created_at.desc())
        .all()
    )

    return {
        "patient": user,
        "skin_profile": skin_profile,
        "lifestyle": lifestyle,
        "assessment": assessment,
        "progress": progress,
    }


@router.post("/recommend/{user_id}")
def send_recommendation(
    user_id: int,
    recommendation: ConsultantRecommendationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    if not latest_assessment:
        raise HTTPException(
            status_code=404,
            detail="No skin assessment found for this user."
        )

    new_recommendation = ConsultantRecommendation(
        user_id=user_id,
        consultant_id=current_user.id,
        assessment_id=latest_assessment.id,
        recommendation=recommendation.recommendation,
        recommend_dermatologist=recommendation.recommend_dermatologist,
    )

    db.add(new_recommendation)
    notification = Notification(

    dermatologist_id=1,

    title="New Patient Assigned",

    message=f"{user.full_name} has been referred for dermatologist review."

)

    db.add(notification)
    db.commit()
    db.refresh(new_recommendation)

    message = recommendation.recommendation

    if recommendation.recommend_dermatologist:
     message += "\n\nA dermatologist consultation is recommended."

    notification = Notification(
    user_id=user_id,
    title="Consultant Recommendation",
    message=message,
)

    db.add(notification)
    db.commit()

    return {
        "message": "Recommendation sent successfully."
    }

@router.get("/my-recommendations")
def get_my_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    recommendations = (
        db.query(ConsultantRecommendation)
        .filter(
            ConsultantRecommendation.user_id == current_user.id
        )
        .order_by(
            ConsultantRecommendation.created_at.desc()
        )
        .all()
    )

    return recommendations