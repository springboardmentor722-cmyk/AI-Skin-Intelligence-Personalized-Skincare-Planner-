from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role
import os
from datetime import datetime
from PIL import Image
import numpy as np

router = APIRouter(prefix="/api/progress", tags=["Progress"])

UPLOAD_DIR = "uploads/progress"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def calculate_image_similarity(image_path1, image_path2):
    """
    Calculate improvement percentage by comparing two images
    Returns percentage (0-100)
    """
    try:
        # Open images
        img1 = Image.open(image_path1).convert('RGB')
        img2 = Image.open(image_path2).convert('RGB')
        
        # Resize to same size for comparison
        size = (200, 200)
        img1 = img1.resize(size)
        img2 = img2.resize(size)
        
        # Convert to numpy arrays
        arr1 = np.array(img1, dtype=np.float32)
        arr2 = np.array(img2, dtype=np.float32)
        
        # Calculate pixel-wise difference
        diff = np.abs(arr1 - arr2)
        
        # Calculate average difference (0-255 scale)
        avg_diff = np.mean(diff)
        
        # Convert to improvement percentage
        # Higher difference = more improvement (skin changed)
        # Map 0-128 difference range to 0-100% improvement
        improvement_pct = min(100, max(0, (avg_diff / 1.28)))
        
        return round(improvement_pct, 2)
    
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        # Return a default if calculation fails
        return 0.0

# UPLOAD BEFORE PHOTO
@router.post("/upload-before")
async def upload_before_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Upload before photo"""
    try:
        # Check if user already has progress tracking
        existing = db.execute(
            text("SELECT photo_id FROM before_after_photos WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="You already have progress tracking. Upload after photo first.")
        
        # Save file
        filename = f"before_{current_user.user_id}_{datetime.now().timestamp()}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(await file.read())
        
        # Insert into DB
        db.execute(
            text("""
                INSERT INTO before_after_photos 
                (user_id, before_image_url, skin_concern, uploaded_date, created_at)
                VALUES (:user_id, :image_url, :concern, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": current_user.user_id,
                "image_url": f"/uploads/progress/{filename}",
                "concern": "Skin improvement tracking"
            }
        )
        db.commit()
        
        return {"message": "Before photo uploaded successfully", "file_path": f"/uploads/progress/{filename}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# UPLOAD AFTER PHOTO & AUTO-CALCULATE IMPROVEMENT
@router.post("/upload-after")
async def upload_after_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Upload after photo and automatically calculate improvement"""
    try:
        # Check if before photo exists and get its path
        before = db.execute(
            text("SELECT photo_id, before_image_url FROM before_after_photos WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        ).first()
        
        if not before:
            raise HTTPException(status_code=400, detail="Please upload before photo first")
        
        # Save after file
        filename = f"after_{current_user.user_id}_{datetime.now().timestamp()}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        
        # Get before photo path
        before_image_url = before[1]  # e.g., /uploads/progress/before_26_xxx.jpg
        before_filepath = os.path.join(UPLOAD_DIR, os.path.basename(before_image_url))
        # Calculate improvement percentage
        improvement_percentage = calculate_image_similarity(before_filepath, filepath)
        # Convert numpy float to Python float
        improvement_percentage = float(improvement_percentage)

        # Update DB with after photo and calculated improvement %
        db.execute(
    text("""
        UPDATE before_after_photos 
        SET after_image_url = :image_url, 
            improvement_percentage = :improvement,
            days_elapsed = 30
        WHERE user_id = :user_id
    """),
    {
        "user_id": current_user.user_id,
        "image_url": f"/uploads/progress/{filename}",
        "improvement": improvement_percentage
    }
)
        db.commit()
        
        return {
            "message": "After photo uploaded successfully",
            "file_path": f"/uploads/progress/{filename}",
            "improvement_percentage": improvement_percentage,
            "analysis": f"Your skin shows {improvement_percentage}% improvement!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET PROGRESS DATA
@router.get("/")
async def get_progress(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user's progress (before/after photos and improvement %)"""
    try:
        result = db.execute(
            text("""
                SELECT photo_id, before_image_url, after_image_url, skin_concern, 
                       improvement_percentage, uploaded_date, notes
                FROM before_after_photos WHERE user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not result:
            return {"message": "No progress data yet"}
        
        improvement = float(result[4]) if result[4] else 0
        
        # Determine status based on improvement
        if improvement == 0:
            status = "No improvement detected yet"
        elif improvement < 20:
            status = "Slight improvement"
        elif improvement < 50:
            status = "Moderate improvement"
        elif improvement < 80:
            status = "Significant improvement"
        else:
            status = "Excellent improvement!"
        
        return {
            "photo_id": result[0],
            "before_image": result[1],
            "after_image": result[2],
            "skin_concern": result[3],
            "improvement_percentage": improvement,
            "status": status,
            "uploaded_date": str(result[5]) if result[5] else None,
            "notes": result[6]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# DELETE PROGRESS
@router.delete("/")
async def delete_progress(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Delete progress data"""
    try:
        db.execute(
            text("DELETE FROM before_after_photos WHERE user_id = :user_id"),
            {"user_id": current_user.user_id}
        )
        db.commit()
        
        return {"message": "Progress data deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    