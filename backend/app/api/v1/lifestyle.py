from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.schemas.lifestyle import LifestyleLogCreate, LifestyleLogUpdate, LifestyleLogResponse
from app.services.lifestyle import lifestyle_log_service

router = APIRouter()

@router.get("/history", response_model=List[LifestyleLogResponse])
def get_lifestyle_history(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return lifestyle_log_service.get_user_logs(db, current_user.id, skip=skip, limit=limit)

@router.get("/latest", response_model=LifestyleLogResponse)
def get_latest_lifestyle(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return lifestyle_log_service.get_latest_log(db, current_user.id)

@router.get("/{id}", response_model=LifestyleLogResponse)
def get_lifestyle_log(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return lifestyle_log_service.get_log_by_id(db, id, current_user.id)

@router.post("/", response_model=LifestyleLogResponse)
def create_lifestyle_log(
    log_in: LifestyleLogCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return lifestyle_log_service.create_log(db, current_user.id, log_in)

@router.put("/{id}", response_model=LifestyleLogResponse)
def update_lifestyle_log(
    id: UUID,
    log_in: LifestyleLogUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return lifestyle_log_service.update_log(db, id, current_user.id, log_in)

@router.delete("/{id}")
def delete_lifestyle_log(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    lifestyle_log_service.delete_log(db, id, current_user.id)
    return {"message": "Lifestyle log deleted successfully"}
