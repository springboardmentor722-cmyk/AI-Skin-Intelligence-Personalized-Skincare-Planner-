"""app/services/progress/router.py (M3-E) — HTTP-layer contract: multipart photo
upload round-trips into progress_images and the response reflects it, and logs
round-trip through Mongo. Role/auth matrix lives in test_rbac.py."""

import io
import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from PIL import Image
from sqlalchemy import delete

from app.core.security import require_user
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.progress.models import ProgressImage


def _real_jpeg_bytes() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), color="purple").save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture
async def router_test_user() -> AsyncGenerator[str, None]:
    # The `client` fixture hits the real `get_db` (no rollback wrapper, unlike
    # `db_session`) — a photo upload really inserts a `progress_images` row FK'd to
    # `user.id`, so this needs a real, committed user row, cleaned up after (same
    # "no mocks" philosophy as test_storage.py's real MinIO round trips).
    user_id = f"test-progress-router-{uuid.uuid4().hex[:16]}"
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
            await session.execute(delete(ProgressImage).where(ProgressImage.user_id == user_id))
            await session.execute(
                delete(external_user_table).where(external_user_table.c.id == user_id)
            )
            await session.commit()
        await get_mongo_db()["progress_logs"].delete_many({"user_id": user_id})


async def _as(user_id: str, client: AsyncClient) -> AsyncClient:
    app.dependency_overrides[require_user] = lambda: {
        "id": user_id,
        "role": "user",
        "claims": {},
    }
    return client


async def test_uploading_a_progress_photo_round_trips_into_the_photos_list(
    client: AsyncClient, router_test_user: str
) -> None:
    await _as(router_test_user, client)
    try:
        response = await client.post(
            "/api/v1/progress/me/photos",
            files={"file": ("selfie.jpg", _real_jpeg_bytes(), "image/jpeg")},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 201
    body = response.json()
    assert len(body["photos"]) >= 1
    assert body["before"] is not None
    assert body["photos"][-1]["url"]  # a real presigned URL, not blank


async def test_uploading_a_non_image_is_rejected(
    client: AsyncClient, router_test_user: str
) -> None:
    await _as(router_test_user, client)
    try:
        response = await client.post(
            "/api/v1/progress/me/photos",
            files={"file": ("evil.jpg", b"<html><script>alert(1)</script></html>", "image/jpeg")},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 400


async def test_progress_log_round_trips_and_is_idempotent_per_week(
    client: AsyncClient, router_test_user: str
) -> None:
    await _as(router_test_user, client)
    try:
        first = await client.post("/api/v1/progress/me/logs", json={"notes": "First entry"})
        second = await client.post("/api/v1/progress/me/logs", json={"notes": "Updated entry"})
        listing = await client.get("/api/v1/progress/me/logs")
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert first.status_code == 201
    assert second.status_code == 201
    logs = listing.json()
    this_week = [log for log in logs if log["week_number"] == first.json()["week_number"]]
    assert len(this_week) == 1
    assert this_week[0]["notes"] == "Updated entry"
