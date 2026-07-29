# M3R Phase 3 — Progress Tracking & Cloud Photo Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close M3R-P3-T1 through T5 (`docs/milestones/milestone_3/M3R_TASK_LEDGER.md`)
— `MILESTONE 3.pdf` Step 3's real gaps: the 90-day adherence window (7/30 exist),
correct handling of a routine changing mid-window (a real, pre-existing bug — the
current adherence code uses *today's* routine for every historical day, not what
was actually assigned that day), photo metadata (skin-health-score-at-upload +
tag), and merging photo links into the analytics endpoint.

**Architecture:** Pure extension of `backend/app/services/progress/`,
`backend/app/services/routines/` (one new interface function), and
`backend/app/services/analytics/` — no new service module. AM/PM check-in logging
(Mongo `routine_logs`) and the photo upload pipeline (S3-compatible, EXIF-stripped,
presigned URLs) are already real and confirmed working (P0 gap analysis) — this
phase does not touch either of those, only what's built on top of them.

**Tech Stack:** FastAPI + SQLAlchemy async + Motor (Mongo) + Alembic (existing
backend stack, no new dependency).

## Global Constraints

- Rolling **7-day, 30-day, and 90-day** compliance = completed steps ÷ assigned
  steps in the window. **Assigned counts must follow what was actually assigned
  each day** (a routine regenerated mid-window — e.g. a professional's overwrite,
  or a re-assessment — changes what's assigned *going forward*, not retroactively).
  Zero-assigned days are excluded from the denominator entirely (contribute to
  neither side of the ratio).
- Photo metadata: PG row must carry **cloud URL/key, upload timestamp, skin-health
  score at time of upload** (frozen — never recomputed later even if the live
  score changes), **and a tag** (`"Baseline"`, `"Week N"`, user-editable). Upload
  streaming, EXIF-strip, and presigned URLs are unchanged — do not touch
  `core/storage.py`.
- Analytics endpoint (`GET /analytics/me`) becomes the single read surface for
  score timeline + 7/30/90 compliance + photo links together — P4/P5 dashboards
  consume only this endpoint, no client-side recomputation, no second fetch to
  `/progress/me/photos` for chart-adjacent data.
- Real-store fixtures in tests, no mocks. Real Docker stores throughout (this
  repo's established testing philosophy).
- Single-writer rule: any function reading `Routine`/`RoutineStep` rows lives in
  `routines/service.py` as an interface function — `progress/service.py` calls it,
  never queries those models directly (same pattern `list_active_step_ids`/
  `list_recent_routine_logs` already establish).
- Any schema change: Alembic migration + same-change update to
  `database_schemas/skinlytics_postgresql_schema_v3.sql`
  (`database_schemas/skinlytics_mongodb_schema_v3.txt` if a Mongo document shape
  grows, though this phase doesn't add new Mongo fields).
- `ruff` + `mypy --strict` + `pytest` green; `make openapi` after router/schema
  changes.
- **Never add a Co-Authored-By trailer or any AI-assistant co-author to any commit
  message** — AGENTS.md §6 strictly forbids it.

---

### Task 1: Correct adherence math — historical per-day assignment + 7/30/90 compliance

**Why this exists:** `progress/service.py::get_adherence_series` currently computes
every historical day's "assigned steps" from `list_active_step_ids` — the
**current**, active-right-now routine's steps — applied uniformly across the whole
window. If a routine was regenerated partway through the window (a real, common
case: a dermatologist overwrite, P5; a re-assessment), every day *before* that
regeneration is silently judged against the *new* routine's steps, not what was
actually assigned that day. Old routines are soft-deactivated
(`Routine.is_active = False`), never deleted, so their historical composition is
still queryable — this task adds a real historical lookup instead of a shortcut.

**Files:**
- Modify: `backend/app/services/routines/service.py` (new interface function)
- Modify: `backend/app/services/progress/service.py` (`get_adherence_series` fix +
  new `get_compliance_percentages`)
- Modify: `backend/app/services/progress/schemas.py` (new
  `CompliancePercentages` schema)
- Test: `backend/tests/test_routines_service.py`, `backend/tests/test_progress_service.py`

**Interfaces:**
- Produces (in `routines/service.py`): `async def
  list_historical_active_step_ids(db: AsyncSession, user_id: str, days:
  list[datetime.date]) -> dict[datetime.date, set[int]]` — for each requested day,
  the step ids that were actually assigned that day (union across whichever
  routine of each type — AM/PM/Weekly/Seasonal — was current as of that day).
- Modifies: `get_adherence_series(db, user_id, days=30)` — same signature, now
  built on the historical lookup instead of `list_active_step_ids`.
- Produces (in `progress/service.py`): `async def get_compliance_percentages(db:
  AsyncSession, user_id: str) -> CompliancePercentages` — `{seven_day: float |
  None, thirty_day: float | None, ninety_day: float | None}`.

- [ ] **Step 1: Write the failing test for the historical lookup**

```python
# backend/tests/test_routines_service.py, add:
async def test_list_historical_active_step_ids_uses_the_routine_active_on_each_day(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """Real regression for the exact scenario the rubric names: a routine
    regenerated mid-window must not retroactively change what earlier days were
    judged against."""
    old_routine = Routine(
        user_id=test_user_id, routine_name="Old AM", routine_type="AM", is_active=False
    )
    db_session.add(old_routine)
    await db_session.flush()
    old_step = RoutineStep(routine_id=old_routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(old_step)
    await db_session.flush()
    # Backdate created_at directly - the ORM default is "now", this test needs a
    # real earlier timestamp to prove the day-boundary logic, not just insertion order.
    await db_session.execute(
        update(Routine)
        .where(Routine.routine_id == old_routine.routine_id)
        .values(created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=10))
    )

    new_routine = Routine(user_id=test_user_id, routine_name="New AM", routine_type="AM", is_active=True)
    db_session.add(new_routine)
    await db_session.flush()
    new_step = RoutineStep(routine_id=new_routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(new_step)
    await db_session.commit()

    today = datetime.datetime.now(datetime.UTC).date()
    old_day = today - datetime.timedelta(days=8)  # before the new routine existed
    new_day = today  # after

    result = await list_historical_active_step_ids(db_session, test_user_id, [old_day, new_day])

    assert result[old_day] == {old_step.step_id}
    assert result[new_day] == {new_step.step_id}
```

(Add `update` to the existing `sqlalchemy` import line if not already imported;
add `Routine`, `RoutineStep` to the existing model imports; add
`list_historical_active_step_ids` to the existing `routines.service` import.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_routines_service.py -k historical_active_step_ids -v`
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `list_historical_active_step_ids`**

Add to `backend/app/services/routines/service.py` (add `from collections import
defaultdict` to the existing imports if not already present):

```python
async def list_historical_active_step_ids(
    db: AsyncSession, user_id: str, days: list[datetime.date]
) -> dict[datetime.date, set[int]]:
    """Interface function (ADR-005) - for each requested day, the step ids that
    were actually assigned that day: the routine of each type (AM/PM/Weekly/
    Seasonal) that was current as of that day, not necessarily today's routine.
    Old routines are soft-deactivated (is_active=False), never deleted
    (get_or_generate_routines), so their historical composition stays queryable -
    this is what "assigned counts follow what was assigned each day" (MILESTONE
    3.pdf Step 3) means in practice."""
    rows = (
        await db.execute(
            select(Routine.routine_id, Routine.routine_type, Routine.created_at)
            .where(Routine.user_id == user_id)
            .order_by(Routine.created_at)
        )
    ).all()
    by_type: dict[str, list[tuple[datetime.datetime, int]]] = defaultdict(list)
    for routine_id, routine_type, created_at in rows:
        by_type[routine_type or ""].append((created_at, routine_id))

    all_routine_ids = [routine_id for entries in by_type.values() for _, routine_id in entries]
    steps_by_routine: dict[int, set[int]] = defaultdict(set)
    if all_routine_ids:
        step_rows = await db.execute(
            select(RoutineStep.routine_id, RoutineStep.step_id).where(
                RoutineStep.routine_id.in_(all_routine_ids)
            )
        )
        for routine_id, step_id in step_rows.all():
            steps_by_routine[routine_id].add(step_id)

    result: dict[datetime.date, set[int]] = {}
    for day in days:
        day_end = datetime.datetime.combine(day, datetime.time.max, tzinfo=datetime.UTC)
        assigned: set[int] = set()
        for entries in by_type.values():
            candidate: int | None = None
            for created_at, routine_id in entries:
                if created_at <= day_end:
                    candidate = routine_id
                else:
                    break
            if candidate is not None:
                assigned |= steps_by_routine.get(candidate, set())
        result[day] = assigned
    return result
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_routines_service.py -k historical_active_step_ids -v`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the corrected `get_adherence_series`**

```python
# backend/tests/test_progress_service.py, add (needs Routine/RoutineStep/update
# imported the same way as Task 1's routines test):
async def test_adherence_series_uses_the_routine_active_on_each_historical_day(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    old_routine = Routine(
        user_id=progress_test_user, routine_name="Old AM", routine_type="AM", is_active=False
    )
    db_session.add(old_routine)
    await db_session.flush()
    old_step = RoutineStep(routine_id=old_routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(old_step)
    await db_session.flush()
    await db_session.execute(
        update(Routine)
        .where(Routine.routine_id == old_routine.routine_id)
        .values(created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=10))
    )
    new_routine = Routine(user_id=progress_test_user, routine_name="New AM", routine_type="AM", is_active=True)
    db_session.add(new_routine)
    await db_session.flush()
    new_step = RoutineStep(routine_id=new_routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(new_step)
    await db_session.commit()

    # Complete the OLD step on a day the old routine was active - proves the
    # series judges that day against the old step, not the new one (which didn't
    # exist yet and would never match, silently zeroing this day out under the
    # old, buggy behavior).
    old_day = datetime.datetime.now(datetime.UTC).date() - datetime.timedelta(days=8)
    await get_mongo_db()["routine_logs"].insert_one(
        {
            "user_id": progress_test_user,
            "log_date": datetime.datetime.combine(old_day, datetime.time.min),
            "completed_steps": [{"routine_step_id": old_step.step_id}],
        }
    )

    series = await get_adherence_series(db_session, progress_test_user, days=10)

    old_day_entry = next(d for d in series if d.date == old_day)
    assert old_day_entry.completed_ratio == 1.0
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_progress_service.py -k historical_day -v`
Expected: FAIL (old behavior judges the old day against the *new* routine's step,
which the logged completion doesn't match, so `completed_ratio` comes out `0.0`).

- [ ] **Step 7: Fix `get_adherence_series`**

Replace the whole function body in `backend/app/services/progress/service.py`:

```python
async def get_adherence_series(
    db: AsyncSession, user_id: str, days: int = 30
) -> list[AdherenceDay]:
    today = datetime.datetime.now(datetime.UTC).date()
    all_days = [today - datetime.timedelta(days=offset) for offset in range(days - 1, -1, -1)]
    assigned_by_day = await routines_service.list_historical_active_step_ids(db, user_id, all_days)
    logs = await routines_service.list_recent_routine_logs(user_id, days=days)
    logs_by_date = {log["log_date"].date(): log for log in logs}

    series: list[AdherenceDay] = []
    for day in all_days:
        assigned_ids = assigned_by_day.get(day, set())
        if not assigned_ids:
            series.append(AdherenceDay(date=day, completed_ratio=0.0))
            continue
        log = logs_by_date.get(day)
        completed = (
            sum(
                1
                for entry in log.get("completed_steps", [])
                if entry.get("routine_step_id") in assigned_ids
            )
            if log
            else 0
        )
        series.append(AdherenceDay(date=day, completed_ratio=min(1.0, completed / len(assigned_ids))))
    return series
```

(This is a straight replacement — remove the old `step_ids = await
routines_service.list_active_step_ids(...)` line and everything that used it.)

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_progress_service.py -k historical_day -v`
Expected: PASS.

- [ ] **Step 9: Write the failing tests for `get_compliance_percentages`**

```python
# backend/tests/test_progress_service.py, add:
async def test_get_compliance_percentages_computes_completed_over_assigned(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    routine = Routine(user_id=progress_test_user, routine_name="AM", routine_type="AM", is_active=True)
    db_session.add(routine)
    await db_session.flush()
    step_a = RoutineStep(routine_id=routine.routine_id, step_order=1, step_name="Cleanse")
    step_b = RoutineStep(routine_id=routine.routine_id, step_order=2, step_name="Moisturize")
    db_session.add_all([step_a, step_b])
    await db_session.commit()

    today = datetime.datetime.now(datetime.UTC).date()
    # 2 of the last 7 days: both steps completed. The rest: nothing logged.
    for offset in (0, 1):
        day = today - datetime.timedelta(days=offset)
        await get_mongo_db()["routine_logs"].insert_one(
            {
                "user_id": progress_test_user,
                "log_date": datetime.datetime.combine(day, datetime.time.min),
                "completed_steps": [
                    {"routine_step_id": step_a.step_id},
                    {"routine_step_id": step_b.step_id},
                ],
            }
        )

    result = await get_compliance_percentages(db_session, progress_test_user)

    # 7-day window: 2 days x 2 steps completed = 4, out of 7 days x 2 steps = 14.
    assert result.seven_day is not None
    assert abs(result.seven_day - 4 / 14) < 0.001
    assert result.thirty_day is not None
    assert result.ninety_day is not None


async def test_get_compliance_percentages_excludes_zero_assigned_days_from_denominator(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    """A user with no routine at all yet has nothing assigned on any day - the
    percentage must be None (an honest empty state), never a fabricated 0%."""
    result = await get_compliance_percentages(db_session, progress_test_user)

    assert result.seven_day is None
    assert result.thirty_day is None
    assert result.ninety_day is None
```

- [ ] **Step 10: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_progress_service.py -k compliance_percentages -v`
Expected: FAIL with `ImportError`.

- [ ] **Step 11: Add the `CompliancePercentages` schema**

Add to `backend/app/services/progress/schemas.py`:

```python
class CompliancePercentages(BaseModel):
    seven_day: float | None
    thirty_day: float | None
    ninety_day: float | None
```

- [ ] **Step 12: Implement `get_compliance_percentages`**

Add to `backend/app/services/progress/service.py` (add `CompliancePercentages` to
the existing schemas import):

```python
_COMPLIANCE_WINDOWS = (7, 30, 90)


async def get_compliance_percentages(db: AsyncSession, user_id: str) -> CompliancePercentages:
    max_days = max(_COMPLIANCE_WINDOWS)
    today = datetime.datetime.now(datetime.UTC).date()
    all_days = [today - datetime.timedelta(days=offset) for offset in range(max_days - 1, -1, -1)]
    assigned_by_day = await routines_service.list_historical_active_step_ids(db, user_id, all_days)
    logs = await routines_service.list_recent_routine_logs(user_id, days=max_days)
    logs_by_date = {log["log_date"].date(): log for log in logs}

    completed_by_day: dict[datetime.date, int] = {}
    for day in all_days:
        assigned_ids = assigned_by_day.get(day, set())
        log = logs_by_date.get(day)
        completed_by_day[day] = (
            sum(
                1
                for entry in log.get("completed_steps", [])
                if entry.get("routine_step_id") in assigned_ids
            )
            if log and assigned_ids
            else 0
        )

    percentages: dict[str, float | None] = {}
    field_by_window = {7: "seven_day", 30: "thirty_day", 90: "ninety_day"}
    for window in _COMPLIANCE_WINDOWS:
        window_days = all_days[-window:]
        total_assigned = sum(len(assigned_by_day.get(d, set())) for d in window_days)
        total_completed = sum(completed_by_day.get(d, 0) for d in window_days)
        percentages[field_by_window[window]] = (
            round(total_completed / total_assigned, 4) if total_assigned > 0 else None
        )
    return CompliancePercentages(**percentages)
```

- [ ] **Step 13: Run tests, then the full progress + routines test files**

Run: `cd backend && uv run pytest tests/test_progress_service.py tests/test_routines_service.py -v` (timeout: 180000)
Expected: all pass.

- [ ] **Step 14: Commit**

```bash
git add backend/app/services/routines/service.py backend/app/services/progress/service.py \
  backend/app/services/progress/schemas.py backend/tests/test_routines_service.py \
  backend/tests/test_progress_service.py
git commit -m "fix(progress): correct adherence math for mid-window routine changes, add 7/30/90 compliance"
```

---

### Task 2: Photo pipeline metadata (skin-health score at upload + tag)

**Files:**
- Modify: `backend/app/services/progress/models.py`
- Create: `backend/app/migrations/versions/<new>_add_progress_image_score_and_tag.py`
- Modify: `database_schemas/skinlytics_postgresql_schema_v3.sql`
- Modify: `backend/app/services/scores/service.py` (new `get_latest_score`)
- Modify: `backend/app/services/progress/service.py` (`upload_progress_photo`)
- Modify: `backend/app/services/progress/schemas.py` (`ProgressPhotoRead`)
- Modify: `backend/app/services/progress/router.py` (accept a `tag` form field)
- Test: `backend/tests/test_progress_service.py`, a router-level test if
  `test_progress_router.py` exists (check first: `ls backend/tests/test_progress_router.py`)

**Interfaces:**
- `ProgressImage` model gains `skin_health_score_at_upload: float | None` (frozen
  at upload time, never recomputed).
- `upload_progress_photo(db, user_id, data, filename, tag: str | None = None) ->
  ProgressImage` — `image_stage` parameter renamed to `tag` for rubric-literal
  clarity (same column, `image_stage` stays the DB column name — only the Python
  parameter name changes to match "Baseline"/"Week 4" language; check every
  existing call site, there's exactly one, the router).
- Default tag computation: first photo ever uploaded for this user auto-tags
  `"Baseline"`; subsequent ones compute `"Week N"` from weeks-since-baseline. A
  caller-supplied tag always wins over the computed default.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_progress_service.py, add:
async def test_upload_progress_photo_freezes_the_current_skin_health_score(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    await create_profile(
        db_session, progress_test_user, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    await scores_service.compute_and_store_score(db_session, progress_test_user)

    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "selfie.jpg"
    )

    assert photo.skin_health_score_at_upload is not None


async def test_first_photo_auto_tags_baseline_second_computes_week_number(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    first = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg"
    )
    second = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "two.jpg"
    )

    assert first.image_stage == "Baseline"
    assert second.image_stage is not None and second.image_stage.startswith("Week")


async def test_upload_progress_photo_accepts_an_explicit_tag_override(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg", tag="Month 2"
    )

    assert photo.image_stage == "Month 2"


async def test_progress_photo_score_stays_frozen_after_a_later_score_changes(
    db_session: AsyncSession, progress_test_user: str
) -> None:
    await create_profile(
        db_session, progress_test_user, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    await scores_service.compute_and_store_score(db_session, progress_test_user)
    photo = await upload_progress_photo(
        db_session, progress_test_user, _real_jpeg_bytes(), "one.jpg"
    )
    frozen_score = photo.skin_health_score_at_upload

    await scores_service.compute_and_store_score(db_session, progress_test_user)  # recompute again

    reloaded = (await list_progress_photos(db_session, progress_test_user))[0]
    assert reloaded.skin_health_score_at_upload == frozen_score
```

(Add `from app.services.scores import service as scores_service`,
`from app.services.skin_profile.schemas import SkinProfileCreate`,
`from app.services.skin_profile.service import create_profile` to the existing
imports if not already there.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_progress_service.py -k "freezes_the_current or auto_tags or explicit_tag or stays_frozen" -v`
Expected: FAIL (`skin_health_score_at_upload` doesn't exist; `tag=` isn't an
accepted keyword yet).

- [ ] **Step 3: Add the model column**

Add to `backend/app/services/progress/models.py`:

```python
    skin_health_score_at_upload: Mapped[float | None] = mapped_column(default=None)
```

(Add `Numeric` to the existing sqlalchemy import if the codebase uses it for other
score-like float columns — check `scores/models.py`'s `overall_score` column for
the exact type convention (`Numeric(5, 2)`) and match it here.)

- [ ] **Step 4: Generate and apply the migration**

Run: `cd backend && uv run alembic revision -m "add progress image score and tag column already exists"`

```python
def upgrade() -> None:
    op.add_column(
        "progress_images", sa.Column("skin_health_score_at_upload", sa.Numeric(5, 2), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("progress_images", "skin_health_score_at_upload")
```

Run: `cd backend && uv run alembic upgrade head`

- [ ] **Step 5: Mirror the canonical SQL doc**

In `database_schemas/skinlytics_postgresql_schema_v3.sql`, find the
`progress_images` (or equivalent) table definition and add:

```sql
    skin_health_score_at_upload DECIMAL(5,2),
```

- [ ] **Step 6: Implement the tag default + score freeze in `upload_progress_photo`**

Replace the function body in `backend/app/services/progress/service.py`:

```python
async def upload_progress_photo(
    db: AsyncSession,
    user_id: str,
    data: bytes,
    filename: str,
    tag: str | None = None,
) -> ProgressImage:
    """EXIF stripped before it ever reaches storage. `tag` defaults to
    "Baseline" for a user's first-ever photo, "Week N" (computed from
    weeks-since-baseline) for subsequent ones - a caller-supplied tag always
    wins. `skin_health_score_at_upload` is read from the scores service
    interface once, at upload time, and never recomputed - a later score
    change must not retroactively rewrite what this photo's caption claimed."""
    sniffed = sniff_content_type(data)
    if sniffed is None or sniffed not in _PROGRESS_PHOTO_CONTENT_TYPES:
        raise FileValidationError("Unsupported file type")
    stripped = strip_exif(data, sniffed)

    key = build_key(prefix="progress-photos", owner_user_id=user_id, filename=filename)
    await upload(key, stripped, allowed_content_types=_PROGRESS_PHOTO_CONTENT_TYPES)

    existing_photos = await list_progress_photos(db, user_id)
    if tag is not None:
        resolved_tag = tag
    elif not existing_photos:
        resolved_tag = "Baseline"
    else:
        weeks_since_baseline = max(
            1, (datetime.datetime.now(datetime.UTC).date() - existing_photos[0].uploaded_at.date()).days // 7
        )
        resolved_tag = f"Week {weeks_since_baseline}"

    latest_score = await scores_service.get_latest_score(db, user_id)
    score_at_upload = float(latest_score.overall_score) if latest_score and latest_score.overall_score is not None else None

    image = ProgressImage(
        user_id=user_id,
        image_url=key,
        image_stage=resolved_tag,
        skin_health_score_at_upload=score_at_upload,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image
```

Confirmed during planning: no "get latest score regardless of age" function exists
yet in `scores/service.py` — only `get_recent_scores(db, user_id, days)` (bounded
to a day-window, ascending order) and `get_score_by_id` (by specific id). Add a
small new function to `backend/app/services/scores/service.py`, next to
`get_recent_scores`:

```python
async def get_latest_score(db: AsyncSession, user_id: str) -> SkinScore | None:
    """Interface function (ADR-005) - the single most recent score regardless of
    age, unlike get_recent_scores' day-bounded window. First real consumer:
    progress/service.py's photo-upload score freeze."""
    result = await db.execute(
        select(SkinScore)
        .where(SkinScore.user_id == user_id)
        .order_by(SkinScore.calculated_at.desc())
        .limit(1)
    )
    return result.scalars().first()
```

- [ ] **Step 7: Update `ProgressPhotoRead` and its one builder**

In `backend/app/services/progress/schemas.py`:

```python
class ProgressPhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    progress_image_id: int
    image_stage: str | None
    uploaded_at: datetime.datetime
    skin_health_score_at_upload: float | None
    url: str
```

In `backend/app/services/progress/service.py`'s `get_progress_photos`, add
`skin_health_score_at_upload=photo.skin_health_score_at_upload` to the
`ProgressPhotoRead(...)` construction.

- [ ] **Step 8: Update the router to accept an optional tag**

In `backend/app/services/progress/router.py`'s `upload_my_progress_photo`, add a
`tag: Annotated[str | None, Form()] = None` parameter (add `Form` to the existing
`fastapi` import), and pass it through:

```python
    await service.upload_progress_photo(
        db, user["id"], data, file.filename or "photo.jpg", tag=tag
    )
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_progress_service.py -k "freezes_the_current or auto_tags or explicit_tag or stays_frozen" -v`
Expected: PASS.

- [ ] **Step 10: Run the full progress test file + `make openapi`**

Run: `cd backend && uv run pytest tests/test_progress_service.py -v`
Run: `make openapi` (from repo root) — confirm `web/lib/api-types.ts`'s diff is
scoped to `ProgressPhotoRead`'s new field and the upload endpoint's new `tag`
form param.

- [ ] **Step 11: Commit**

```bash
git add backend/app/services/progress/models.py backend/app/migrations/versions/ \
  database_schemas/skinlytics_postgresql_schema_v3.sql backend/app/services/scores/service.py \
  backend/app/services/progress/service.py backend/app/services/progress/schemas.py \
  backend/app/services/progress/router.py backend/tests/test_progress_service.py web/lib/api-types.ts
git commit -m "feat(progress): freeze skin-health score at photo upload, wire the Baseline/Week N tag through the API"
```

---

### Task 3: Merge photo links + compliance percentages into the analytics endpoint

**Files:**
- Modify: `backend/app/services/analytics/schemas.py`
- Modify: `backend/app/services/analytics/service.py`
- Test: `backend/tests/test_analytics_service.py` if it exists (check first: `ls
  backend/tests/test_analytics_service.py`), else add to whichever analytics test
  file already exists (`grep -rl get_my_analytics backend/tests/`)

**Interfaces:**
- `AnalyticsMeRead` gains `compliance: CompliancePercentagesRead` (a small
  analytics-owned mirror shape — analytics owns nothing per its own docstring, so
  this is a plain re-read of `progress_service.get_compliance_percentages`'s
  result, not a new computation) and `photos: list[ProgressPhotoRead]`.

- [ ] **Step 1: Write the failing test**

```python
# in whichever analytics test file already covers get_my_analytics, add:
async def test_get_my_analytics_includes_compliance_and_photos(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    await scores_service.compute_and_store_score(db_session, test_user_id)
    await progress_service.upload_progress_photo(
        db_session, test_user_id, _real_jpeg_bytes(), "one.jpg"
    )

    result = await get_my_analytics(db_session, test_user_id)

    assert result.compliance.seven_day is not None or result.compliance.seven_day is None
    assert len(result.photos) == 1
    assert result.photos[0].image_stage == "Baseline"
    assert result.photos[0].skin_health_score_at_upload is not None
```

(Reuse whatever real-JPEG-bytes helper and imports the existing analytics test
file already has, or import them from `test_progress_service.py` if the analytics
test file doesn't have its own — check first rather than duplicating.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest -k includes_compliance_and_photos -v`
Expected: FAIL (`AnalyticsMeRead` has no `compliance`/`photos` fields yet).

- [ ] **Step 3: Add the schema fields**

In `backend/app/services/analytics/schemas.py`, add
`from app.services.progress.schemas import CompliancePercentages, ProgressPhotoRead`
and:

```python
class AnalyticsMeRead(BaseModel):
    score_vs_adherence: list[ScoreAdherencePoint]
    correlations: list[CorrelationInsight]
    compliance: CompliancePercentages
    photos: list[ProgressPhotoRead]
```

- [ ] **Step 4: Wire the two new fields into `get_my_analytics`**

In `backend/app/services/analytics/service.py`, add
`compliance=await progress_service.get_compliance_percentages(db, user_id)` and
`photos=(await progress_service.get_progress_photos(db, user_id)).photos` to the
`AnalyticsMeRead(...)` return construction (both call the same interface functions
Task 1/2 already built — no new logic in this file, analytics stays a pure
aggregator per its own docstring).

- [ ] **Step 5: Run tests to verify they pass, then the full gate**

Run: `cd backend && uv run pytest -k includes_compliance_and_photos -v`
Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q` (timeout: 1800000)
Run: `make openapi`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/analytics/schemas.py backend/app/services/analytics/service.py \
  backend/tests/ web/lib/api-types.ts
git commit -m "feat(analytics): merge compliance percentages and photo links into GET /analytics/me"
```

---

### Task 4: Full gate + docs/ledger close-out

**Files:**
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`
- Modify: `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md`
- Modify: `docs/milestones/milestone_3/M3R_API_CONTRACT.md` §4 (if the analytics
  shape frozen there doesn't match what was actually built — reconcile, don't
  leave both versions standing)

- [ ] **Step 1: Run the full gate**

Run: `cd backend && uv run ruff check . && uv run mypy --strict . && uv run pytest -q`
Run: `cd web && npm run typecheck && npm run lint && npm run build`
Expected: all green (aside from the two already-known, independently-confirmed-
flaky ES-isolation tests in `test_ingredients_service.py` — don't chase those).

- [ ] **Step 2: Update the ledger**

Mark `M3R-P3-T1` through `M3R-P3-T5` `DONE` with evidence: the real
`list_historical_active_step_ids` fix (a genuine bug fix, not just a gap-fill —
say so plainly), the migration revision id, real test names/counts.

- [ ] **Step 3: Update the gap analysis and API contract**

`M3R_GAP_ANALYSIS.md` §3: mark the 90-day window, photo tag/score, and analytics
merge gaps closed, with the real mechanism (historical step lookup) described
accurately — not just "90-day window added" when the more significant fix is the
mid-window correctness bug.

- [ ] **Step 4: Commit**

```bash
git add docs/milestones/milestone_3/M3R_TASK_LEDGER.md docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md \
  docs/milestones/milestone_3/M3R_API_CONTRACT.md
git commit -m "docs(m3r): close P3 ledger rows - progress tracking rebuilt to rubric spec"
```

---

## Verification (against the running stack, per the phase file)

Check off routine steps across several seeded days (including at least one day
before a routine regeneration, to exercise the mid-window fix), upload two photos
(one auto-tagged Baseline, one later) → hit `GET /api/v1/analytics/me` and paste
the JSON showing all three compliance windows, the score timeline, and both photos
with tags + frozen scores. Confirm the raw bucket object is NOT publicly fetchable
and the presigned link works once.

## Exit

Manual self-review (no `gh`/PR, per Phase 1's recorded decision) → merge
`feat/m3r-p3-progress-photo-pipeline` to `dev` → delete branch → `graphify update .`
→ `PROGRESS.md` entry.
