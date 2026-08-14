from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from .. import models, schemas, engine, cache
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/scoring", tags=["Skin Health Scoring"])


def _routine_consistency_percent(db: Session, user_id: int) -> float:
    since = datetime.utcnow() - timedelta(days=14)
    logs = (
        db.query(models.ProgressLog)
        .filter(models.ProgressLog.user_id == user_id, models.ProgressLog.log_date >= since)
        .all()
    )
    if not logs:
        return 50.0  # neutral default until the user starts logging
    return sum(l.routine_adherence_percent for l in logs) / len(logs)


@router.post("/compute", response_model=schemas.SkinHealthScoreOut)
def compute_score(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a skin profile first.")

    latest_assessment = (
        db.query(models.SkinAssessment)
        .filter(models.SkinAssessment.user_id == current_user.id)
        .order_by(models.SkinAssessment.created_at.desc())
        .first()
    )
    overall_condition_score = latest_assessment.overall_condition_score if latest_assessment else 30.0

    routine_consistency = _routine_consistency_percent(db, current_user.id)

    result = engine.compute_skin_health_score(overall_condition_score, profile, routine_consistency)
    score_record = models.SkinHealthScore(user_id=current_user.id, **result)
    db.add(score_record)
    db.commit()
    db.refresh(score_record)

    # Cache the freshly computed score so /latest can serve from Redis without hitting the DB.
    cache.cache_set(f"skin_health_score:{current_user.id}", schemas.SkinHealthScoreOut.model_validate(score_record).model_dump(mode="json"), ttl_seconds=600)

    return score_record


@router.get("/latest", response_model=schemas.SkinHealthScoreOut)
def get_latest_score(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cached = cache.cache_get(f"skin_health_score:{current_user.id}")
    if cached:
        return cached

    score = (
        db.query(models.SkinHealthScore)
        .filter(models.SkinHealthScore.user_id == current_user.id)
        .order_by(models.SkinHealthScore.computed_at.desc())
        .first()
    )
    if not score:
        raise HTTPException(status_code=404, detail="No score computed yet. POST /api/scoring/compute first.")

    # warm the cache for next time
    cache.cache_set(f"skin_health_score:{current_user.id}", schemas.SkinHealthScoreOut.model_validate(score).model_dump(mode="json"), ttl_seconds=600)
    return score


@router.get("/history", response_model=List[schemas.SkinHealthScoreOut])
def get_score_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.SkinHealthScore)
        .filter(models.SkinHealthScore.user_id == current_user.id)
        .order_by(models.SkinHealthScore.computed_at.asc())
        .all()
    )
