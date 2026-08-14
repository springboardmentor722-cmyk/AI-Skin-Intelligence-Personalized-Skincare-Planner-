from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_roles

router = APIRouter(prefix="/api/verification", tags=["Professional Verification"])


@router.get("/me", response_model=schemas.VerificationReviewOut)
def my_verification_status(current_user: models.User = Depends(get_current_user)):
    if current_user.role.value not in ("consultant", "dermatologist"):
        raise HTTPException(status_code=400, detail="Verification only applies to consultant and dermatologist accounts.")
    return current_user


@router.post("/submit", response_model=schemas.VerificationReviewOut)
def submit_credentials(
    payload: schemas.VerificationSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("consultant", "dermatologist")),
):
    current_user.license_number = payload.license_number
    current_user.credential_notes = payload.credential_notes
    current_user.verification_status = "pending"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/queue", response_model=List[schemas.VerificationReviewOut])
def verification_queue(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin")),
):
    return (
        db.query(models.User)
        .filter(models.User.verification_status == "pending")
        .order_by(models.User.created_at.asc())
        .all()
    )


@router.get("/all", response_model=List[schemas.VerificationReviewOut])
def all_professional_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin")),
):
    return (
        db.query(models.User)
        .filter(models.User.role.in_(["consultant", "dermatologist"]))
        .order_by(models.User.created_at.desc())
        .all()
    )


@router.post("/{user_id}/decide", response_model=schemas.VerificationReviewOut)
def decide_verification(
    user_id: int,
    payload: schemas.VerificationDecision,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin")),
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.role.value not in ("consultant", "dermatologist"):
        raise HTTPException(status_code=400, detail="This user's role doesn't require verification.")

    target.verification_status = "verified" if payload.approve else "rejected"
    target.verification_reviewed_by = current_user.id
    target.verification_reviewed_at = datetime.utcnow()
    if payload.reviewer_note:
        target.credential_notes = (target.credential_notes or "") + f"\n[Admin note: {payload.reviewer_note}]"
    db.commit()
    db.refresh(target)
    return target
