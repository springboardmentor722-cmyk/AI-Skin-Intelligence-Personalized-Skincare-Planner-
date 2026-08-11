from pydantic import BaseModel


class ConsultationCreate(BaseModel):

    expert_id: int


class ConsultationResponse(BaseModel):

    id: int

    user_id: int

    expert_id: int

    status: str

    recommendation: str | None = None

    class Config:

        from_attributes = True