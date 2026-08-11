from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.progress import Progress
from app.models.user import User
from app.schemas.progress_schema import ProgressCreate
from app.utils.auth import get_current_user, role_required

router = APIRouter(prefix="/progress", tags=["Progress"])

@router.post("/")
def add_progress(progress: ProgressCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required(["USER"]))):
    record = Progress(user_id=current_user.id, **progress.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return {"message": "Progress added successfully.", "progress": record}

@router.get("/")
def get_progress(db: Session = Depends(get_db), current_user: User = Depends(role_required(["USER"]))):
    return db.query(Progress).filter(Progress.user_id == current_user.id).order_by(Progress.assessment_date, Progress.progress_id).all()

@router.put("/{progress_id}")
def update_progress(progress_id: int, data: ProgressCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required(["USER"]))):
    record = db.query(Progress).filter(Progress.progress_id == progress_id, Progress.user_id == current_user.id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Progress record not found")
    for field, value in data.model_dump().items(): setattr(record, field, value)
    db.commit(); db.refresh(record)
    return {"message": "Progress updated successfully.", "progress": record}
