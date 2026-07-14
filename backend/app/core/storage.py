"""S3-compatible object storage adapter (docs/ARCHITECTURE.md §7, database_schemas/
skinlytics_infrastructure_layer_v2.txt §2). MinIO in dev (docker-compose.yml's
`minio` service), real S3/Azure Blob in prod — same adapter either way, only
`S3_ENDPOINT_URL`/credentials change. First consumer is verification-document
uploads (Milestone 1 foundation expansion), but this is deliberately general —
profile images, skin-scan images, and progress photos (all named in the bucket
layout doc) reuse it unchanged when those features land.

Objects are private; every read goes through `get_presigned_url`, never a public
bucket URL — matches the infra doc's "access via signed URLs only".

Production-readiness audit finding: the infra doc's own "Upload constraints
(enforced at the API gateway)" section says "content-type validated server-side,
never trusted from the client" and "max 10 MB" — neither was ever actually
implemented. `upload()`'s `content_type` param was passed straight from the
client's `Content-Type` header (trivially spoofable) into the stored object's own
`ContentType`, which an admin's browser (`web/app/admin/users/verification/...`
opens presigned URLs directly via `window.open`) would then honor when rendering
the response — a malicious applicant could upload `text/html`/`image/svg+xml`
content that executes when an admin reviews it. Fixed by sniffing the file's real
magic bytes server-side and using *that* as the stored content-type, never the
caller-supplied one; the caller only says which types are acceptable for its use
case (verification documents: PDF + the infra doc's own image list).
"""

import uuid
from collections.abc import Callable

import aioboto3
from botocore.config import Config

from app.core.config import settings

_session = aioboto3.Session()

# infra doc §2's own "max 10 MB" (stated for images; applied here to every upload
# through this shared adapter, not just images — no upload consumer has a
# documented reason to need more).
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


class FileValidationError(Exception):
    """Raised when an upload fails server-side content validation."""


_MAGIC_SNIFFERS: dict[str, Callable[[bytes], bool]] = {
    "application/pdf": lambda d: d.startswith(b"%PDF-"),
    # infra doc §2: "images: jpg/png/webp".
    "image/jpeg": lambda d: d.startswith(b"\xff\xd8\xff"),
    "image/png": lambda d: d.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda d: d[:4] == b"RIFF" and d[8:12] == b"WEBP",
}

# Government IDs/certificates/licenses are routinely PDF scans, not just photos —
# the infra doc's own "images: jpg/png/webp" list is silent on documents
# specifically, so PDF is added here as the obviously-necessary format for this
# real use case, not invented speculatively. Shared by consultant_profile and
# dermatologist_profile's identical upload_document() — one allowlist, not two
# copies that could drift.
VERIFICATION_DOCUMENT_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}


def sniff_content_type(data: bytes) -> str | None:
    """The file's *real* type, from its own bytes — never the client-supplied
    Content-Type header, which is just a claim. Returns None for anything that
    doesn't match a known signature (rejected by `upload()`, not silently
    accepted as some default)."""
    for content_type, matches in _MAGIC_SNIFFERS.items():
        if matches(data):
            return content_type
    return None


def _client_kwargs() -> dict[str, str | Config]:
    return {
        "endpoint_url": settings.s3_endpoint_url,
        "aws_access_key_id": settings.s3_access_key_id,
        "aws_secret_access_key": settings.s3_secret_access_key,
        "region_name": settings.s3_region,
        # MinIO (and most S3-compatible stores) need path-style addressing —
        # virtual-hosted-style (the boto3 default) resolves to a DNS name the local
        # container doesn't have.
        "config": Config(s3={"addressing_style": "path"}),
    }


def build_key(*, prefix: str, owner_user_id: str, filename: str) -> str:
    """`{prefix}/user_{id}/{uuid}_{filename}` — matches the infra doc's
    `{entity_type}/{user_id}/{resource_id}/{file_name}` convention. The uuid prefix
    avoids collisions between two uploads of the same original filename; the real
    filename is preserved in `verification_documents.original_filename`, not lost."""
    unique = uuid.uuid4().hex[:12]
    safe_filename = filename.replace("/", "_")
    return f"{prefix}/user_{owner_user_id}/{unique}_{safe_filename}"


async def upload(key: str, data: bytes, *, allowed_content_types: set[str]) -> str:
    """`allowed_content_types` is the caller's own allowlist for its use case (e.g.
    verification documents accept PDF + images; a future skin-scan-photo consumer
    might only accept images) — `upload()` itself always sniffs the real bytes and
    always rejects anything outside that allowlist, regardless of caller."""
    if len(data) > MAX_UPLOAD_BYTES:
        raise FileValidationError(f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit")
    sniffed = sniff_content_type(data)
    if sniffed is None or sniffed not in allowed_content_types:
        raise FileValidationError("Unsupported file type")

    async with _session.client("s3", **_client_kwargs()) as s3:
        await s3.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=data,
            ContentType=sniffed,
        )
    return key


async def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    async with _session.client("s3", **_client_kwargs()) as s3:
        url: str = await s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )
    return url


async def delete(key: str) -> None:
    async with _session.client("s3", **_client_kwargs()) as s3:
        await s3.delete_object(Bucket=settings.s3_bucket_name, Key=key)
