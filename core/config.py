"""
Application configuration.

Centralizes all environment-driven settings so that every other module
reads configuration from a single, well-typed source instead of calling
os.environ directly throughout the codebase.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load variables from a .env file located at the backend root (if present).
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Strongly-typed application settings loaded from environment variables."""

    # --- General ---
    APP_NAME: str = os.getenv("APP_NAME", "AI Skin Intelligence Platform")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    OPEN_BROWSER: bool = os.getenv("OPEN_BROWSER", "True").lower() == "true"

    # --- Database (PostgreSQL) ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/ai_skin_intelligence",
    )

    # --- Database (MongoDB) — Milestone 2: daily routine checklist logs ---
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "ai_skin_intelligence_mongo")

    # --- Security / JWT ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REMEMBER_ME_EXPIRE_DAYS: int = int(os.getenv("REMEMBER_ME_EXPIRE_DAYS", "30"))

    # --- CORS ---
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:8000"
    ).split(",")

    # --- Static / uploads ---
    STATIC_DIR: Path = BASE_DIR / "static"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    FRONTEND_BUILD_DIR: Path = BASE_DIR.parent / "frontend" / "dist"


settings = Settings()
