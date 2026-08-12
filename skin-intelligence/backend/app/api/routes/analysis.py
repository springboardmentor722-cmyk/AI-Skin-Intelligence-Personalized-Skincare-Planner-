import numpy as np
import cv2
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.core.deps import get_current_user
from app.models.user import User
from app.ml.inference import SkinAnalyzer
from app.db.mongo import scan_results_collection
from app.core.config import get_settings

router = APIRouter(prefix="/analysis", tags=["Skin Analysis"])
settings = get_settings()
analyzer = SkinAnalyzer()


@router.post("/scan")
async def analyze_face_scan(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Image must be JPEG, PNG, or WEBP")

    contents = await image.read()
    if len(contents) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit")

    np_arr = np.frombuffer(contents, np.uint8)
    image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    try:
        result = analyzer.analyze(image_bgr)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    doc = {
        "user_id": str(current_user.id),
        "created_at": datetime.utcnow(),
        "result": result.__dict__,
        # NOTE: raw image is intentionally NOT persisted here to minimize PII
        # retention risk. Store only if user opts into before/after tracking,
        # and encrypt at rest in a dedicated, access-controlled bucket.
    }
    inserted = await scan_results_collection.insert_one(doc)

    return {"scan_id": str(inserted.inserted_id), "analysis": result.__dict__}


@router.get("/history")
async def get_scan_history(current_user: User = Depends(get_current_user), limit: int = 20):
    cursor = scan_results_collection.find({"user_id": str(current_user.id)}).sort("created_at", -1).limit(limit)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
