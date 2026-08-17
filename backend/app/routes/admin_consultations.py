from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_admin_role

router = APIRouter(prefix="/api/admin", tags=["Admin Consultations"])

# GET ALL CONSULTATION REQUESTS
@router.get("/consultations/requests")
async def get_all_consultation_requests(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all consultation requests for admin to assign"""
    try:
        requests = db.execute(
            text("""
                SELECT cr.request_id, u.first_name, u.last_name, cr.request_type, 
                       cr.status, cr.title, cr.description, cr.requested_date,
                       cr.assigned_consultant_id, cr.assigned_dermatologist_id
                FROM consultation_requests cr
                JOIN users u ON cr.user_id = u.user_id
                ORDER BY cr.requested_date DESC
            """)
        ).all()
        
        consultation_list = [
            {
                "request_id": r[0],
                "user_name": f"{r[1]} {r[2]}",
                "request_type": r[3],
                "status": r[4],
                "title": r[5],
                "description": r[6],
                "requested_date": str(r[7]),
                "assigned_consultant_id": r[8],
                "assigned_dermatologist_id": r[9]
            }
            for r in requests
        ]
        
        return {
            "consultations": consultation_list,
            "count": len(consultation_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET PENDING REQUESTS (NOT ASSIGNED)
@router.get("/consultations/pending")
async def get_pending_requests(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get consultation requests that need assignment"""
    try:
        requests = db.execute(
            text("""
                SELECT cr.request_id, u.user_id, u.first_name, u.last_name, 
                       cr.request_type, cr.status, cr.title, cr.requested_date
                FROM consultation_requests cr
                JOIN users u ON cr.user_id = u.user_id
                WHERE cr.status = 'pending' AND 
                      cr.assigned_consultant_id IS NULL AND
                      cr.assigned_dermatologist_id IS NULL
                ORDER BY cr.requested_date DESC
            """)
        ).all()
        
        pending_list = [
            {
                "request_id": r[0],
                "user_id": r[1],
                "user_name": f"{r[2]} {r[3]}",
                "request_type": r[4],
                "status": r[5],
                "title": r[6],
                "requested_date": str(r[7])
            }
            for r in requests
        ]
        
        return {
            "pending": pending_list,
            "count": len(pending_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET AVAILABLE CONSULTANTS
@router.get("/consultants")
async def get_available_consultants(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all approved consultants"""
    try:
        consultants = db.execute(
            text("""
                SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone
                FROM users u
                WHERE u.role_id = 3 AND u.is_approved = TRUE AND u.is_active = TRUE
                ORDER BY u.first_name ASC
            """)
        ).all()
        
        consultant_list = [
            {
                "consultant_id": c[0],
                "name": f"{c[1]} {c[2]}",
                "email": c[3],
                "phone": c[4]
            }
            for c in consultants
        ]
        
        return {"consultants": consultant_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET AVAILABLE DERMATOLOGISTS
@router.get("/dermatologists")
async def get_available_dermatologists(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all approved dermatologists"""
    try:
        dermatologists = db.execute(
            text("""
                SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone
                FROM users u
                WHERE u.role_id = 2 AND u.is_approved = TRUE AND u.is_active = TRUE
                ORDER BY u.first_name ASC
            """)
        ).all()
        
        dermatologist_list = [
            {
                "dermatologist_id": d[0],
                "name": f"{d[1]} {d[2]}",
                "email": d[3],
                "phone": d[4]
            }
            for d in dermatologists
        ]
        
        return {"dermatologists": dermatologist_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ASSIGN CONSULTANT TO REQUEST
@router.put("/consultations/{request_id}/assign-consultant/{consultant_id}")
async def assign_consultant(
    request_id: int,
    consultant_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Assign a consultant to a consultation request"""
    try:
        db.execute(
            text("""
                UPDATE consultation_requests
                SET assigned_consultant_id = :consultant_id, 
                    status = 'assigned',
                    updated_at = CURRENT_TIMESTAMP
                WHERE request_id = :request_id
            """),
            {"request_id": request_id, "consultant_id": consultant_id}
        )
        db.commit()
        
        return {"message": "Consultant assigned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ASSIGN DERMATOLOGIST TO REQUEST
@router.put("/consultations/{request_id}/assign-dermatologist/{dermatologist_id}")
async def assign_dermatologist(
    request_id: int,
    dermatologist_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Assign a dermatologist to a consultation request"""
    try:
        db.execute(
            text("""
                UPDATE consultation_requests
                SET assigned_dermatologist_id = :dermatologist_id, 
                    status = 'assigned',
                    updated_at = CURRENT_TIMESTAMP
                WHERE request_id = :request_id
            """),
            {"request_id": request_id, "dermatologist_id": dermatologist_id}
        )
        db.commit()
        
        return {"message": "Dermatologist assigned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET ASSIGNMENT STATS
@router.get("/consultations/stats")
async def get_consultation_stats(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get consultation request statistics"""
    try:
        total = db.execute(text("SELECT COUNT(*) FROM consultation_requests")).scalar()
        pending = db.execute(
            text("SELECT COUNT(*) FROM consultation_requests WHERE status = 'pending'")
        ).scalar()
        assigned = db.execute(
            text("SELECT COUNT(*) FROM consultation_requests WHERE status = 'assigned'")
        ).scalar()
        completed = db.execute(
            text("SELECT COUNT(*) FROM consultation_requests WHERE status = 'completed'")
        ).scalar()
        
        return {
            "total": total,
            "pending": pending,
            "assigned": assigned,
            "completed": completed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))