"""Bug #4, bugs_report.md 2026-07-26: the notification bell showed a hardcoded fake
unread count with no backing data and no click handler. This is the real (currently
always-empty, since nothing in the app produces a notification yet) read path behind
it — reuses the `notifications` table already migrated in a7e9f4e50c45, which that
migration's own docstring says is exactly meant to gain a models.py "when it's actually
built"."""

import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import external_user_table
from app.main import app
from app.services.notifications.models import Notification
from app.services.notifications.service import list_my_notifications


async def _as(user_id: str, client: AsyncClient) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": user_id,
        "role": "user",
        "claims": {},
    }


async def test_list_my_notifications_is_empty_for_a_user_with_none(
    db_session: AsyncSession, test_user_id: str
) -> None:
    assert await list_my_notifications(db_session, test_user_id) == []


async def test_list_my_notifications_returns_only_the_caller_s_own_rows(
    db_session: AsyncSession, test_user_id: str
) -> None:
    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other Test User",
            emailVerified=False,
        )
    )
    db_session.add(
        Notification(
            user_id=test_user_id,
            title="Routine reminder",
            message="Time for your PM routine",
            notification_type="routine",
            is_read=False,
        )
    )
    db_session.add(
        Notification(
            user_id=other_user_id,
            title="Not yours",
            message="Should not show up",
            notification_type="routine",
            is_read=False,
        )
    )
    await db_session.flush()

    rows = await list_my_notifications(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].title == "Routine reminder"
    assert rows[0].is_read is False


async def test_notifications_endpoint_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/notifications/me")
    assert response.status_code in (401, 403)


async def test_notifications_endpoint_returns_the_caller_s_notifications(
    client: AsyncClient,
) -> None:
    await _as("test-notifications-http", client)
    try:
        response = await client.get("/api/v1/notifications/me")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    assert response.json() == []
