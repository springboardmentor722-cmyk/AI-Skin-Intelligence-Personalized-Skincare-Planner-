"""app/core/storage.py — real round trip against the live MinIO container
(docker-compose.yml's `minio` service), not mocked: upload, fetch via the actual
presigned URL over HTTP, delete, confirm gone. Matches this project's established
"verify against the real thing" testing philosophy (tests/conftest.py's db_session
fixture does the same for Postgres).
"""

import httpx
import pytest

from app.core.storage import (
    MAX_UPLOAD_BYTES,
    FileValidationError,
    build_key,
    delete,
    get_presigned_url,
    sniff_content_type,
    upload,
)

_TEST_PREFIX = "test-storage"
_REAL_PDF_BYTES = b"%PDF-1.4\nskinlytics storage adapter test content"


def test_build_key_is_namespaced_by_owner_and_unique_per_call() -> None:
    key_a = build_key(prefix=_TEST_PREFIX, owner_user_id="user-1", filename="doc.pdf")
    key_b = build_key(prefix=_TEST_PREFIX, owner_user_id="user-1", filename="doc.pdf")

    assert key_a.startswith(f"{_TEST_PREFIX}/user_user-1/")
    assert key_a.endswith("_doc.pdf")
    assert key_a != key_b  # two uploads of the same filename never collide


async def test_upload_and_presigned_url_round_trip_against_real_minio() -> None:
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="license.pdf")

    await upload(key, _REAL_PDF_BYTES, allowed_content_types={"application/pdf"})
    try:
        url = await get_presigned_url(key, expires_in=60)
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
        assert response.status_code == 200
        assert response.content == _REAL_PDF_BYTES
        assert response.headers["content-type"] == "application/pdf"
    finally:
        await delete(key)


async def test_delete_actually_removes_the_object() -> None:
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="temp.pdf")
    await upload(key, _REAL_PDF_BYTES, allowed_content_types={"application/pdf"})

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


# --- Production-readiness audit: server-side content validation, never trusted
# from the client (infra doc §2's own "Upload constraints") ---


def test_sniff_content_type_recognizes_real_pdf_bytes() -> None:
    assert sniff_content_type(_REAL_PDF_BYTES) == "application/pdf"


def test_sniff_content_type_recognizes_real_image_formats() -> None:
    assert sniff_content_type(b"\xff\xd8\xff\xe0rest of a real jpeg") == "image/jpeg"
    assert sniff_content_type(b"\x89PNG\r\n\x1a\nrest of a real png") == "image/png"
    assert sniff_content_type(b"RIFF\x00\x00\x00\x00WEBPrest") == "image/webp"


def test_sniff_content_type_rejects_content_that_matches_no_real_signature() -> None:
    # The exact attack this closes: a client claiming Content-Type: application/pdf
    # (or image/*) for bytes that are actually something else entirely (e.g. HTML
    # that would execute if an admin's browser ever rendered it inline).
    assert sniff_content_type(b"<html><script>alert(1)</script></html>") is None


async def test_upload_rejects_content_not_matching_its_claimed_type() -> None:
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="fake.pdf")
    html_masquerading_as_pdf = b"<html><script>alert(document.cookie)</script></html>"

    with pytest.raises(FileValidationError):
        await upload(key, html_masquerading_as_pdf, allowed_content_types={"application/pdf"})


async def test_upload_rejects_a_real_type_outside_the_caller_allowlist() -> None:
    # A real PNG is a real, sniffable image — but this caller only wants PDFs
    # (e.g. a "government ID must be a PDF" policy), so it's still rejected.
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="photo.png")
    real_png_bytes = b"\x89PNG\r\n\x1a\nrest of a real png"

    with pytest.raises(FileValidationError):
        await upload(key, real_png_bytes, allowed_content_types={"application/pdf"})


async def test_upload_rejects_a_file_over_the_size_limit() -> None:
    key = build_key(prefix=_TEST_PREFIX, owner_user_id="storage-test", filename="huge.pdf")
    oversized = _REAL_PDF_BYTES + b"0" * MAX_UPLOAD_BYTES

    with pytest.raises(FileValidationError):
        await upload(key, oversized, allowed_content_types={"application/pdf"})
