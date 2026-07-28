"""Database engines.

Relational (PostgreSQL in production, SQLite for local development) via SQLAlchemy,
plus an optional MongoDB handle reserved for unstructured data in later milestones
(AI scan images, model outputs, chat transcripts).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_mongo():
    """Return a MongoDB database handle, or None when MONGO_URL is not configured.

    Milestone 1 does not require MongoDB; this hook exists so the AI modules in
    later milestones can store scan images and unstructured payloads without
    changing the application wiring.
    """
    if not settings.mongo_url:
        return None
    from pymongo import MongoClient  # imported lazily so pymongo stays optional

    client = MongoClient(settings.mongo_url)
    return client[settings.mongo_db]
