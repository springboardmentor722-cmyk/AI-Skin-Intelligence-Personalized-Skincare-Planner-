"""
MongoDB connection for document-style data that doesn't fit neatly into the
relational schema: free-text lifestyle journal entries, user preferences, and
notes. This matches the "Secondary Database (MongoDB)" box in the
architecture spec: Lifestyle Data, Progress Logs, Notes, Preferences.

Falls back gracefully (returns None / no-ops) if MongoDB isn't running, so the
rest of the app still works during local dev without Mongo installed.
"""
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "skin_intelligence")

_client = None
_db = None
_mongo_available = False

try:
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError

    _client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
    _client.admin.command("ping")
    _db = _client[MONGO_DB_NAME]
    _mongo_available = True
    logger.info("Connected to MongoDB at %s", MONGO_URL)
except Exception as e:  # noqa: BLE001
    logger.warning("MongoDB not available (%s). Journal/preferences features will be disabled until it's running.", e)
    _mongo_available = False


def is_mongo_available() -> bool:
    return _mongo_available


def get_collection(name: str):
    if not _mongo_available:
        return None
    return _db[name]


# ---------------------------------------------------------------------------
# Lifestyle journal entries (free-text daily notes, mood, photos metadata)
# ---------------------------------------------------------------------------
def add_journal_entry(user_id: int, entry: dict) -> dict:
    col = get_collection("lifestyle_journal")
    if col is None:
        return {"stored": False, "reason": "MongoDB unavailable"}
    doc = {"user_id": user_id, "created_at": datetime.utcnow(), **entry}
    result = col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"stored": True, "entry": doc}


def list_journal_entries(user_id: int, limit: int = 30) -> list:
    col = get_collection("lifestyle_journal")
    if col is None:
        return []
    docs = list(col.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


# ---------------------------------------------------------------------------
# User preferences (schema-flexible: notification settings, UI prefs, etc.)
# ---------------------------------------------------------------------------
def upsert_preferences(user_id: int, preferences: dict) -> dict:
    col = get_collection("preferences")
    if col is None:
        return {"stored": False, "reason": "MongoDB unavailable"}
    col.update_one(
        {"user_id": user_id},
        {"$set": {**preferences, "updated_at": datetime.utcnow()}},
        upsert=True,
    )
    return {"stored": True}


def get_preferences(user_id: int) -> dict:
    col = get_collection("preferences")
    if col is None:
        return {}
    doc = col.find_one({"user_id": user_id})
    if not doc:
        return {}
    doc["_id"] = str(doc["_id"])
    return doc


# ---------------------------------------------------------------------------
# Consultant/dermatologist notes on a client (schema-flexible, freeform)
# ---------------------------------------------------------------------------
def add_note(author_id: int, target_user_id: int, note_text: str) -> dict:
    col = get_collection("notes")
    if col is None:
        return {"stored": False, "reason": "MongoDB unavailable"}
    doc = {
        "author_id": author_id,
        "target_user_id": target_user_id,
        "note": note_text,
        "created_at": datetime.utcnow(),
    }
    result = col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"stored": True, "note": doc}


def list_notes_for_user(target_user_id: int) -> list:
    col = get_collection("notes")
    if col is None:
        return []
    docs = list(col.find({"target_user_id": target_user_id}).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs
