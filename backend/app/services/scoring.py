from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from app.services.user_profile import user_profile_service
from app.services.skin_screening import skin_screening_service
from app.services.lifestyle import lifestyle_log_service

class SkinHealthScore(BaseModel):
    overall_score: int
    condition_score: int
    lifestyle_score: int
    routine_adherence_score: int
    sleep_score: int
    hydration_score: int
    interpretation: str
    logs_this_week: int = 0

class ScoringService:
    def calculate_score(self, db: Session, user_id: UUID) -> SkinHealthScore:
        from fastapi import HTTPException
        from datetime import datetime, timedelta
        
        # 1. Fetch relevant data
        skin_profile = None
        try:
            from app.models.profile import SkinProfile
            skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        except HTTPException:
            pass
        
        latest_screening = None
        try:
            latest_screening = skin_screening_service.get_latest_screening(db, user_id)
        except HTTPException:
            pass
            
        latest_lifestyle = None
        logs_this_week = 0
        try:
            latest_lifestyle = lifestyle_log_service.get_latest_log(db, user_id)
            # count logs in the last 7 days
            from app.models.lifestyle import LifestyleLog
            one_week_ago = datetime.utcnow() - timedelta(days=7)
            logs_this_week = db.query(LifestyleLog).filter(
                LifestyleLog.user_id == user_id, 
                LifestyleLog.created_at >= one_week_ago
            ).count()
        except HTTPException:
            pass
        
        # 2. Condition Score (Base 85) -> Weight: 35%
        condition = 85
        
        # Deduct based on static onboarding profile
        if skin_profile:
            if skin_profile.skin_concerns:
                condition -= len(skin_profile.skin_concerns.split(',')) * 3
            if skin_profile.sensitivities:
                condition -= len(skin_profile.sensitivities.split(',')) * 2
                
        # Deduct heavily based on Real-Time AI Skin Screening
        if latest_screening:
            if latest_screening.primary_concern:
                condition -= 15 # Major active concern detected by AI
            if latest_screening.secondary_concern:
                condition -= 10 # Secondary active concern detected by AI
            if latest_screening.stress_level == "High":
                condition -= 5
            
        condition = max(10, min(100, condition))
        
        # 3. Lifestyle Score -> Weight: 20%
        lifestyle = 60
        if latest_lifestyle:
            if latest_lifestyle.stress in ["Low", "Moderate"]:
                lifestyle += 20
            if latest_lifestyle.outdoor_time in ["Minimal", "Moderate"]:
                lifestyle += 10
            if latest_lifestyle.smoking == "Non-Smoker":
                lifestyle += 10
        else:
            lifestyle = 65
            
        lifestyle = max(10, min(100, lifestyle))

        # 4. Sleep Quality -> Weight: 15%
        sleep = 50
        if latest_lifestyle and latest_lifestyle.sleep_duration:
            if latest_lifestyle.sleep_duration >= 8:
                sleep = 100
            elif latest_lifestyle.sleep_duration >= 7:
                sleep = 85
            elif latest_lifestyle.sleep_duration >= 6:
                sleep = 65
            else:
                sleep = 40
        else:
            sleep = 70
        
        # 5. Hydration Level -> Weight: 10%
        hydration = 50
        if latest_lifestyle and latest_lifestyle.water_intake:
            if latest_lifestyle.water_intake >= 2.5:
                hydration = 100
            elif latest_lifestyle.water_intake >= 2.0:
                hydration = 80
            elif latest_lifestyle.water_intake >= 1.5:
                hydration = 60
            else:
                hydration = 30
        else:
            hydration = 60
        
        # 6. Routine Adherence Score -> Weight: 20%
        # Calculate based on logs_this_week (target is 7 days a week)
        adherence = int((logs_this_week / 7.0) * 100) if logs_this_week <= 7 else 100
        
        # 7. Overall Score (Weighted average)
        # Condition 35%, Lifestyle 20%, Sleep 15%, Routine 20%, Hydration 10%
        overall = int(
            (condition * 0.35) +
            (lifestyle * 0.20) +
            (sleep * 0.15) +
            (adherence * 0.20) +
            (hydration * 0.10)
        )
        
        if overall >= 85:
            interpretation = "Excellent! Keep up the good work."
        elif overall >= 70:
            interpretation = "Good. Minor tweaks could yield better results."
        elif overall >= 50:
            interpretation = "Fair. Pay attention to hydration and sleep."
        else:
            interpretation = "Needs Attention. Consider consulting a dermatologist."
            
        return SkinHealthScore(
            overall_score=overall,
            condition_score=condition,
            lifestyle_score=lifestyle,
            routine_adherence_score=adherence,
            sleep_score=sleep,
            hydration_score=hydration,
            interpretation=interpretation,
            logs_this_week=logs_this_week
        )

scoring_service = ScoringService()
