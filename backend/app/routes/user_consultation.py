from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_user_role
from datetime import datetime

router = APIRouter(prefix="/api/user/consultation", tags=["User Consultation"])

# ============================================
# PYDANTIC SCHEMAS
# ============================================
class ConsultationRequest(BaseModel):
    request_type: str  # "consultant" or "dermatologist"
    title: str
    description: str

# ============================================
# SUBMIT CONSULTATION REQUEST
# ============================================
@router.post("/submit")
async def submit_consultation_request(
    request_data: ConsultationRequest,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """User submits a consultation request"""
    try:
        print(f"Consultation request from user {current_user.user_id}: {request_data.title}")
        
        # Validate request type
        if request_data.request_type not in ["consultant", "dermatologist"]:
            raise HTTPException(
                status_code=400,
                detail="Request type must be 'consultant' or 'dermatologist'"
            )
        
        # Create consultation request
        db.execute(
            text("""
                INSERT INTO consultation_requests
                (user_id, request_type, title, description, status, requested_date, created_at, updated_at)
                VALUES (:user_id, :request_type, :title, :description, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "request_type": request_data.request_type,
                "title": request_data.title,
                "description": request_data.description
            }
        )
        
        db.commit()
        
        return {
            "message": "Consultation request submitted successfully",
            "status": "pending",
            "next_step": "Admin will review and assign a professional"
        }
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error submitting consultation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET USER'S CONSULTATION REQUESTS
# ============================================
@router.get("/my-requests")
async def get_my_requests(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get all consultation requests submitted by the user"""
    try:
        requests = db.execute(
            text("""
                SELECT request_id, user_id, request_type, title, description, status, 
                       requested_date, assigned_consultant_id, assigned_dermatologist_id,
                       responded_date, completion_date
                FROM consultation_requests
                WHERE user_id = :user_id
                ORDER BY requested_date DESC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        request_list = [
            {
                "request_id": r[0],
                "user_id": r[1],
                "request_type": r[2],
                "title": r[3],
                "description": r[4],
                "status": r[5],
                "requested_date": str(r[6]),
                "assigned_consultant_id": r[7],
                "assigned_dermatologist_id": r[8],
                "responded_date": str(r[9]) if r[9] else None,
                "completion_date": str(r[10]) if r[10] else None
            }
            for r in requests
        ]
        
        return {
            "requests": request_list,
            "count": len(request_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET CONSULTATION REQUEST DETAILS
# ============================================
@router.get("/request/{request_id}")
async def get_request_details(
    request_id: int,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get details of a specific consultation request"""
    try:
        request = db.execute(
            text("""
                SELECT request_id, user_id, request_type, title, description, status, 
                       requested_date, assigned_consultant_id, assigned_dermatologist_id
                FROM consultation_requests
                WHERE request_id = :request_id AND user_id = :user_id
            """),
            {"request_id": request_id, "user_id": current_user.user_id}
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        return {
            "request_id": request[0],
            "user_id": request[1],
            "request_type": request[2],
            "title": request[3],
            "description": request[4],
            "status": request[5],
            "requested_date": str(request[6]),
            "assigned_consultant_id": request[7],
            "assigned_dermatologist_id": request[8]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET CONSULTATION RECOMMENDATIONS
# ============================================
@router.get("/get-recommendation")
async def get_recommendations(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get consultant/dermatologist recommendations for the user"""
    try:
        # Get recommendations from consultants or dermatologists
        recommendations = db.execute(
            text("""
                SELECT 
                    cr.recommendation_id,
                    cr.user_id,
                    cr.professional_id,
                    cr.recommendation_text,
                    cr.product_suggestions,
                    cr.routine_suggestions,
                    cr.sent_date,
                    u.first_name,
                    u.last_name,
                    u.role_id
                FROM consultant_recommendations cr
                JOIN users u ON cr.professional_id = u.user_id
                WHERE cr.user_id = :user_id
                ORDER BY cr.sent_date DESC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        recommendation_list = [
            {
                "recommendation_id": r[0],
                "user_id": r[1],
                "professional_id": r[2],
                "professional_name": f"{r[7]} {r[8]}",
                "professional_role": "Consultant" if r[9] == 3 else "Dermatologist" if r[9] == 2 else "Specialist",
                "recommendation_text": r[3],
                "product_suggestions": r[4],
                "routine_suggestions": r[5],
                "sent_date": str(r[6])
            }
            for r in recommendations
        ]
        
        return {
            "recommendations": recommendation_list,
            "count": len(recommendation_list),
            "has_recommendations": len(recommendation_list) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest-recommendation")
async def get_latest_recommendation(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get the most recent recommendation for the user"""
    try:
        recommendation = db.execute(
            text("""
                SELECT 
                    cr.recommendation_id,
                    cr.user_id,
                    cr.professional_id,
                    cr.recommendation_text,
                    cr.product_suggestions,
                    cr.routine_suggestions,
                    cr.sent_date,
                    u.first_name,
                    u.last_name,
                    u.role_id
                FROM consultant_recommendations cr
                JOIN users u ON cr.professional_id = u.user_id
                WHERE cr.user_id = :user_id
                ORDER BY cr.sent_date DESC
                LIMIT 1
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not recommendation:
            return {
                "has_recommendation": False,
                "recommendation": None
            }
        
        return {
            "has_recommendation": True,
            "recommendation": {
                "recommendation_id": recommendation[0],
                "user_id": recommendation[1],
                "professional_id": recommendation[2],
                "professional_name": f"{recommendation[7]} {recommendation[8]}",
                "professional_role": "Consultant" if recommendation[9] == 3 else "Dermatologist",
                "recommendation_text": recommendation[3],
                "product_suggestions": recommendation[4],
                "routine_suggestions": recommendation[5],
                "sent_date": str(recommendation[6])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ============================================
# GET CONSULTATION STATUS
# ============================================
@router.get("/status/{request_id}")
async def get_consultation_status(
    request_id: int,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get the status of a consultation request"""
    try:
        status_info = db.execute(
            text("""
                SELECT status, assigned_consultant_id, assigned_dermatologist_id, 
                       completion_date, responded_date
                FROM consultation_requests
                WHERE request_id = :request_id AND user_id = :user_id
            """),
            {"request_id": request_id, "user_id": current_user.user_id}
        ).first()
        
        if not status_info:
            raise HTTPException(status_code=404, detail="Request not found")
        
        status = status_info[0]
        consultant_assigned = status_info[1] is not None
        dermatologist_assigned = status_info[2] is not None
        completed = status_info[3] is not None
        responded = status_info[4] is not None
        
        # Determine progress
        if status == "pending":
            progress = "Awaiting admin assignment"
        elif status == "assigned" and not responded:
            progress = "Professional reviewing your case"
        elif status == "completed":
            progress = "Treatment plan ready"
        elif responded:
            progress = "Professional has responded"
        else:
            progress = "In progress"
        
        return {
            "status": status,
            "progress": progress,
            "consultant_assigned": consultant_assigned,
            "dermatologist_assigned": dermatologist_assigned,
            "completed": completed,
            "responded": responded
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# CANCEL CONSULTATION REQUEST
# ============================================
@router.put("/request/{request_id}/cancel")
async def cancel_consultation_request(
    request_id: int,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """User can cancel their pending consultation request"""
    try:
        # Check if request exists and belongs to user
        request = db.execute(
            text("""
                SELECT status FROM consultation_requests
                WHERE request_id = :request_id AND user_id = :user_id
            """),
            {"request_id": request_id, "user_id": current_user.user_id}
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        if request[0] != "pending":
            raise HTTPException(
                status_code=400,
                detail="Can only cancel pending requests"
            )
        
        # Delete the request
        db.execute(
            text("DELETE FROM consultation_requests WHERE request_id = :request_id"),
            {"request_id": request_id}
        )
        db.commit()
        
        return {"message": "Consultation request cancelled"}
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    