from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_dermatologist_role
from datetime import datetime

router = APIRouter(prefix="/api/dermatologist", tags=["Dermatologist"])

# ============================================
# PYDANTIC SCHEMAS
# ============================================
class RecommendationData(BaseModel):
    user_id: int
    recommendation_text: str
    product_suggestions: str = ""
    routine_suggestions: str = ""

class RoutineStep(BaseModel):
    routine_step: str
    frequency: str

class RoutineUpdate(BaseModel):
    routine_steps: list

# ============================================
# GET DERMATOLOGIST PROFILE
# ============================================
@router.get("/profile")
async def get_dermatologist_profile(
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Get dermatologist profile"""
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Dermatologist not found")
        
        return {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role_id": user.role_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# UPDATE DERMATOLOGIST PROFILE
# ============================================
@router.put("/profile/update")
async def update_dermatologist_profile(
    profile_data: dict,
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Update dermatologist profile"""
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Dermatologist not found")
        
        if "phone" in profile_data:
            user.phone = profile_data["phone"]
        if "first_name" in profile_data:
            user.first_name = profile_data["first_name"]
        if "last_name" in profile_data:
            user.last_name = profile_data["last_name"]
        
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET CONSULTATION REQUESTS (ASSIGNED CASES)
# ============================================
@router.get("/consultation-requests")
async def get_consultation_requests(
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Get consultation requests assigned to this dermatologist"""
    try:
        requests = db.execute(
            text("""
                SELECT cr.request_id, u.user_id, u.first_name, u.last_name, u.email,
                       cr.title, cr.description, cr.status, cr.requested_date
                FROM consultation_requests cr
                JOIN users u ON cr.user_id = u.user_id
                WHERE cr.assigned_dermatologist_id = :dermatologist_id
                ORDER BY cr.requested_date DESC
            """),
            {"dermatologist_id": current_user.user_id}
        ).all()
        
        request_list = [
            {
                "request_id": r[0],
                "user_id": r[1],
                "user_name": f"{r[2]} {r[3]}",
                "email": r[4],
                "title": r[5],
                "description": r[6],
                "status": r[7],
                "requested_date": str(r[8])
            }
            for r in requests
        ]
        
        return {"requests": request_list, "count": len(request_list)}
    except Exception as e:
        print(f"Error fetching consultation requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET DERMATOLOGIST'S ASSIGNED PATIENTS
# ============================================
@router.get("/my-patients")
async def get_my_patients(
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Get all patients assigned to this dermatologist"""
    try:
        patients = db.execute(
            text("""
                SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.email,
                       u.health_score, u.compliance_percentage
                FROM users u
                JOIN consultation_requests cr ON u.user_id = cr.user_id
                WHERE cr.assigned_dermatologist_id = :dermatologist_id
                ORDER BY u.first_name ASC
            """),
            {"dermatologist_id": current_user.user_id}
        ).all()
        
        patient_list = [
            {
                "user_id": p[0],
                "first_name": p[1],
                "last_name": p[2],
                "email": p[3],
                "health_score": float(p[4]) if p[4] else 7.0,
                "compliance_percentage": float(p[5]) if p[5] else 0
            }
            for p in patients
        ]
        
        print(f"Dermatologist {current_user.user_id} has {len(patient_list)} patients")
        
        return {"patients": patient_list, "count": len(patient_list)}
    except Exception as e:
        print(f"Error fetching patients: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET PATIENT INSPECTION DETAILS
# ============================================
@router.get("/patient-inspection/{user_id}")
async def get_patient_inspection(
    user_id: int,
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Get detailed inspection data for a patient"""
    try:
        # Get user basic info
        user = db.execute(
            text("""
                SELECT user_id, first_name, last_name, email, age, gender, 
                       health_score, compliance_percentage
                FROM users WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get lifestyle data (last 30 days)
        lifestyle = db.execute(
            text("""
                SELECT tracking_date, sleep_duration, water_intake, stress_level, exercise_type
                FROM lifestyle_tracking
                WHERE user_id = :user_id
                ORDER BY tracking_date DESC
                LIMIT 30
            """),
            {"user_id": user_id}
        ).all()
        
        # Get skin screening
        screening = db.execute(
            text("""
                SELECT screening_id, image_url, analysis_json, created_at
                FROM skin_screening
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {"user_id": user_id}
        ).first()
        
        # Get current routine
        routine = db.execute(
            text("""
                SELECT routine_id, routine_step, frequency
                FROM skincare_routines
                WHERE user_id = :user_id
                ORDER BY step_order ASC
            """),
            {"user_id": user_id}
        ).all()
        
        return {
            "user": {
                "user_id": user[0],
                "first_name": user[1],
                "last_name": user[2],
                "email": user[3],
                "age": user[4],
                "gender": user[5],
                "health_score": float(user[6]) if user[6] else 7.0,
                "compliance_percentage": float(user[7]) if user[7] else 0
            },
            "lifestyle": [
                {
                    "date": str(l[0]),
                    "sleep": float(l[1]) if l[1] else 0,
                    "water": int(l[2]) if l[2] else 0,
                    "stress": l[3],
                    "exercise": l[4] or ""
                }
                for l in lifestyle
            ],
            "screening": {
                "screening_id": screening[0],
                "image_url": screening[1],
                "analysis": screening[2],
                "created_at": str(screening[3])
            } if screening else None,
            "routine": [
                {
                    "routine_id": r[0],
                    "routine_step": r[1],
                    "frequency": r[2]
                }
                for r in routine
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# SEND RECOMMENDATION (TREATMENT PLAN)
# ============================================
@router.post("/send-recommendation")
async def send_recommendation(
    recommendation_data: RecommendationData,
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Send treatment plan to a patient"""
    try:
        db.execute(
            text("""
                INSERT INTO consultant_recommendations
                (user_id, professional_id, recommendation_text, product_suggestions, routine_suggestions, created_at, sent_date)
                VALUES (:user_id, :professional_id, :recommendation_text, :product_suggestions, :routine_suggestions, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": recommendation_data.user_id,
                "professional_id": current_user.user_id,
                "recommendation_text": recommendation_data.recommendation_text,
                "product_suggestions": recommendation_data.product_suggestions,
                "routine_suggestions": recommendation_data.routine_suggestions
            }
        )
        
        # Mark consultation request as completed
        db.execute(
            text("""
                UPDATE consultation_requests
                SET status = 'completed', completion_date = CURRENT_TIMESTAMP
                WHERE user_id = :user_id AND assigned_dermatologist_id = :dermatologist_id
            """),
            {"user_id": recommendation_data.user_id, "dermatologist_id": current_user.user_id}
        )
        
        db.commit()
        return {"message": "Treatment plan sent successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# UPDATE PATIENT ROUTINE
# ============================================
@router.put("/update-patient-routine/{user_id}")
async def update_patient_routine(
    user_id: int,
    routine_data: RoutineUpdate,
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Update a patient's routine"""
    try:
        # Delete existing routine
        db.execute(
            text("DELETE FROM skincare_routines WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        
        # Add new routine steps
        for i, step in enumerate(routine_data.routine_steps):
            db.execute(
                text("""
                    INSERT INTO skincare_routines
                    (user_id, routine_step, frequency, step_order, created_at, updated_at)
                    VALUES (:user_id, :routine_step, :frequency, :step_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """),
                {
                    "user_id": user_id,
                    "routine_step": step.routine_step,
                    "frequency": step.frequency,
                    "step_order": i + 1
                }
            )
        
        db.commit()
        return {"message": "Routine updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET DERMATOLOGIST DASHBOARD STATS
# ============================================
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_dermatologist_role),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for dermatologist"""
    try:
        total_patients = db.execute(
            text("""
                SELECT COUNT(DISTINCT u.user_id)
                FROM users u
                JOIN consultation_requests cr ON u.user_id = cr.user_id
                WHERE cr.assigned_dermatologist_id = :dermatologist_id
            """),
            {"dermatologist_id": current_user.user_id}
        ).scalar()
        
        active_cases = db.execute(
            text("""
                SELECT COUNT(*)
                FROM consultation_requests
                WHERE assigned_dermatologist_id = :dermatologist_id AND status != 'completed'
            """),
            {"dermatologist_id": current_user.user_id}
        ).scalar()
        
        completed_cases = db.execute(
            text("""
                SELECT COUNT(*)
                FROM consultation_requests
                WHERE assigned_dermatologist_id = :dermatologist_id AND status = 'completed'
            """),
            {"dermatologist_id": current_user.user_id}
        ).scalar()
        
        return {
            "total_patients": total_patients or 0,
            "active_cases": active_cases or 0,
            "completed_cases": completed_cases or 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))