from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import List
from app.schemas.role import RoleResponse

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    role_name: str = "User"

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    roles: List[RoleResponse] = []
    
    class Config:
        from_attributes = True
