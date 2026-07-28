"""Personalized Skincare Routine Generation — Milestone 2, Step 4."""

import uuid

from sqlalchemy.orm import Session

from models.routine import SkincareRoutine
from utils.decision_matrix import apply_sensitivity_safety_filter, get_routine_template


def deactivate_active_routine(db: Session, user_id: uuid.UUID) -> None:
    """Soft-deactivate a user's current routine before generating a new one."""
    db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user_id, SkincareRoutine.is_active.is_(True)
    ).update({"is_active": False})
    db.commit()


def generate_routine(
    db: Session,
    user_id: uuid.UUID,
    assessment_id: uuid.UUID,
    skin_type: str,
    is_highly_sensitive: bool,
) -> list[SkincareRoutine]:
    """
    Step 4.1: look up the seeded decision-matrix template for `skin_type`,
    run the sensitivity safety filter over every time-of-day list, and
    persist the resulting steps as fresh SkincareRoutine rows.

    The previous active routine (if any) is deactivated first rather than
    deleted, so routine history is preserved for future progress tracking.
    """
    deactivate_active_routine(db, user_id)

    template = get_routine_template(skin_type)
    rows: list[SkincareRoutine] = []

    for time_of_day, steps in template.items():
        safe_steps = apply_sensitivity_safety_filter(steps, is_highly_sensitive)
        for step_number, category in enumerate(safe_steps, start=1):
            rows.append(
                SkincareRoutine(
                    user_id=user_id,
                    assessment_id=assessment_id,
                    time_of_day=time_of_day,
                    step_number=step_number,
                    step_category=category,
                    is_active=True,
                )
            )

    db.add_all(rows)
    db.commit()
    for row in rows:
        db.refresh(row)
    return rows


def get_active_routine(db: Session, user_id: uuid.UUID) -> list[SkincareRoutine]:
    """Fetch every active step in the user's current routine, ordered for display."""
    return (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == user_id, SkincareRoutine.is_active.is_(True))
        .order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number)
        .all()
    )


def count_active_daily_steps(db: Session, user_id: uuid.UUID) -> int:
    """
    Number of active AM + PM steps (Weekly excluded — it's not a daily
    expectation). Feeds the R_consist component's `expected_count`.
    """
    return (
        db.query(SkincareRoutine)
        .filter(
            SkincareRoutine.user_id == user_id,
            SkincareRoutine.is_active.is_(True),
            SkincareRoutine.time_of_day.in_(["AM", "PM"]),
        )
        .count()
    )
