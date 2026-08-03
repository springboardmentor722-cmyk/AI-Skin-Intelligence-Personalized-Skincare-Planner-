from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from app import models
from app.auth import get_current_user
from app.database import get_db
from app.services.adherence_service import calculate_compliance_rate

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

class ScorePoint(BaseModel):
    score: float
    created_at: datetime

class ComplianceOut(BaseModel):
    rolling_7_days: Optional[float] = None
    rolling_30_days: Optional[float] = None
    rolling_90_days: Optional[float] = None

class PhotoTimelinePoint(BaseModel):
    cloud_url: str
    uploaded_at: datetime
    tag: Optional[str] = None
    skin_health_score: Optional[int] = None

class AnalyticsOut(BaseModel):
    score_timeline: List[ScorePoint]
    compliance: ComplianceOut
    photo_history: List[PhotoTimelinePoint]

@router.get("", response_model=AnalyticsOut)
def get_user_analytics(
    user_id: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id
    if user_id and user_id != current_user.id:
        if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
            raise HTTPException(status_code=403, detail="Not authorized to view other users' analytics.")
        
        # Enforce assignment checks for dermatologist and consultant roles
        if current_user.role == models.RoleEnum.dermatologist:
            patient = db.query(models.User).filter(models.User.id == user_id).first()
            if not patient or patient.assigned_dermatologist_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to view unassigned patient's analytics.")
        elif current_user.role == models.RoleEnum.skincare_consultant:
            patient = db.query(models.User).filter(models.User.id == user_id).first()
            if not patient or not patient.assigned_dermatologist_id:
                raise HTTPException(status_code=403, detail="Not authorized to view unassigned patient's analytics.")
            collab = db.query(models.ProfessionalMessage).filter(
                models.ProfessionalMessage.consultant_id == current_user.id,
                models.ProfessionalMessage.dermatologist_id == patient.assigned_dermatologist_id
            ).first()
            if not collab:
                raise HTTPException(status_code=403, detail="Not authorized to view unassigned patient's analytics.")
                
        target_user_id = user_id

    # 1. Fetch score timeline from SkinAssessment
    assessments = db.query(models.SkinAssessment).filter(
        models.SkinAssessment.user_id == target_user_id
    ).order_by(models.SkinAssessment.created_at.asc()).all()
    
    score_timeline = [
        ScorePoint(score=a.overall_score, created_at=a.created_at) for a in assessments
    ]
    
    # 2. Compute compliance rates
    rolling_7 = calculate_compliance_rate(db, target_user_id, 7)
    rolling_30 = calculate_compliance_rate(db, target_user_id, 30)
    rolling_90 = calculate_compliance_rate(db, target_user_id, 90)
    
    compliance = ComplianceOut(
        rolling_7_days=rolling_7,
        rolling_30_days=rolling_30,
        rolling_90_days=rolling_90
    )
    
    # 3. Fetch progress photos timeline
    photos = db.query(models.ProgressPhoto).filter(
        models.ProgressPhoto.user_id == target_user_id
    ).order_by(models.ProgressPhoto.uploaded_at.asc()).all()
    
    photo_history = [
        PhotoTimelinePoint(
            cloud_url=p.cloud_url,
            uploaded_at=p.uploaded_at,
            tag=p.tag,
            skin_health_score=p.skin_health_score
        ) for p in photos
    ]
    
    return AnalyticsOut(
        score_timeline=score_timeline,
        compliance=compliance,
        photo_history=photo_history
    )
