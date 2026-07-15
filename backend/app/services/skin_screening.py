from typing import List
from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status

from app.repositories.skin_screening import skin_screening_repo
from app.schemas.skin_screening import SkinScreeningCreate, SkinScreeningUpdate
from app.models.skin_screening import SkinScreening

class SkinScreeningService:
    def get_user_screenings(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SkinScreening]:
        return skin_screening_repo.get_by_user_id(db, user_id, skip=skip, limit=limit)
        
    def get_latest_screening(self, db: Session, user_id: UUID) -> SkinScreening:
        screening = skin_screening_repo.get_latest_by_user_id(db, user_id)
        if not screening:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Skin screening not found"
            )
        return screening
        
    def get_screening_by_id(self, db: Session, id: UUID, user_id: UUID) -> SkinScreening:
        screening = skin_screening_repo.get_by_id(db, id)
        if not screening or screening.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Skin screening not found"
            )
        return screening

    def create_screening(self, db: Session, user_id: UUID, screening_in: SkinScreeningCreate) -> SkinScreening:
        return skin_screening_repo.create(db, user_id, screening_in)

    def update_screening(self, db: Session, id: UUID, user_id: UUID, screening_in: SkinScreeningUpdate) -> SkinScreening:
        screening = self.get_screening_by_id(db, id, user_id)
        return skin_screening_repo.update(db, screening, screening_in)

    def delete_screening(self, db: Session, id: UUID, user_id: UUID) -> None:
        screening = self.get_screening_by_id(db, id, user_id)
        skin_screening_repo.delete(db, screening)

skin_screening_service = SkinScreeningService()
