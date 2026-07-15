from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.workflow import ScreeningRequest, ClinicalReview
from app.models.routine import SkincareRoutine

router = APIRouter()

@router.get("/queue/dermatologist")
def get_dermatologist_queue(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Fetch all pending screening requests assigned to the logged-in dermatologist.
    """
    if current_user.role.name != "Dermatologist":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    requests = db.query(ScreeningRequest).filter(
        ScreeningRequest.dermatologist_id == current_user.id,
        ScreeningRequest.status == "ASSIGNED"
    ).all()
    
    result = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        result.append({
            "id": str(req.id),
            "user_id": str(req.user_id),
            "patient_name": user.username if user else "Unknown Patient",
            "status": req.status,
            "created_at": req.created_at,
            "risk_level": "High Priority" # Hardcoded for now since they are routed here only if High Risk
        })
    
    return result

@router.get("/queue/consultant")
def get_consultant_queue(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Fetch all pending screening requests assigned to the logged-in skincare consultant.
    """
    if current_user.role.name != "Skincare Consultant":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    requests = db.query(ScreeningRequest).filter(
        ScreeningRequest.consultant_id == current_user.id,
        ScreeningRequest.status == "ASSIGNED"
    ).all()
    
    result = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        result.append({
            "id": str(req.id),
            "user_id": str(req.user_id),
            "patient_name": user.username if user else "Unknown Patient",
            "status": req.status,
            "created_at": req.created_at,
            "risk_level": "Standard Priority" # Hardcoded for now
        })
    
    return result

@router.post("/review/{request_id}/accept")
def accept_screening(
    request_id: UUID,
    notes: str = "",
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Accepts the AI preliminary routine and marks it ACTIVE for the user.
    """
    if current_user.role.name != "Dermatologist":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(ScreeningRequest).filter(ScreeningRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Update Request Status
    req.status = "ACCEPTED"
    
    # Create Clinical Review Audit
    review = ClinicalReview(
        screening_request_id=req.id,
        dermatologist_id=current_user.id,
        clinical_notes=notes,
        action_taken="ACCEPTED"
    )
    db.add(review)
    
    # Mark Routine as Active for the user
    if req.preliminary_routine_id:
        routine = db.query(SkincareRoutine).filter(SkincareRoutine.id == req.preliminary_routine_id).first()
        if routine:
            routine.status = "ACTIVE"
            
    db.commit()
    return {"message": "Screening approved. Routine is now active for the patient."}

@router.post("/review/{request_id}/reject")
def reject_screening(
    request_id: UUID,
    reason: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Rejects the screening and sends it back to the user for more info.
    """
    if current_user.role.name != "Dermatologist":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(ScreeningRequest).filter(ScreeningRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = "REJECTED"
    
    review = ClinicalReview(
        screening_request_id=req.id,
        dermatologist_id=current_user.id,
        clinical_notes=reason,
        action_taken="REJECTED"
    )
    db.add(review)
    db.commit()
    
    return {"message": "Screening rejected. User has been notified."}
