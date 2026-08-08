from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models.routine import RoutineLog, SkincareRoutine, RoutineStep

class ProgressTrackingEngine:
    @staticmethod
    def calculate_adherence(db: Session, user_id: str, days: int) -> float:
        """
        Calculate compliance rate over the last `days` days based on total completed steps vs total assigned.
        Since we might not know exactly how many were 'assigned' historically if the routine changed,
        a simplistic approach: count completed logs in the last `days` days.
        For a more accurate approach, we can compare distinct days a log was made vs total days.
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get logs in timeframe
        logs = db.query(RoutineLog).filter(
            RoutineLog.user_id == user_id,
            RoutineLog.completed_at >= cutoff_date,
            RoutineLog.is_completed == True
        ).all()
        
        # Count distinct days a user checked in
        completed_days = len(set(log.completed_at.date() for log in logs))
        
        # Adherence is completed days / target days
        adherence = (completed_days / days) * 100
        return min(100.0, adherence)
