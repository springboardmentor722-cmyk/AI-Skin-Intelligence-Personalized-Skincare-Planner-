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
        screening = skin_screening_repo.create(db, user_id, screening_in)
        
        # If frontend passed overall_score, save it to the SkinScore table
        if getattr(screening_in, 'overall_score', None) is not None:
            from app.models.score import SkinScore
            new_score = SkinScore(
                user_id=user_id,
                screening_id=screening.id,
                overall_score=screening_in.overall_score,
                skin_condition_score=screening_in.overall_score,
                lifestyle_score=0,
                sleep_score=0,
                routine_score=0,
                hydration_score=0,
                risk_level="Low"
            )
            db.add(new_score)
            db.commit()
            
        return screening

    def update_screening(self, db: Session, id: UUID, user_id: UUID, screening_in: SkinScreeningUpdate) -> SkinScreening:
        screening = self.get_screening_by_id(db, id, user_id)
        return skin_screening_repo.update(db, screening, screening_in)

    def delete_screening(self, db: Session, id: UUID, user_id: UUID) -> None:
        screening = self.get_screening_by_id(db, id, user_id)
        
        # Manually delete related records that might cause FK constraint errors
        from app.models.score import SkinScore, ScoreBreakdown
        from app.models.routine import SkincareRoutine, RoutineStep
        from app.models.skin_screening import ScreeningHistory
        
        # Delete ScreeningHistory
        db.query(ScreeningHistory).filter(ScreeningHistory.screening_id == id).delete(synchronize_session=False)
        
        # Delete SkinScores and their breakdowns
        scores = db.query(SkinScore).filter(SkinScore.screening_id == id).all()
        for score in scores:
            db.query(ScoreBreakdown).filter(ScoreBreakdown.score_id == score.id).delete(synchronize_session=False)
            db.delete(score)
            
        # Delete SkincareRoutines and their steps
        from app.models.routine import RoutineLog
        from app.models.workflow import ScreeningRequest
        routines = db.query(SkincareRoutine).filter(SkincareRoutine.screening_id == id).all()
        for routine in routines:
            # Nullify any ScreeningRequest referencing this routine to prevent constraint error
            requests = db.query(ScreeningRequest).filter(ScreeningRequest.preliminary_routine_id == routine.id).all()
            for req in requests:
                req.preliminary_routine_id = None
            db.flush()
            
            steps = db.query(RoutineStep).filter(RoutineStep.routine_id == routine.id).all()
            for step in steps:
                db.query(RoutineLog).filter(RoutineLog.step_id == step.id).delete(synchronize_session=False)
                db.delete(step)
            db.delete(routine)
            
        skin_screening_repo.delete(db, screening)

skin_screening_service = SkinScreeningService()
