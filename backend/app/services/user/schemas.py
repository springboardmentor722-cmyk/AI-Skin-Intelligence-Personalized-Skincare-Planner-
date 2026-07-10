import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Keep in lockstep with the migration's CHECK constraints (a1e009276345) and
# web/lib/themes.ts's PALETTES — three independent sources of truth for the same
# fixed set, same discipline as SIGNUP_ROLES/ROLE_CARDS already living in two places.
PaletteId = Literal["default", "emerald", "ocean", "lavender", "sunset", "slate", "rose", "forest"]
ThemeMode = Literal["light", "dark", "system"]


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


class AppearancePreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palette: PaletteId
    theme_mode: ThemeMode
    accent_color: str | None
    font_size: str | None
    density: str | None
    motion_preference: str | None


class AppearancePreferenceUpdate(BaseModel):
    """All fields optional — PATCH-style partial update (`exclude_unset`), same
    convention as `UserProfileUpdate`. `accent_color`/`font_size`/`density`/
    `motion_preference` are accepted but not yet consumed by the v1 UI — genuine
    future-ready placeholders, not dead fields, since the column/schema/API round
    trip already works end to end."""

    palette: PaletteId | None = None
    theme_mode: ThemeMode | None = None
    accent_color: str | None = Field(default=None, max_length=20)
    font_size: str | None = Field(default=None, max_length=10)
    density: str | None = Field(default=None, max_length=10)
    motion_preference: str | None = Field(default=None, max_length=20)
