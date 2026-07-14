"""weather/service.py::get_latest_uv_index — Milestone 2 Step 3.1's real "high
unprotected UV index exposure" signal for scores/service.py's lifestyle component.
Mongo isn't covered by db_session's rollback, so these clean up manually.
"""

import datetime
from collections.abc import AsyncGenerator

import pytest

from app.db.mongo import get_mongo_db
from app.services.weather.service import get_latest_uv_index


@pytest.fixture
async def weather_test_user(test_user_id: str) -> AsyncGenerator[str, None]:
    try:
        yield test_user_id
    finally:
        await get_mongo_db()["weather_uv_logs"].delete_many({"user_id": test_user_id})


async def test_get_latest_uv_index_is_none_with_no_readings(weather_test_user: str) -> None:
    assert await get_latest_uv_index(weather_test_user) is None


async def test_get_latest_uv_index_returns_the_most_recent_reading(
    weather_test_user: str,
) -> None:
    collection = get_mongo_db()["weather_uv_logs"]
    now = datetime.datetime.now(datetime.UTC)
    await collection.insert_many(
        [
            {
                "user_id": weather_test_user,
                "location": "12.9,77.6",
                "uv_index": 3.0,
                "captured_at": now - datetime.timedelta(hours=2),
            },
            {
                "user_id": weather_test_user,
                "location": "12.9,77.6",
                "uv_index": 8.0,
                "captured_at": now,
            },
        ]
    )

    assert await get_latest_uv_index(weather_test_user) == 8.0


async def test_get_latest_uv_index_skips_readings_with_no_uv_value(
    weather_test_user: str,
) -> None:
    # A real OpenWeather-only reading (OpenUV unconfigured/unreachable that call) has
    # uv_index=None — must not be mistaken for "the latest real UV reading is None".
    collection = get_mongo_db()["weather_uv_logs"]
    now = datetime.datetime.now(datetime.UTC)
    await collection.insert_many(
        [
            {
                "user_id": weather_test_user,
                "location": "12.9,77.6",
                "uv_index": 6.5,
                "captured_at": now - datetime.timedelta(hours=1),
            },
            {
                "user_id": weather_test_user,
                "location": "12.9,77.6",
                "uv_index": None,
                "captured_at": now,
            },
        ]
    )

    assert await get_latest_uv_index(weather_test_user) == 6.5
