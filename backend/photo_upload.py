# backend/photo_upload.py

"""
MILESTONE 3 - Photo Upload Pipeline

This module provides:
1. Photo upload with automatic tagging
2. Thumbnail generation
3. Photo gallery retrieval
4. Before/after comparison
"""

import os
import shutil
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from PIL import Image
from fastapi import UploadFile, HTTPException
from backend.models import ProgressPhoto, SkinAssessment

UPLOAD_DIR = "static/uploads/photos"
THUMBNAIL_SIZE = (200, 200)


def ensure_upload_directory():
    """Create upload directory if it doesn't exist."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_uploaded_photo(
    db: Session,
    user_id: int,
    file: UploadFile,
    tag: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Save an uploaded photo with metadata.
    """
    ensure_upload_directory()
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save the file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Generate thumbnail
    thumbnail_filename = f"thumb_{filename}"
    thumbnail_path = os.path.join(UPLOAD_DIR, thumbnail_filename)
    try:
        img = Image.open(filepath)
        img.thumbnail(THUMBNAIL_SIZE)
        img.save(thumbnail_path)
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        thumbnail_path = None
    
    # Get current skin score
    latest_assessment = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == user_id
    ).order_by(SkinAssessment.created_at.desc()).first()
    skin_score = latest_assessment.overall_score if latest_assessment else None
    
    # Create database record
    photo = ProgressPhoto(
        user_id=user_id,
        image_url=f"/static/uploads/photos/{filename}",
        thumbnail_url=f"/static/uploads/photos/{thumbnail_filename}" if thumbnail_path else None,
        tag=tag or "Uncategorized",
        skin_score=skin_score,
        notes=notes,
        uploaded_at=datetime.utcnow()
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return {
        "id": photo.id,
        "image_url": photo.image_url,
        "thumbnail_url": photo.thumbnail_url,
        "tag": photo.tag,
        "skin_score": photo.skin_score,
        "notes": photo.notes,
        "uploaded_at": photo.uploaded_at.isoformat()
    }


def get_user_photos(
    db: Session,
    user_id: int,
    limit: int = 50,
    tag: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get all photos for a user, optionally filtered by tag.
    """
    query = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == user_id)
    
    if tag:
        query = query.filter(ProgressPhoto.tag == tag)
    
    photos = query.order_by(ProgressPhoto.uploaded_at.desc()).limit(limit).all()
    
    return [
        {
            "id": p.id,
            "image_url": p.image_url,
            "thumbnail_url": p.thumbnail_url,
            "tag": p.tag,
            "skin_score": p.skin_score,
            "notes": p.notes,
            "uploaded_at": p.uploaded_at.isoformat()
        }
        for p in photos
    ]


def get_before_after_comparison(
    db: Session,
    user_id: int
) -> Dict[str, Any]:
    """
    Get the earliest (Baseline) and latest photos for comparison.
    """
    # Get earliest photo (Baseline)
    baseline = db.query(ProgressPhoto).filter(
        ProgressPhoto.user_id == user_id,
        ProgressPhoto.tag == "Baseline"
    ).order_by(ProgressPhoto.uploaded_at.asc()).first()
    
    # If no Baseline tag, get the oldest photo
    if not baseline:
        baseline = db.query(ProgressPhoto).filter(
            ProgressPhoto.user_id == user_id
        ).order_by(ProgressPhoto.uploaded_at.asc()).first()
    
    # Get latest photo
    latest = db.query(ProgressPhoto).filter(
        ProgressPhoto.user_id == user_id
    ).order_by(ProgressPhoto.uploaded_at.desc()).first()
    
    return {
        "baseline": {
            "id": baseline.id if baseline else None,
            "image_url": baseline.image_url if baseline else None,
            "uploaded_at": baseline.uploaded_at.isoformat() if baseline else None,
            "skin_score": baseline.skin_score if baseline else None,
            "tag": baseline.tag if baseline else None
        } if baseline else None,
        "latest": {
            "id": latest.id if latest else None,
            "image_url": latest.image_url if latest else None,
            "uploaded_at": latest.uploaded_at.isoformat() if latest else None,
            "skin_score": latest.skin_score if latest else None,
            "tag": latest.tag if latest else None
        } if latest else None,
        "has_both": baseline is not None and latest is not None
    }


def delete_photo(
    db: Session,
    photo_id: int,
    user_id: int
) -> bool:
    """
    Delete a photo and its thumbnail.
    """
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == user_id
    ).first()
    
    if not photo:
        return False
    
    # Delete file if exists
    if photo.image_url:
        filepath = photo.image_url.replace("/static/uploads/photos/", "")
        filepath = os.path.join(UPLOAD_DIR, filepath)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    # Delete thumbnail if exists
    if photo.thumbnail_url:
        filepath = photo.thumbnail_url.replace("/static/uploads/photos/", "")
        filepath = os.path.join(UPLOAD_DIR, filepath)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    db.delete(photo)
    db.commit()
    return True