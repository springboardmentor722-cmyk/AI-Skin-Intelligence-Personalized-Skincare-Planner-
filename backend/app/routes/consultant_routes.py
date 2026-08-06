from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import require_consultant_role

router = APIRouter(prefix="/api/consultant", tags=["Consultant"])

# GET CONSULTANT PROFILE
@router.get("/profile")
async def get_consultant_profile(
    current_user: User = Depends(require_consultant_role),
    db: Session = Depends(get_db)
):
    """Get consultant's profile"""
    try:
        result = db.execute(
            text("""
                SELECT consultant_id, certification, specialization, company_name, 
                       years_experience, bio, consultation_fee, is_verified
                FROM consultant_profiles WHERE user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "consultant_id": result[0],
            "certification": result[1],
            "specialization": result[2],
            "company_name": result[3],
            "years_experience": result[4],
            "bio": result[5],
            "consultation_fee": float(result[6]) if result[6] else 0,
            "is_verified": bool(result[7])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE CONSULTANT PROFILE
@router.put("/profile/update")
async def update_consultant_profile(
    profile_data: dict,
    current_user: User = Depends(require_consultant_role),
    db: Session = Depends(get_db)
):
    """Update consultant profile"""
    try:
        updates = []
        params = {"user_id": current_user.user_id}
        
        if "specialization" in profile_data:
            updates.append("specialization = :specialization")
            params["specialization"] = profile_data["specialization"]
        if "company_name" in profile_data:
            updates.append("company_name = :company_name")
            params["company_name"] = profile_data["company_name"]
        if "bio" in profile_data:
            updates.append("bio = :bio")
            params["bio"] = profile_data["bio"]
        if "consultation_fee" in profile_data:
            updates.append("consultation_fee = :fee")
            params["fee"] = profile_data["consultation_fee"]
        
        if updates:
            query = f"UPDATE consultant_profiles SET {', '.join(updates)} WHERE user_id = :user_id"
            db.execute(text(query), params)
            db.commit()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET ASSIGNED PATIENTS
@router.get("/patients")
async def get_patients(
    current_user: User = Depends(require_consultant_role),
    db: Session = Depends(get_db)
):
    """Get list of assigned patients"""
    try:
        # Get consultant_id
        consultant = db.execute(
            text("SELECT consultant_id FROM consultant_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if not consultant:
            raise HTTPException(status_code=404, detail="Consultant profile not found")
        
        patients = db.execute(
            text("""
                SELECT u.user_id, u.first_name, u.last_name, u.email, ca.assignment_date
                FROM consultation_assignments ca
                JOIN users u ON ca.user_id = u.user_id
                WHERE ca.consultant_id = :consultant_id
                ORDER BY ca.assignment_date DESC
            """),
            {"consultant_id": consultant[0]}
        ).all()
        
        patient_list = [
            {
                "user_id": r[0],
                "name": f"{r[1]} {r[2]}",
                "email": r[3],
                "assigned_date": str(r[4])
            }
            for r in patients
        ]
        
        return {"patients": patient_list, "count": len(patient_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SEND RECOMMENDATION TO PATIENT
@router.post("/recommendations")
async def send_recommendation(
    recommendation_data: dict,
    current_user: User = Depends(require_consultant_role),
    db: Session = Depends(get_db)
):
    """Send skincare recommendations to a patient"""
    try:
        # Get consultant_id
        consultant = db.execute(
            text("SELECT consultant_id FROM consultant_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if not consultant:
            raise HTTPException(status_code=404, detail="Consultant profile not found")
        
        user_id = recommendation_data.get("user_id")
        
        db.execute(
            text("""
                INSERT INTO consultant_recommendations 
                (user_id, consultant_id, recommendation_text, product_suggestions, routine_suggestions, sent_date, created_at)
                VALUES (:user_id, :consultant_id, :text, :products, :routine, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": user_id,
                "consultant_id": consultant[0],
                "text": recommendation_data.get("recommendation_text"),
                "products": recommendation_data.get("product_suggestions"),
                "routine": recommendation_data.get("routine_suggestions")
            }
        )
        db.commit()
        
        return {"message": "Recommendation sent to patient"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET RECOMMENDATIONS SENT
@router.get("/recommendations/{user_id}")
async def get_patient_recommendations(
    user_id: int,
    current_user: User = Depends(require_consultant_role),
    db: Session = Depends(get_db)
):
    """Get recommendations sent to a patient"""
    try:
        recommendations = db.execute(
            text("""
                SELECT recommendation_id, recommendation_text, product_suggestions, 
                       routine_suggestions, sent_date
                FROM consultant_recommendations 
                WHERE user_id = :user_id AND consultant_id = (
                    SELECT consultant_id FROM consultant_profiles WHERE user_id = :consultant_user_id
                )
                ORDER BY sent_date DESC
            """),
            {"user_id": user_id, "consultant_user_id": current_user.user_id}
        ).all()
        
        rec_list = [
            {
                "recommendation_id": r[0],
                "text": r[1],
                "products": r[2],
                "routine": r[3],
                "sent_date": str(r[4])
            }
            for r in recommendations
        ]
        
        return {"recommendations": rec_list, "count": len(rec_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# VIEW PATIENT PROGRESS REPORTS
@router.get("/reports/{user_id}")
async def get_patient_report(
    user_id: int,
    current_user: User = Depends(require_consultant_role),
    db: Session = Depends(get_db)
):
    """Get patient's progress report"""
    try:
        # Get progress data
        progress = db.execute(
            text("""
                SELECT photo_id, before_image_url, after_image_url, improvement_percentage,
                       before_upload_date, after_upload_date, skin_concern
                FROM before_after_photos WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).first()
        
        # Get lifestyle data
        lifestyle = db.execute(
            text("""
                SELECT AVG(sleep_duration), AVG(water_intake), AVG(stress_level), COUNT(*)
                FROM lifestyle_tracking WHERE user_id = :user_id AND tracking_date >= CURRENT_DATE - INTERVAL '30 days'
            """),
            {"user_id": user_id}
        ).first()
        
        # Get latest screening
        screening = db.execute(
            text("""
                SELECT analysis_result, confidence_score, screening_date
                FROM skin_screening WHERE user_id = :user_id
                ORDER BY screening_date DESC LIMIT 1
            """),
            {"user_id": user_id}
        ).first()
        
        return {
            "progress": {
                "before_image": progress[1] if progress else None,
                "after_image": progress[2] if progress else None,
                "improvement": float(progress[3]) if progress and progress[3] else 0
            },
            "lifestyle_30days": {
                "avg_sleep": float(lifestyle[0]) if lifestyle and lifestyle[0] else 0,
                "avg_water": float(lifestyle[1]) if lifestyle and lifestyle[1] else 0,
                "avg_stress": float(lifestyle[2]) if lifestyle and lifestyle[2] else 0,
                "total_logs": lifestyle[3] if lifestyle else 0
            },
            "latest_screening": {
                "condition": screening[0] if screening else None,
                "confidence": float(screening[1]) if screening and screening[1] else 0,
                "date": str(screening[2]) if screening else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    