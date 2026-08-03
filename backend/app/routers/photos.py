from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app import models
from app.auth import get_current_user
from app.database import get_db
from app.services.storage_service import upload_progress_photo

router = APIRouter(prefix="/api/photos", tags=["Progress Photos"])

class ProgressPhotoOut(BaseModel):
    id: str
    user_id: str
    cloud_url: str
    uploaded_at: datetime
    skin_health_score: Optional[int] = None
    tag: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/upload", response_model=ProgressPhotoOut, status_code=201)
def upload_photo(
    file: UploadFile = File(...),
    tag: Optional[str] = Form(None),
    skin_health_score: Optional[int] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    url = upload_progress_photo(file, current_user.id)
    photo = models.ProgressPhoto(
        user_id=current_user.id,
        cloud_url=url,
        skin_health_score=skin_health_score,
        tag=tag
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo

@router.get("/", response_model=list[ProgressPhotoOut])
def get_photos(
    user_id: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Standard users can only view their own photos
    target_user_id = current_user.id
    if user_id and user_id != current_user.id:
        if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
            raise HTTPException(status_code=403, detail="Not authorized to view other users' progress photos.")
        
        # Enforce assignment checks for dermatologist and consultant roles
        if current_user.role == models.RoleEnum.dermatologist:
            patient = db.query(models.User).filter(models.User.id == user_id).first()
            if not patient or patient.assigned_dermatologist_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to view unassigned patient's photos.")
        elif current_user.role == models.RoleEnum.skincare_consultant:
            patient = db.query(models.User).filter(models.User.id == user_id).first()
            if not patient or not patient.assigned_dermatologist_id:
                raise HTTPException(status_code=403, detail="Not authorized to view unassigned patient's photos.")
            collab = db.query(models.ProfessionalMessage).filter(
                models.ProfessionalMessage.consultant_id == current_user.id,
                models.ProfessionalMessage.dermatologist_id == patient.assigned_dermatologist_id
            ).first()
            if not collab:
                raise HTTPException(status_code=403, detail="Not authorized to view unassigned patient's photos.")
                
        target_user_id = user_id

    return db.query(models.ProgressPhoto).filter(models.ProgressPhoto.user_id == target_user_id).order_by(models.ProgressPhoto.uploaded_at.desc()).all()
