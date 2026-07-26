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
