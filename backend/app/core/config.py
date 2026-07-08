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

    @property
    def sqlalchemy_database_url(self) -> str:
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
