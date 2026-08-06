from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user_profile import UserProfile
from app.models.user import User
from app.schemas.user_profile import UserProfileCreate, UserProfileUpdate, UserProfileResponse
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/profile", tags=["User Profile"])


@router.post("/create", response_model=UserProfileResponse, status_code=201)
async def create_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Create user skin profile"""
    try:
        print(f"DEBUG: Creating profile for user {current_user.user_id}")
        
        # Check if profile exists
        existing = db.execute(
            text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists"
            )
        
        # Insert directly with raw SQL
        db.execute(
            text("""
                INSERT INTO user_profiles (user_id, skin_type, skin_tone, allergies, sensitivities, created_at, updated_at)
                VALUES (:user_id, :skin_type, :skin_tone, :allergies, :sensitivities, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "skin_type": profile_data.skin_type,
                "skin_tone": profile_data.skin_tone,
                "allergies": profile_data.allergies,
                "sensitivities": profile_data.sensitivities
            }
        )
        db.commit()
        
        # Retrieve the created profile
        result = db.execute(
            text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        print(f"DEBUG: Profile created successfully")
        
        return UserProfileResponse(
            profile_id=result[0],
            user_id=result[1],
            skin_type=result[2],
            skin_tone=result[3],
            allergies=result[4],
            sensitivities=result[5],
            created_at=result[6],
            updated_at=result[7]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user skin profile"""
    try:
        result = db.execute(
            text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return UserProfileResponse(
            profile_id=result[0],
            user_id=result[1],
            skin_type=result[2],
            skin_tone=result[3],
            allergies=result[4],
            sensitivities=result[5],
            created_at=result[6],
            updated_at=result[7]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/update", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Update user skin profile"""
    try:
        # Check if profile exists
        existing = db.execute(
            text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Build update query dynamically
        updates = []
        params = {"user_id": current_user.user_id}
        
        if profile_data.skin_type:
            updates.append("skin_type = :skin_type")
            params["skin_type"] = profile_data.skin_type
        if profile_data.skin_tone:
            updates.append("skin_tone = :skin_tone")
            params["skin_tone"] = profile_data.skin_tone
        if profile_data.allergies is not None:
            updates.append("allergies = :allergies")
            params["allergies"] = profile_data.allergies
        if profile_data.sensitivities is not None:
            updates.append("sensitivities = :sensitivities")
            params["sensitivities"] = profile_data.sensitivities
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            update_query = f"UPDATE user_profiles SET {', '.join(updates)} WHERE user_id = :user_id"
            db.execute(text(update_query), params)
            db.commit()
        
        # Retrieve updated profile
        result = db.execute(
            text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        return UserProfileResponse(
            profile_id=result[0],
            user_id=result[1],
            skin_type=result[2],
            skin_tone=result[3],
            allergies=result[4],
            sensitivities=result[5],
            created_at=result[6],
            updated_at=result[7]
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/", status_code=204)
async def delete_profile(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Delete user skin profile"""
    try:
        # Check if profile exists
        existing = db.execute(
            text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        db.execute(
            text("DELETE FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        )
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )