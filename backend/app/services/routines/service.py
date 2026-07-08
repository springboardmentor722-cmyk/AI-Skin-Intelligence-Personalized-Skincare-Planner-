from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.seeding import seeded_random
from app.services.recommendations import service as recommendations_service
from app.services.recommendations.schemas import ProductRead
from app.services.routines.models import Routine, RoutineProduct, RoutineStep
from app.services.routines.schemas import RoutineProductRead, RoutineRead, RoutineStepRead
from app.services.skin_profile import service as skin_profile_service

_STEP_INSTRUCTIONS = {
    "Cleanser": "Massage onto damp skin for 30-60 seconds, then rinse with lukewarm water.",
    "Treatment": "Apply a thin layer to clean, dry skin. Avoid the eye area.",
    "Moisturizer": "Apply evenly while skin is still slightly damp to lock in hydration.",
    "Sunscreen": "Apply generously as the last step, 15 minutes before sun exposure.",
}
_AM_CATEGORIES = ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"]
_PM_CATEGORIES = ["Cleanser", "Treatment", "Moisturizer"]


async def _read_with_steps(db: AsyncSession, routine: Routine) -> RoutineRead:
    steps_result = await db.execute(
        select(RoutineStep)
        .where(RoutineStep.routine_id == routine.routine_id)
        .order_by(RoutineStep.step_order)
    )
    steps = list(steps_result.scalars().all())

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
) -> Routine:
    rng = seeded_random(user_id, "routine", routine_type)

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
            instruction=_STEP_INSTRUCTIONS.get(category, "Apply as directed."),
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
    not a graph DB), with a seeded pick where multiple products qualify.

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
    await db.commit()
    await db.refresh(am)
    await db.refresh(pm)

    return [await _read_with_steps(db, am), await _read_with_steps(db, pm)]
