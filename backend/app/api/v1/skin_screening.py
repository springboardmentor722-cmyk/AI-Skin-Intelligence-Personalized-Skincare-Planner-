from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.schemas.skin_screening import SkinScreeningCreate, SkinScreeningUpdate, SkinScreeningResponse
from app.services.skin_screening import skin_screening_service

router = APIRouter()

@router.get("/history", response_model=List[SkinScreeningResponse])
def get_screening_history(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return skin_screening_service.get_user_screenings(db, current_user.id, skip=skip, limit=limit)

@router.get("/latest", response_model=SkinScreeningResponse)
def get_latest_screening(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return skin_screening_service.get_latest_screening(db, current_user.id)

@router.post("/analyze")
def analyze_image(
    screening_in: SkinScreeningCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    from app.services.groq_vision import groq_vision_service
    if not screening_in.image_data:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No image provided")
    
    return groq_vision_service.analyze_skin_image(
        screening_in.image_data, db=db, user_id=current_user.id
    )

@router.get("/{id}", response_model=SkinScreeningResponse)
def get_screening(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return skin_screening_service.get_screening_by_id(db, id, current_user.id)

@router.post("/", response_model=SkinScreeningResponse)
def create_screening(
    screening_in: SkinScreeningCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return skin_screening_service.create_screening(db, current_user.id, screening_in)

@router.put("/{id}", response_model=SkinScreeningResponse)
def update_screening(
    id: UUID,
    screening_in: SkinScreeningUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return skin_screening_service.update_screening(db, id, current_user.id, screening_in)

@router.delete("/{id}")
def delete_screening(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    try:
        skin_screening_service.delete_screening(db, id, current_user.id)
        return {"message": "Skin screening deleted successfully"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return 500 explicitly to avoid masking behind CORS
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/evaluate")
def evaluate_screening(
    user_profile_data: dict,
    lifestyle_data: dict,
    concerns_data: dict,
    goals_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Workflow: Read User Profile -> Evaluate -> Calculate Score -> Identify Concerns -> Generate Routine -> Save -> ASSIGN TO DERMATOLOGIST
    """
    from app.services.screening_engine import SkinScreeningEngine
    from app.services.prioritization_engine import ConcernPrioritizationEngine
    from app.services.scoring_engine import WeightedSkinScoreEngine
    from app.services.routine_generator import RoutineGenerator
    from app.models.score import SkinScore, ScoreBreakdown
    from app.models.workflow import ScreeningRequest
    from app.models.role import Role
    import uuid
    
    # 1. Normalize
    normalized_data = SkinScreeningEngine.process_screening(user_profile_data, lifestyle_data, concerns_data, goals_data)
    
    # 2. Prioritize Concerns
    prioritized_concerns = ConcernPrioritizationEngine.identify_skin_concerns(
        skin_type=normalized_data["base_profile"]["skin_type"],
        primary_concern=normalized_data["concerns_profile"]["primary"],
        secondary_concern=normalized_data["concerns_profile"]["secondary"],
        lifestyle_factors=normalized_data["lifestyle_factors"],
        sensitivity=normalized_data["base_profile"]["sensitivity"]
    )
    
    # 3. Score
    score_data = WeightedSkinScoreEngine.calculate_score(normalized_data, routine_consistency_percentage=0.0)
    
    # 4. Generate Routine (Will be marked PRELIMINARY due to our model changes)
    screening_id = str(uuid.uuid4()) # Dummy screening ID
    routine = RoutineGenerator.generate_routine(
        session=db,
        user_id=str(current_user.id),
        screening_id=screening_id,
        skin_type=normalized_data["base_profile"]["skin_type"],
        primary_concern=normalized_data["concerns_profile"]["primary"],
        sensitivity=normalized_data["base_profile"]["sensitivity"]
    )
    
    # 5. Save Score
    new_score = SkinScore(
        user_id=current_user.id,
        overall_score=score_data["overall_score"],
        skin_condition_score=score_data["individual_scores"]["skin_condition"],
        lifestyle_score=score_data["individual_scores"]["lifestyle"],
        sleep_score=score_data["individual_scores"]["sleep"],
        routine_score=score_data["individual_scores"]["routine_consistency"],
        hydration_score=score_data["individual_scores"]["hydration"],
        risk_level=score_data["risk_level"]
    )
    db.add(new_score)
    db.flush()
    
    breakdown = ScoreBreakdown(score_id=new_score.id, details=score_data["score_breakdown"])
    db.add(breakdown)
    
    # 6. Workflow Shift: Create a ScreeningRequest and auto-assign to a Dermatologist
    # 6. Assign based on Risk Level (Routing Engine)
    risk_level = score_data.get("risk_level", "Low")
    
    dermatologist_id = None
    consultant_id = None
    
    if risk_level == "High":
        derm_role = db.query(Role).filter(Role.name == "Dermatologist").first()
        first_derm = db.query(User).filter(User.role_id == derm_role.id).first() if derm_role else None
        dermatologist_id = first_derm.id if first_derm else None
    else:
        consultant_role = db.query(Role).filter(Role.name == "Skincare Consultant").first()
        first_consultant = db.query(User).filter(User.role_id == consultant_role.id).first() if consultant_role else None
        consultant_id = first_consultant.id if first_consultant else None
    
    workflow_request = ScreeningRequest(
        user_id=current_user.id,
        dermatologist_id=dermatologist_id,
        consultant_id=consultant_id,
        preliminary_routine_id=routine["routine_id"],
        status="ASSIGNED" if (dermatologist_id or consultant_id) else "SUBMITTED"
    )
    db.add(workflow_request)
    
    db.commit()
    
    return {
        "message": "Screening Submitted. A Dermatologist will review your case shortly.",
        "score": score_data,
        "concerns": prioritized_concerns,
        "workflow_status": workflow_request.status
    }

@router.get("/score/latest")
def get_latest_score(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    from app.models.score import SkinScore, ScoreBreakdown
    latest_score = db.query(SkinScore).filter(SkinScore.user_id == current_user.id).order_by(SkinScore.created_at.desc()).first()
    if not latest_score:
        return {"message": "No score found"}
        
    breakdown = db.query(ScoreBreakdown).filter(ScoreBreakdown.score_id == latest_score.id).first()
    
    return {
        "overall_score": latest_score.overall_score,
        "skin_score": latest_score.skin_condition_score,
        "lifestyle_score": latest_score.lifestyle_score,
        "sleep_score": latest_score.sleep_score,
        "hydration_score": latest_score.hydration_score,
        "routine_score": latest_score.routine_score,
        "risk_level": latest_score.risk_level,
        "breakdown": breakdown.details if breakdown else {}
    }

@router.post("/upload-image/{request_id}")
async def upload_skin_image(
    request_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    from app.models.workflow import ScreeningRequest
    from app.services.image_processing import ComputerVisionPipeline
    import os
    import shutil
    
    req = db.query(ScreeningRequest).filter(ScreeningRequest.id == request_id).first()
    if not req:
        return {"error": "Request not found"}
        
    # Secure save
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_location = f"{upload_dir}/{request_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Update DB
    req.image_url = file_location
    db.commit()
    
    # Run through CV pipeline
    cv_results = ComputerVisionPipeline.analyze_skin_image(file_location)
    
    return {
        "message": "Image uploaded and analyzed successfully.",
        "image_path": file_location,
        "cv_insights": cv_results
    }
