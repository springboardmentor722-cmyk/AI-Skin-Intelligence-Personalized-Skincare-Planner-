import datetime

from pydantic import BaseModel, ConfigDict, Field

# The only two shapes worker/consumers/reminders.py's cron actually understands —
# "daily" (paired with reminder_time) or "every_Nh" with N >= 1 (interval-based,
# reminder_time null). Reject anything else at the trust boundary rather than
# silently accepting a value the cron can only ever treat as "never due".
_FrequencyStr = Field(pattern=r"^(daily|every_[1-9]\d*h)$")


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
    frequency: str = _FrequencyStr
    is_active: bool = True


class ReminderUpdate(BaseModel):
    title: str | None = None
    message: str | None = None
    reminder_time: datetime.time | None = None
    frequency: str | None = Field(default=None, pattern=r"^(daily|every_[1-9]\d*h)$")
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
