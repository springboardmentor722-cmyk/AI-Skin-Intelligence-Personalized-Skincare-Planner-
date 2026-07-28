"""
Mongo-backed daily checklist logging — Milestone 2.

Document shape in the `routine_logs` collection (matches the spec exactly):

    {
        "user_id": "<uuid string>",
        "log_date": "YYYY-MM-DD",
        "completed_steps": [
            {"routine_step_id": "<uuid string>", "completed_at": <datetime>}
        ],
        "water_intake_ml": 2500,
        "sleep_hours": 7.5
    }

One document per (user_id, log_date) pair — see the unique index created in
core/mongodb.py's init_mongo(). All functions here take the `Database`
handle from `get_mongo_db()` as their first argument rather than importing
it directly, so this module has no hidden global state and is easy to
unit test with a fake/mock database.
"""

from datetime import date, datetime, timedelta, timezone

from pymongo.database import Database

ROUTINE_LOGS_COLLECTION = "routine_logs"


def _date_str(log_date: date | None) -> str:
    return (log_date or datetime.now(timezone.utc).date()).isoformat()


def get_log(db: Database, user_id, log_date: date | None = None) -> dict | None:
    """Fetch the single day's checklist document, or None if it doesn't exist yet."""
    return db[ROUTINE_LOGS_COLLECTION].find_one(
        {"user_id": str(user_id), "log_date": _date_str(log_date)}
    )


def upsert_step_completion(
    db: Database,
    user_id,
    routine_step_id: str,
    completed: bool,
    log_date: date | None = None,
    water_intake_ml: float | None = None,
    sleep_hours: float | None = None,
) -> dict:
    """
    Mark a single routine step completed/uncompleted for a given day.

    Called from POST /api/v1/routine/log every time a checkbox is toggled
    on the Daily Planner dashboard. Idempotent: toggling the same step to
    the same state twice in a row doesn't create duplicate entries.
    """
    date_str = _date_str(log_date)
    filter_ = {"user_id": str(user_id), "log_date": date_str}
    collection = db[ROUTINE_LOGS_COLLECTION]

    # Ensure the day's document exists before we start mutating array fields.
    collection.update_one(
        filter_,
        {"$setOnInsert": {"user_id": str(user_id), "log_date": date_str, "completed_steps": []}},
        upsert=True,
    )

    # Always clear any existing entry for this step first, so re-checking
    # a box never produces duplicate completed_steps entries.
    collection.update_one(
        filter_, {"$pull": {"completed_steps": {"routine_step_id": str(routine_step_id)}}}
    )

    if completed:
        collection.update_one(
            filter_,
            {
                "$push": {
                    "completed_steps": {
                        "routine_step_id": str(routine_step_id),
                        "completed_at": datetime.now(timezone.utc),
                    }
                }
            },
        )

    if water_intake_ml is not None or sleep_hours is not None:
        set_fields = {}
        if water_intake_ml is not None:
            set_fields["water_intake_ml"] = water_intake_ml
        if sleep_hours is not None:
            set_fields["sleep_hours"] = sleep_hours
        collection.update_one(filter_, {"$set": set_fields})

    return collection.find_one(filter_)


def get_logs_in_range(db: Database, user_id, days: int = 7) -> list[dict]:
    """Fetch every checklist document for a user over the last `days` days (inclusive of today)."""
    start = datetime.now(timezone.utc).date() - timedelta(days=days - 1)
    date_strs = [(start + timedelta(days=i)).isoformat() for i in range(days)]
    return list(
        db[ROUTINE_LOGS_COLLECTION].find(
            {"user_id": str(user_id), "log_date": {"$in": date_strs}}
        )
    )


def compute_consistency_counts(db: Database, user_id, expected_daily_steps: int, days: int = 7) -> tuple[int, int]:
    """
    Return (completed_count, expected_count) over the last `days` days.

    `expected_daily_steps` is the number of active AM + PM steps in the
    user's current routine (Weekly steps aren't counted — they're not a
    daily expectation). Used by the R_consist (20%) component of the
    Skin Health Score.
    """
    logs = get_logs_in_range(db, user_id, days)
    completed_count = sum(len(log.get("completed_steps", [])) for log in logs)
    expected_count = expected_daily_steps * days
    return completed_count, expected_count
