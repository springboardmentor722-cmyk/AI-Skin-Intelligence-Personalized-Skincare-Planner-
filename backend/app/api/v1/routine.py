from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.routine import Routine
from app.services.routine import routine_service

router = APIRouter()

@router.get("/recommendations", response_model=Routine)
def get_routine_recommendations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return routine_service.generate_routine(db, current_user.id)
