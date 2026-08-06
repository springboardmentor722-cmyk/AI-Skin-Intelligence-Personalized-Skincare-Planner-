from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/dermatologist", tags=["Dermatologist Patients"])

# GET ASSIGNED PATIENTS
@router.get("/patients")
async def get_my_patients(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all patients assigned to this dermatologist"""
    if current_user.role_id != 2:
        raise HTTPException(status_code=403, detail="Only dermatologists can access")
    
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

# GET PATIENT INSPECTION (SAME AS CONSULTANT)
@router.get("/patient-inspection/{user_id}")
async def get_patient_inspection(
    user_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get detailed inspection view of patient"""
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
        raise HTTPException(status_code=403, detail="Not assigned to this patient")
    
    try:
        user_info = db.execute(
            text("SELECT first_name, last_name, email FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).first()
        
        timeline = []
        
        screenings = db.execute(
            text("""
                SELECT created_at, analysis_json FROM skin_screening 
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
        
        lifestyle_stats = db.execute(
            text("""
                SELECT 
                  AVG(hours_slept), AVG(glasses_water), AVG(stress_level), COUNT(*)
                FROM lifestyle_tracking 
                WHERE user_id = :user_id AND log_date >= CURRENT_DATE - INTERVAL 30 DAY
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
            'timeline': sorted(timeline, key=lambda x: x['date'], reverse=True),
            'progress_photos': {
                'before_image': progress[1] if progress else None,
                'after_image': progress[2] if progress else None,
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

# UPDATE PATIENT ROUTINE
@router.put("/patient-routine/{user_id}")
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
    """Send recommendation"""
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
            raise HTTPException(status_code=403, detail="Not assigned")
        
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