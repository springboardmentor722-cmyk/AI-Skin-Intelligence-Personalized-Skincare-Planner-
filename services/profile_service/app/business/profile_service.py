from sqlalchemy.orm import Session
from fastapi import HTTPException

from services.profile_service.app.models.profile import Profile
from services.profile_service.app.models.treatment_note import TreatmentNote
from services.profile_service.app.schemas.profile import ProfileCreate, ProfileUpdate
from services.auth_service.app.models.user import User


def create_profile(profile: ProfileCreate, current_user, db: Session):
    existing_profile = db.query(Profile).filter(Profile.user_id == current_user["id"]).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")

    new_profile = Profile(
        user_id=current_user["id"],
        age=profile.age, gender=profile.gender, skin_type=profile.skin_type,
        skin_tone=profile.skin_tone, skin_concerns=profile.skin_concerns,
        allergies=profile.allergies, goals=profile.goals,
        water_intake=profile.water_intake, sleep_hours=profile.sleep_hours,
        exercise_frequency=profile.exercise_frequency, stress_level=profile.stress_level,
        sun_exposure=profile.sun_exposure,
        consultant_id=profile.consultant_id, dermatologist_id=profile.dermatologist_id,
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return {"message": "Profile created successfully"}


def get_profile(current_user, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == current_user["id"]).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def update_profile(updates: ProfileUpdate, current_user, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == current_user["id"]).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def get_clients_for_consultant(current_user, db: Session):
    rows = db.query(Profile, User).join(User, Profile.user_id == User.id).filter(
        Profile.consultant_id == current_user["id"]
    ).all()
    return [
        {"id": user.id, "name": user.full_name, "email": user.email, "age": profile.age,
         "skin_type": profile.skin_type, "skin_concerns": profile.skin_concerns,
         "goals": profile.goals, "assigned_date": profile.created_at}
        for profile, user in rows
    ]


def get_patients_for_dermatologist(current_user, db: Session):
    rows = db.query(Profile, User).join(User, Profile.user_id == User.id).filter(
        Profile.dermatologist_id == current_user["id"]
    ).all()
    return [
        {"id": user.id, "name": user.full_name, "email": user.email, "age": profile.age,
         "skin_type": profile.skin_type, "skin_concerns": profile.skin_concerns,
         "goals": profile.goals, "assigned_date": profile.created_at}
        for profile, user in rows
    ]


def add_treatment_note(patient_id: int, text: str, current_user, db: Session):
    profile = db.query(Profile).filter(
        Profile.user_id == patient_id, Profile.dermatologist_id == current_user["id"]
    ).first()
    if not profile:
        raise HTTPException(status_code=403, detail="This patient is not assigned to you")

    note = TreatmentNote(patient_id=patient_id, dermatologist_id=current_user["id"], text=text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_treatment_notes(patient_id: int, current_user, db: Session):
    return db.query(TreatmentNote).filter(
        TreatmentNote.patient_id == patient_id,
        TreatmentNote.dermatologist_id == current_user["id"],
    ).order_by(TreatmentNote.created_at.desc()).all()