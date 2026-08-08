from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form
import os
import uuid as uuid_pkg
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.professional import ProfessionalProfile
from app.schemas.professional import ProfessionalUserResponse, ProfessionalProfileResponse

router = APIRouter()

@router.get("/", response_model=List[ProfessionalUserResponse])
def get_professionals(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a list of all verified professionals (Dermatologists and Consultants)
    """
    # Fetch users who have either Dermatologist or Skin Consultant roles
    from app.models.role import Role
    professionals = db.query(User).join(User.roles).filter(
        Role.name.in_(["Dermatologist", "Skincare Consultant"])
    ).options(joinedload(User.professional_profile)).all()
    
    # We map them to the response
    results = []
    for user in professionals:
        role_names = [r.name for r in user.roles]
        prof_data = user.professional_profile
        
        # If they don't have a profile yet, mock one or skip. We'll include them for now.
        prof_response = None
        if prof_data:
            prof_response = ProfessionalProfileResponse.model_validate(prof_data)
        else:
            # Create a mock profile if none exists so they show up in the directory for testing
            prof_response = ProfessionalProfileResponse(
                id=user.id, # using user id as mock id
                user_id=user.id,
                qualifications="Certified Professional",
                years_of_experience=5,
                specialization="General Skincare",
                consultation_mode="Virtual",
                verification_status="Verified"
            )
            
        results.append(
            ProfessionalUserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                roles=role_names,
                profile=prof_response
            )
        )
    return results

@router.post("/profile", response_model=ProfessionalProfileResponse)
async def create_or_update_professional_profile(
    full_name: str = Form(...),
    qualifications: str = Form(...),
    registration_number: str = Form(...),
    hospital_affiliation: str = Form(""),
    years_of_experience: int = Form(0),
    specialization: str = Form(""),
    consultation_mode: str = Form(""),
    available_days: str = Form(""),
    available_time: str = Form(""),
    email: str = Form(""),
    phone: str = Form(""),
    bio: str = Form(""),
    medical_license: Optional[UploadFile] = File(None),
    degree_certificate: Optional[UploadFile] = File(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create or update a professional profile from onboarding.
    """
    os.makedirs("uploads", exist_ok=True)
    
    license_filename = None
    if medical_license:
        license_filename = f"uploads/{uuid_pkg.uuid4()}_{medical_license.filename}"
        with open(license_filename, "wb") as f:
            f.write(await medical_license.read())
            
    degree_filename = None
    if degree_certificate:
        degree_filename = f"uploads/{uuid_pkg.uuid4()}_{degree_certificate.filename}"
        with open(degree_filename, "wb") as f:
            f.write(await degree_certificate.read())
            
    # Update user full name
    current_user.full_name = full_name
    
    # Auto-assign Dermatologist role if not already assigned
    from app.models.role import Role
    derm_role = db.query(Role).filter(Role.name == "Dermatologist").first()
    if derm_role and derm_role not in current_user.roles:
        current_user.roles.append(derm_role)
    
    # Check if profile exists
    prof = current_user.professional_profile
    if not prof:
        prof = ProfessionalProfile(
            user_id=current_user.id,
            qualifications=qualifications,
            registration_number=registration_number,
            hospital_affiliation=hospital_affiliation,
            years_of_experience=years_of_experience,
            specialization=specialization,
            consultation_mode=consultation_mode,
            available_days=available_days,
            available_time=available_time,
            medical_license_url=license_filename,
            degree_certificate_url=degree_filename,
            verification_status="Verified"
        )
        db.add(prof)
    else:
        prof.qualifications = qualifications
        prof.registration_number = registration_number
        prof.hospital_affiliation = hospital_affiliation
        prof.years_of_experience = years_of_experience
        prof.specialization = specialization
        prof.consultation_mode = consultation_mode
        prof.available_days = available_days
        prof.available_time = available_time
        if license_filename:
            prof.medical_license_url = license_filename
        if degree_filename:
            prof.degree_certificate_url = degree_filename
        prof.verification_status = "Verified"

    db.commit()
    db.refresh(prof)
    return ProfessionalProfileResponse.model_validate(prof)

@router.get("/{id}", response_model=ProfessionalUserResponse)
def get_professional(
    id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get details of a specific professional
    """
    user = db.query(User).options(joinedload(User.professional_profile)).filter(User.id == id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional not found")
        
    role_names = [r.name for r in user.roles]
    prof_data = user.professional_profile
    
    prof_response = None
    if prof_data:
        prof_response = ProfessionalProfileResponse.model_validate(prof_data)
    else:
        prof_response = ProfessionalProfileResponse(
            id=user.id,
            user_id=user.id,
            qualifications="Certified Professional",
            years_of_experience=5,
            specialization="General Skincare",
            consultation_mode="Virtual",
            verification_status="Verified"
        )
        
    return ProfessionalUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=role_names,
        profile=prof_response
    )
