from typing import Optional
from pydantic import BaseModel
from datetime import date

class ProgressCreate(BaseModel):
    skin_score: float
    hydration_score: Optional[float] = None
    acne_level: Optional[int] = None
    assessment_date: date
    notes: str | None = None
