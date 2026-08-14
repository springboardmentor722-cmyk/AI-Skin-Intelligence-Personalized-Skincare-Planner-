from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, engine
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/assessment", tags=["Skin Assessment"])


@router.post("/run", response_model=schemas.AssessmentOut)
def run_assessment(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a skin profile before running an assessment.")

    result = engine.run_skin_assessment_hybrid(profile)

    # If the user has uploaded a photo, blend its CV signals into the scores.
    latest_photo = (
        db.query(models.SkinPhoto)
        .filter(models.SkinPhoto.user_id == current_user.id, models.SkinPhoto.face_detected == True)  # noqa: E712
        .order_by(models.SkinPhoto.uploaded_at.desc())
        .first()
    )
    if latest_photo:
        photo_signals = {
            "face_detected": latest_photo.face_detected,
            "redness_score": latest_photo.redness_score,
            "texture_score": latest_photo.texture_score,
            "evenness_score": latest_photo.evenness_score,
            "oiliness_score": latest_photo.oiliness_score,
        }
        result["condition_scores"] = engine.blend_photo_signals(result["condition_scores"], photo_signals)
        if result["condition_scores"]:
            result["overall_condition_score"] = round(sum(result["condition_scores"].values()) / len(result["condition_scores"]), 1)
            result["prioritized_concerns"] = sorted(result["condition_scores"], key=lambda c: result["condition_scores"][c], reverse=True)

    assessment = models.SkinAssessment(user_id=current_user.id, **result)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/history", response_model=List[schemas.AssessmentOut])
def get_assessment_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.SkinAssessment)
        .filter(models.SkinAssessment.user_id == current_user.id)
        .order_by(models.SkinAssessment.created_at.desc())
        .all()
    )


@router.get("/latest", response_model=schemas.AssessmentOut)
def get_latest_assessment(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assessment = (
        db.query(models.SkinAssessment)
        .filter(models.SkinAssessment.user_id == current_user.id)
        .order_by(models.SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment yet. Run one first.")
    return assessment
