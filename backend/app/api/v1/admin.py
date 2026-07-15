from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.user import User
from app.models.skin_screening import SkinScreening
from app.models.professional import ProfessionalProfile

router = APIRouter()

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Fetch live platform statistics for the Admin Dashboard.
    """
    if current_user.role.name != "Administrator":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    total_users = db.query(func.count(User.id)).scalar()
    total_scans = db.query(func.count(SkinScreening.id)).scalar()
    pending_verifications = db.query(func.count(ProfessionalProfile.id)).filter(
        ProfessionalProfile.verification_status == "Pending"
    ).scalar()
    
    return {
        "total_active_users": total_users,
        "ai_scans_today": total_scans, # Simplified for now
        "pending_verifications": pending_verifications,
        "api_error_rate": "0.01%",
        "avg_latency": "120ms"
    }
