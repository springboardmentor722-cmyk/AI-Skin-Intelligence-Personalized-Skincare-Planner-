from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/consultant", tags=["Consultant Patients"])

# GET ASSIGNED PATIENTS (PATIENT ROSTER)
@router.get("/patients")
async def get_my_patients(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all patients assigned to this consultant"""
    if current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Only consultants can access")
    
    try:
        result = db.execute(
            text("""
                SELECT 
                  u.user_id, u.first_name, u.last_name, u.email,
                  u.health_score, u.compliance_percentage,
                  ca.assigned_date,
                  GROUP_CONCAT(sc.concern_name) as concerns
                FROM consultation_assignments ca
                JOIN users u ON ca.user_id = u.user_id
                LEFT JOIN user_profiles up ON u.user_id = up.user_id
                LEFT JOIN skin_concerns sc ON up.primary_concern_id = sc.concern_id
                WHERE ca.consultant_id = :consultant_id
                GROUP BY u.user_id
            """),
            {"consultant_id": current_user.user_id}
        ).fetchall()
        
        patients = []
        for row in result:
            patients.append({
                'user_id': row[0],
                'name': f"{row[1]} {row[2]}",
                'email': row[3],
                'health_score': float(row[4]) if row[4] else 0,
                'compliance_percentage': float(row[5]) if row[5] else 0,
                'assigned_date': str(row[6]),
                'primary_concerns': row[7] or 'Not specified'
            })
        
        return {'patients': patients, 'count': len(patients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET PATIENT INSPECTION VIEW (DETAILED TIMELINE)
@router.get("/patient-inspection/{user_id}")
async def get_patient_inspection(
    user_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get detailed inspection view of patient including timeline, progress photos, lifestyle"""
    if current_user.role_id not in [2, 3]:  # Dermatologist or Consultant
        raise HTTPException(status_code=403, detail="Only medical professionals")
    
    # Verify consultant is assigned to this user
    assignment = db.execute(
        text("""
            SELECT assignment_id FROM consultation_assignments 
            WHERE user_id = :user_id AND 
            ((consultant_id = :expert_id AND :role_id = 3) OR 
             (dermatologist_id = :expert_id AND :role_id = 2))
        """),
        {"user_id": user_id, "expert_id": current_user.user_id, "role_id": current_user.role_id}
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned to this patient")
    
    try:
        # Get user basic info
        user_info = db.execute(
            text("SELECT first_name, last_name, email FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).first()
        
        # Get timeline events
        timeline = []
        
        # Screening events
        screenings = db.execute(
            text("""
                SELECT created_at, analysis_json, ai_model FROM skin_screening 
                WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 5
            """),
            {"user_id": user_id}
        ).fetchall()
        
        for screening in screenings:
            timeline.append({
                'date': str(screening[0]),
                'type': 'screening',
                'description': f"AI Screening - {screening[2]}",
                'data': screening[1]
            })
        
        # Lifestyle events
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
                'description': 'Lifestyle log recorded'
            })
        
        # Progress photos
        progress = db.execute(
            text("""
                SELECT photo_id, before_image_url, after_image_url, uploaded_date, improvement_percentage
                FROM before_after_photos WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).first()
        
        # Routine updates
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
        
        # Get last 30 days lifestyle stats
        lifestyle_stats = db.execute(
            text("""
                SELECT 
                  AVG(hours_slept) as avg_sleep,
                  AVG(glasses_water) as avg_water,
                  AVG(stress_level) as avg_stress,
                  COUNT(*) as total_logs
                FROM lifestyle_tracking 
                WHERE user_id = :user_id AND log_date >= CURRENT_DATE - INTERVAL 30 DAY
            """),
            {"user_id": user_id}
        ).first()
        
        # Get current routine
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
                'total_logs': lifestyle_stats[3]
            },
            'current_routine': [{'step': r[0], 'frequency': r[1]} for r in current_routine]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE PATIENT ROUTINE (CONSULTANT/DERMATOLOGIST)
@router.put("/patient-routine/{user_id}")
async def update_patient_routine(
    user_id: int,
    routine_data: dict,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update a patient's skincare routine"""
    if current_user.role_id not in [2, 3]:
        raise HTTPException(status_code=403, detail="Only medical professionals")
    
    # Verify assignment
    assignment = db.execute(
        text("""
            SELECT assignment_id FROM consultation_assignments 
            WHERE user_id = :user_id AND 
            ((consultant_id = :expert_id) OR (dermatologist_id = :expert_id))
        """),
        {"user_id": user_id, "expert_id": current_user.user_id}
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this patient")
    
    try:
        # Delete old routine
        db.execute(text("DELETE FROM skincare_routines WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Add new routine steps
        routine_steps = routine_data.get('routine_steps', [])
        for idx, step in enumerate(routine_steps):
            db.execute(
                text("""
                    INSERT INTO skincare_routines 
                    (user_id, routine_step, frequency, step_order, created_at, updated_at)
                    VALUES (:user_id, :step, :freq, :order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """),
                {
                    'user_id': user_id,
                    'step': step.get('step'),
                    'freq': step.get('frequency'),
                    'order': idx
                }
            )
        
        db.commit()
        return {"message": "Patient routine updated successfully"}
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
    if current_user.role_id not in [2, 3]:
        raise HTTPException(status_code=403, detail="Only medical professionals")
    
    try:
        user_id = data.get('user_id')
        
        # Verify assignment
        assignment = db.execute(
            text("""
                SELECT assignment_id FROM consultation_assignments 
                WHERE user_id = :user_id AND 
                ((consultant_id = :expert_id) OR (dermatologist_id = :expert_id))
            """),
            {"user_id": user_id, "expert_id": current_user.user_id}
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

# GET RECOMMENDATIONS FOR PATIENT
@router.get("/recommendations/{user_id}")
async def get_recommendations(
    user_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get latest recommendation for this patient"""
    try:
        result = db.execute(
            text("""
                SELECT cr.recommendation_id, u.first_name, u.last_name, 
                       cr.recommendation_text, cr.product_suggestions, 
                       cr.routine_suggestions, cr.created_at
                FROM consultant_recommendations cr
                JOIN users u ON cr.consultant_id = u.user_id
                WHERE cr.user_id = :user_id
                ORDER BY cr.created_at DESC LIMIT 1
            """),
            {"user_id": user_id}
        ).first()
        
        if not result:
            return {"message": "No recommendations yet"}
        
        return {
            'recommendation_id': result[0],
            'expert_name': f"{result[1]} {result[2]}",
            'recommendation_text': result[3],
            'product_suggestions': result[4],
            'routine_suggestions': result[5],
            'created_at': str(result[6])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))