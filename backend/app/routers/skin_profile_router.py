import os
import shutil
from datetime import date

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.progress import Progress
from app.models.skin_profile import SkinProfile
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/skin-profile", tags=["Skin Profile"])
UPLOAD_FOLDER = "uploads/skin_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def upsert_today_progress(db: Session, profile: SkinProfile, notes: str) -> None:
    """Keep one automatically generated skin-profile assessment per day."""
    record = db.query(Progress).filter(Progress.user_id == profile.user_id, Progress.assessment_date == date.today()).first()
    if record is None:
        record = Progress(user_id=profile.user_id, assessment_date=date.today())
        db.add(record)
    record.skin_score = profile.skin_score
    # The current skin profile holds these as labels (for example, "Good"),
    # so a numeric progress value would be invented. Leave them unset.
    record.hydration_score = None
    record.acne_level = None
    record.notes = notes

def save_image(user_id: int, skin_image: UploadFile) -> str:
    filename = f"{user_id}_{skin_image.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(skin_image.file, buffer)
    return filepath

@router.post("/")
def create_profile(age: int = Form(...), gender: str = Form(...), skin_type: str = Form(...), skin_concerns: str = Form(...), allergies: str = Form(...), sensitivities: str = Form(...), skin_image: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if existing:
        return {"message": "Profile already exists"}
    profile = SkinProfile(user_id=current_user.id, age=age, gender=gender, skin_type=skin_type, skin_concerns=skin_concerns, allergies=allergies, sensitivities=sensitivities, skin_image=save_image(current_user.id, skin_image), skin_score=87, ai_skin_type="Combination Skin", acne_level="Mild", pigmentation="Moderate", hydration="Good", oiliness="Medium", dark_circles="Low", recommendations="Use Salicylic Acid Face Wash\nVitamin C Serum\nNiacinamide Serum\nSPF 50 Sunscreen\nDrink 3 Litres Water\nSleep 8 Hours")
    db.add(profile); db.flush(); upsert_today_progress(db, profile, "Skin profile assessment"); db.commit(); db.refresh(profile)
    return {"message": "Profile Created Successfully", "profile": profile}

@router.get("/")
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first() or {}

@router.put("/")
def update_profile(age: int = Form(...), gender: str = Form(...), skin_type: str = Form(...), skin_concerns: str = Form(...), allergies: str = Form(...), sensitivities: str = Form(...), skin_image: UploadFile | None = File(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if profile is None:
        return {"message": "Profile not found"}
    profile.age, profile.gender, profile.skin_type = age, gender, skin_type
    profile.skin_concerns, profile.allergies, profile.sensitivities = skin_concerns, allergies, sensitivities
    if skin_image:
        profile.skin_image = save_image(current_user.id, skin_image)
    upsert_today_progress(db, profile, "Skin profile assessment updated")
    db.commit(); db.refresh(profile)
    return {"message": "Profile Updated Successfully", "profile": profile}
