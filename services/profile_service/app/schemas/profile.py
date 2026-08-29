from typing import Optional
from pydantic import BaseModel


class ProfileCreate(BaseModel):
    age: int
    gender: str
    skin_type: str
    skin_tone: str
    skin_concerns: str
    allergies: str
    goals: str
    water_intake: float
    sleep_hours: float
    exercise_frequency: str
    stress_level: str
    sun_exposure: str
    consultant_id: Optional[int] = None
    dermatologist_id: Optional[int] = None


class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    skin_type: Optional[str] = None
    skin_tone: Optional[str] = None
    skin_concerns: Optional[str] = None
    allergies: Optional[str] = None
    goals: Optional[str] = None
    water_intake: Optional[float] = None
    sleep_hours: Optional[float] = None
    exercise_frequency: Optional[str] = None
    stress_level: Optional[str] = None
    sun_exposure: Optional[str] = None
    consultant_id: Optional[int] = None
    dermatologist_id: Optional[int] = None


class TreatmentNoteCreate(BaseModel):
    text: str