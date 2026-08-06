from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/dermatologist", tags=["Dermatologist"])

# GET DERMATOLOGIST PROFILE
@router.get("/profile")
async def get_dermatologist_profile(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get dermatologist's profile"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        result = db.execute(
            text("""
                SELECT dermatologist_id, license_number, specialization, hospital_name, 
                       years_experience, bio, consultation_fee, is_verified
                FROM dermatologist_profiles WHERE user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "dermatologist_id": result[0],
            "license_number": result[1],
            "specialization": result[2],
            "hospital_name": result[3],
            "years_experience": result[4],
            "bio": result[5],
            "consultation_fee": float(result[6]) if result[6] else 0,
            "is_verified": bool(result[7])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE DERMATOLOGIST PROFILE
@router.put("/profile/update")
async def update_dermatologist_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update dermatologist profile"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        updates = []
        params = {"user_id": current_user.user_id}
        
        if "license_number" in profile_data:
            updates.append("license_number = :license_number")
            params["license_number"] = profile_data["license_number"]
        if "specialization" in profile_data:
            updates.append("specialization = :specialization")
            params["specialization"] = profile_data["specialization"]
        if "hospital_name" in profile_data:
            updates.append("hospital_name = :hospital_name")
            params["hospital_name"] = profile_data["hospital_name"]
        if "years_experience" in profile_data:
            updates.append("years_experience = :years_experience")
            params["years_experience"] = profile_data["years_experience"]
        if "bio" in profile_data:
            updates.append("bio = :bio")
            params["bio"] = profile_data["bio"]
        if "consultation_fee" in profile_data:
            updates.append("consultation_fee = :fee")
            params["fee"] = profile_data["consultation_fee"]
        
        if updates:
            query = f"UPDATE dermatologist_profiles SET {', '.join(updates)} WHERE user_id = :user_id"
            db.execute(text(query), params)
            db.commit()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET CONSULTATION REQUESTS
@router.get("/consultation-requests")
async def get_consultation_requests(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get consultation requests for this dermatologist"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        # Get all consultation requests where dermatologist is assigned
        requests = db.execute(
            text("""
                SELECT 
                  cr.request_id, u.first_name, u.last_name, cr.title, cr.description, 
                  cr.status, cr.requested_date
                FROM consultation_requests cr
                JOIN users u ON cr.user_id = u.user_id
                LEFT JOIN consultation_assignments ca ON cr.user_id = ca.user_id
                WHERE ca.dermatologist_id = :dermatologist_id 
                   OR (cr.status = 'pending')
                ORDER BY cr.requested_date DESC
            """),
            {"dermatologist_id": current_user.user_id}
        ).all()
        
        consultation_list = [
            {
                "request_id": r[0],
                "user_name": f"{r[1]} {r[2]}",
                "title": r[3],
                "description": r[4],
                "status": r[5],
                "requested_date": str(r[6])
            }
            for r in requests
        ]
        
        return {"consultations": consultation_list, "count": len(consultation_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE CONSULTATION STATUS
@router.put("/consultation-request/{request_id}/status")
async def update_consultation_status(
    request_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update consultation request status"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        status = status_data.get("status")
        
        db.execute(
            text("""
                UPDATE consultation_requests 
                SET status = :status, responded_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE request_id = :request_id
            """),
            {"request_id": request_id, "status": status}
        )
        db.commit()
        
        return {"message": f"Consultation status updated to {status}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET ALL PRODUCTS (NO LIMIT)
@router.get("/products")
async def get_dermatologist_products(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all products for dermatologist reference"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        products = db.execute(
            text("""
                SELECT product_id, brand, name, price, review_score
                FROM products
                ORDER BY brand, name
            """)
        ).all()
        
        product_list = [
            {
                "product_id": r[0],
                "brand": r[1],
                "name": r[2],
                "price": float(r[3]),
                "rating": float(r[4]) if r[4] else 0
            }
            for r in products
        ]
        
        return {"products": product_list, "count": len(product_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET ALL INGREDIENTS (NO LIMIT)
@router.get("/ingredients")
async def get_dermatologist_ingredients(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all ingredients for dermatologist reference"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        ingredients = db.execute(
            text("""
                SELECT ingredient_id, name, what_does_it_do
                FROM ingredients
                ORDER BY name
            """)
        ).all()
        
        ingredient_list = [
            {
                "ingredient_id": r[0],
                "name": r[1],
                "benefits": r[2]
            }
            for r in ingredients
        ]
        
        return {"ingredients": ingredient_list, "count": len(ingredient_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET PATIENTS (for dermatologist - SAME as in dermatologist_patients.py)
@router.get("/patients")
async def get_my_patients(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all patients assigned to this dermatologist"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        result = db.execute(
            text("""
                SELECT 
                  u.user_id, u.first_name, u.last_name, u.email,
                  u.health_score, u.compliance_percentage,
                  ca.assigned_date
                FROM consultation_assignments ca
                JOIN users u ON ca.user_id = u.user_id
                WHERE ca.dermatologist_id = :dermatologist_id
                ORDER BY ca.assigned_date DESC
            """),
            {"dermatologist_id": current_user.user_id}
        ).fetchall()
        
        patients = []
        for row in result:
            patients.append({
                'user_id': row[0],
                'name': f"{row[1]} {row[2]}",
                'email': row[3],
                'health_score': float(row[4]) if row[4] else 0,
                'compliance_percentage': float(row[5]) if row[5] else 0,
                'assigned_date': str(row[6])
            })
        
        return {'patients': patients, 'count': len(patients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET PATIENT INSPECTION
@router.get("/patient-inspection/{user_id}")
async def get_patient_inspection(
    user_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get detailed inspection view of patient"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    # Verify assignment
    assignment = db.execute(
        text("""
            SELECT assignment_id FROM consultation_assignments 
            WHERE user_id = :user_id AND dermatologist_id = :dermatologist_id
        """),
        {"user_id": user_id, "dermatologist_id": current_user.user_id}
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this patient")
    
    try:
        user_info = db.execute(
            text("SELECT first_name, last_name, email FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).first()
        
        timeline = []
        
        screenings = db.execute(
            text("""
                SELECT created_at FROM skin_screening 
                WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 5
            """),
            {"user_id": user_id}
        ).fetchall()
        
        for screening in screenings:
            timeline.append({
                'date': str(screening[0]),
                'type': 'screening',
                'description': 'AI Skin Screening'
            })
        
        lifestyle = db.execute(
            text("""
                SELECT log_date FROM lifestyle_tracking 
                WHERE user_id = :user_id ORDER BY log_date DESC LIMIT 5
            """),
            {"user_id": user_id}
        ).fetchall()
        
        for log in lifestyle:
            timeline.append({
                'date': str(log[0]),
                'type': 'lifestyle',
                'description': 'Lifestyle log'
            })
        
        progress = db.execute(
            text("""
                SELECT photo_id, before_image_url, after_image_url, uploaded_date, improvement_percentage
                FROM before_after_photos WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).first()
        
        routines = db.execute(
            text("""
                SELECT updated_at FROM skincare_routines 
                WHERE user_id = :user_id ORDER BY updated_at DESC LIMIT 3
            """),
            {"user_id": user_id}
        ).fetchall()
        
        for routine in routines:
            timeline.append({
                'date': str(routine[0]),
                'type': 'routine_update',
                'description': 'Routine updated'
            })
        
        lifestyle_stats = db.execute(
            text("""
                SELECT 
                  COALESCE(AVG(hours_slept), 0) as avg_sleep,
                  COALESCE(AVG(glasses_water), 0) as avg_water,
                  COALESCE(AVG(stress_level), 0) as avg_stress,
                  COUNT(*) as total_logs
                FROM lifestyle_tracking 
                WHERE user_id = :user_id AND log_date >= CURRENT_DATE - INTERVAL '30 days'
            """),
            {"user_id": user_id}
        ).first()
        
        current_routine = db.execute(
            text("""
                SELECT routine_step, frequency FROM skincare_routines 
                WHERE user_id = :user_id ORDER BY step_order
            """),
            {"user_id": user_id}
        ).fetchall()
        
        return {
            'patient_name': f"{user_info[0]} {user_info[1]}",
            'patient_email': user_info[2],
            'timeline': sorted(timeline, key=lambda x: x['date'], reverse=True),
            'progress_photos': {
                'before_image': progress[1] if progress else None,
                'after_image': progress[2] if progress else None,
                'uploaded_date': str(progress[3]) if progress else None,
                'improvement_percentage': float(progress[4]) if progress and progress[4] else 0
            } if progress else None,
            'lifestyle_30days': {
                'avg_sleep': float(lifestyle_stats[0]) if lifestyle_stats[0] else 0,
                'avg_water': float(lifestyle_stats[1]) if lifestyle_stats[1] else 0,
                'avg_stress': float(lifestyle_stats[2]) if lifestyle_stats[2] else 0,
                'total_logs': int(lifestyle_stats[3])
            },
            'current_routine': [{'step': r[0], 'frequency': r[1]} for r in current_routine]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE PATIENT ROUTINE
@router.put("/update-patient-routine/{user_id}")
async def update_patient_routine(
    user_id: int,
    routine_data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update patient routine"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    assignment = db.execute(
        text("""
            SELECT assignment_id FROM consultation_assignments 
            WHERE user_id = :user_id AND dermatologist_id = :dermatologist_id
        """),
        {"user_id": user_id, "dermatologist_id": current_user.user_id}
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned")
    
    try:
        db.execute(text("DELETE FROM skincare_routines WHERE user_id = :user_id"), {"user_id": user_id})
        
        routine_steps = routine_data.get('routine_steps', [])
        for idx, step in enumerate(routine_steps):
            db.execute(
                text("""
                    INSERT INTO skincare_routines 
                    (user_id, routine_step, frequency, step_order, created_at, updated_at)
                    VALUES (:user_id, :step, :freq, :order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """),
                {'user_id': user_id, 'step': step.get('step'), 'freq': step.get('frequency'), 'order': idx}
            )
        
        db.commit()
        return {"message": "Routine updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# SEND RECOMMENDATION
@router.post("/recommendations")
async def send_recommendation(
    data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Send recommendation to patient"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists")
    
    try:
        user_id = data.get('user_id')
        
        assignment = db.execute(
            text("""
                SELECT assignment_id FROM consultation_assignments 
                WHERE user_id = :user_id AND dermatologist_id = :dermatologist_id
            """),
            {"user_id": user_id, "dermatologist_id": current_user.user_id}
        ).first()
        
        if not assignment:
            raise HTTPException(status_code=403, detail="Not assigned to this patient")
        
        db.execute(
            text("""
                INSERT INTO consultant_recommendations 
                (user_id, consultant_id, recommendation_text, product_suggestions, routine_suggestions, created_at)
                VALUES (:user_id, :consultant_id, :rec_text, :prod_sug, :rout_sug, CURRENT_TIMESTAMP)
            """),
            {
                'user_id': user_id,
                'consultant_id': current_user.user_id,
                'rec_text': data.get('recommendation_text'),
                'prod_sug': data.get('product_suggestions'),
                'rout_sug': data.get('routine_suggestions')
            }
        )
        
        db.commit()
        return {"message": "Recommendation sent"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))