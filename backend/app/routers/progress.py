from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/progress", tags=["Progress Tracking"])


@router.post("/log", response_model=schemas.ProgressLogOut)
def add_progress_log(
    payload: schemas.ProgressLogIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    log = models.ProgressLog(user_id=current_user.id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/history", response_model=List[schemas.ProgressLogOut])
def get_progress_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.ProgressLog)
        .filter(models.ProgressLog.user_id == current_user.id)
        .order_by(models.ProgressLog.log_date.asc())
        .all()
    )


@router.get("/summary")
def get_progress_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    logs = (
        db.query(models.ProgressLog)
        .filter(models.ProgressLog.user_id == current_user.id)
        .order_by(models.ProgressLog.log_date.asc())
        .all()
    )
    scores = (
        db.query(models.SkinHealthScore)
        .filter(models.SkinHealthScore.user_id == current_user.id)
        .order_by(models.SkinHealthScore.computed_at.asc())
        .all()
    )
    if not scores:
        trend = "no_data"
        improvement = 0.0
    elif len(scores) == 1:
        trend = "baseline"
        improvement = 0.0
    else:
        improvement = round(scores[-1].overall_score - scores[0].overall_score, 1)
        trend = "improving" if improvement > 2 else ("declining" if improvement < -2 else "stable")

    avg_adherence = round(sum(l.routine_adherence_percent for l in logs) / len(logs), 1) if logs else 0.0

    return {
        "total_logs": len(logs),
        "average_routine_adherence": avg_adherence,
        "score_trend": trend,
        "score_improvement": improvement,
        "first_score": scores[0].overall_score if scores else None,
        "latest_score": scores[-1].overall_score if scores else None,
    }
