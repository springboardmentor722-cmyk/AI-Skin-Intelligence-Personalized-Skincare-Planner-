import datetime
from collections import defaultdict
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.seeding import seeded_random
from app.db.mongo import get_mongo_db
from app.services.recommendations import service as recommendations_service
from app.services.recommendations.schemas import ProductRead
from app.services.routines import constants, guardrails
from app.services.routines.constants import PipelineStep
from app.services.routines.guardrails import GeneratedStep
from app.services.routines.models import Routine, RoutineProduct, RoutineStep
from app.services.routines.schemas import RoutineProductRead, RoutineRead, RoutineStepRead
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.schemas import SkinProfileRead

_ROUTINE_LOGS_COLLECTION = "routine_logs"

# Milestone 2 P11 — one instruction per canonical category (routines/constants.py),
# not per real product category: Exfoliation and Night Care now have their own
# guidance even though both draw candidates from a shared real product category.
_STEP_INSTRUCTIONS: dict[str, str] = {
    constants.CLEANSING: "Massage onto damp skin for 30-60 seconds, then rinse with lukewarm"
    " water.",
    constants.EXFOLIATION: "Apply to clean, dry skin 2-3 times per week — not daily.",
    constants.TREATMENT: "Apply a thin layer to clean, dry skin. Avoid the eye area.",
    constants.MOISTURIZING: "Apply evenly while skin is still slightly damp to lock in hydration.",
    constants.SUN_PROTECTION: "Apply generously as the last step, 15 minutes before sun exposure.",
    constants.NIGHT_CARE: "Apply as the final step before bed to reinforce the barrier overnight.",
}


def _current_season(today: datetime.date | None = None) -> str:
    return constants.SEASON_BY_MONTH[(today or datetime.datetime.now(datetime.UTC).date()).month]


async def _read_with_steps(db: AsyncSession, routine: Routine) -> RoutineRead:
    """Production-readiness audit finding: this used to do 2 extra DB round trips
    *per step* (a RoutineProduct query, then a get_products_by_ids call) instead of
    batching once across the whole routine — a real N+1, and this function runs
    once per routine returned by get_or_generate_routines (up to 4: AM/PM/Weekly/
    Seasonal) on every GET /routines/me, one of the most frequently-hit endpoints
    in the app. Now 3 queries total regardless of step count: steps, all their
    routine_products in one IN(...), all their products in one IN(...)
    (get_products_by_ids already batches — it just wasn't being called at the
    right granularity)."""
    steps_result = await db.execute(
        select(RoutineStep)
        .where(RoutineStep.routine_id == routine.routine_id)
        .order_by(RoutineStep.step_order)
    )
    steps = list(steps_result.scalars().all())
    completed_today = await get_completed_step_ids(
        routine.user_id, datetime.datetime.now(datetime.UTC).date()
    )

    step_ids = [step.step_id for step in steps]
    routine_products_by_step: dict[int, list[RoutineProduct]] = defaultdict(list)
    if step_ids:
        rp_result = await db.execute(
            select(RoutineProduct).where(RoutineProduct.step_id.in_(step_ids))
        )
        for rp in rp_result.scalars().all():
            if rp.step_id is not None:  # always true here (filtered by a real step_id list)
                routine_products_by_step[rp.step_id].append(rp)

    all_product_ids = [rp.product_id for rps in routine_products_by_step.values() for rp in rps]
    products_by_id = await recommendations_service.get_products_by_ids(db, all_product_ids)

    step_reads = [
        RoutineStepRead(
            step_id=step.step_id,
            step_order=step.step_order,
            step_name=step.step_name,
            category=step.category,
            instruction=step.instruction,
            rationale=step.rationale,
            safety_flag=step.safety_flag,
            duration_minutes=step.duration_minutes,
            completed_today=step.step_id in completed_today,
            products=[
                RoutineProductRead(
                    product=ProductRead.model_validate(products_by_id[rp.product_id]),
                    usage_notes=rp.usage_notes,
                )
                for rp in routine_products_by_step[step.step_id]
                if rp.product_id in products_by_id
            ],
        )
        for step in steps
    ]

    return RoutineRead(
        routine_id=routine.routine_id,
        routine_name=routine.routine_name,
        routine_type=routine.routine_type,
        description=routine.description,
        score_id=routine.score_id,
        steps=step_reads,
    )


async def _generate_steps(
    db: AsyncSession,
    pipeline: list[PipelineStep],
    skin_type_id: int,
    skin_type_name: str | None,
    concern_ids: list[int],
    redness_severity: int | None,
    rng: Any,
    profile: SkinProfileRead,
) -> list[GeneratedStep]:
    """Candidate selection (generation) — returns in-memory steps, not yet
    persisted. `routines/guardrails.py`'s safety layer runs on the result
    afterward, in `_generate_routine` below, so a future change here can't
    quietly skip it."""
    avoided_product_ids = await recommendations_service.list_avoided_ingredient_product_ids(
        db, skin_type_id
    )
    all_candidates = await recommendations_service.list_products_for_skin_type(
        db, skin_type_id, category=None
    )
    suitability = await recommendations_service.evaluate_products_suitability(
        db, [p.product_id for p in all_candidates], profile, skin_type_name
    )
    candidates_by_product_category: dict[str, list[Any]] = defaultdict(list)
    for product in all_candidates:
        if (
            product.product_id not in avoided_product_ids
            and not suitability[product.product_id].any_allergy
        ):
            candidates_by_product_category[product.category or ""].append(product)
    product_concerns = await recommendations_service.list_concern_ids_for_products(
        db, [p.product_id for p in all_candidates]
    )

    generated: list[GeneratedStep] = []
    for pipeline_step in pipeline:
        product_category = constants.CATEGORY_TO_PRODUCT_CATEGORY[pipeline_step.category]
        candidates = candidates_by_product_category[product_category]
        if not candidates:
            continue
        concern_matches = [
            p for p in candidates if set(product_concerns.get(p.product_id, [])) & set(concern_ids)
        ]
        chosen = rng.choice(concern_matches or candidates)
        generated.append(
            GeneratedStep(
                category=pipeline_step.category,
                step_name=pipeline_step.step_name,
                rationale=pipeline_step.rationale,
                product_id=chosen.product_id,
            )
        )

    # Safety guardrails (routines/guardrails.py) — a distinct layer applied AFTER
    # generation, not folded into the candidate-selection loop above.
    all_generated_product_ids = [step.product_id for step in generated]
    ingredient_categories = await recommendations_service.list_ingredient_categories_for_products(
        db, all_generated_product_ids
    )
    soothing_product = await recommendations_service.get_product_by_name(
        db, guardrails.SOOTHING_PRODUCT_NAME
    )
    soothing_product_id = soothing_product.product_id if soothing_product else None
    if soothing_product_id is not None:
        # The soothing product is a substitution TARGET the guardrails below can
        # introduce into a routine that never went through the candidate-pool
        # allergy filter above — gate it the same way, so a user allergic to its
        # own key ingredient (e.g. Centella Asiatica) can never receive it via
        # this path either. No second soothing product exists in this catalog, so
        # the fallback is the same one both guardrail functions already implement
        # for "no real soothing product available": leave the original step as-is.
        soothing_suitability = await recommendations_service.evaluate_products_suitability(
            db, [soothing_product_id], profile, skin_type_name
        )
        if soothing_suitability[soothing_product_id].any_allergy:
            soothing_product_id = None
    generated = guardrails.apply_safety_guardrails(
        generated,
        skin_type_name=skin_type_name,
        redness_severity=redness_severity,
        product_ingredient_categories=ingredient_categories,
        soothing_product_id=soothing_product_id,
    )

    # Milestone 2 P12 — interaction-matrix guardrail, applied after the
    # sensitivity guardrail so a soothing substitution is itself checked for new
    # conflicts (docs/DECISIONS.md ADR-030).
    ingredient_names = await recommendations_service.list_ingredient_names_for_products(
        db, [step.product_id for step in generated]
    )
    generated = guardrails.apply_interaction_guardrail(
        generated,
        product_ingredient_names=ingredient_names,
        soothing_product_id=soothing_product_id,
    )
    return generated


async def _generate_routine(
    db: AsyncSession,
    user_id: str,
    routine_type: str,
    routine_name: str,
    pipeline: list[PipelineStep],
    skin_type_id: int,
    skin_type_name: str | None,
    concern_ids: list[int],
    redness_severity: int | None,
    skin_profile_id: int | None,
    profile: SkinProfileRead,
    score_id: int | None = None,
) -> Routine:
    rng = seeded_random(user_id, "routine", routine_type)
    generated_steps = await _generate_steps(
        db, pipeline, skin_type_id, skin_type_name, concern_ids, redness_severity, rng, profile
    )
    # "Every generated AM routine contains a Sun Protection step. No exceptions,
    # no configuration that can disable it." — enforced here, unconditionally,
    # independent of whatever the generation loop above did.
    guardrails.assert_sunscreen_present(generated_steps, routine_type)

    routine = Routine(
        user_id=user_id,
        routine_name=routine_name,
        routine_type=routine_type,
        description=f"Starter {routine_type} routine based on your skin profile.",
        is_active=True,
        generated_by_ai=True,
        score_id=score_id,
        skin_profile_id=skin_profile_id,
    )
    db.add(routine)
    await db.flush()  # assigns routine.routine_id without committing yet

    for order, gs in enumerate(generated_steps, start=1):
        step = RoutineStep(
            routine_id=routine.routine_id,
            step_order=order,
            step_name=gs.step_name,
            category=gs.category,
            instruction=_STEP_INSTRUCTIONS.get(gs.category, "Apply as directed."),
            rationale=gs.rationale,
            safety_flag=gs.safety_flag,
            duration_minutes=1,
        )
        db.add(step)
        await db.flush()  # assigns step.step_id

        db.add(
            RoutineProduct(
                routine_id=routine.routine_id, product_id=gs.product_id, step_id=step.step_id
            )
        )

    return routine


def _seasonal_pipeline(season: str) -> list[PipelineStep]:
    return [
        PipelineStep(
            category, f"{season} {category}", f"Recommended emphasis for {season.lower()}."
        )
        for category in constants.SEASON_CATEGORIES[season]
    ]


async def get_or_generate_routines(db: AsyncSession, user_id: str) -> list[RoutineRead]:
    """Deterministic, `hash(user_id)`-seeded routine generation (ADR-007 spirit) — no
    dedicated AI model surface exists for routine planning (docs/ARCHITECTURE.md §5's 7
    surfaces don't include one), so this is rule-based candidate selection over the
    skin_type/concern junction tables (ADR-001: relationship queries are indexed joins,
    not a graph DB), with a seeded pick where multiple products qualify, and the
    Milestone 2 P11 safety guardrail layer (routines/guardrails.py) applied after.
    Generates AM, PM, Weekly Care, and Seasonal Care — four real routines, not the
    Dashboard's AM/PM-only checklist.

    AM/PM/Weekly are generated once per profile *version* and reused on subsequent
    reads. Two independent triggers force a real regeneration (both deactivate the
    stale row rather than delete it):
    - Seasonal: the current calendar season (`_current_season`) no longer matches
      the season its `routine_name` was generated for.
    - AM/PM/Weekly ("adaptive routine updates", mile_2.docx §4): the user's current
      skin profile is a different *version* (`skin_profile_id`) than the one these
      routines were generated against — a real re-assessment. When core routines
      refresh for this reason, Seasonal refreshes too (it also depends on the
      profile's concern_ids).

    Each generated routine also carries `score_id`, a best-effort link to whichever
    `skin_assessments` row was most recently computed for this user (Milestone 2 Step
    1.1's "assessment_id" traceability) — null if no score has ever been computed;
    this function never computes one itself as a side effect.

    "Respond to progress logs" (mile_2.docx §4) has no concrete trigger implemented
    here — Progress Tracking (`progress/service.py`) has no documented hook into
    routine regeneration, and inventing one wasn't backed by any real requirement
    beyond the phrase itself (flagged in PROGRESS.md rather than guessed at)."""
    existing_result = await db.execute(
        select(Routine).where(Routine.user_id == user_id, Routine.is_active.is_(True))
    )
    existing = list(existing_result.scalars().all())
    core = [r for r in existing if r.routine_type != "Seasonal"]
    seasonal = next((r for r in existing if r.routine_type == "Seasonal"), None)

    profile = await skin_profile_service.get_current_profile(db, user_id)

    needs_core_refresh = not core or (
        profile is not None and any(r.skin_profile_id != profile.skin_profile_id for r in core)
    )

    season = _current_season()
    seasonal_name = f"{season} Care"
    needs_seasonal_refresh = (
        needs_core_refresh or seasonal is None or seasonal.routine_name != seasonal_name
    )

    if not needs_core_refresh and not needs_seasonal_refresh:
        return [await _read_with_steps(db, r) for r in existing]

    if profile is None:
        # Nothing to (re)generate against — return whatever already exists as-is.
        return [await _read_with_steps(db, r) for r in existing]
    concern_ids = [c.concern_id for c in profile.concerns]

    skin_types = await skin_profile_service.list_skin_types(db)
    skin_type_name = next(
        (t.skin_type_name for t in skin_types if t.skin_type_id == profile.skin_type_id), None
    )

    concerns = await skin_profile_service.list_skin_concerns(db)
    redness_concern_id = next((c.concern_id for c in concerns if c.concern_name == "Redness"), None)
    redness_severity = next(
        (c.severity_rating for c in profile.concerns if c.concern_id == redness_concern_id),
        None,
    )

    # Local import: scores/service.py already imports routines/service.py (for the
    # routine_adherence score component), so a module-level import here would be
    # circular. Best-effort only — never computes a fresh score as a side effect of
    # this (a GET-triggered) routine generation, see the score_id column's own comment
    # in routines/models.py.
    from app.services.scores import service as scores_service

    recent_scores = await scores_service.get_recent_scores(db, user_id)
    score_id = recent_scores[-1].score_id if recent_scores else None

    if needs_core_refresh:
        for routine in core:
            routine.is_active = False
        am = await _generate_routine(
            db,
            user_id,
            "AM",
            "Morning Routine",
            constants.AM_PIPELINE,
            profile.skin_type_id,
            skin_type_name,
            concern_ids,
            redness_severity,
            profile.skin_profile_id,
            profile,
            score_id=score_id,
        )
        pm = await _generate_routine(
            db,
            user_id,
            "PM",
            "Evening Routine",
            constants.PM_PIPELINE,
            profile.skin_type_id,
            skin_type_name,
            concern_ids,
            redness_severity,
            profile.skin_profile_id,
            profile,
            score_id=score_id,
        )
        weekly = await _generate_routine(
            db,
            user_id,
            "Weekly",
            "Weekly Care",
            constants.WEEKLY_PIPELINE,
            profile.skin_type_id,
            skin_type_name,
            concern_ids,
            redness_severity,
            profile.skin_profile_id,
            profile,
            score_id=score_id,
        )
        core = [am, pm, weekly]

    if needs_seasonal_refresh:
        if seasonal is not None:
            seasonal.is_active = False
        seasonal = await _generate_routine(
            db,
            user_id,
            "Seasonal",
            seasonal_name,
            _seasonal_pipeline(season),
            profile.skin_type_id,
            skin_type_name,
            concern_ids,
            redness_severity,
            profile.skin_profile_id,
            profile,
            score_id=score_id,
        )

    # Guaranteed non-None here: the `not needs_core_refresh and not
    # needs_seasonal_refresh` branch above already returned early otherwise, and
    # needs_seasonal_refresh=True always runs the generation block just above,
    # which assigns a real Routine to `seasonal`.
    assert seasonal is not None

    await db.commit()
    all_routines = [*core, seasonal]
    for routine in all_routines:
        await db.refresh(routine)

    return [await _read_with_steps(db, routine) for routine in all_routines]


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


async def list_recent_routine_logs(user_id: str, days: int = 7) -> list[dict[str, Any]]:
    collection = get_mongo_db()[_ROUTINE_LOGS_COLLECTION]
    since = _day_start(
        datetime.datetime.now(datetime.UTC).date() - datetime.timedelta(days=days - 1)
    )
    cursor = collection.find({"user_id": user_id, "log_date": {"$gte": since}}).sort("log_date", -1)
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


async def list_active_step_counts_by_user(
    db: AsyncSession, user_ids: list[str] | None = None
) -> dict[str, int]:
    """Interface function (ADR-005) — Analytics' admin-wide adherence distribution
    (M3-F) reads active step counts across every user through this, never
    `skincare_routines`/`routine_steps` directly. One aggregate query, not a
    per-user loop — "where cheap" (milestone_3.md §M3-F's own phrasing).

    `user_ids` restricts the aggregate to a cohort. Analytics genuinely wants
    every user and omits it; Milestone 2 P14's clinical portfolio-stats only
    needs one professional's roster, and without the filter it would pull a row
    per user on the entire platform into memory just to test membership."""
    query = (
        select(Routine.user_id, func.count(RoutineStep.step_id))
        .join(RoutineStep, RoutineStep.routine_id == Routine.routine_id)
        .where(Routine.is_active.is_(True))
    )
    if user_ids is not None:
        if not user_ids:
            return {}
        query = query.where(Routine.user_id.in_(user_ids))
    result = await db.execute(query.group_by(Routine.user_id))
    return {user_id: count for user_id, count in result.all()}


async def count_completed_steps_by_user(user_ids: list[str], days: int = 7) -> dict[str, int]:
    """Interface function (ADR-005) — bulk, cross-user sibling of
    `list_recent_routine_logs`, for Analytics' admin-wide adherence distribution
    (M3-F). One Mongo query via `$in`, never a per-user loop."""
    if not user_ids:
        return {}
    collection = get_mongo_db()[_ROUTINE_LOGS_COLLECTION]
    since = _day_start(
        datetime.datetime.now(datetime.UTC).date() - datetime.timedelta(days=days - 1)
    )
    cursor = collection.find({"user_id": {"$in": user_ids}, "log_date": {"$gte": since}})
    counts: dict[str, int] = {}
    async for doc in cursor:
        counts[doc["user_id"]] = counts.get(doc["user_id"], 0) + len(doc.get("completed_steps", []))
    return counts


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
    """Same hard safety filters _generate_routine enforces at generation time
    (the skin-type avoid-junction AND the allergy check), now enforced on manual
    edits too - a user (or a direct API call) can't add/swap in a product flagged
    unsafe for their own skin type, and can't add one that matches their declared
    allergies either."""
    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        raise ValueError("No skin profile yet")
    avoided = await recommendations_service.list_avoided_ingredient_product_ids(
        db, profile.skin_type_id
    )
    if product_id in avoided:
        raise UnsafeProductError("This product isn't safe for your skin type")
    suitability = await recommendations_service.evaluate_products_suitability(
        db, [product_id], profile, None
    )
    if suitability[product_id].any_allergy:
        raise UnsafeProductError("This product matches one of your recorded allergies")


async def reorder_steps(
    db: AsyncSession, user_id: str, routine_id: int, step_ids: list[int]
) -> RoutineRead:
    routine = await _get_owned_routine(db, user_id, routine_id)
    steps_result = await db.execute(select(RoutineStep).where(RoutineStep.routine_id == routine_id))
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
                RoutineProduct(routine_id=step.routine_id, product_id=product_id, step_id=step_id)
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
    candidate_ids = {p.product_id for p in candidates if p.product_id not in avoided}
    query_lower = query.strip().lower()
    name_matches = [
        p
        for p in candidates
        if p.product_id in candidate_ids
        and (
            not query_lower
            or query_lower in (p.product_name or "").lower()
            or query_lower in (p.brand_name or "").lower()
        )
    ]
    suitability = await recommendations_service.evaluate_products_suitability(
        db, [p.product_id for p in name_matches], profile, None
    )
    matches = [p for p in name_matches if not suitability[p.product_id].any_allergy]
    return [ProductRead.model_validate(p) for p in matches[:10]]
