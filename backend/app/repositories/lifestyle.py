from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.lifestyle import LifestyleLog
from app.schemas.lifestyle import LifestyleLogCreate, LifestyleLogUpdate

class LifestyleLogRepository:
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[LifestyleLog]:
        return db.query(LifestyleLog).filter(LifestyleLog.user_id == user_id).order_by(LifestyleLog.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_latest_by_user_id(self, db: Session, user_id: UUID) -> Optional[LifestyleLog]:
        return db.query(LifestyleLog).filter(LifestyleLog.user_id == user_id).order_by(LifestyleLog.created_at.desc()).first()
    
    def get_by_id(self, db: Session, id: UUID) -> Optional[LifestyleLog]:
        return db.query(LifestyleLog).filter(LifestyleLog.id == id).first()

    def create(self, db: Session, user_id: UUID, obj_in: LifestyleLogCreate) -> LifestyleLog:
        db_obj = LifestyleLog(user_id=user_id, **obj_in.model_dump(exclude_unset=True))
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: LifestyleLog, obj_in: LifestyleLogUpdate) -> LifestyleLog:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: LifestyleLog) -> None:
        db.delete(db_obj)
        db.commit()

lifestyle_log_repo = LifestyleLogRepository()
