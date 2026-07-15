from typing import List
from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status

from app.repositories.lifestyle import lifestyle_log_repo
from app.schemas.lifestyle import LifestyleLogCreate, LifestyleLogUpdate
from app.models.lifestyle import LifestyleLog

class LifestyleLogService:
    def get_user_logs(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[LifestyleLog]:
        return lifestyle_log_repo.get_by_user_id(db, user_id, skip=skip, limit=limit)
        
    def get_latest_log(self, db: Session, user_id: UUID) -> LifestyleLog:
        log = lifestyle_log_repo.get_latest_by_user_id(db, user_id)
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Lifestyle log not found"
            )
        return log
        
    def get_log_by_id(self, db: Session, id: UUID, user_id: UUID) -> LifestyleLog:
        log = lifestyle_log_repo.get_by_id(db, id)
        if not log or log.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Lifestyle log not found"
            )
        return log

    def create_log(self, db: Session, user_id: UUID, log_in: LifestyleLogCreate) -> LifestyleLog:
        return lifestyle_log_repo.create(db, user_id, log_in)

    def update_log(self, db: Session, id: UUID, user_id: UUID, log_in: LifestyleLogUpdate) -> LifestyleLog:
        log = self.get_log_by_id(db, id, user_id)
        return lifestyle_log_repo.update(db, log, log_in)

    def delete_log(self, db: Session, id: UUID, user_id: UUID) -> None:
        log = self.get_log_by_id(db, id, user_id)
        lifestyle_log_repo.delete(db, log)

lifestyle_log_service = LifestyleLogService()
