"""Lifestyle service — reusable database logic for the Lifestyle Tracking module."""

import uuid

from sqlalchemy.orm import Session

from models.lifestyle import LifestyleLog
from schemas.lifestyle import LifestyleLogCreate, LifestyleLogUpdate


def list_lifestyle_logs(db: Session, user_id: uuid.UUID) -> list[LifestyleLog]:
    return (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == user_id, LifestyleLog.is_deleted.is_(False))
        .order_by(LifestyleLog.logged_at.desc())
        .all()
    )


def get_lifestyle_log(db: Session, user_id: uuid.UUID, log_id: uuid.UUID) -> LifestyleLog | None:
    return (
        db.query(LifestyleLog)
        .filter(
            LifestyleLog.id == log_id,
            LifestyleLog.user_id == user_id,
            LifestyleLog.is_deleted.is_(False),
        )
        .first()
    )


def create_lifestyle_log(
    db: Session, user_id: uuid.UUID, payload: LifestyleLogCreate
) -> LifestyleLog:
    log = LifestyleLog(user_id=user_id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def update_lifestyle_log(
    db: Session, log: LifestyleLog, payload: LifestyleLogUpdate
) -> LifestyleLog:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


def delete_lifestyle_log(db: Session, log: LifestyleLog) -> None:
    log.is_deleted = True
    db.commit()
