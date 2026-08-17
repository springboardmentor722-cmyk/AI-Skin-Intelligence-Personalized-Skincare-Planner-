from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_user_role
from datetime import datetime

router = APIRouter(prefix="/api/routine", tags=["Routine"])

# ============================================
# PYDANTIC SCHEMAS
# ============================================
class RoutineStep(BaseModel):
    routine_type: str
    product_name: str = ""
    duration_minutes: int = 0
    description: str = ""

class RoutineUpdate(BaseModel):
    steps: list

# ============================================
# GET USER ROUTINE
# ============================================
@router.get("/")
async def get_routine(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get user's skincare routine"""
    try:
        routine = db.execute(
            text("""
                SELECT routine_id, user_id, routine_type, step_order, product_name, duration_minutes, description
                FROM skincare_routines
                WHERE user_id = :user_id
                ORDER BY step_order ASC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        routine_list = [
            {
                "routine_id": r[0],
                "user_id": r[1],
                "routine_type": r[2],
                "step_order": r[3],
                "product_name": r[4],
                "duration_minutes": r[5],
                "description": r[6]
            }
            for r in routine
        ]
        
        return {"routine": routine_list, "count": len(routine_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADD ROUTINE STEP
# ============================================
@router.post("/")
async def add_routine_step(
    step_data: RoutineStep,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Add a step to user's routine"""
    try:
        # Get max step order
        max_order = db.execute(
            text("SELECT MAX(step_order) FROM skincare_routines WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).scalar()
        
        next_order = (max_order or 0) + 1
        
        db.execute(
            text("""
                INSERT INTO skincare_routines
                (user_id, routine_type, product_name, duration_minutes, description, step_order, created_at, updated_at)
                VALUES (:user_id, :routine_type, :product_name, :duration_minutes, :description, :step_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "routine_type": step_data.routine_type,
                "product_name": step_data.product_name,
                "duration_minutes": step_data.duration_minutes,
                "description": step_data.description,
                "step_order": next_order
            }
        )
        
        db.commit()
        return {"message": "Routine step added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# UPDATE ROUTINE STEP
# ============================================
@router.put("/{routine_id}")
async def update_routine_step(
    routine_id: int,
    step_data: RoutineStep,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Update a routine step"""
    try:
        db.execute(
            text("""
                UPDATE skincare_routines
                SET routine_type = :routine_type,
                    product_name = :product_name,
                    duration_minutes = :duration_minutes,
                    description = :description,
                    updated_at = CURRENT_TIMESTAMP
                WHERE routine_id = :routine_id AND user_id = :user_id
            """),
            {
                "routine_id": routine_id,
                "user_id": current_user.user_id,
                "routine_type": step_data.routine_type,
                "product_name": step_data.product_name,
                "duration_minutes": step_data.duration_minutes,
                "description": step_data.description
            }
        )
        
        db.commit()
        return {"message": "Routine step updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# DELETE ROUTINE STEP
# ============================================
@router.delete("/{routine_id}")
async def delete_routine_step(
    routine_id: int,
    current_user: User = Depends(require_user_role),
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