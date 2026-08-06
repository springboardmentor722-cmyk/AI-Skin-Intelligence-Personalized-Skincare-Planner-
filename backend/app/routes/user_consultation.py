from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/consultation", tags=["Consultation"])

# REQUEST CONSULTATION
@router.post("/request")
async def request_consultation(
    request_data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """User requests consultation with expert"""
    try:
        request_type = request_data.get("request_type")  # 'dermatologist' or 'consultant'
        
        db.execute(
            text("""
                INSERT INTO consultation_requests 
                (user_id, request_type, status, title, description, requested_date, created_at, updated_at)
                VALUES (:user_id, :type, 'pending', :title, :description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "type": request_type,
                "title": request_data.get("title"),
                "description": request_data.get("description")
            }
        )
        db.commit()
        
        return {"message": "Consultation request submitted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET USER'S CONSULTATION REQUEST STATUS
@router.get("/status")
async def get_consultation_status(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user's consultation request status"""
    try:
        result = db.execute(
            text("""
                SELECT request_id, request_type, status, title, description, 
                       requested_date, responded_date, dermatologist_id, consultant_id
                FROM consultation_requests 
                WHERE user_id = :user_id 
                ORDER BY requested_date DESC LIMIT 1
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            return {"message": "No consultation request yet"}
        
        # Get assigned consultant/dermatologist name
        expert_name = None
        if result[7]:  # dermatologist_id
            expert = db.execute(
                text("SELECT u.first_name, u.last_name FROM dermatologist_profiles dp JOIN users u ON dp.user_id = u.user_id WHERE dp.dermatologist_id = :id"),
                {"id": result[7]}
            ).first()
            if expert:
                expert_name = f"{expert[0]} {expert[1]}"
        elif result[8]:  # consultant_id
            expert = db.execute(
                text("SELECT u.first_name, u.last_name FROM consultant_profiles cp JOIN users u ON cp.user_id = u.user_id WHERE cp.consultant_id = :id"),
                {"id": result[8]}
            ).first()
            if expert:
                expert_name = f"{expert[0]} {expert[1]}"
        
        return {
            "request_id": result[0],
            "type": result[1],
            "status": result[2],
            "title": result[3],
            "description": result[4],
            "requested_date": str(result[5]),
            "responded_date": str(result[6]) if result[6] else None,
            "assigned_expert": expert_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET ASSIGNED CONSULTANT (one-to-one)
@router.get("/assigned-consultant")
async def get_assigned_consultant(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user's assigned consultant"""
    try:
        result = db.execute(
            text("""
                SELECT ca.assignment_id, u.first_name, u.last_name, cp.consultation_fee, cp.specialization
                FROM consultation_assignments ca
                JOIN consultant_profiles cp ON ca.consultant_id = cp.consultant_id
                JOIN users u ON cp.user_id = u.user_id
                WHERE ca.user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            return {"message": "No consultant assigned yet"}
        
        return {
            "assignment_id": result[0],
            "consultant_name": f"{result[1]} {result[2]}",
            "fee": float(result[3]) if result[3] else 0,
            "specialization": result[4]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CANCEL CONSULTATION REQUEST
@router.delete("/request/{request_id}")
async def cancel_request(
    request_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Cancel consultation request"""
    try:
        db.execute(
            text("""
                DELETE FROM consultation_requests 
                WHERE request_id = :request_id AND user_id = :user_id
            """),
            {"request_id": request_id, "user_id": current_user.user_id}
        )
        db.commit()
        
        return {"message": "Request cancelled"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    