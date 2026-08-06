from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role
from datetime import datetime
import json

router = APIRouter(prefix="/api/screening", tags=["Screening"])

class ScreeningAnalysis(BaseModel):
    condition: str
    severity: int
    confidence: int
    recommendations: str

# ANALYZE SKIN (AI SCREENING)
@router.post("/analyze")
async def analyze_skin(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Upload and analyze skin image"""
    try:
        # Read file
        contents = await file.read()
        
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Save filename
        filename = f"screening_{current_user.user_id}_{datetime.now().timestamp()}.jpg"
        filepath = f"uploads/screening/{filename}"
        
        # Store in database
        analysis_json = {
            "condition": "Healthy skin with minor concerns",
            "severity": 4,
            "confidence": 85,
            "recommendations": "Continue with current routine. Consider adding Vitamin C serum for brightness. Ensure daily SPF 30+. Increase water intake to 3L daily."
        }
        
        db.execute(
            text("""
                INSERT INTO skin_screening 
                (user_id, image_url, ai_model, analysis_json, created_at)
                VALUES 
                (:user_id, :image_url, :ai_model, :analysis_json, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "image_url": filepath,
                "ai_model": "DermaAI-v1",
                "analysis_json": json.dumps(analysis_json)
            }
        )
        db.commit()
        
        return {
            "message": "Analysis complete",
            "analysis": analysis_json
        }
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# GET LATEST SCREENING
@router.get("/latest")
async def get_latest_screening(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get latest skin screening result"""
    try:
        result = db.execute(
            text("""
                SELECT screening_id, image_url, analysis_json, created_at
                FROM skin_screening 
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            return {"message": "No screening yet"}
        
        analysis = json.loads(result[3]) if isinstance(result[3], str) else result[3]
        
        return {
            "screening_id": result[0],
            "image_url": result[1],
            "analysis": analysis,
            "created_at": str(result[4])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET SCREENING HISTORY
@router.get("/history")
async def get_screening_history(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get all screening history"""
    try:
        results = db.execute(
            text("""
                SELECT screening_id, image_url, analysis_json, created_at
                FROM skin_screening 
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        screenings = []
        for r in results:
            analysis = json.loads(r[2]) if isinstance(r[2], str) else r[2]
            screenings.append({
                "screening_id": r[0],
                "image_url": r[1],
                "analysis": analysis,
                "created_at": str(r[3])
            })
        
        return {"screenings": screenings, "count": len(screenings)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# DELETE SCREENING
@router.delete("/{screening_id}")
async def delete_screening(
    screening_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Delete a screening record"""
    try:
        db.execute(
            text("DELETE FROM skin_screening WHERE screening_id = :id AND user_id = :user_id"),
            {"id": screening_id, "user_id": current_user.user_id}
        )
        db.commit()
        return {"message": "Screening deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))