import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(path: Path) -> None:
        """Small fallback for the local key=value backend .env file."""
        if not path.exists():
            return
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())


BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def get_gemini_api_key() -> str:
    """Return the configured key without ever logging or exposing it."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Gemini is not configured. Set GEMINI_API_KEY in the backend .env file.")
    return api_key


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not configured. Set it in the backend .env file.")
    return value


def get_database_url() -> str:
    """Return the database URL without logging credentials."""
    return _required_env("DATABASE_URL")


def get_jwt_secret() -> str:
    """Return the JWT signing key without logging it."""
    return _required_env("JWT_SECRET")
