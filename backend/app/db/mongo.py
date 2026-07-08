from functools import lru_cache
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


@lru_cache(maxsize=1)
def get_mongo_client() -> AsyncIOMotorClient[Any]:
    return AsyncIOMotorClient(settings.mongo_uri)


def get_mongo_db() -> AsyncIOMotorDatabase[Any]:
    """Collections per database_schemas/skinlytics_mongodb_schema_v3.txt — created
    lazily by MongoDB on first write, no migration step needed."""
    return get_mongo_client().get_default_database()
