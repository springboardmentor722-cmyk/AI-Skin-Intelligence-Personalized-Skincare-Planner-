from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_user_role
import os
from datetime import datetime
import shutil

router = APIRouter(prefix="/api/user/progress", tags=["Progress"])

UPLOAD_DIR = "uploads/progress"

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============================================
# UPLOAD PROGRESS PHOTO
# ============================================
@router.post("/upload-photo")
async def upload_progress_photo(
    file: UploadFile = File(...),
    photo_type: str = "before",
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Upload a progress photo (before/after)"""
    try:
        print(f"Uploading photo for user {current_user.user_id}, type: {photo_type}")
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Create filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user.user_id}_{photo_type}_{timestamp}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Save to database
        image_url = f"/uploads/progress/{filename}"
        
        db.execute(
            text("""
                INSERT INTO progress_photos
                (user_id, image_url, photo_type, created_at)
                VALUES (:user_id, :image_url, :photo_type, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "image_url": image_url,
                "photo_type": photo_type
            }
        )
        
        db.commit()
        
        print(f"Photo uploaded successfully: {image_url}")
        
        return {
            "message": f"{photo_type.capitalize()} photo uploaded successfully",
            "image_url": image_url
        }
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error uploading photo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET PROGRESS PHOTOS
# ============================================
@router.get("/photos")
async def get_progress_photos(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get all progress photos for the user"""
    try:
        photos = db.execute(
            text("""
                SELECT photo_id, user_id, image_url, photo_type, created_at
                FROM progress_photos
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        photo_list = [
            {
                "photo_id": p[0],
                "user_id": p[1],
                "image_url": p[2],
                "photo_type": p[3],
                "created_at": str(p[4])
            }
            for p in photos
        ]
        
        print(f"Retrieved {len(photo_list)} photos for user {current_user.user_id}")
        
        return {"photos": photo_list, "count": len(photo_list)}
    except Exception as e:
        print(f"Error fetching photos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# DELETE PROGRESS PHOTO
# ============================================
@router.delete("/photos/{photo_id}")
async def delete_progress_photo(
    photo_id: int,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Delete a progress photo"""
    try:
        # Get photo to verify ownership and get filename
        photo = db.execute(
            text("""
                SELECT photo_id, image_url FROM progress_photos
                WHERE photo_id = :photo_id AND user_id = :user_id
            """),
            {"photo_id": photo_id, "user_id": current_user.user_id}
        ).first()
        
        if not photo:
            raise HTTPException(status_code=404, detail="Photo not found")
        
        # Delete from database
        db.execute(
            text("DELETE FROM progress_photos WHERE photo_id = :photo_id"),
            {"photo_id": photo_id}
        )
        db.commit()
        
        # Try to delete file
        try:
            filename = photo[1].replace("/uploads/progress/", "")
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except:
            pass
        
        return {"message": "Photo deleted successfully"}
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    # ============================================
# GET PROGRESS STATS
# ============================================
@router.get("/stats")
async def get_progress_stats(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get user's progress statistics"""
    try:
        stats = db.execute(
            text("""
                SELECT progress_percentage, notes, created_at
                FROM progress_stats
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not stats:
            return {
                "progress_percentage": 0,
                "notes": "",
                "created_at": None
            }
        
        return {
            "progress_percentage": stats[0],
            "notes": stats[1],
            "created_at": str(stats[2])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# UPDATE PROGRESS STATS
# ============================================
@router.post("/update")
async def update_progress_stats(
    progress_data: dict,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Update user's progress percentage and notes"""
    try:
        progress_percentage = progress_data.get("progress_percentage", 0)
        notes = progress_data.get("notes", "")
        
        # Check if record exists
        existing = db.execute(
            text("SELECT id FROM progress_stats WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if existing:
            # Update
            db.execute(
                text("""
                    UPDATE progress_stats
                    SET progress_percentage = :progress_percentage,
                        notes = :notes,
                        created_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": current_user.user_id,
                    "progress_percentage": progress_percentage,
                    "notes": notes
                }
            )
        else:
            # Insert
            db.execute(
                text("""
                    INSERT INTO progress_stats
                    (user_id, progress_percentage, notes, created_at)
                    VALUES (:user_id, :progress_percentage, :notes, CURRENT_TIMESTAMP)
                """),
                {
                    "user_id": current_user.user_id,
                    "progress_percentage": progress_percentage,
                    "notes": notes
                }
            )
        
        db.commit()
        
        return {"message": "Progress updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    