"""Product Recommendation controller — Milestone 3, Step 2."""

from sqlalchemy.orm import Session

from models.assessment import SkinAssessment
from models.skin_profile import SkinProfile
from models.user import User
from services import recommendation_service


def get_recommendations_for_user(db: Session, user: User, max_price: float | None) -> dict:
    """
    GET /api/v1/recommendations

    Pulls the user's current concerns (from their latest assessment) and
    skin type + allergies (from their skin profile) automatically — no
    request body needed, since this is their own profile.
    """
    skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    concerns = [c["name"] for c in (latest_assessment.detected_concerns if latest_assessment else []) or []]
    skin_type = (skin_profile.skin_type if skin_profile else None) or (
        latest_assessment.skin_type if latest_assessment else None
    )
    allergy_text = skin_profile.allergies if skin_profile else None

    return recommendation_service.get_recommendations(db, concerns, skin_type, allergy_text, max_price)
