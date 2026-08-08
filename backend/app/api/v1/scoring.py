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
    from app.repositories.skin_screening import skin_screening_repo
    from app.models.score import SkinScore
    screenings = skin_screening_repo.get_by_user_id(db, current_user.id, limit=50)
    
    # Sort chronologically
    screenings.sort(key=lambda x: x.created_at)
    
    history = []
    
    for s in screenings:
        # Try to find an actual score for this screening
        score_record = db.query(SkinScore).filter(SkinScore.screening_id == s.id).first()
        
        if score_record:
            overall_score = int(score_record.overall_score)
            adherence = int(score_record.routine_score)
        else:
            # Fallback to mock if no score was saved
            overall_score = 80
            if s.primary_concern: overall_score -= 10
            if s.secondary_concern: overall_score -= 5
            adherence = 60 # Default baseline
            
        history.append({
            "id": str(s.id),
            "date": s.created_at.isoformat(),
            "overall_score": overall_score,
            "adherence": adherence,
            "image_data": None
        })
        
    return history
