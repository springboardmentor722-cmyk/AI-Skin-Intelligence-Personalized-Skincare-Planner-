import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from services.auth_service.app.core.config import settings

db_url = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL") or "sqlite:///./ai_skin.db"

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if "sqlite" in db_url:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_url)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()