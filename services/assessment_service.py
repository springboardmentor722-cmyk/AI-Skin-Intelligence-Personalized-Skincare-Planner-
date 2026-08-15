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


def get_latest_assessments_for_users(db: Session, user_ids: list[uuid.UUID]) -> dict:
    """
    One latest SkinAssessment per user, for the given set of users, in a
    single query. Used to build consultant/dermatologist dashboard
    aggregates (skin-type distribution, top concerns, average score)
    without an N+1 query per client.
    """
    if not user_ids:
        return {}
    rows = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id.in_(user_ids))
        .order_by(SkinAssessment.user_id, SkinAssessment.created_at.desc())
        .all()
    )
    latest_by_user = {}
    for row in rows:
        if row.user_id not in latest_by_user:
            latest_by_user[row.user_id] = row
    return latest_by_user


def get_recent_assessments_for_users(db: Session, user_ids: list[uuid.UUID], limit: int = 5) -> list[SkinAssessment]:
    """Most recent assessments across a set of users — powers a consultant/dermatologist "Recent Assessments" feed."""
    if not user_ids:
        return []
    return (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id.in_(user_ids))
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )


def compute_improvement(db: Session, user_id: uuid.UUID) -> dict | None:
    """
    Skin Improvement Scoring: compares the user's FIRST-ever assessment
    score to their latest, so the platform can show real progress rather
    than just a raw current number. Returns None if fewer than two
    assessments exist yet (there's nothing to compare against).
    """
    first = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.asc())
        .first()
    )
    latest = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if first is None or latest is None or first.id == latest.id:
        return None

    delta_points = round(latest.overall_score - first.overall_score, 1)
    delta_percent = round((delta_points / first.overall_score) * 100, 1) if first.overall_score else 0.0

    if delta_points > 2:
        trend = "Improving"
    elif delta_points < -2:
        trend = "Declining"
    else:
        trend = "Stable"

    return {
        "starting_score": first.overall_score,
        "latest_score": latest.overall_score,
        "delta_points": delta_points,
        "delta_percent": delta_percent,
        "trend": trend,
        "since": first.created_at,
    }


def compute_improvement_for_users(db: Session, user_ids: list[uuid.UUID]) -> dict:
    """Per-user improvement dict for a set of users — used to build an "Avg. Improvement" dashboard stat."""
    return {uid: compute_improvement(db, uid) for uid in user_ids}
