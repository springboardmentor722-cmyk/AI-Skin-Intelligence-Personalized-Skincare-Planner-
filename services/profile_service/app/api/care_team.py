from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.profile_service.app.db.dependencies import get_db
from services.profile_service.app.schemas.profile import TreatmentNoteCreate
from services.profile_service.app.business.profile_service import (
    get_clients_for_consultant, get_patients_for_dermatologist,
    add_treatment_note, get_treatment_notes,
)
from services.auth_service.app.utils.roles import require_role

router = APIRouter(tags=["Care Team"])


@router.get("/consultant/clients")
def consultant_clients(current_user=Depends(require_role("consultant")), db: Session = Depends(get_db)):
    return get_clients_for_consultant(current_user, db)


@router.get("/dermatologist/patients")
def dermatologist_patients(current_user=Depends(require_role("dermatologist")), db: Session = Depends(get_db)):
    return get_patients_for_dermatologist(current_user, db)


@router.post("/dermatologist/patients/{patient_id}/notes")
def create_note(patient_id: int, note: TreatmentNoteCreate, current_user=Depends(require_role("dermatologist")), db: Session = Depends(get_db)):
    return add_treatment_note(patient_id, note.text, current_user, db)


@router.get("/dermatologist/patients/{patient_id}/notes")
def list_notes(patient_id: int, current_user=Depends(require_role("dermatologist")), db: Session = Depends(get_db)):
    return get_treatment_notes(patient_id, current_user, db)