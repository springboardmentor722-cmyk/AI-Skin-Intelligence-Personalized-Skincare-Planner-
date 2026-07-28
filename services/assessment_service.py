"""Database logic for skin_assessments — Milestone 2, Step 3.2 (persistence half)."""

import uuid

from sqlalchemy.orm import Session

from models.assessment import SkinAssessment


def create_assessment(
    db: Session,
    user_id: uuid.UUID,
    overall_score: float,
    detected_concerns: list[dict],
    primary_concern: str | None,
    skin_type: str | None,
    is_highly_sensitive: bool,
    skin_condition_score: float,
    lifestyle_score: float,
    sleep_score: float,
    consistency_score: float,
    hydration_score: float,
) -> SkinAssessment:
    """
    Persist one historical snapshot. Called every time the scoring engine
    runs (both POST /evaluate and GET /score), per the spec: "every time a
    score is calculated, a historical snapshot is saved."
    """
    assessment = SkinAssessment(
        user_id=user_id,
        overall_score=overall_score,
        detected_concerns=detected_concerns,
        primary_concern=primary_concern,
        skin_type=skin_type,
        is_highly_sensitive=is_highly_sensitive,
        skin_condition_score=skin_condition_score,
        lifestyle_score=lifestyle_score,
        sleep_score=sleep_score,
        consistency_score=consistency_score,
        hydration_score=hydration_score,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def get_latest_assessment(db: Session, user_id: uuid.UUID) -> SkinAssessment | None:
    """Most recent assessment snapshot for a user, or None if they haven't taken one yet."""
    return (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )


def get_assessment_history(db: Session, user_id: uuid.UUID, limit: int = 30) -> list[SkinAssessment]:
    """Chronological history of a user's scores, most recent first — for future progress charts."""
    return (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
