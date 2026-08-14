from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, engine
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/routines", tags=["Routines"])

VALID_TYPES = {"morning", "evening", "weekly", "seasonal"}


@router.post("/generate", response_model=schemas.RoutineOut)
def generate_routine(
    routine_type: str = Query(..., description="morning | evening | weekly | seasonal"),
    season: Optional[str] = Query(None, description="winter | summer | monsoon (for seasonal routines)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if routine_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"routine_type must be one of {VALID_TYPES}")

    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a skin profile before generating a routine.")

    steps = engine.generate_routine(profile, routine_type, season)

    # deactivate old routines of the same type so only one active version exists
    db.query(models.Routine).filter(
        models.Routine.user_id == current_user.id,
        models.Routine.routine_type == routine_type,
        models.Routine.is_active == True,  # noqa: E712
    ).update({"is_active": False})

    routine = models.Routine(user_id=current_user.id, routine_type=routine_type, steps=steps, season=season)
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine


@router.get("/active", response_model=List[schemas.RoutineOut])
def get_active_routines(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Routine)
        .filter(models.Routine.user_id == current_user.id, models.Routine.is_active == True)  # noqa: E712
        .all()
    )


@router.get("/history", response_model=List[schemas.RoutineOut])
def get_routine_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Routine)
        .filter(models.Routine.user_id == current_user.id)
        .order_by(models.Routine.generated_at.desc())
        .all()
    )
