from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "AI Skin Intelligence Platform"
    ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Postgres (structured data: users, auth, routines, scores, orders)
    POSTGRES_URL: str = "postgresql+asyncpg://skin_user:skin_pass@localhost:5432/skin_intelligence"

    # MongoDB (unstructured data: face scan results, image metadata, ingredient DB)
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "skin_intelligence"

    # Auth
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_IMAGE_SIZE_MB: int = 8

    # Skin Health Score weights (must sum to 1.0) — per product spec
    WEIGHT_SKIN_CONDITION: float = 0.35
    WEIGHT_LIFESTYLE: float = 0.20
    WEIGHT_SLEEP: float = 0.15
    WEIGHT_ROUTINE_CONSISTENCY: float = 0.20
    WEIGHT_HYDRATION: float = 0.10

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
