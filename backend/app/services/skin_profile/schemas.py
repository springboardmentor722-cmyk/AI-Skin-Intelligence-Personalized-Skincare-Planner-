import datetime

from pydantic import BaseModel, ConfigDict, Field


class SkinTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skin_type_id: int
    skin_type_name: str
    description: str | None


class SkinConcernRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    concern_id: int
    concern_name: str
    category: str | None


class SkinProfileConcernInput(BaseModel):
    concern_id: int
    severity_rating: int = Field(ge=1, le=10)
    priority_level: int = Field(ge=1, le=10)


class SkinProfileConcernRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    concern_id: int
    severity_rating: int | None
    priority_level: int | None


class SkinProfileCreate(BaseModel):
    skin_type_id: int
    age_group: str | None = None
    allergies: str | None = None
    sensitivities: str | None = None
    concerns: list[SkinProfileConcernInput] = Field(default_factory=list)


class SkinProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skin_profile_id: int
    skin_type_id: int
    age_group: str | None
    allergies: str | None
    sensitivities: str | None
    concerns: list[SkinProfileConcernRead]
    # Optional to match the SQLAlchemy model exactly — the SQL schema only gives these
    # columns a DEFAULT, not NOT NULL, so they're technically nullable even though a
    # value is always present in practice.
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


# --- Lifestyle logs (Mongo, docs/database_schemas/skinlytics_mongodb_schema_v3.txt) ---


class EnvironmentalExposure(BaseModel):
    sun_hours: float | None = None
    pollution_level: str | None = None  # low | moderate | high
    ac_exposure_hours: float | None = None


class LifestyleLogCreate(BaseModel):
    log_date: datetime.date
    sleep_hours: float | None = None
    sleep_quality: int | None = Field(default=None, ge=1, le=10)
    water_intake_liters: float | None = None
    stress_level: int | None = Field(default=None, ge=1, le=10)
    diet_quality: int | None = Field(default=None, ge=1, le=10)
    exercise_frequency: int | None = None
    smoking: bool | None = None
    alcohol_consumption: str | None = None  # none | occasional | regular
    environmental_exposure: EnvironmentalExposure | None = None


class LifestyleLogRead(LifestyleLogCreate):
    logged_at: datetime.datetime
