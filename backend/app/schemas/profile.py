from pydantic import BaseModel
from typing import Optional

class SkinProfileBase(BaseModel):
    skin_type: Optional[str] = None
    age_group: Optional[str] = None
    skin_concerns: Optional[str] = None
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None

class SkinProfileCreate(SkinProfileBase):
    pass

class LifestyleProfileBase(BaseModel):
    sleep_quality: Optional[str] = None
    water_intake: Optional[str] = None

class LifestyleProfileCreate(LifestyleProfileBase):
    pass

class OnboardingData(BaseModel):
    skin_profile: SkinProfileCreate
    lifestyle_profile: LifestyleProfileCreate
