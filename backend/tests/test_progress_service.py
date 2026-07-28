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
from app.services.scores import service as scores_service
from app.services.skin_profile.schemas import SkinProfileCreate
from app.services.skin_profile.service import create_profile


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
    assert photo.image_stage == "Baseline"  # first-ever photo for this user auto-tags


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


async def test_upload_progress_photo_freezes_the_current_skin_health_score(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    await create_profile(
        db_session, progress_test_user, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    await scores_service.compute_and_store_score(db_session, progress_test_user)

    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "selfie.jpg"
    )

    assert photo.skin_health_score_at_upload is not None


async def test_first_photo_auto_tags_baseline_second_computes_week_number(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    first = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg"
    )
    second = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "two.jpg"
    )

    assert first.image_stage == "Baseline"
    assert second.image_stage is not None and second.image_stage.startswith("Week")


async def test_upload_progress_photo_accepts_an_explicit_tag_override(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg", tag="Month 2"
    )

    assert photo.image_stage == "Month 2"


async def test_progress_photo_score_stays_frozen_after_a_later_score_changes(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    await create_profile(
        db_session, progress_test_user, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    await scores_service.compute_and_store_score(db_session, progress_test_user)
    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg"
    )
    frozen_score = photo.skin_health_score_at_upload

    await scores_service.compute_and_store_score(db_session, progress_test_user)  # recompute again

    reloaded = (await list_progress_photos(db_session, progress_test_user))[0]
    assert reloaded.skin_health_score_at_upload == frozen_score


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
    # has zero assigned steps, so each is omitted entirely (not fabricated as
    # 0.0) - an empty series is the honest "no routine ever assigned" signal the
    # frontend's empty state branches on.
    series = await get_adherence_series(db_session, progress_test_user, days=7)
    assert series == []


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


async def test_get_compliance_percentages_thirty_and_ninety_day_ratios_are_exact(
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
    # Backdate so this one routine is assigned across the entire 90-day window
    # under test (list_historical_active_step_ids only counts a routine from its
    # created_at onward).
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
    # One completion inside the 7-day window, one inside 30 but outside 7, one
    # inside 90 but outside 30 - both steps completed each time - so the three
    # windows land on three different, independently-verifiable ratios instead
    # of all just being "not None".
    for offset in (3, 15, 60):
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

    # 7-day window: only offset 3 falls inside -> 2 steps x 1 day = 2 completed,
    # out of 7 days x 2 steps = 14 assigned.
    assert result.seven_day is not None
    assert abs(result.seven_day - 2 / 14) < 0.001
    # 30-day window: offsets 3 and 15 fall inside -> 2 steps x 2 days = 4
    # completed, out of 30 x 2 = 60 assigned.
    assert result.thirty_day is not None
    assert abs(result.thirty_day - 4 / 60) < 0.001
    # 90-day window: all three offsets fall inside -> 2 steps x 3 days = 6
    # completed, out of 90 x 2 = 180 assigned.
    assert result.ninety_day is not None
    assert abs(result.ninety_day - 6 / 180) < 0.001


async def test_get_compliance_percentages_reflects_routine_change_mid_window(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    """Mirrors test_adherence_series_uses_the_routine_active_on_each_historical_day's
    setup, but asserts get_compliance_percentages - the rubric's actual named
    7/30/90 formula - which the series test never exercises."""
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

    today = datetime.datetime.now(datetime.UTC).date()
    old_day = today - datetime.timedelta(days=5)
    # Complete the OLD step on an old day (old routine active there) and the NEW
    # step today (new routine active there). If percentages judged every
    # historical day against only the *current* routine's step ids (the bug the
    # series test above already guards against, but only for the series
    # function), the old-day completion would never match and this would
    # undercount.
    await get_mongo_db()["routine_logs"].insert_one(
        {
            "user_id": progress_test_user,
            "log_date": datetime.datetime.combine(old_day, datetime.time.min),
            "completed_steps": [{"routine_step_id": old_step.step_id}],
        }
    )
    await get_mongo_db()["routine_logs"].insert_one(
        {
            "user_id": progress_test_user,
            "log_date": datetime.datetime.combine(today, datetime.time.min),
            "completed_steps": [{"routine_step_id": new_step.step_id}],
        }
    )

    result = await get_compliance_percentages(db_session, progress_test_user)

    # 7-day window: 1 step assigned per day x 7 days = 7 assigned; 2 completed
    # (old-day completion matched against the old step, today's against the new
    # step).
    assert result.seven_day is not None
    assert abs(result.seven_day - 2 / 7) < 0.001


async def test_adherence_series_buckets_completions_by_utc_calendar_day(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    """This repo's established convention (scores/service.py:87-91): UTC, always.
    A completion one second before UTC midnight and one one second after must
    land in their own separate calendar-day buckets - not merged, not off-by-one
    from a local-time boundary. get_adherence_series and get_compliance_percentages
    share the same `log["log_date"].date()` bucketing (progress/service.py), so
    this exercises that shared logic directly."""
    routine = Routine(
        user_id=progress_test_user, routine_name="AM", routine_type="AM", is_active=True
    )
    db_session.add(routine)
    await db_session.flush()
    step = RoutineStep(routine_id=routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(step)
    await db_session.flush()
    await db_session.execute(
        update(Routine)
        .where(Routine.routine_id == routine.routine_id)
        .values(
            created_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
            - datetime.timedelta(days=10)
        )
    )
    await db_session.commit()

    day_before = datetime.datetime.now(datetime.UTC).date() - datetime.timedelta(days=5)
    day_after = day_before + datetime.timedelta(days=1)
    await get_mongo_db()["routine_logs"].insert_one(
        {
            "user_id": progress_test_user,
            "log_date": datetime.datetime.combine(day_before, datetime.time(23, 59, 59)),
            "completed_steps": [{"routine_step_id": step.step_id}],
        }
    )
    await get_mongo_db()["routine_logs"].insert_one(
        {
            "user_id": progress_test_user,
            "log_date": datetime.datetime.combine(day_after, datetime.time(0, 0, 1)),
            "completed_steps": [{"routine_step_id": step.step_id}],
        }
    )

    series = await get_adherence_series(db_session, progress_test_user, days=10)

    before_entry = next(d for d in series if d.date == day_before)
    after_entry = next(d for d in series if d.date == day_after)
    assert before_entry.completed_ratio == 1.0
    assert after_entry.completed_ratio == 1.0


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
