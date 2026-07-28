"""Application configuration loaded from environment variables (.env supported)."""
import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.database_url: str = os.getenv("DATABASE_URL", "sqlite:///./lumen.db")
        self.mongo_url: str = os.getenv("MONGO_URL", "")
        self.mongo_db: str = os.getenv("MONGO_DB", "lumen")
        self.jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
        self.jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        self.frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
        self.google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")

        # --- AI skin analysis (Milestone 3, Parts 4-9) ---
        _here = os.path.dirname(os.path.abspath(__file__))
        self.ai_model_dir: str = os.getenv("AI_MODEL_DIR", os.path.join(_here, "ai", "models"))
        self.upload_dir: str = os.getenv("UPLOAD_DIR",
                                         os.path.join(os.path.dirname(_here), "uploads"))
        self.ai_max_upload_mb: int = int(os.getenv("AI_MAX_UPLOAD_MB", "8"))
        self.ai_face_required: bool = os.getenv("AI_FACE_REQUIRED", "true").lower() == "true"


@lru_cache
def get_settings() -> Settings:
    # Load .env if present (no external dependency required)
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())
    return Settings()
