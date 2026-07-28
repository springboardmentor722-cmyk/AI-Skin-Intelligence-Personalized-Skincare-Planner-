"""
MongoDB connection layer — Milestone 2.

PostgreSQL (core/database.py) remains the system of record for structured
data: users, skin profiles, assessments, and generated routines. MongoDB
holds the unstructured, high-write-frequency daily checklist data (which
steps were completed on which day) per the project's data-layer split.

Mirrors the shape of core/database.py: a single client, a `get_mongo_db()`
FastAPI dependency, and an init function called once at startup.
"""

import logging

from pymongo import ASCENDING, MongoClient
from pymongo.database import Database

from core.config import settings

logger = logging.getLogger("app.mongodb")

_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    """Lazily create a single shared MongoClient for the process lifetime."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    return _client


def get_mongo_db() -> Database:
    """FastAPI dependency that yields the MongoDB database handle."""
    return get_mongo_client()[settings.MONGODB_DB_NAME]


def init_mongo() -> None:
    """
    Verify connectivity and ensure indexes exist on routine_logs.

    Called once from main.py at startup, alongside init_db() for
    PostgreSQL. Failures are logged but do not crash the app — Milestone 1
    features (auth, profiles, lifestyle) don't depend on MongoDB at all,
    so the app should still boot if Mongo is temporarily unreachable.
    """
    try:
        db = get_mongo_db()
        db.command("ping")
        db["routine_logs"].create_index(
            [("user_id", ASCENDING), ("log_date", ASCENDING)],
            unique=True,
            name="uq_user_log_date",
        )
        logger.info("MongoDB connected and routine_logs indexes verified.")
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "MongoDB not reachable at startup (%s). Routine checklist logging "
            "and the consistency-score component will not work until MongoDB "
            "is running and reachable at MONGODB_URL.",
            exc,
        )
