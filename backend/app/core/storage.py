"""S3-compatible object storage adapter (docs/ARCHITECTURE.md §7, database_schemas/
skinlytics_infrastructure_layer_v2.txt §2). MinIO in dev (docker-compose.yml's
`minio` service), real S3/Azure Blob in prod — same adapter either way, only
`S3_ENDPOINT_URL`/credentials change. First consumer is verification-document
uploads (Milestone 1 foundation expansion), but this is deliberately general —
profile images, skin-scan images, and progress photos (all named in the bucket
layout doc) reuse it unchanged when those features land.

Objects are private; every read goes through `get_presigned_url`, never a public
bucket URL — matches the infra doc's "access via signed URLs only".
"""

import uuid

import aioboto3
from botocore.config import Config

from app.core.config import settings

_session = aioboto3.Session()


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


async def upload(key: str, data: bytes, content_type: str | None = None) -> str:
    async with _session.client("s3", **_client_kwargs()) as s3:
        await s3.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=data,
            **({"ContentType": content_type} if content_type else {}),
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
