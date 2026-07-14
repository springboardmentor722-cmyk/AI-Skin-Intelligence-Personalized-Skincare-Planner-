from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.clinical_review.models import ConsultantClient, ConsultantNote
from app.services.clinical_review.schemas import (
    ClientDetailRead,
    ClientScoreRead,
    ClientSummaryRead,
    ConsultantNoteRead,
)
from app.services.routines import service as routines_service
from app.services.scores import service as scores_service
from app.services.skin_profile import service as skin_profile_service


async def create_assignment(db: AsyncSession, professional_id: str, user_id: str) -> None:
    """Interface function (ADR-005) — Admin's assignment endpoint
    (backend/app/services/admin/) creates a real consultant_clients row through
    this, never by importing this service's models directly. Idempotent: an
    existing row for this (professional, user) pair is reactivated to 'active'
    rather than raising on the table's own UNIQUE(consultant_id, user_id)
    constraint — no self-service "request a consultant" flow exists yet, so this is
    the only way a real assignment gets created today."""
    result = await db.execute(
        select(ConsultantClient).where(
            ConsultantClient.consultant_id == professional_id,
            ConsultantClient.user_id == user_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        existing.status = "active"
    else:
        db.add(ConsultantClient(consultant_id=professional_id, user_id=user_id, status="active"))
    await db.commit()


async def _get_user_row(db: AsyncSession, user_id: str) -> tuple[str | None, str]:
    result = await db.execute(
        select(external_user_table.c.name, external_user_table.c.email).where(
            external_user_table.c.id == user_id
        )
    )
    row = result.one()
    return row.name, row.email


async def _verify_assignment(
    db: AsyncSession, professional_id: str, user_id: str
) -> ConsultantClient:
    """docs/CONVENTIONS.md's own anticipated ownership check: "consultant-can-only-
    read-*assigned*-clients". Shared by Consultant and Dermatologist — the real
    schema's `consultant_clients`/`consultant_notes` tables are generic despite the
    name (docs/ARCHITECTURE.md §2 calls this `consultant_assignments`, stale)."""
    result = await db.execute(
        select(ConsultantClient).where(
            ConsultantClient.consultant_id == professional_id,
            ConsultantClient.user_id == user_id,
            ConsultantClient.status == "active",
        )
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        raise ValueError("This client isn't assigned to you")
    return assignment


async def list_my_clients(db: AsyncSession, professional_id: str) -> list[ClientSummaryRead]:
    result = await db.execute(
        select(ConsultantClient).where(
            ConsultantClient.consultant_id == professional_id, ConsultantClient.status == "active"
        )
    )
    assignments = list(result.scalars().all())
    if not assignments:
        return []

    all_skin_types = await skin_profile_service.list_skin_types(db)
    skin_types = {t.skin_type_id: t.skin_type_name for t in all_skin_types}
    all_concerns = await skin_profile_service.list_skin_concerns(db)
    concerns = {c.concern_id: c.concern_name for c in all_concerns}

    summaries = []
    for assignment in assignments:
        name, email = await _get_user_row(db, assignment.user_id)
        profile = await skin_profile_service.get_current_profile(db, assignment.user_id)
        scores = await scores_service.get_recent_scores(db, assignment.user_id, days=30)
        latest = scores[-1] if scores else None

        primary_concern_name = None
        if profile and profile.concerns:
            top_concern = max(profile.concerns, key=lambda c: c.priority_level or 0)
            primary_concern_name = concerns.get(top_concern.concern_id)

        summaries.append(
            ClientSummaryRead(
                user_id=assignment.user_id,
                name=name,
                email=email,
                skin_type_name=skin_types.get(profile.skin_type_id) if profile else None,
                primary_concern_name=primary_concern_name,
                overall_score=latest.overall_score if latest else None,
                routine_adherence_score=latest.routine_adherence_score if latest else None,
                score_trend=[float(s.overall_score) for s in scores if s.overall_score is not None],
                last_sync=latest.calculated_at if latest else None,
            )
        )
    return summaries


async def get_client_detail(
    db: AsyncSession, professional_id: str, user_id: str
) -> ClientDetailRead:
    await _verify_assignment(db, professional_id, user_id)
    name, email = await _get_user_row(db, user_id)

    profile = await skin_profile_service.get_current_profile(db, user_id)
    scores = await scores_service.get_recent_scores(db, user_id, days=30)
    latest = scores[-1] if scores else None
    routines = await routines_service.get_or_generate_routines(db, user_id)
    notes = await list_notes(db, professional_id, user_id)

    return ClientDetailRead(
        user_id=user_id,
        name=name,
        email=email,
        skin_profile=profile,
        score=ClientScoreRead.model_validate(latest) if latest else None,
        routines=routines,
        notes=notes,
    )


async def list_notes(
    db: AsyncSession, professional_id: str, user_id: str
) -> list[ConsultantNoteRead]:
    await _verify_assignment(db, professional_id, user_id)
    result = await db.execute(
        select(ConsultantNote)
        .where(ConsultantNote.consultant_id == professional_id, ConsultantNote.user_id == user_id)
        # note_id (monotonic SERIAL), not created_at — Postgres's now()/
        # CURRENT_TIMESTAMP is stable for the whole transaction, so two notes added
        # in quick succession (e.g. within the same request-scoped session) can get
        # an identical created_at; note_id always reflects real insertion order.
        .order_by(ConsultantNote.note_id.desc())
    )
    return [
        ConsultantNoteRead(
            note_id=n.note_id,
            note_text=n.note_text,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in result.scalars().all()
    ]


async def add_note(
    db: AsyncSession, professional_id: str, user_id: str, note_text: str
) -> ConsultantNoteRead:
    await _verify_assignment(db, professional_id, user_id)
    note = ConsultantNote(consultant_id=professional_id, user_id=user_id, note_text=note_text)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return ConsultantNoteRead(
        note_id=note.note_id,
        note_text=note.note_text,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )
