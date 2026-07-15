from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
import uuid
from pathlib import Path

from app.api import deps
from app.models.user import User
from app.models.professional import ProfessionalProfile

router = APIRouter()

UPLOAD_DIR = Path("uploads/professionals")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/profile")
async def create_professional_profile(
    full_name: str = Form(...),
    qualifications: str = Form(...),
    registration_number: str = Form(...),
    hospital_affiliation: str = Form(...),
    years_of_experience: int = Form(...),
    specialization: str = Form(...),
    consultation_mode: str = Form(...),
    available_days: str = Form(...),
    available_time: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    bio: Optional[str] = Form(""),
    medical_license: UploadFile = File(...),
    degree_certificate: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create or update a professional profile along with document uploads.
    """
    if current_user.role.name not in ["Dermatologist", "Skincare Consultant"]:
        raise HTTPException(status_code=403, detail="Only professionals can create a profile")

    # Handle File Uploads
    medical_license_filename = f"{current_user.id}_{uuid.uuid4().hex}_{medical_license.filename}"
    medical_license_path = UPLOAD_DIR / medical_license_filename
    with medical_license_path.open("wb") as buffer:
        shutil.copyfileobj(medical_license.file, buffer)

    degree_certificate_filename = f"{current_user.id}_{uuid.uuid4().hex}_{degree_certificate.filename}"
    degree_certificate_path = UPLOAD_DIR / degree_certificate_filename
    with degree_certificate_path.open("wb") as buffer:
        shutil.copyfileobj(degree_certificate.file, buffer)

    # Check if profile already exists
    profile = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = ProfessionalProfile(user_id=current_user.id)
        db.add(profile)
        
    profile.qualifications = qualifications
    profile.registration_number = registration_number
    profile.hospital_affiliation = hospital_affiliation
    profile.years_of_experience = years_of_experience
    profile.specialization = specialization
    profile.consultation_mode = consultation_mode
    profile.available_days = available_days
    profile.available_time = available_time
    profile.contact_email = email
    profile.contact_phone = phone
    profile.bio = bio
    profile.medical_license_url = str(medical_license_path)
    profile.degree_certificate_url = str(degree_certificate_path)
    profile.verification_status = "Pending"
    
    # Also update the user's name if it was set
    current_user.full_name = full_name

    db.commit()
    db.refresh(profile)

    return {"message": "Profile submitted for verification", "status": "Pending"}
