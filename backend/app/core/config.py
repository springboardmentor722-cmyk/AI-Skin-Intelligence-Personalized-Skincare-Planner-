from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env vars documented in /.env.example — read from there, not invented here."""

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    environment: str = "development"

    # Identity — Better Auth issues JWTs; FastAPI only validates (ADR-002/003).
    better_auth_url: str = "http://localhost:3000"
    jwt_issuer: str = "http://localhost:3000"
    jwt_audience: str = "http://localhost:3000"

    # Postgres — system of record (Better Auth tables + domain tables). Shared verbatim
    # with web/lib/auth.ts's `Pool({ connectionString: process.env.DATABASE_URL })`, so
    # this must stay a plain `postgresql://` URL — the SQLAlchemy `+asyncpg` dialect
    # suffix is added in `sqlalchemy_database_url`, not stored in the env var itself.
    database_url: str = "postgresql://skinlytics:skinlytics@localhost:5432/skinlytics"

    # MongoDB — lifestyle logs, assessments, progress, preferences, weather.
    mongo_uri: str = "mongodb://localhost:27017/skinlytics"

    # Redis — sessions, rate limits, caches, arq queues (worker lands M2, ADR-010).
    redis_url: str = "redis://localhost:6379/0"

    # Rate limiting (docs/ARCHITECTURE.md §9 "per-tier rate limits") — one general
    # fixed-window ceiling per identity (app/core/rate_limit.py), not yet split into
    # the doc's finer per-endpoint AI-path tier since no AI path does real (expensive)
    # work yet (ADR-007 stubs are cheap, deterministic computation).
    rate_limit_per_minute: int = 300

    # Object storage — S3-compatible (MinIO in docker-compose.yml for dev, real S3/
    # Azure Blob in prod — same adapter either way, app/core/storage.py). Bucket
    # layout: database_schemas/skinlytics_infrastructure_layer_v2.txt §2.
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket_name: str = "skinlytics-storage"
    s3_region: str = "us-east-1"

    # External data sources — docs/DATASETS_AND_APIS.md is the canonical registry
    # (access method, target store, ToS caveats) for every one of these. Blank by
    # default (matches /.env.example) — each adapter degrades gracefully rather than
    # erroring when its key is unset (topbar's "UV —" stub is the existing precedent).
    kaggle_username: str = ""
    kaggle_key: str = ""
    openweather_api_key: str = ""
    openuv_api_key: str = ""
    ncbi_api_key: str = ""  # optional — raises PubMed's rate limit, not required

    @property
    def sqlalchemy_database_url(self) -> str:
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
