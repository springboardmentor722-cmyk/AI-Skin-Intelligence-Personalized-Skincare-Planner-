"""
Read-only snapshot of a user's skin profile, lifestyle logs, latest
assessment, progress photos, and adherence — used by the consultant's
Client Profile page and the dermatologist's Patient Record page (the
Milestone 3 "Patient Inspection View").

This is intentionally read-only and lives in its own module rather than
inside profile_service/lifestyle_service, since those are scoped to "the
current user reading their own data" — this one is explicitly "another
role reading someone else's data," and keeping it separate makes that
distinction obvious and makes the ownership check (done in the callers:
booking_service.is_client_assigned_to_consultant /
has_patient_booked_with_dermatologist) easy to audit.
"""

import uuid

from pymongo.database import Database
from sqlalchemy.orm import Session

from models.assessment import SkinAssessment
from models.lifestyle import LifestyleLog
from models.skin_profile import SkinProfile
from models.user import User
from services import assessment_service, progress_service


def get_client_snapshot(db: Session, client_id: uuid.UUID, mongo_db: Database | None = None) -> dict | None:
    user = db.query(User).filter(User.id == client_id, User.is_deleted.is_(False)).first()
    if user is None:
        return None

    skin_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == client_id, SkinProfile.is_deleted.is_(False))
        .first()
    )

    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == client_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    lifestyle_logs = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == client_id, LifestyleLog.is_deleted.is_(False))
        .order_by(LifestyleLog.logged_at.desc())
        .limit(30)
        .all()
    )

    progress_photos = progress_service.list_progress_photos(db, client_id)
    adherence = progress_service.compute_adherence(db, mongo_db, client_id) if mongo_db is not None else None
    improvement = assessment_service.compute_improvement(db, client_id)

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "age": user.age,
        "gender": user.gender,
        "skin_type": skin_profile.skin_type if skin_profile else None,
        "skin_concerns": skin_profile.skin_concerns if skin_profile else None,
        "allergies": skin_profile.allergies if skin_profile else None,
        "skin_photo_url": skin_profile.skin_photo_url if skin_profile else None,
        "latest_overall_score": latest_assessment.overall_score if latest_assessment else None,
        "latest_primary_concern": latest_assessment.primary_concern if latest_assessment else None,
        "detected_concerns": (latest_assessment.detected_concerns if latest_assessment else []) or [],
        "lifestyle_logs": lifestyle_logs,
        "progress_photos": progress_photos,
        "adherence": adherence,
        "improvement": improvement,
    }
