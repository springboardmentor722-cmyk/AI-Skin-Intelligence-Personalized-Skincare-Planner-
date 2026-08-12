from datetime import date
from typing import Optional
from pydantic import BaseModel

class ReportCreate(BaseModel):
    consultation_id: int
    report_date: Optional[date] = None
    patient_summary: Optional[str] = None
    clinical_observations: Optional[str] = None
    skin_assessment: Optional[str] = None
    recommendations: Optional[str] = None
    skincare_routine: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    additional_notes: Optional[str] = None
