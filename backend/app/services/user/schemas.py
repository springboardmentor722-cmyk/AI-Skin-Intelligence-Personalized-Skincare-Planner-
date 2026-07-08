from pydantic import BaseModel


class UserMeResponse(BaseModel):
    id: str
    role: str
