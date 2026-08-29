from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.assessment_service.app.schemas.routine import RoutineLogToggle
from services.assessment_service.app.db.dependencies import get_db
from services.assessment_service.app.db.mongo import get_mongo_db
from services.assessment_service.app.business.assessment_service import (
    generate_routine, get_active_routine, toggle_routine_log,
)
from services.auth_service.app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/routine", tags=["Routine"])


@router.post("/generate")
def generate(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    steps = generate_routine(current_user, db)
    return [
        {
            "id": s.id, "time_of_day": s.time_of_day, "step_number": s.step_number,
            "step_category": s.step_category, "step_name": s.step_name, "is_active": s.is_active,
        }
        for s in steps
    ]


@router.get("")
def get_routine(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db=Depends(get_mongo_db),
):
    return get_active_routine(current_user, db, mongo_db)


@router.post("/logs")
def log_step(
    payload: RoutineLogToggle,
    current_user=Depends(get_current_user),
    mongo_db=Depends(get_mongo_db),
):
    return toggle_routine_log(current_user["id"], payload.routine_step_id, payload.completed, mongo_db)
