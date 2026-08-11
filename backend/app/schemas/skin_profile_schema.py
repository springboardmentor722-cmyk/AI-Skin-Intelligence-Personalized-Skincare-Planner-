from pydantic import BaseModel

class SkinProfileCreate(BaseModel):

    age: int
    gender: str
    skin_type: str
    skin_concerns: str
    allergies: str
    sensitivities: str