from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/user", tags=["User Profile"])

# ✅ PYDANTIC SCHEMAS
class UserProfileUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    phone: str = None
    age: int = None
    gender: str = None

class SkinProfileUpdate(BaseModel):
    skin_type: str
    primary_concern: str
    sensitivity_level: str

# GET USER PROFILE
@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user profile"""
    try:
        result = db.execute(
            text("""
                SELECT user_id, email, first_name, last_name, phone, age, gender
                FROM users WHERE user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": result[0],
            "email": result[1],
            "first_name": result[2],
            "last_name": result[3],
            "phone": result[4],
            "age": result[5],
            "gender": result[6]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE USER PROFILE
@router.put("/profile")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        updates = []
        params = {"user_id": current_user.user_id}
        
        if profile_data.first_name:
            updates.append("first_name = :first_name")
            params["first_name"] = profile_data.first_name
        if profile_data.last_name:
            updates.append("last_name = :last_name")
            params["last_name"] = profile_data.last_name
        if profile_data.phone:
            updates.append("phone = :phone")
            params["phone"] = profile_data.phone
        if profile_data.age:
            updates.append("age = :age")
            params["age"] = profile_data.age
        if profile_data.gender:
            updates.append("gender = :gender")
            params["gender"] = profile_data.gender
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = :user_id"
            db.execute(text(query), params)
            db.commit()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET SKIN PROFILE
@router.get("/skin-profile")
async def get_skin_profile(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user skin profile"""
    try:
        result = db.execute(
            text("""
                SELECT up.skin_type, up.primary_concern, up.sensitivity_level
                FROM user_profiles up
                WHERE up.user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            return {
                "skin_type": "",
                "primary_concern": "",
                "sensitivity_level": ""
            }
        
        return {
            "skin_type": result[0],
            "primary_concern": result[1],
            "sensitivity_level": result[2]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE SKIN PROFILE
@router.put("/skin-profile")
async def update_skin_profile(
    profile_data: SkinProfileUpdate,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update skin profile"""
    try:
        # Check if exists
        exists = db.execute(
            text("SELECT profile_id FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if exists:
            db.execute(
                text("""
                    UPDATE user_profiles 
                    SET skin_type = :skin_type, primary_concern = :concern, 
                        sensitivity_level = :sensitivity, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": current_user.user_id,
                    "skin_type": profile_data.skin_type,
                    "concern": profile_data.primary_concern,
                    "sensitivity": profile_data.sensitivity_level
                }
            )
        else:
            db.execute(
                text("""
                    INSERT INTO user_profiles (user_id, skin_type, primary_concern, sensitivity_level, created_at)
                    VALUES (:user_id, :skin_type, :concern, :sensitivity, CURRENT_TIMESTAMP)
                """),
                {
                    "user_id": current_user.user_id,
                    "skin_type": profile_data.skin_type,
                    "concern": profile_data.primary_concern,
                    "sensitivity": profile_data.sensitivity_level
                }
            )
        
        db.commit()
        return {"message": "Skin profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))