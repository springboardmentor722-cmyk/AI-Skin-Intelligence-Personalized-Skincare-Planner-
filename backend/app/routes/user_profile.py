from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_user_role
from datetime import datetime

router = APIRouter(prefix="/api/user", tags=["User Profile"])

# ============================================
# PYDANTIC SCHEMAS
# ============================================
class UserProfileUpdate(BaseModel):
    age: int = None
    gender: str = None
    phone: str = None

class SkinProfileUpdate(BaseModel):
    skin_type: str
    skin_tone: str = ""
    allergies: str = ""
    sensitivities: str = ""

# ============================================
# GET USER PROFILE
# ============================================
@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get user profile information"""
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "age": user.age,
            "gender": user.gender,
            "phone": user.phone,
            "role_id": user.role_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# UPDATE USER PROFILE
# ============================================
@router.put("/profile/update")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if profile_data.age:
            user.age = profile_data.age
        if profile_data.gender:
            user.gender = profile_data.gender
        if profile_data.phone:
            user.phone = profile_data.phone
        
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET SKIN PROFILE
# ============================================
@router.get("/skin-profile")
async def get_skin_profile(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get user's skin profile"""
    try:
        profile = db.execute(
            text("""
                SELECT profile_id, user_id, skin_type, skin_tone, allergies, sensitivities
                FROM user_profiles
                WHERE user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not profile:
            return {
                "profile_id": None,
                "user_id": current_user.user_id,
                "skin_type": None,
                "skin_tone": None,
                "allergies": None,
                "sensitivities": None
            }
        
        return {
            "profile_id": profile[0],
            "user_id": profile[1],
            "skin_type": profile[2],
            "skin_tone": profile[3],
            "allergies": profile[4],
            "sensitivities": profile[5]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# CREATE OR UPDATE SKIN PROFILE
# ============================================
@router.put("/skin-profile/update")
async def update_skin_profile(
    skin_data: SkinProfileUpdate,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Create or update user's skin profile"""
    try:
        # Check if profile exists
        existing = db.execute(
            text("SELECT profile_id FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if existing:
            # Update existing
            db.execute(
                text("""
                    UPDATE user_profiles
                    SET skin_type = :skin_type,
                        skin_tone = :skin_tone,
                        allergies = :allergies,
                        sensitivities = :sensitivities,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": current_user.user_id,
                    "skin_type": skin_data.skin_type,
                    "skin_tone": skin_data.skin_tone,
                    "allergies": skin_data.allergies,
                    "sensitivities": skin_data.sensitivities
                }
            )
        else:
            # Create new
            db.execute(
                text("""
                    INSERT INTO user_profiles
                    (user_id, skin_type, skin_tone, allergies, sensitivities, created_at, updated_at)
                    VALUES (:user_id, :skin_type, :skin_tone, :allergies, :sensitivities, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """),
                {
                    "user_id": current_user.user_id,
                    "skin_type": skin_data.skin_type,
                    "skin_tone": skin_data.skin_tone,
                    "allergies": skin_data.allergies,
                    "sensitivities": skin_data.sensitivities
                }
            )
        
        db.commit()
        return {"message": "Skin profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))