"""app/services/progress/service.py (M3-E) — photo pipeline (real MinIO round trip,
EXIF stripped), Mongo progress_logs upsert idempotence, adherence series from real
routine_logs, milestone detection. Real Docker stores throughout, this repo's
established testing philosophy (no mocks)."""

import datetime
import io
from collections.abc import AsyncGenerator

import pytest
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.services.progress.schemas import AdherenceDay, Milestone, ScoreTrendPoint
from app.services.progress.service import (
    _detect_score_band_milestones,
    _detect_streak_milestones,
    get_adherence_series,
    list_progress_photos,
    upload_progress_photo,
    upsert_progress_log,
)


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
        doc
        async for doc in get_mongo_db()["progress_logs"].find({"user_id": progress_test_user})
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
    # No active routine for this throwaway user -> honestly empty, not fabricated.
    series = await get_adherence_series(db_session, progress_test_user, days=7)
    assert series == []


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
