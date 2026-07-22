import datetime
from typing import Any

from sqlalchemy import BigInteger, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# ADR-010's transactional outbox, made real (M3-A). append_outbox() never commits or
# rolls back — it only adds a row to the session it's given, so it lives or dies with
# whatever transaction the caller (a product/ingredient/skin_profile mutation) is
# already in. backend/app/worker/ is the only reader; nothing else ever writes ES/the
# vector DB directly (single-writer rule, ADR-005).


class Outbox(Base):
    __tablename__ = "outbox"
    __table_args__ = (Index("idx_outbox_processed_id", "processed_at", "outbox_id"),)

    outbox_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    aggregate_type: Mapped[str] = mapped_column(String(50))
    aggregate_id: Mapped[str] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column(String(50))
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP, server_default=func.now()
    )
    processed_at: Mapped[datetime.datetime | None] = mapped_column(TIMESTAMP, default=None)


async def append_outbox(
    db: AsyncSession,
    aggregate_type: str,
    aggregate_id: str,
    event_type: str,
    payload: dict[str, Any] | None = None,
) -> None:
    db.add(
        Outbox(
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            payload=payload,
        )
    )
