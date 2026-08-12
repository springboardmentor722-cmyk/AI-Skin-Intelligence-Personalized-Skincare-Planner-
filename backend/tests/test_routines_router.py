"""backend/app/services/routines/router.py — router-level behavior not already
covered by test_routines_service.py's generation/guardrail tests. Calls the
handler function directly (not through the client/HTTP fixture) since the
notification hook under test only needs the real service calls, not an HTTP
round trip."""

import datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.services.notifications.service import list_my_notifications
from app.services.routines.models import Routine
from app.services.routines.router import log_step_completion
from app.services.routines.schemas import StepCompletionUpdate
from app.services.routines.service import get_or_generate_routines
from app.services.skin_profile.schemas import SkinProfileCreate
from app.services.skin_profile.service import create_profile


async def test_logging_a_step_completion_that_crosses_a_streak_writes_a_notification(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # skin_type_id=1 is Normal (verified live against the seeded skin_types table,
    # 2026-08-12: `SELECT skin_type_id, skin_type_name FROM skin_types ORDER BY
    # skin_type_id LIMIT 3` -> [(1, 'Normal'), (2, 'Dry'), (3, 'Oily')]). Any real
    # skin_type_id works here since this test doesn't check score/product content,
    # only that a routine with real steps gets generated.
    await create_profile(db_session, test_user_id, SkinProfileCreate(skin_type_id=1))
    routines = await get_or_generate_routines(db_session, test_user_id)
    all_step_ids = [step.step_id for routine in routines for step in routine.steps]
    assert all_step_ids, "test setup requires at least one generated routine step"

    # list_historical_active_step_ids (progress/service.py's get_adherence_series)
    # only counts a day as "assigned" if the routine's created_at predates that day —
    # backdate it so the 6 seeded historical days below actually count toward the
    # streak instead of being silently omitted as "nothing assigned yet".
    await db_session.execute(
        update(Routine)
        .where(Routine.user_id == test_user_id)
        .values(
            created_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
            - datetime.timedelta(days=7)
        )
    )
    await db_session.flush()

    collection = get_mongo_db()["routine_logs"]
    today = datetime.datetime.now(datetime.UTC).date()
    try:
        # Seed 6 prior days of 100%-complete adherence directly — routine_logs'
        # real document shape, matching routines/service.py's toggle_step_completion
        # (`_day_start` = midnight-combined naive datetime, `completed_steps` is a
        # list of {routine_step_id, completed_at}).
        for offset in range(6, 0, -1):
            day = today - datetime.timedelta(days=offset)
            await collection.insert_one(
                {
                    "user_id": test_user_id,
                    "log_date": datetime.datetime.combine(day, datetime.time.min),
                    "completed_steps": [
                        {
                            "routine_step_id": step_id,
                            "completed_at": datetime.datetime.now(datetime.UTC),
                        }
                        for step_id in all_step_ids
                    ],
                }
            )

        # Day 7 (today) goes through the real handler under test — this is what
        # actually exercises the new streak-notification code, not the seeding.
        user = {"id": test_user_id, "role": "user", "claims": {}}
        for step_id in all_step_ids:
            await log_step_completion(
                step_id, StepCompletionUpdate(completed=True), user, db_session
            )

        notifications = await list_my_notifications(db_session, test_user_id)
        assert any(n.notification_type == "streak" for n in notifications)
    finally:
        await collection.delete_many({"user_id": test_user_id})
