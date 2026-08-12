import datetime
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

ReportType = Literal["assessment", "progress", "routine"]


class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    include_profile_header: bool = True


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: int
    report_type: str
    summary: str | None
    generated_at: datetime.datetime | None


class ReportScheduleCreate(BaseModel):
    report_type: ReportType
    frequency: Literal["weekly", "monthly"]
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    day_of_month: int | None = Field(default=None, ge=1, le=28)
    time_of_day: datetime.time = datetime.time(8, 0)
    is_active: bool = True

    @model_validator(mode="after")
    def _matching_day_field_is_set(self) -> Self:
        if self.frequency == "weekly" and self.day_of_week is None:
            raise ValueError("day_of_week is required when frequency is 'weekly'")
        if self.frequency == "monthly" and self.day_of_month is None:
            raise ValueError("day_of_month is required when frequency is 'monthly'")
        return self


class ReportScheduleUpdate(BaseModel):
    frequency: Literal["weekly", "monthly"] | None = None
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    day_of_month: int | None = Field(default=None, ge=1, le=28)
    time_of_day: datetime.time | None = None
    is_active: bool | None = None


class ReportScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: int
    report_type: str
    frequency: str
    day_of_week: int | None
    day_of_month: int | None
    time_of_day: datetime.time
    is_active: bool
