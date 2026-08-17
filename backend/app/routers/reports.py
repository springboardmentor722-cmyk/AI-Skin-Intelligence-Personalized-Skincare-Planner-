import csv
import io
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db, get_mongo_db

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

class ReportGenerateRequest(BaseModel):
    include_assessment: bool = True
    include_routines: bool = True
    include_progress: bool = True

@router.post("/generate")
def generate_report(
    payload: ReportGenerateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create an in-memory string buffer for CSV generation (Excel compatible)
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 1. Header & Title Block
    writer.writerow(["SKINGENIE CLINICAL SYSTEM REPORT"])
    writer.writerow(["Generated At", datetime.utcnow().isoformat()])
    writer.writerow(["User Profile ID", current_user.id])
    writer.writerow(["User Full Name", current_user.full_name])
    writer.writerow(["User Email", current_user.email])
    writer.writerow([])
    
    # 2. Skin Assessments
    if payload.include_assessment:
        writer.writerow(["--- SKIN ASSESSMENTS HISTORICAL RECORD ---"])
        assessments = db.query(models.SkinAssessment).filter(
            models.SkinAssessment.user_id == current_user.id
        ).order_by(models.SkinAssessment.created_at.desc()).all()
        
        writer.writerow(["Date Logged", "Overall Score", "Condition Score", "Lifestyle Score", "Sleep Score", "Hydration Score", "Consistency Score", "Detected Concerns"])
        for a in assessments:
            writer.writerow([
                a.created_at.strftime("%Y-%m-%d %H:%M"),
                a.overall_score,
                a.skin_condition_score,
                a.lifestyle_score,
                a.sleep_score,
                a.hydration_score,
                a.consistency_score,
                ", ".join(a.detected_concerns) if a.detected_concerns else "None"
            ])
        writer.writerow([])
        
    # 3. Active Routines
    if payload.include_routines:
        writer.writerow(["--- ACTIVE SKINCARE ROUTINE STEPS ---"])
        routines = db.query(models.SkincareRoutine).filter(
            models.SkincareRoutine.user_id == current_user.id,
            models.SkincareRoutine.is_active == True
        ).all()
        
        writer.writerow(["Step Name", "Step Category", "Time of Day", "Application Order", "Product recommended"])
        for r in routines:
            writer.writerow([
                r.step_name,
                r.category,
                r.time_of_day,
                r.order,
                r.recommended_product_name or "—"
            ])
        writer.writerow([])
        
    # 4. Progress Logs
    if payload.include_progress:
        writer.writerow(["--- WEEKLY COMPLIANCE & PROGRESS TRACKING ---"])
        progress = db.query(models.ProgressEntry).filter(
            models.ProgressEntry.user_id == current_user.id
        ).order_by(models.ProgressEntry.entry_date.desc()).all()
        
        writer.writerow(["Log Date", "Hydration (0-10)", "Breakout Count", "Clinical Notes", "Progress Photo URL"])
        for p in progress:
            writer.writerow([
                p.entry_date.isoformat(),
                p.hydration_score or "—",
                p.breakout_count or 0,
                p.notes or "—",
                p.photo_url or "—"
            ])
        writer.writerow([])
        
    # Move to the beginning of the StringIO buffer
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="skingenie_report_{current_user.full_name.replace(" ", "_")}.csv"'
    }
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type='text/csv',
        headers=headers
    )
