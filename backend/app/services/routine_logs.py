"""routine_logs — MongoDB daily-checklist tracking (Milestone 2, Steps 1.2 & 5.2).

Document shape, exactly as the specification defines it:

    {
      "user_id": "...",
      "log_date": "YYYY-MM-DD",
      "completed_steps": [{"routine_step_id": "...", "completed_at": <timestamp>}],
      "water_intake_ml": 2500,
      "sleep_hours": 7.5
    }

MongoDB is the primary store. When MONGO_URL is not configured — the default for
local development — the identical document is transparently kept in a relational
fallback table instead, so the checklist, the consistency score, and the whole
Milestone 2 flow work end-to-end on a stock `pip install` with no extra services
to run. The routers only ever touch the public functions below, so the storage
choice never leaks upward.
"""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta

from sqlalchemy import Column, Date, Integer, String, Text, select
from sqlalchemy.orm import Session

from ..database import Base, get_mongo

COLLECTION = "routine_logs"


class RoutineLogFallback(Base):
    """Relational mirror of a routine_logs document (used when Mongo is absent)."""
    __tablename__ = "routine_logs_fallback"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(40), index=True, nullable=False)
    log_date = Column(Date, index=True, nullable=False)
    completed_steps = Column(Text, default="[]")   # JSON array
    water_intake_ml = Column(Integer)
    sleep_hours = Column(String(10))


def _collection():
    """The live Mongo collection, or None when Mongo isn't configured."""
    mongo = get_mongo()
    if mongo is None:
        return None
    coll = mongo[COLLECTION]
    coll.create_index([("user_id", 1), ("log_date", 1)], unique=True)
    return coll


def storage_backend() -> str:
    """Which store is live — surfaced in the API response for transparency."""
    return "mongodb" if _collection() is not None else "relational-fallback"


def _blank(user_id, log_date: date) -> dict:
    return {
        "user_id": str(user_id),
        "log_date": log_date.isoformat(),
        "completed_steps": [],
        "water_intake_ml": None,
        "sleep_hours": None,
    }


def get_log(db: Session, user_id, log_date: date) -> dict:
    """Fetch one day's log. Always returns a document (blank if none exists yet)."""
    coll = _collection()
    if coll is not None:
        doc = coll.find_one({"user_id": str(user_id), "log_date": log_date.isoformat()},
                            {"_id": 0})
        return doc or _blank(user_id, log_date)

    row = db.scalar(select(RoutineLogFallback).where(
        RoutineLogFallback.user_id == str(user_id),
        RoutineLogFallback.log_date == log_date,
    ))
    if not row:
        return _blank(user_id, log_date)
    return {
        "user_id": row.user_id,
        "log_date": row.log_date.isoformat(),
        "completed_steps": json.loads(row.completed_steps or "[]"),
        "water_intake_ml": row.water_intake_ml,
        "sleep_hours": float(row.sleep_hours) if row.sleep_hours else None,
    }


def toggle_step(db: Session, user_id, log_date: date, routine_step_id: str,
                completed: bool) -> dict:
    """Check or uncheck one routine step for a given day. Returns the updated log."""
    doc = get_log(db, user_id, log_date)
    steps = [s for s in doc.get("completed_steps", [])
             if s.get("routine_step_id") != routine_step_id]

    if completed:
        steps.append({
            "routine_step_id": routine_step_id,
            "completed_at": datetime.utcnow().isoformat(),
        })

    doc["completed_steps"] = steps
    return _persist(db, user_id, log_date, doc)


def update_metrics(db: Session, user_id, log_date: date,
                   water_intake_ml: int | None = None,
                   sleep_hours: float | None = None) -> dict:
    """Record the day's water and sleep alongside the checklist."""
    doc = get_log(db, user_id, log_date)
    if water_intake_ml is not None:
        doc["water_intake_ml"] = int(water_intake_ml)
    if sleep_hours is not None:
        doc["sleep_hours"] = float(sleep_hours)
    return _persist(db, user_id, log_date, doc)


def _persist(db: Session, user_id, log_date: date, doc: dict) -> dict:
    coll = _collection()
    if coll is not None:
        coll.update_one(
            {"user_id": str(user_id), "log_date": log_date.isoformat()},
            {"$set": {k: v for k, v in doc.items() if k not in ("user_id", "log_date")}},
            upsert=True,
        )
        return doc

    row = db.scalar(select(RoutineLogFallback).where(
        RoutineLogFallback.user_id == str(user_id),
        RoutineLogFallback.log_date == log_date,
    ))
    if not row:
        row = RoutineLogFallback(user_id=str(user_id), log_date=log_date)
        db.add(row)
    row.completed_steps = json.dumps(doc.get("completed_steps", []))
    row.water_intake_ml = doc.get("water_intake_ml")
    sh = doc.get("sleep_hours")
    row.sleep_hours = str(sh) if sh is not None else None
    db.commit()
    return doc


def consistency_last_7_days(db: Session, user_id, expected_per_day: int) -> tuple[int, int]:
    """(completed, expected) across the last 7 days — this feeds R_consist.

    This is the MongoDB read the scoring engine depends on.
    """
    today = date.today()
    days = [today - timedelta(days=i) for i in range(7)]

    completed = 0
    coll = _collection()
    if coll is not None:
        docs = coll.find({"user_id": str(user_id),
                          "log_date": {"$in": [d.isoformat() for d in days]}},
                         {"_id": 0, "completed_steps": 1})
        for d in docs:
            completed += len(d.get("completed_steps", []))
    else:
        rows = db.scalars(select(RoutineLogFallback).where(
            RoutineLogFallback.user_id == str(user_id),
            RoutineLogFallback.log_date.in_(days),
        )).all()
        for r in rows:
            completed += len(json.loads(r.completed_steps or "[]"))

    expected = max(expected_per_day, 0) * 7
    # Never report over 100% (e.g. if the routine shrank after logs were written)
    return (min(completed, expected) if expected else completed), expected
