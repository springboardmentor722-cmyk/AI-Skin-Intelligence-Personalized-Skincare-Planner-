"""
Database engine, session factory, and declarative base.

Every model in `models/` inherits from `Base`. Every request-scoped
database session is obtained through the `get_db` dependency so that
sessions are always closed, even when an exception occurs mid-request.
"""

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

logger = logging.getLogger("app.database")

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Create all tables that do not yet exist.

    Models must be imported before this call so that they are registered
    on `Base.metadata`. This is done explicitly in `main.py`.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")
