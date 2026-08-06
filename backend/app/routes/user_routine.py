from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/routine", tags=["Routine"])

# ✅ PYDANTIC SCHEMA
class RoutineStep(BaseModel):
    routine_step: str
    frequency: str

# GET USER ROUTINE
@router.get("/")
async def get_routine(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user's current routine"""
    try:
        results = db.execute(
            text("""
                SELECT routine_id, routine_step, frequency, step_order
                FROM skincare_routines
                WHERE user_id = :user_id
                ORDER BY step_order ASC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        routine = [
            {
                "routine_id": r[0],
                "routine_step": r[1],
                "frequency": r[2],
                "step_order": r[3]
            }
            for r in results
        ]
        
        return {"routine": routine, "count": len(routine)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ADD ROUTINE STEP
@router.post("/")
async def add_routine_step(
    step_data: RoutineStep,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Add a new routine step"""
    try:
        # Get max order
        result = db.execute(
            text("SELECT MAX(step_order) FROM skincare_routines WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        max_order = (result[0] or 0) + 1
        
        db.execute(
            text("""
                INSERT INTO skincare_routines 
                (user_id, routine_step, frequency, step_order, created_at, updated_at)
                VALUES (:user_id, :step, :freq, :order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "step": step_data.routine_step,
                "freq": step_data.frequency,
                "order": max_order
            }
        )
        
        db.commit()
        return {"message": "Routine step added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding step: {str(e)}")

# UPDATE ROUTINE STEP
@router.put("/{routine_id}")
async def update_routine_step(
    routine_id: int,
    step_data: RoutineStep,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update a routine step"""
    try:
        db.execute(
            text("""
                UPDATE skincare_routines 
                SET routine_step = :step, frequency = :freq, updated_at = CURRENT_TIMESTAMP
                WHERE routine_id = :routine_id AND user_id = :user_id
            """),
            {
                "routine_id": routine_id,
                "user_id": current_user.user_id,
                "step": step_data.routine_step,
                "freq": step_data.frequency
            }
        )
        
        db.commit()
        return {"message": "Routine step updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# DELETE ROUTINE STEP
@router.delete("/{routine_id}")
async def delete_routine_step(
    routine_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Delete a routine step"""
    try:
        db.execute(
            text("DELETE FROM skincare_routines WHERE routine_id = :routine_id AND user_id = :user_id"),
            {"routine_id": routine_id, "user_id": current_user.user_id}
        )
        
        db.commit()
        return {"message": "Routine step deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))