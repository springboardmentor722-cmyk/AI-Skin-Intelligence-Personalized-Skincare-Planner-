import os
import shutil
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    SkinAssessment,
    SkinProfile,
    Lifestyle,
)
from app.services.recommendation_manager import regenerate_recommendations
from app.services.recommendation_storage import delete_saved_recommendations
from app.ai.predictor import predict_skin

router = APIRouter(
    prefix="/ai-assessment",
    tags=["AI Assessment"]
)

UPLOAD_FOLDER = "uploads/skin_images"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_skin_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    # Allow only image files
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image."
        )

    # Generate unique filename
    filename = f"{uuid4()}_{file.filename}"

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    # Save image
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # Save to database
        # Preprocess image
    prediction = predict_skin(file_path)

    # Save to database
    assessment = SkinAssessment(
        user_id=current_user.id,
        image_path=file_path,

        skin_type=prediction["skin_type"],

        acne_score=prediction["acne_score"],
        pigmentation_score=prediction["pigmentation_score"],
        redness_score=prediction["redness_score"],
        wrinkles_score=prediction["wrinkles_score"],
        dark_circle_score=prediction["dark_circle_score"],

        overall_score=prediction["overall_score"],
        
        ai_summary=prediction["ai_summary"],
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Get latest skin profile
    skin_profile = (
    db.query(SkinProfile)
    .filter(SkinProfile.user_id == current_user.id)
    .first()
)

    # Update skin type from AI
    if skin_profile:
     skin_profile.skin_type = prediction["skin_type"]

     db.commit()
     db.refresh(skin_profile)

# Get lifestyle
    lifestyle = (
    db.query(Lifestyle)
    .filter(Lifestyle.user_id == current_user.id)
    .first()
)

# Only regenerate if all required data exists
    if skin_profile and lifestyle:

        delete_saved_recommendations(
        db,
        current_user.id,
    )

        regenerate_recommendations(
        db,
        current_user.id,
        skin_profile,
        assessment,
        lifestyle,
    )

    return {
        "message": "Skin assessment completed successfully.",
        "assessment": {
            "id": assessment.id,
            "skin_type": assessment.skin_type,
            "acne_score": assessment.acne_score,
            "pigmentation_score": assessment.pigmentation_score,
            "redness_score": assessment.redness_score,
            "wrinkles_score": assessment.wrinkles_score,
            "dark_circle_score": assessment.dark_circle_score,
            "overall_score": assessment.overall_score,
            "ai_summary": assessment.ai_summary,
            
            "image_path": assessment.image_path,
        },
    }

@router.get("/history")
def get_assessment_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .all()
    )

    return [
        {
            "id": assessment.id,
            "skin_type": assessment.skin_type,
            "overall_score": assessment.overall_score,
            "acne_score": assessment.acne_score,
            "pigmentation_score": assessment.pigmentation_score,
            "redness_score": assessment.redness_score,
            "wrinkles_score": assessment.wrinkles_score,
            "dark_circle_score": assessment.dark_circle_score,
            "ai_summary": assessment.ai_summary,
            "image_path": assessment.image_path,
            "created_at": assessment.created_at,
        }
        for assessment in assessments
    ]