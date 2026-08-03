from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from app import models
from app.database import get_mongo_db

def calculate_compliance_rate(
    db: Session,
    user_id: str,
    window_days: int
) -> float | None:
    mongo = get_mongo_db()
    
    # 1. Get user and registration date
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
        
    user_created = user.created_at.date() if user.created_at else date.today()
    
    # 2. Calculate elapsed days inside the window
    today = date.today()
    start_date = today - timedelta(days=window_days - 1)
    
    # Prorate over actual days since registration if the account is newer than the window
    if user_created > start_date:
        start_date = user_created
        
    days_elapsed = (today - start_date).days + 1
    if days_elapsed <= 0:
        days_elapsed = 1
        
    # 3. Get count of active steps in routine
    active_steps_count = db.query(models.SkincareRoutine).filter(
        models.SkincareRoutine.user_id == user_id,
        models.SkincareRoutine.is_active == True
    ).count()
    
    if active_steps_count == 0:
        return None  # Insufficient data / 0 steps assigned
        
    total_assigned_steps = active_steps_count * days_elapsed
    
    # 4. Count routine check-ins completed in the window
    start_date_str = start_date.isoformat()
    today_str = today.isoformat()
    
    completed_checkins_count = mongo.routine_checkins.count_documents({
        "user_id": user_id,
        "date": {
            "$gte": start_date_str,
            "$lte": today_str
        }
    })
    
    compliance = (completed_checkins_count / total_assigned_steps) * 100.0
    return round(min(100.0, compliance), 1)
