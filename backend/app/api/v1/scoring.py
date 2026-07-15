from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.services.scoring import scoring_service, SkinHealthScore

router = APIRouter()

@router.get("/", response_model=SkinHealthScore)
def get_skin_health_score(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return scoring_service.calculate_score(db, current_user.id)

@router.get("/history")
def get_skin_health_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Mocking historical progress data
    import datetime
    today = datetime.date.today()
    return [
        {"date": (today - datetime.timedelta(days=28)).isoformat(), "overall_score": 62, "adherence": 60},
        {"date": (today - datetime.timedelta(days=21)).isoformat(), "overall_score": 65, "adherence": 70},
        {"date": (today - datetime.timedelta(days=14)).isoformat(), "overall_score": 68, "adherence": 75},
        {"date": (today - datetime.timedelta(days=7)).isoformat(), "overall_score": 75, "adherence": 85},
        {"date": today.isoformat(), "overall_score": scoring_service.calculate_score(db, current_user.id).overall_score, "adherence": 85},
    ]
