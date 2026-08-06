from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role
from datetime import datetime

router = APIRouter(prefix="/api/lifestyle", tags=["Lifestyle"])

# ✅ SCHEMA MATCHING DATABASE
class LifestyleLog(BaseModel):
    sleep_duration: float
    water_intake: int
    stress_level: int
    exercise_duration: float = 0
    exercise_type: str = ""
    environmental_exposure: str = ""
    notes: str = ""

# LOG LIFESTYLE
@router.post("/log")
async def log_lifestyle(
    lifestyle_data: LifestyleLog,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Log daily lifestyle data"""
    try:
        db.execute(
            text("""
                INSERT INTO lifestyle_tracking 
                (user_id, tracking_date, sleep_duration, water_intake, 
                 exercise_duration, exercise_type, stress_level, environmental_exposure, notes)
                VALUES 
                (:user_id, CURRENT_DATE, :sleep_duration, :water_intake, 
                 :exercise_duration, :exercise_type, :stress_level, :environmental_exposure, :notes)
            """),
            {
                "user_id": current_user.user_id,
                "sleep_duration": lifestyle_data.sleep_duration,
                "water_intake": lifestyle_data.water_intake,
                "exercise_duration": lifestyle_data.exercise_duration,
                "exercise_type": lifestyle_data.exercise_type,
                "stress_level": lifestyle_data.stress_level,
                "environmental_exposure": lifestyle_data.environmental_exposure,
                "notes": lifestyle_data.notes
            }
        )
        db.commit()
        return {"message": "Lifestyle logged successfully"}
    except Exception as e:
        db.rollback()
        print(f"Database Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log: {str(e)}")

# GET 30-DAY HISTORY
@router.get("/history/30days")
async def get_lifestyle_history(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get last 30 days of lifestyle data"""
    try:
        results = db.execute(
            text("""
                SELECT tracking_date, sleep_duration, water_intake, stress_level, exercise_type
                FROM lifestyle_tracking 
                WHERE user_id = :user_id
                ORDER BY tracking_date DESC
                LIMIT 30
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        history = [
            {
                "date": str(r[0]),
                "sleep": float(r[1]) if r[1] else 0,
                "water": int(r[2]) if r[2] else 0,
                "stress": r[3],
                "exercise": r[4] or ""
            }
            for r in results
        ]
        
        return {"history": history}
    except Exception as e:
        print(f"History Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")