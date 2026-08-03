import os
import uuid
from fastapi import UploadFile, HTTPException

def upload_progress_photo(file: UploadFile, user_id: str) -> str:
    # Validate file type (must be image)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed.")
    
    # Ensure static/uploads/progress exists
    upload_dir = os.path.join("static", "uploads", "progress")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    extension = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4()}{extension}"
    filepath = os.path.join(upload_dir, filename)
    
    # Save the file
    try:
        with open(filepath, "wb") as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    return f"/static/uploads/progress/{filename}"
