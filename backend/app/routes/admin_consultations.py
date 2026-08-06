from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role
from datetime import datetime

router = APIRouter(prefix="/api/admin/consultations", tags=["Admin Consultations"])

# GET ALL CONSULTATION REQUESTS
@router.get("/requests")
async def get_all_consultation_requests(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all consultation requests for admin to manage"""
    if current_user.role_id != 4:
        raise HTTPException(status_code=403, detail="Only admins can access this")
    
    try:
        result = db.execute(
            text("""
                SELECT 
                  cr.request_id, cr.user_id, cr.title, cr.description,
                  cr.status, cr.requested_date,
                  u.first_name, u.last_name, u.email,
                  ca.consultant_id, ca.dermatologist_id
                FROM consultation_requests cr
                JOIN users u ON cr.user_id = u.user_id
                LEFT JOIN consultation_assignments ca ON cr.user_id = ca.user_id
                ORDER BY cr.requested_date DESC
            """)
        ).fetchall()
        
        consultations = []
        for row in result:
            consultations.append({
                'request_id': row[0],
                'user_id': row[1],
                'title': row[2],
                'description': row[3],
                'status': row[4],
                'requested_date': str(row[5]),
                'user_name': f"{row[6]} {row[7]}",
                'user_email': row[8],
                'assigned_consultant_id': row[9],
                'assigned_dermatologist_id': row[10]
            })
        
        return {'consultations': consultations, 'count': len(consultations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ASSIGN CONSULTANT TO USER
@router.post("/assign-consultant")
async def assign_consultant(
    data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Admin assigns consultant to a user"""
    if current_user.role_id != 4:
        raise HTTPException(status_code=403, detail="Only admins can assign")
    
    try:
        user_id = data.get('user_id')
        consultant_id = data.get('consultant_id')
        
        # Check if already assigned
        existing = db.execute(
            text("SELECT assignment_id FROM consultation_assignments WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).first()
        
        if existing:
            # Update
            db.execute(
                text("""
                    UPDATE consultation_assignments 
                    SET consultant_id = :consultant_id, assignment_type = 'consultant'
                    WHERE user_id = :user_id
                """),
                {"consultant_id": consultant_id, "user_id": user_id}
            )
        else:
            # Create new
            db.execute(
                text("""
                    INSERT INTO consultation_assignments 
                    (user_id, consultant_id, assignment_type)
                    VALUES (:user_id, :consultant_id, 'consultant')
                """),
                {"user_id": user_id, "consultant_id": consultant_id}
            )
        
        db.commit()
        return {"message": "Consultant assigned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ASSIGN DERMATOLOGIST TO USER
@router.post("/assign-dermatologist")
async def assign_dermatologist(
    data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Admin assigns dermatologist to a user"""
    if current_user.role_id != 4:
        raise HTTPException(status_code=403, detail="Only admins can assign")
    
    try:
        user_id = data.get('user_id')
        dermatologist_id = data.get('dermatologist_id')
        
        # Check if already assigned
        existing = db.execute(
            text("SELECT assignment_id FROM consultation_assignments WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).first()
        
        if existing:
            # Update
            db.execute(
                text("""
                    UPDATE consultation_assignments 
                    SET dermatologist_id = :dermatologist_id, assignment_type = 'dermatologist'
                    WHERE user_id = :user_id
                """),
                {"dermatologist_id": dermatologist_id, "user_id": user_id}
            )
        else:
            # Create new
            db.execute(
                text("""
                    INSERT INTO consultation_assignments 
                    (user_id, dermatologist_id, assignment_type)
                    VALUES (:user_id, :dermatologist_id, 'dermatologist')
                """),
                {"user_id": user_id, "dermatologist_id": dermatologist_id}
            )
        
        db.commit()
        return {"message": "Dermatologist assigned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET CONSULTANTS/DERMATOLOGISTS FOR ASSIGNMENT DROPDOWN
@router.get("/available-experts/{role_id}")
async def get_available_experts(
    role_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get list of available consultants or dermatologists for assignment"""
    if current_user.role_id != 4:
        raise HTTPException(status_code=403, detail="Only admins can access")
    
    try:
        result = db.execute(
            text("""
                SELECT user_id, first_name, last_name, email 
                FROM users 
                WHERE role_id = :role_id AND is_active = TRUE
            """),
            {"role_id": role_id}
        ).fetchall()
        
        experts = [{'user_id': r[0], 'name': f"{r[1]} {r[2]}", 'email': r[3]} for r in result]
        return {'experts': experts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))