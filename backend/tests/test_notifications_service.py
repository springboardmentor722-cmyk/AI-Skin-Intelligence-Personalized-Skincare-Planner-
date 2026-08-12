"""Bug #4, bugs_report.md 2026-07-26: the notification bell showed a hardcoded fake
unread count with no backing data and no click handler. This is the real (currently
always-empty, since nothing in the app produces a notification yet) read path behind
it — reuses the `notifications` table already migrated in a7e9f4e50c45, which that
migration's own docstring says is exactly meant to gain a models.py "when it's actually
built"."""

import datetime
import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.notifications.models import Notification, Reminder
from app.services.notifications.service import list_my_notifications


@pytest.fixture
async def router_test_user() -> AsyncGenerator[str, None]:
    # The `client` fixture hits the real `get_db` (no rollback wrapper, unlike
    # `db_session`) — creating a reminder over HTTP really inserts a `reminders`
    # row FK'd to `user.id`, so this needs a real, committed user row (same
    # pattern as test_progress_router.py's fixture of the same name).
    user_id = f"test-reminders-router-{uuid.uuid4().hex[:16]}"
    async with async_session_factory() as session:
        await session.execute(
            external_user_table.insert().values(
                id=user_id, email=f"{user_id}@test.invalid", name="Test User", emailVerified=False
            )
        )
        await session.commit()
    try:
        yield user_id
    finally:
        async with async_session_factory() as session:
            await session.execute(delete(Reminder).where(Reminder.user_id == user_id))
            await session.execute(
                delete(external_user_table).where(external_user_table.c.id == user_id)
            )
            await session.commit()


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


async def test_create_notification_persists_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.service import create_notification

    created = await create_notification(
        db_session,
        test_user_id,
        title="Evening routine reminder",
        message="Time for your PM routine",
        notification_type="reminder",
    )
    await db_session.flush()

    assert created.notification_id is not None
    assert created.user_id == test_user_id
    assert created.title == "Evening routine reminder"
    assert created.is_read is False

    rows = await list_my_notifications(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].notification_id == created.notification_id


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


async def test_upsert_reminder_creates_a_new_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate
    from app.services.notifications.service import list_my_reminders, upsert_reminder

    created = await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_morning",
            title="Morning Routine",
            message="Time for your AM routine",
            reminder_time=datetime.time(8, 0),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    assert created.reminder_id is not None
    rows = await list_my_reminders(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].reminder_type == "routine_morning"


async def test_list_my_reminders_returns_only_the_caller_s_own_rows(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate
    from app.services.notifications.service import list_my_reminders, upsert_reminder

    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other Test User",
            emailVerified=False,
        )
    )
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration Nudge",
            message="Drink water",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await upsert_reminder(
        db_session,
        other_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Not yours",
            message="Should not show up",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await db_session.flush()

    rows = await list_my_reminders(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].title == "Hydration Nudge"


async def test_update_reminder_toggles_is_active(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate, ReminderUpdate
    from app.services.notifications.service import update_reminder, upsert_reminder

    created = await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_evening",
            title="Evening Routine",
            message="Time for your PM routine",
            reminder_time=datetime.time(21, 30),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    updated = await update_reminder(
        db_session, test_user_id, created.reminder_id, ReminderUpdate(is_active=False)
    )
    assert updated.is_active is False


async def test_update_reminder_rejects_another_user_s_reminder(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate, ReminderUpdate
    from app.services.notifications.service import update_reminder, upsert_reminder

    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other Test User",
            emailVerified=False,
        )
    )
    created = await upsert_reminder(
        db_session,
        other_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Not yours",
            message="msg",
            reminder_time=None,
            frequency="every_3h",
            is_active=True,
        ),
    )
    await db_session.flush()

    with pytest.raises(ValueError):
        await update_reminder(
            db_session, test_user_id, created.reminder_id, ReminderUpdate(is_active=False)
        )


async def test_delete_reminder_removes_the_row(db_session: AsyncSession, test_user_id: str) -> None:
    from app.services.notifications.schemas import ReminderCreate
    from app.services.notifications.service import (
        delete_reminder,
        list_my_reminders,
        upsert_reminder,
    )

    created = await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="msg",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await db_session.flush()

    await delete_reminder(db_session, test_user_id, created.reminder_id)
    await db_session.flush()

    assert await list_my_reminders(db_session, test_user_id) == []


async def test_reminders_endpoints_require_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reminders")
    assert response.status_code in (401, 403)


async def test_create_list_update_delete_reminder_via_http(
    client: AsyncClient, router_test_user: str
) -> None:
    await _as(router_test_user, client)
    try:
        create_response = await client.post(
            "/api/v1/reminders",
            json={
                "reminder_type": "hydration",
                "title": "Hydration Nudge",
                "message": "Drink water",
                "reminder_time": None,
                "frequency": "every_2h",
                "is_active": True,
            },
        )
        assert create_response.status_code == 200
        reminder_id = create_response.json()["reminder_id"]

        list_response = await client.get("/api/v1/reminders")
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1

        patch_response = await client.patch(
            f"/api/v1/reminders/{reminder_id}", json={"is_active": False}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["is_active"] is False

        delete_response = await client.delete(f"/api/v1/reminders/{reminder_id}")
        assert delete_response.status_code == 204

        final_list = await client.get("/api/v1/reminders")
        assert final_list.json() == []
    finally:
        app.dependency_overrides.pop(require_user, None)
