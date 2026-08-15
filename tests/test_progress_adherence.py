"""
Milestone 3, Step 5.1 — Automated backend testing for the Adherence Math
Engine: rolling compliance rate calculation.

compute_consistency_counts (Milestone 2) already returns (completed,
expected); this tests the percentage math built on top of it directly,
using mongomock so no real MongoDB server is required.
"""

from datetime import datetime, timedelta, timezone

import mongomock

from services import mongo_service


def _seed_logs(db, user_id, days_with_full_completion, expected_daily_steps):
    """Write `days_with_full_completion` days of fully-completed logs, most recent first."""
    today = datetime.now(timezone.utc).date()
    for i in range(days_with_full_completion):
        log_date = today - timedelta(days=i)
        for step_num in range(expected_daily_steps):
            mongo_service.upsert_step_completion(
                db, user_id, routine_step_id=f"step-{step_num}", completed=True, log_date=log_date
            )


def test_perfect_adherence_over_7_days():
    """3 expected daily steps, all completed every day for 7 days -> 100%."""
    client = mongomock.MongoClient()
    db = client["test_db"]
    user_id = "user-1"

    _seed_logs(db, user_id, days_with_full_completion=7, expected_daily_steps=3)

    completed, expected = mongo_service.compute_consistency_counts(db, user_id, expected_daily_steps=3, days=7)
    rate = round((completed / expected) * 100, 1)

    assert expected == 21  # 3 steps x 7 days
    assert completed == 21
    assert rate == 100.0


def test_partial_adherence_over_7_days():
    """Only 2 of 7 days logged (out of 3 expected steps/day) -> ~28.6%."""
    client = mongomock.MongoClient()
    db = client["test_db"]
    user_id = "user-2"

    _seed_logs(db, user_id, days_with_full_completion=2, expected_daily_steps=3)

    completed, expected = mongo_service.compute_consistency_counts(db, user_id, expected_daily_steps=3, days=7)
    rate = round((completed / expected) * 100, 1)

    assert expected == 21
    assert completed == 6
    assert rate == 28.6


def test_zero_expected_steps_does_not_divide_by_zero():
    """No active routine yet (0 expected daily steps) — caller must guard the division, not this function."""
    client = mongomock.MongoClient()
    db = client["test_db"]
    completed, expected = mongo_service.compute_consistency_counts(db, "user-3", expected_daily_steps=0, days=7)

    assert expected == 0
    assert completed == 0
