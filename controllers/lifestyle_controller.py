"""Lifestyle Tracking controller — CRUD orchestration with ownership enforcement."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.user import User
from schemas.lifestyle import LifestyleLogCreate, LifestyleLogUpdate
from services import lifestyle_service


def list_my_logs(db: Session, user: User):
    return lifestyle_service.list_lifestyle_logs(db, user.id)


def create_my_log(db: Session, user: User, payload: LifestyleLogCreate):
    return lifestyle_service.create_lifestyle_log(db, user.id, payload)


def get_my_log(db: Session, user: User, log_id: uuid.UUID):
    log = lifestyle_service.get_lifestyle_log(db, user.id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifestyle log not found")
    return log


def update_my_log(db: Session, user: User, log_id: uuid.UUID, payload: LifestyleLogUpdate):
    log = lifestyle_service.get_lifestyle_log(db, user.id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifestyle log not found")
    return lifestyle_service.update_lifestyle_log(db, log, payload)


def delete_my_log(db: Session, user: User, log_id: uuid.UUID):
    log = lifestyle_service.get_lifestyle_log(db, user.id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifestyle log not found")
    lifestyle_service.delete_lifestyle_log(db, log)
