from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):

    name: str
    email: str

    role: Optional[str] = None

    qualification: Optional[str] = None
    experience: Optional[int] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    organization: Optional[str] = None