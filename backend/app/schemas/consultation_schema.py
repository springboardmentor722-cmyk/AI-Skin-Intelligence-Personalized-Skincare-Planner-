from typing import Optional
from pydantic import Field

from pydantic import BaseModel


class ConsultationCreate(BaseModel):

    # Omit this for the common consultant. It remains available for a chosen
    # dermatologist consultation.
    expert_id: Optional[int] = None


class ConsultationResponse(BaseModel):

    id: int

    user_id: int

    expert_id: int

    status: str

    recommendation: str | None = None

    class Config:

        from_attributes = True


class ConsultantReviewCreate(BaseModel):
    recommendation: str = Field(min_length=1, max_length=5000)
    consultant_notes: Optional[str] = Field(default=None, max_length=5000)
    progress_observations: Optional[str] = Field(default=None, max_length=5000)
    routine_suggestions: Optional[str] = Field(default=None, max_length=5000)
    follow_up_suggestion: Optional[str] = Field(default=None, max_length=3000)
    requires_dermatologist: bool = False
