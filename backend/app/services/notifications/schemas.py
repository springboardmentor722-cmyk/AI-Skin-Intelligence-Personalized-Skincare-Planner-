import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    title: str | None
    message: str | None
    notification_type: str | None
    is_read: bool
    created_at: datetime.datetime | None


class ReminderCreate(BaseModel):
    reminder_type: str
    title: str
    message: str | None = None
    reminder_time: datetime.time | None = None
    frequency: str
    is_active: bool = True


class ReminderUpdate(BaseModel):
    title: str | None = None
    message: str | None = None
    reminder_time: datetime.time | None = None
    frequency: str | None = None
    is_active: bool | None = None


class ReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reminder_id: int
    reminder_type: str
    title: str
    message: str | None
    reminder_time: datetime.time | None
    frequency: str
    is_active: bool
