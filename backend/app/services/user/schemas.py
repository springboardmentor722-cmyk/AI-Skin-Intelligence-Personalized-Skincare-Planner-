import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserMeResponse(BaseModel):
    id: str
    role: str


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str | None
    last_name: str | None
    profile_image_url: str | None
    date_of_birth: datetime.date | None
    gender: str | None
    phone_number: str | None
    location: str | None
    bio: str | None


class UserProfileUpdate(BaseModel):
    """All fields optional — PATCH-style partial update (`exclude_unset`)."""

    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    profile_image_url: str | None = Field(default=None, max_length=255)
    date_of_birth: datetime.date | None = None
    gender: str | None = Field(default=None, max_length=20)
    phone_number: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=150)
    bio: str | None = None
