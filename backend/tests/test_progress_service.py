"""app/services/progress/service.py (M3-E) — photo pipeline (real MinIO round trip,
EXIF stripped), Mongo progress_logs upsert idempotence, adherence series from real
routine_logs, milestone detection. Real Docker stores throughout, this repo's
established testing philosophy (no mocks)."""

import datetime
import io
from collections.abc import AsyncGenerator

import pytest
from PIL import Image
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.services.progress.schemas import AdherenceDay, Milestone, ScoreTrendPoint
from app.services.progress.service import (
    _detect_score_band_milestones,
    _detect_streak_milestones,
    get_adherence_series,
    get_compliance_percentages,
    list_progress_photos,
    upload_progress_photo,
    upsert_progress_log,
)
from app.services.routines.models import Routine, RoutineStep


def _real_jpeg_bytes() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), color="green").save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture
async def progress_test_user(test_user_id: str) -> AsyncGenerator[str, None]:
    # test_user_id (conftest.py) already gives a real, FK-safe user row rolled back
    # with db_session — this wrapper only adds Mongo cleanup, since Mongo has no
    # equivalent transaction rollback here (test_skin_profile_service.py's own
    # module docstring explains the same split).
    try:
        yield test_user_id
    finally:
        await get_mongo_db()["progress_logs"].delete_many({"user_id": test_user_id})
        await get_mongo_db()["routine_logs"].delete_many({"user_id": test_user_id})


async def test_upload_progress_photo_strips_exif_and_lands_in_pg(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "selfie.jpg"
    )

    assert photo.progress_image_id is not None
    assert photo.image_url  # a storage key, not a public URL
    assert photo.image_stage == "progress"


async def test_list_progress_photos_orders_oldest_first(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    first = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg"
    )
    second = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "two.jpg"
    )

    photos = await list_progress_photos(db_session, progress_test_user)

    assert [p.progress_image_id for p in photos] == [
        first.progress_image_id,
        second.progress_image_id,
    ]


async def test_upsert_progress_log_is_idempotent_one_doc_per_user_per_week(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    await upsert_progress_log(db_session, get_mongo_db(), progress_test_user, notes="Week one")
    await upsert_progress_log(db_session, get_mongo_db(), progress_test_user, notes="Updated note")

    docs = [
        doc async for doc in get_mongo_db()["progress_logs"].find({"user_id": progress_test_user})
    ]
    assert len(docs) == 1
    assert docs[0]["notes"] == "Updated note"


async def test_upsert_progress_log_carries_before_after_from_uploaded_photos(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    await upload_progress_photo(db_session, progress_test_user, _real_jpeg_bytes(), "before.jpg")
    await upload_progress_photo(db_session, progress_test_user, _real_jpeg_bytes(), "after.jpg")

    log = await upsert_progress_log(db_session, get_mongo_db(), progress_test_user, notes=None)

    assert log.before_image_url is not None
    assert log.after_image_url is not None
    assert log.before_image_url != log.after_image_url


async def test_adherence_series_reflects_real_routine_logs(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    # No routine ever assigned for this throwaway user -> every day in the window
    # has zero assigned steps, so each day is honestly 0.0 (not fabricated), and
    # the series still covers the full requested window (see
    # list_historical_active_step_ids/get_adherence_series's per-day contract).
    series = await get_adherence_series(db_session, progress_test_user, days=7)
    assert len(series) == 7
    assert all(day.completed_ratio == 0.0 for day in series)


async def test_adherence_series_uses_the_routine_active_on_each_historical_day(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    old_routine = Routine(
        user_id=progress_test_user, routine_name="Old AM", routine_type="AM", is_active=False
    )
    db_session.add(old_routine)
    await db_session.flush()
    old_step = RoutineStep(routine_id=old_routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(old_step)
    await db_session.flush()
    await db_session.execute(
        update(Routine)
        .where(Routine.routine_id == old_routine.routine_id)
        .values(
            created_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
            - datetime.timedelta(days=10)
        )
    )
    new_routine = Routine(
        user_id=progress_test_user, routine_name="New AM", routine_type="AM", is_active=True
    )
    db_session.add(new_routine)
    await db_session.flush()
    new_step = RoutineStep(routine_id=new_routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(new_step)
    await db_session.commit()

    # Complete the OLD step on a day the old routine was active - proves the
    # series judges that day against the old step, not the new one (which didn't
    # exist yet and would never match, silently zeroing this day out under the
    # old, buggy behavior).
    old_day = datetime.datetime.now(datetime.UTC).date() - datetime.timedelta(days=8)
    await get_mongo_db()["routine_logs"].insert_one(
        {
            "user_id": progress_test_user,
            "log_date": datetime.datetime.combine(old_day, datetime.time.min),
            "completed_steps": [{"routine_step_id": old_step.step_id}],
        }
    )

    series = await get_adherence_series(db_session, progress_test_user, days=10)

    old_day_entry = next(d for d in series if d.date == old_day)
    assert old_day_entry.completed_ratio == 1.0


async def test_get_compliance_percentages_computes_completed_over_assigned(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    routine = Routine(
        user_id=progress_test_user, routine_name="AM", routine_type="AM", is_active=True
    )
    db_session.add(routine)
    await db_session.flush()
    step_a = RoutineStep(routine_id=routine.routine_id, step_order=1, step_name="Cleanse")
    step_b = RoutineStep(routine_id=routine.routine_id, step_order=2, step_name="Moisturize")
    db_session.add_all([step_a, step_b])
    await db_session.flush()
    # Backdate so this routine is considered assigned across the whole 7-day
    # window under test (list_historical_active_step_ids only counts a routine
    # from its created_at onward) - without this, a routine created "just now"
    # would only count as assigned for today, not the preceding days.
    await db_session.execute(
        update(Routine)
        .where(Routine.routine_id == routine.routine_id)
        .values(
            created_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
            - datetime.timedelta(days=100)
        )
    )
    await db_session.commit()

    today = datetime.datetime.now(datetime.UTC).date()
    # 2 of the last 7 days: both steps completed. The rest: nothing logged.
    for offset in (0, 1):
        day = today - datetime.timedelta(days=offset)
        await get_mongo_db()["routine_logs"].insert_one(
            {
                "user_id": progress_test_user,
                "log_date": datetime.datetime.combine(day, datetime.time.min),
                "completed_steps": [
                    {"routine_step_id": step_a.step_id},
                    {"routine_step_id": step_b.step_id},
                ],
            }
        )

    result = await get_compliance_percentages(db_session, progress_test_user)

    # 7-day window: 2 days x 2 steps completed = 4, out of 7 days x 2 steps = 14.
    assert result.seven_day is not None
    assert abs(result.seven_day - 4 / 14) < 0.001
    assert result.thirty_day is not None
    assert result.ninety_day is not None


async def test_get_compliance_percentages_excludes_zero_assigned_days_from_denominator(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    """A user with no routine at all yet has nothing assigned on any day - the
    percentage must be None (an honest empty state), never a fabricated 0%."""
    result = await get_compliance_percentages(db_session, progress_test_user)

    assert result.seven_day is None
    assert result.thirty_day is None
    assert result.ninety_day is None


async def test_streak_milestone_fires_at_seven_days() -> None:
    today = datetime.date(2026, 1, 8)
    seven_perfect_days = [
        AdherenceDay(date=today - datetime.timedelta(days=6 - i), completed_ratio=1.0)
        for i in range(7)
    ]

    milestones = _detect_streak_milestones(seven_perfect_days)

    assert any(m.label == "7-day routine streak" for m in milestones)


async def test_streak_milestone_does_not_fire_for_a_broken_streak() -> None:
    today = datetime.date(2026, 1, 8)
    days = [
        AdherenceDay(date=today - datetime.timedelta(days=6 - i), completed_ratio=r)
        for i, r in enumerate([1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0])
    ]

    milestones = _detect_streak_milestones(days)

    assert milestones == []


async def test_score_band_milestone_fires_on_crossing_into_a_new_decade() -> None:
    points = [
        ScoreTrendPoint(date=datetime.date(2026, 1, 1), overall_score=78.0),
        ScoreTrendPoint(date=datetime.date(2026, 1, 8), overall_score=82.0),
    ]

    milestones = _detect_score_band_milestones(points)

    expected = Milestone(label="Score crossed into the 80s", achieved_on=datetime.date(2026, 1, 8))
    assert milestones == [expected]


async def test_score_band_milestone_does_not_fire_within_the_same_band() -> None:
    points = [
        ScoreTrendPoint(date=datetime.date(2026, 1, 1), overall_score=81.0),
        ScoreTrendPoint(date=datetime.date(2026, 1, 8), overall_score=85.0),
    ]

    assert _detect_score_band_milestones(points) == []
