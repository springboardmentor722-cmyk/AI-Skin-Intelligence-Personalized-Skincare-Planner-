from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.skin_screening import SkinScreening
from app.schemas.skin_screening import SkinScreeningCreate, SkinScreeningUpdate

class SkinScreeningRepository:
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SkinScreening]:
        return db.query(SkinScreening).filter(SkinScreening.user_id == user_id).order_by(SkinScreening.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_latest_by_user_id(self, db: Session, user_id: UUID) -> Optional[SkinScreening]:
        return db.query(SkinScreening).filter(SkinScreening.user_id == user_id).order_by(SkinScreening.created_at.desc()).first()
    
    def get_by_id(self, db: Session, id: UUID) -> Optional[SkinScreening]:
        return db.query(SkinScreening).filter(SkinScreening.id == id).first()

    def create(self, db: Session, user_id: UUID, obj_in: SkinScreeningCreate) -> SkinScreening:
        db_obj = SkinScreening(user_id=user_id, **obj_in.model_dump(exclude_unset=True))
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: SkinScreening, obj_in: SkinScreeningUpdate) -> SkinScreening:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: SkinScreening) -> None:
        db.delete(db_obj)
        db.commit()

skin_screening_repo = SkinScreeningRepository()
