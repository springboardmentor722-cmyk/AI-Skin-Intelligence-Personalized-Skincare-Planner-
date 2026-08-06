from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    username: str
    password: str
    confirm_password: str
    first_name: str
    last_name: str
    age: int
    gender: str
    phone: Optional[str] = None
    role_id: int = 1 
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response"""
    user_id: int
    email: str
    username: str
    first_name: str
    last_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    role_id: int  # ✅ ADD THIS
    is_active: bool
    is_approved: bool  # ✅ ADD THIS
    health_score: Optional[float] = None  # ✅ ADD THIS
    compliance_percentage: Optional[float] = None  # ✅ ADD THIS
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str
    user: UserResponse