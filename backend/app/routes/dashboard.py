from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    User,
    Product,
    Ingredient,
    ProgressTracking,
    SkinProfile,
    SkinAssessment,
    Lifestyle,
    UserRecommendation,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# --------------------------
# Admin Dashboard Statistics
# --------------------------
@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):

    users = db.query(User).count()

    products = db.query(Product).count()

    ingredients = db.query(Ingredient).count()

    progress = db.query(ProgressTracking).count()

    return {
        "users": users,
        "products": products,
        "ingredients": ingredients,
        "progress": progress,
    }


# --------------------------
# User Dashboard Statistics
# --------------------------
@router.get("/user-stats")
def user_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    skin_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    assessment_count = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .count()
    )

    progress_count = (
        db.query(ProgressTracking)
        .filter(ProgressTracking.user_id == current_user.id)
        .count()
    )

    recommendation_count = (
    db.query(UserRecommendation)
    .filter(UserRecommendation.user_id == current_user.id)
    .count()
)

    latest_assessment = (
    db.query(SkinAssessment)
    .filter(SkinAssessment.user_id == current_user.id)
    .order_by(SkinAssessment.created_at.desc())
    .first()
)

    return {
    "skin_type": skin_profile.skin_type if skin_profile else "Not Set",

    "recommendations": recommendation_count,

    "assessments": assessment_count,

    "progress": progress_count,

    "overall_score": (
        latest_assessment.overall_score
        if latest_assessment
        else 0
    ),
}

# --------------------------
# Latest Assessment
# --------------------------
@router.get("/latest-assessment")
def get_latest_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    if not assessment:
        return {
            "message": "No assessment found"
        }

    return {
    "skin_type": assessment.skin_type,
    "overall_score": assessment.overall_score,
    "acne_score": assessment.acne_score,
    "pigmentation_score": assessment.pigmentation_score,
    "redness_score": assessment.redness_score,
    "wrinkles_score": assessment.wrinkles_score,
    "dark_circle_score": assessment.dark_circle_score,
    "created_at": assessment.created_at,
}

@router.get("/progress-chart")
def user_progress_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.asc())
        .all()
    )

    return [
        {
            "date": item.created_at.strftime("%d %b"),
            "acne": item.acne_score,
            "pigmentation": item.pigmentation_score,
            "redness": item.redness_score,
            "wrinkles": item.wrinkles_score,
        }
        for item in assessments
    ]

@router.get("/progress-history")
def get_progress_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .all()
    )

    return [
        {
            "id": assessment.id,
            "date": assessment.created_at.strftime("%d %b %Y"),
            "skin_type": assessment.skin_type,
            "overall_score": assessment.overall_score,
            "acne_score": assessment.acne_score,
            "pigmentation_score": assessment.pigmentation_score,
            "redness_score": assessment.redness_score,
            "wrinkles_score": assessment.wrinkles_score,
            "dark_circle_score": assessment.dark_circle_score,
        }
        for assessment in assessments
    ]