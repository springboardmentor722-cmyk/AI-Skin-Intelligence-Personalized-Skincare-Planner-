from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.postgres import get_db
from app.models.lifestyle_log import LifestyleLog
from app.models.user import User
from app.schemas.lifestyle import LifestyleLogCreate, LifestyleLogUpdate, LifestyleLogResponse

router = APIRouter(prefix="/lifestyle", tags=["Lifestyle Tracking"])


@router.post("/", response_model=LifestyleLogResponse, status_code=status.HTTP_201_CREATED)
def create_lifestyle_log(
    payload: LifestyleLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log_date = payload.log_date or date.today()

    existing = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == log_date)
        .first()
    )
    if existing:
        # Upsert — update the existing record instead of raising an error
        update_data = payload.model_dump(exclude_unset=True)
        update_data.pop("log_date", None)
        for field, value in update_data.items():
            if hasattr(existing, field) and value is not None:
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    data = payload.model_dump()
    data["log_date"] = log_date

    log = LifestyleLog(user_id=current_user.id, **data)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/", response_model=List[LifestyleLogResponse])
def list_my_lifestyle_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.log_date.desc())
        .all()
    )


@router.get("/latest", response_model=LifestyleLogResponse)
def get_latest_lifestyle_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the most recent lifestyle log for the authenticated user."""
    log = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="No lifestyle log found. Complete the assessment first.")
    return log


@router.get("/{log_date}", response_model=LifestyleLogResponse)
def get_lifestyle_log_by_date(
    log_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == log_date)
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail=f"No lifestyle log found for {log_date}")
    return log


@router.put("/{log_date}", response_model=LifestyleLogResponse)
def update_lifestyle_log(
    log_date: date,
    payload: LifestyleLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == log_date)
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail=f"No lifestyle log found for {log_date}")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return log