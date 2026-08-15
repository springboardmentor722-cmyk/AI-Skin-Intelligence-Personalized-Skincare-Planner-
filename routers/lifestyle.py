"""Lifestyle Tracking CRUD routes."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from controllers import lifestyle_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.lifestyle import LifestyleLogCreate, LifestyleLogResponse, LifestyleLogUpdate

router = APIRouter(prefix="/api/lifestyle", tags=["Lifestyle Tracking"])


@router.post("", response_model=LifestyleLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    payload: LifestyleLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return lifestyle_controller.create_my_log(db, current_user, payload)


@router.get("", response_model=list[LifestyleLogResponse])
def list_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return lifestyle_controller.list_my_logs(db, current_user)


@router.get("/{log_id}", response_model=LifestyleLogResponse)
def get_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return lifestyle_controller.get_my_log(db, current_user, log_id)


@router.put("/{log_id}", response_model=LifestyleLogResponse)
def update_log(
    log_id: uuid.UUID,
    payload: LifestyleLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return lifestyle_controller.update_my_log(db, current_user, log_id, payload)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lifestyle_controller.delete_my_log(db, current_user, log_id)
