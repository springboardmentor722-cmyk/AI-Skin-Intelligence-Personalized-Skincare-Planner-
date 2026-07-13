import datetime
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.seeding import seeded_random
from app.db.mongo import get_mongo_db
from app.services.recommendations import service as recommendations_service
from app.services.recommendations.schemas import ProductRead
from app.services.routines.models import Routine, RoutineProduct, RoutineStep
from app.services.routines.schemas import RoutineProductRead, RoutineRead, RoutineStepRead
from app.services.skin_profile import service as skin_profile_service

_ROUTINE_LOGS_COLLECTION = "routine_logs"

_STEP_INSTRUCTIONS = {
    "Cleanser": "Massage onto damp skin for 30-60 seconds, then rinse with lukewarm water.",
    "Treatment": "Apply a thin layer to clean, dry skin. Avoid the eye area.",
    "Moisturizer": "Apply evenly while skin is still slightly damp to lock in hydration.",
    "Sunscreen": "Apply generously as the last step, 15 minutes before sun exposure.",
}
# Weekly Care's Treatment step uses different cadence guidance than the daily AM/PM
# Treatment step (same category, same candidate pool/safety filter — see
# _generate_routine — just used less often), so it gets its own instruction text
# instead of sharing _STEP_INSTRUCTIONS["Treatment"].
_WEEKLY_STEP_INSTRUCTIONS = {
    "Treatment": "Use 2-3 times per week, not daily — allow skin to rest in between applications.",
}
_AM_CATEGORIES = ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"]
_PM_CATEGORIES = ["Cleanser", "Treatment", "Moisturizer"]
# The seed catalog (backend/app/db/seed.py) has no dedicated exfoliant/mask product
# category — Weekly Care's one real, non-invented category is Treatment, the same
# actives AM/PM already draw from, just at a lower cadence (see _WEEKLY_STEP_INSTRUCTIONS).
_WEEKLY_CATEGORIES = ["Treatment"]


async def _read_with_steps(db: AsyncSession, routine: Routine) -> RoutineRead:
    steps_result = await db.execute(
        select(RoutineStep)
        .where(RoutineStep.routine_id == routine.routine_id)
        .order_by(RoutineStep.step_order)
    )
    steps = list(steps_result.scalars().all())
    completed_today = await get_completed_step_ids(
        routine.user_id, datetime.datetime.now(datetime.UTC).date()
    )

    step_reads = []
    for step in steps:
        rp_result = await db.execute(
            select(RoutineProduct).where(RoutineProduct.step_id == step.step_id)
        )
        routine_products = list(rp_result.scalars().all())
        products_by_id = await recommendations_service.get_products_by_ids(
            db, [rp.product_id for rp in routine_products]
        )

        step_reads.append(
            RoutineStepRead(
                step_id=step.step_id,
                step_order=step.step_order,
                step_name=step.step_name,
                instruction=step.instruction,
                duration_minutes=step.duration_minutes,
                completed_today=step.step_id in completed_today,
                products=[
                    RoutineProductRead(
                        product=ProductRead.model_validate(products_by_id[rp.product_id]),
                        usage_notes=rp.usage_notes,
                    )
                    for rp in routine_products
                    if rp.product_id in products_by_id
                ],
            )
        )

    return RoutineRead(
        routine_id=routine.routine_id,
        routine_name=routine.routine_name,
        routine_type=routine.routine_type,
        description=routine.description,
        steps=step_reads,
    )


async def _generate_routine(
    db: AsyncSession,
    user_id: str,
    routine_type: str,
    routine_name: str,
    categories: list[str],
    skin_type_id: int,
    concern_ids: list[int],
    step_instructions: dict[str, str] = _STEP_INSTRUCTIONS,
) -> Routine:
    rng = seeded_random(user_id, "routine", routine_type)
    # Hard safety filter (Milestone 2 Step 4 / docs/AI_ML.md Principle 3) — never
    # generate a step around a product carrying an ingredient flagged unsafe for this
    # skin type (e.g. strong exfoliants avoid-flagged for Sensitive skin,
    # backend/app/db/seed.py). Applied before candidate selection, not after.
    avoided_product_ids = await recommendations_service.list_avoided_ingredient_product_ids(
        db, skin_type_id
    )

    routine = Routine(
        user_id=user_id,
        routine_name=routine_name,
        routine_type=routine_type,
        description=f"Starter {routine_type} routine based on your skin profile.",
        is_active=True,
        generated_by_ai=True,
    )
    db.add(routine)
    await db.flush()  # assigns routine.routine_id without committing yet

    for order, category in enumerate(categories, start=1):
        candidates = await recommendations_service.list_products_for_skin_type(
            db, skin_type_id, category=category
        )
        candidates = [p for p in candidates if p.product_id not in avoided_product_ids]
        if not candidates:
            continue
        product_concerns = await recommendations_service.list_concern_ids_for_products(
            db, [p.product_id for p in candidates]
        )
        concern_matches = [
            p
            for p in candidates
            if set(product_concerns.get(p.product_id, [])) & set(concern_ids)
        ]
        chosen = rng.choice(concern_matches or candidates)

        step = RoutineStep(
            routine_id=routine.routine_id,
            step_order=order,
            step_name=category,
            instruction=step_instructions.get(category, "Apply as directed."),
            duration_minutes=1,
        )
        db.add(step)
        await db.flush()  # assigns step.step_id

        db.add(
            RoutineProduct(
                routine_id=routine.routine_id, product_id=chosen.product_id, step_id=step.step_id
            )
        )

    return routine


async def get_or_generate_routines(db: AsyncSession, user_id: str) -> list[RoutineRead]:
    """Deterministic, `hash(user_id)`-seeded routine generation (ADR-007 spirit) — no
    dedicated AI model surface exists for routine planning (docs/ARCHITECTURE.md §5's 7
    surfaces don't include one), so this is rule-based candidate selection over the
    skin_type/concern junction tables (ADR-001: relationship queries are indexed joins,
    not a graph DB), with a seeded pick where multiple products qualify. Generates AM,
    PM, and Weekly Care (Milestone 2) — three real routines, not the Dashboard's
    AM/PM-only checklist.

    Generated once per user and reused on subsequent reads. Regenerating automatically
    after a skin-profile update isn't built yet (routines has no skin_profile_id column
    to key off — database_schemas/...sql) — a known M1 gap, tracked in PROGRESS.md."""
    existing = await db.execute(
        select(Routine).where(Routine.user_id == user_id, Routine.is_active.is_(True))
    )
    routines = list(existing.scalars().all())
    if routines:
        return [await _read_with_steps(db, r) for r in routines]

    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        return []
    concern_ids = [c.concern_id for c in profile.concerns]

    am = await _generate_routine(
        db, user_id, "AM", "Morning Routine", _AM_CATEGORIES, profile.skin_type_id, concern_ids
    )
    pm = await _generate_routine(
        db, user_id, "PM", "Evening Routine", _PM_CATEGORIES, profile.skin_type_id, concern_ids
    )
    weekly = await _generate_routine(
        db,
        user_id,
        "Weekly",
        "Weekly Care",
        _WEEKLY_CATEGORIES,
        profile.skin_type_id,
        concern_ids,
        step_instructions=_WEEKLY_STEP_INSTRUCTIONS,
    )
    await db.commit()
    await db.refresh(am)
    await db.refresh(pm)
    await db.refresh(weekly)

    return [
        await _read_with_steps(db, am),
        await _read_with_steps(db, pm),
        await _read_with_steps(db, weekly),
    ]


# --- Routine completion logs (Mongo, M2) ---
# Milestone 2 Step 1.2/5.2: real checklist persistence, one doc per user per day —
# same shape/pattern as skin_profile/service.py's lifestyle_logs. Backs both the
# dashboard's persisted checkbox state (RoutineStepRead.completed_today above) and the
# real routine_adherence Skin Health Score component (scores/service.py).


def _day_start(day: datetime.date) -> datetime.datetime:
    return datetime.datetime.combine(day, datetime.time.min)


async def get_completed_step_ids(user_id: str, log_date: datetime.date) -> set[int]:
    collection = get_mongo_db()[_ROUTINE_LOGS_COLLECTION]
    doc = await collection.find_one({"user_id": user_id, "log_date": _day_start(log_date)})
    if doc is None:
        return set()
    return {entry["routine_step_id"] for entry in doc.get("completed_steps", [])}


async def toggle_step_completion(user_id: str, step_id: int, completed: bool) -> None:
    collection = get_mongo_db()[_ROUTINE_LOGS_COLLECTION]
    today = _day_start(datetime.datetime.now(datetime.UTC).date())
    # Pull any existing entry for this step first so re-checking the same step twice
    # in one day can't create duplicate completed_steps rows — upsert=True here also
    # covers "first toggle of the day" (no doc exists yet).
    await collection.update_one(
        {"user_id": user_id, "log_date": today},
        {"$pull": {"completed_steps": {"routine_step_id": step_id}}},
        upsert=True,
    )
    if completed:
        await collection.update_one(
            {"user_id": user_id, "log_date": today},
            {
                "$push": {
                    "completed_steps": {
                        "routine_step_id": step_id,
                        "completed_at": datetime.datetime.now(datetime.UTC),
                    }
                }
            },
        )


async def list_recent_routine_logs(user_id: str, days: int = 30) -> list[dict[str, Any]]:
    collection = get_mongo_db()[_ROUTINE_LOGS_COLLECTION]
    since = _day_start(
        datetime.datetime.now(datetime.UTC).date() - datetime.timedelta(days=days - 1)
    )
    cursor = collection.find({"user_id": user_id, "log_date": {"$gte": since}}).sort(
        "log_date", -1
    )
    return [doc async for doc in cursor]


async def list_active_step_ids(db: AsyncSession, user_id: str) -> list[int]:
    """Interface function (ADR-005) — scores/service.py reads the scheduled-step count
    for routine_adherence through this, never `routine_steps` directly."""
    result = await db.execute(
        select(RoutineStep.step_id)
        .join(Routine, Routine.routine_id == RoutineStep.routine_id)
        .where(Routine.user_id == user_id, Routine.is_active.is_(True))
    )
    return list(result.scalars().all())


# --- Routine edit/reorder (M2, deferred half of the My Routine screen) ---
# app-routine-edit.html's real, schema-backed parts only — reorder/add/delete a
# step, swap a step's product, edit usage notes. The wireframe's "Interaction
# Conflict" banner, invented match-percentage "Recommended Alternatives", and "AI
# Prediction: Barrier Health" chart are deliberately not built: no ingredient-
# interaction table exists anywhere in database_schemas/, and there's no real
# ranking/predictive model behind any of the three — same "raw exports never ship"
# precedent the Dashboard and My Routine screens already set for this wireframe pack.


class UnsafeProductError(ValueError):
    """Distinct from a plain not-found ValueError — routers map this to 400, not
    404, since it's a rejected choice, not a missing resource."""


async def _get_owned_routine(db: AsyncSession, user_id: str, routine_id: int) -> Routine:
    result = await db.execute(
        select(Routine).where(Routine.routine_id == routine_id, Routine.user_id == user_id)
    )
    routine = result.scalar_one_or_none()
    if routine is None:
        raise ValueError("Routine not found")
    return routine


async def _get_owned_step(db: AsyncSession, user_id: str, step_id: int) -> RoutineStep:
    result = await db.execute(
        select(RoutineStep)
        .join(Routine, Routine.routine_id == RoutineStep.routine_id)
        .where(RoutineStep.step_id == step_id, Routine.user_id == user_id)
    )
    step = result.scalar_one_or_none()
    if step is None:
        raise ValueError("Step not found")
    return step


async def _assert_product_is_safe(db: AsyncSession, user_id: str, product_id: int) -> None:
    """Same hard safety filter _generate_routine enforces at generation time
    (recommendations_service.list_avoided_ingredient_product_ids), now enforced on
    manual edits too — a user (or a direct API call) can't add/swap in a product
    flagged unsafe for their own skin type."""
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        raise ValueError("No skin profile yet")
    avoided = await recommendations_service.list_avoided_ingredient_product_ids(
        db, profile.skin_type_id
    )
    if product_id in avoided:
        raise UnsafeProductError("This product isn't safe for your skin type")


async def reorder_steps(
    db: AsyncSession, user_id: str, routine_id: int, step_ids: list[int]
) -> RoutineRead:
    routine = await _get_owned_routine(db, user_id, routine_id)
    steps_result = await db.execute(
        select(RoutineStep).where(RoutineStep.routine_id == routine_id)
    )
    steps_by_id = {s.step_id: s for s in steps_result.scalars().all()}
    if set(step_ids) != set(steps_by_id):
        raise ValueError("step_ids must match the routine's existing steps exactly")

    for order, step_id in enumerate(step_ids, start=1):
        steps_by_id[step_id].step_order = order
    await db.commit()
    await db.refresh(routine)
    return await _read_with_steps(db, routine)


async def add_step(
    db: AsyncSession, user_id: str, routine_id: int, step_name: str, product_id: int
) -> RoutineRead:
    routine = await _get_owned_routine(db, user_id, routine_id)
    await _assert_product_is_safe(db, user_id, product_id)

    max_order_result = await db.execute(
        select(func.max(RoutineStep.step_order)).where(RoutineStep.routine_id == routine_id)
    )
    next_order = (max_order_result.scalar_one_or_none() or 0) + 1

    step = RoutineStep(
        routine_id=routine_id,
        step_order=next_order,
        step_name=step_name,
        instruction=_STEP_INSTRUCTIONS.get(step_name, "Apply as directed."),
        duration_minutes=1,
    )
    db.add(step)
    await db.flush()  # assigns step.step_id
    db.add(RoutineProduct(routine_id=routine_id, product_id=product_id, step_id=step.step_id))

    await db.commit()
    await db.refresh(routine)
    return await _read_with_steps(db, routine)


async def delete_step(db: AsyncSession, user_id: str, step_id: int) -> RoutineRead:
    step = await _get_owned_step(db, user_id, step_id)
    routine_id = step.routine_id

    await db.execute(delete(RoutineProduct).where(RoutineProduct.step_id == step_id))
    await db.delete(step)
    await db.flush()

    remaining_result = await db.execute(
        select(RoutineStep)
        .where(RoutineStep.routine_id == routine_id)
        .order_by(RoutineStep.step_order)
    )
    for order, remaining_step in enumerate(remaining_result.scalars().all(), start=1):
        remaining_step.step_order = order

    await db.commit()
    routine = await _get_owned_routine(db, user_id, routine_id)
    return await _read_with_steps(db, routine)


async def update_step(
    db: AsyncSession,
    user_id: str,
    step_id: int,
    step_name: str | None,
    product_id: int | None,
    usage_notes: str | None,
) -> RoutineRead:
    step = await _get_owned_step(db, user_id, step_id)

    if step_name is not None:
        step.step_name = step_name

    if product_id is not None:
        await _assert_product_is_safe(db, user_id, product_id)
        rp_result = await db.execute(
            select(RoutineProduct).where(RoutineProduct.step_id == step_id)
        )
        routine_product = rp_result.scalars().first()
        if routine_product is None:
            db.add(
                RoutineProduct(
                    routine_id=step.routine_id, product_id=product_id, step_id=step_id
                )
            )
        else:
            routine_product.product_id = product_id
            if usage_notes is not None:
                routine_product.usage_notes = usage_notes
    elif usage_notes is not None:
        rp_result = await db.execute(
            select(RoutineProduct).where(RoutineProduct.step_id == step_id)
        )
        routine_product = rp_result.scalars().first()
        if routine_product is not None:
            routine_product.usage_notes = usage_notes

    await db.commit()
    routine = await _get_owned_routine(db, user_id, step.routine_id)
    return await _read_with_steps(db, routine)


async def search_products_for_edit(
    db: AsyncSession, user_id: str, category: str, query: str
) -> list[ProductRead]:
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        return []
    candidates = await recommendations_service.list_products_for_skin_type(
        db, profile.skin_type_id, category=category
    )
    avoided = await recommendations_service.list_avoided_ingredient_product_ids(
        db, profile.skin_type_id
    )
    query_lower = query.strip().lower()
    matches = [
        p
        for p in candidates
        if p.product_id not in avoided
        and (
            not query_lower
            or query_lower in (p.product_name or "").lower()
            or query_lower in (p.brand_name or "").lower()
        )
    ]
    return [ProductRead.model_validate(p) for p in matches[:10]]
