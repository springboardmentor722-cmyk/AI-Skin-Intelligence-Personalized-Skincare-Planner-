import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

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
    day_of_week: int | None = None  # 0-6, required when frequency='weekly'
    day_of_month: int | None = None  # 1-28, required when frequency='monthly'
    time_of_day: datetime.time = datetime.time(8, 0)
    is_active: bool = True


class ReportScheduleUpdate(BaseModel):
    frequency: Literal["weekly", "monthly"] | None = None
    day_of_week: int | None = None
    day_of_month: int | None = None
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
