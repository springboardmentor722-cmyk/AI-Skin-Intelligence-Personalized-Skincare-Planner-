"""app/core/storage.py — real round trip against the live MinIO container
(docker-compose.yml's `minio` service), not mocked: upload, fetch via the actual
presigned URL over HTTP, delete, confirm gone. Matches this project's established
"verify against the real thing" testing philosophy (tests/conftest.py's db_session
fixture does the same for Postgres)."""

import httpx

from app.core.storage import build_key, delete, get_presigned_url, upload

_TEST_PREFIX = "test-storage"


def test_build_key_is_namespaced_by_owner_and_unique_per_call() -> None:
    key_a = build_key(prefix=_TEST_PREFIX, owner_user_id="user-1", filename="doc.pdf")
    key_b = build_key(prefix=_TEST_PREFIX, owner_user_id="user-1", filename="doc.pdf")

    assert key_a.startswith(f"{_TEST_PREFIX}/user_user-1/")
    assert key_a.endswith("_doc.pdf")
    assert key_a != key_b  # two uploads of the same filename never collide


async def test_upload_and_presigned_url_round_trip_against_real_minio() -> None:
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="license.pdf")
    body = b"skinlytics storage adapter test content"

    await upload(key, body, content_type="application/pdf")
    try:
        url = await get_presigned_url(key, expires_in=60)
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
        assert response.status_code == 200
        assert response.content == body
    finally:
        await delete(key)


async def test_delete_actually_removes_the_object() -> None:
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="temp.pdf")
    await upload(key, b"to be deleted")

    await delete(key)

    url = await get_presigned_url(key, expires_in=60)
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
    assert response.status_code == 404


def test_build_key_sanitizes_slashes_in_filename() -> None:
    # A filename containing "/" would otherwise create an unintended sub-path in the
    # bucket — sanitized to "_" instead.
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="abc", filename="sneaky/../path.pdf")
    assert key.count("/") == 2  # prefix/user_.../filename — no extra segments
    assert key.endswith("sneaky_.._path.pdf")
