from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from .. import models
from ..deps import get_current_user, require_roles
from .. import mongo

router = APIRouter(prefix="/api/journal", tags=["Lifestyle Journal (MongoDB)"])


class JournalEntryIn(BaseModel):
    mood: Optional[str] = None
    text: str
    tags: List[str] = []


class PreferencesIn(BaseModel):
    reminder_opt_in: bool = True
    preferred_reminder_time: Optional[str] = "09:00"
    dark_mode: bool = False
    units: str = "metric"


class NoteIn(BaseModel):
    target_user_id: int
    note: str


@router.get("/status")
def mongo_status():
    """Lets the frontend/README show whether MongoDB is actually connected."""
    return {"mongo_available": mongo.is_mongo_available()}


@router.post("/entries")
def add_entry(payload: JournalEntryIn, current_user: models.User = Depends(get_current_user)):
    result = mongo.add_journal_entry(current_user.id, payload.model_dump())
    if not result["stored"]:
        raise HTTPException(status_code=503, detail="MongoDB is not connected. Start it and try again.")
    return result["entry"]


@router.get("/entries")
def get_entries(current_user: models.User = Depends(get_current_user)):
    return mongo.list_journal_entries(current_user.id)


@router.put("/preferences")
def set_preferences(payload: PreferencesIn, current_user: models.User = Depends(get_current_user)):
    result = mongo.upsert_preferences(current_user.id, payload.model_dump())
    if not result["stored"]:
        raise HTTPException(status_code=503, detail="MongoDB is not connected. Start it and try again.")
    return {"saved": True}


@router.get("/preferences")
def read_preferences(current_user: models.User = Depends(get_current_user)):
    return mongo.get_preferences(current_user.id)


@router.post("/notes")
def add_note(
    payload: NoteIn,
    current_user: models.User = Depends(require_roles("consultant", "dermatologist", "admin")),
):
    result = mongo.add_note(current_user.id, payload.target_user_id, payload.note)
    if not result["stored"]:
        raise HTTPException(status_code=503, detail="MongoDB is not connected. Start it and try again.")
    return result["note"]


@router.get("/notes/{target_user_id}")
def get_notes(
    target_user_id: int,
    current_user: models.User = Depends(require_roles("consultant", "dermatologist", "admin")),
):
    return mongo.list_notes_for_user(target_user_id)
