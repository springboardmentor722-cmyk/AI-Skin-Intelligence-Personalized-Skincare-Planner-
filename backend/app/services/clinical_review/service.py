import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.trend import RealProgressTrendAnalyzer
from app.db.postgres import external_user_table
from app.services.clinical_review.models import ConsultantClient, ConsultantNote
from app.services.clinical_review.schemas import (
    ClientDetailRead,
    ClientScoreRead,
    ClientSummaryRead,
    ClinicalPortfolioStatsRead,
    ConsultantNoteRead,
    PortfolioDistributionSlice,
    PortfolioRecentAssessment,
)
from app.services.routines import service as routines_service
from app.services.scores import service as scores_service
from app.services.skin_profile import service as skin_profile_service
from app.services.user import service as user_service

_trend_analyzer = RealProgressTrendAnalyzer()


def _age_from_date_of_birth(date_of_birth: datetime.date | None) -> int | None:
    if date_of_birth is None:
        return None
    today = datetime.date.today()
    years = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        years -= 1
    return years


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


async def _get_user_rows(
    db: AsyncSession, user_ids: list[str]
) -> dict[str, tuple[str | None, str]]:
    """Bulk sibling of `_get_user_row` — one `IN` query for a whole cohort.

    Deliberately tolerant where the single-row version is strict: `_get_user_row`
    calls `.one()`, which raises if the identity row is gone, and that is correct
    for `get_client_detail` (a request for one named client that no longer exists
    should fail). A portfolio-wide aggregate must not 500 the entire clinical
    dashboard because one assigned client's Better Auth row was deleted while the
    `consultant_clients` assignment survived — missing ids are simply absent from
    the result and the caller falls back."""
    if not user_ids:
        return {}
    result = await db.execute(
        select(
            external_user_table.c.id,
            external_user_table.c.name,
            external_user_table.c.email,
        ).where(external_user_table.c.id.in_(user_ids))
    )
    return {row.id: (row.name, row.email) for row in result.all()}


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


async def list_my_clients(
    db: AsyncSession, professional_id: str, *, page: int = 1, page_size: int = 20
) -> tuple[list[ClientSummaryRead], int]:
    """Production-readiness audit finding: this had no LIMIT at all — every active
    assignment, unbounded, on every call, each one also driving 3 further queries
    (_get_user_row/get_current_profile/get_recent_scores) in the loop below — a
    real N+1 whose blast radius scales with a professional's *entire* client
    count. Paginated at the SQL level (LIMIT/OFFSET on the initial query, not
    fetch-everything-then-slice in Python like admin/service.py's own precedent)
    so an unpaginated professional's full client count never gets fetched or
    processed for a single page — bounds both the response size and the N+1's
    real cost per call, though the N+1 itself isn't fixed this pass."""
    count_result = await db.execute(
        select(func.count())
        .select_from(ConsultantClient)
        .where(
            ConsultantClient.consultant_id == professional_id, ConsultantClient.status == "active"
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(ConsultantClient)
        .where(
            ConsultantClient.consultant_id == professional_id, ConsultantClient.status == "active"
        )
        .order_by(ConsultantClient.assignment_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    assignments = list(result.scalars().all())
    if not assignments:
        return [], total

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
        # Milestone 2 P14 (ADR-024) — real age/gender from user_profiles, the same
        # per-assignment-loop N+1 shape this function's own docstring already
        # accepted for get_current_profile/get_recent_scores above.
        user_profile = await user_service.get_or_create_profile(db, assignment.user_id)

        primary_concern_name = None
        if profile and profile.concerns:
            top_concern = max(profile.concerns, key=lambda c: c.priority_level or 0)
            primary_concern_name = concerns.get(top_concern.concern_id)

        summaries.append(
            ClientSummaryRead(
                user_id=assignment.user_id,
                name=name,
                email=email,
                age=_age_from_date_of_birth(user_profile.date_of_birth),
                gender=user_profile.gender,
                skin_type_name=skin_types.get(profile.skin_type_id) if profile else None,
                primary_concern_name=primary_concern_name,
                overall_score=latest.overall_score if latest else None,
                routine_adherence_score=latest.routine_adherence_score if latest else None,
                score_trend=[float(s.overall_score) for s in scores if s.overall_score is not None],
                last_sync=latest.calculated_at if latest else None,
            )
        )
    return summaries, total


async def get_portfolio_stats(db: AsyncSession, professional_id: str) -> ClinicalPortfolioStatsRead:
    """Milestone 2 P14 (ADR-024's deferred consequence) — the real, aggregated
    replacement for the clinical dashboard's fixture KPIs/donut/bars/trend/stat-
    footer/recent-assessments, computed once across the professional's WHOLE
    active roster (unpaginated — a portfolio-wide stat, not a page of it).

    Because the roster here is unpaginated, this function must stay free of
    per-client queries: `list_my_clients` can afford its documented N+1 (LIMIT/
    OFFSET bounds it to one page), but the same pattern here would scale with a
    professional's entire client count on the clinical dashboard's main
    endpoint. Every read below is therefore a single cohort-wide query keyed by
    `user_ids`, and the loop is pure in-memory aggregation over their results."""
    assignments_result = await db.execute(
        select(ConsultantClient.user_id).where(
            ConsultantClient.consultant_id == professional_id, ConsultantClient.status == "active"
        )
    )
    user_ids = list(assignments_result.scalars().all())
    total_assigned = len(user_ids)
    if not user_ids:
        return ClinicalPortfolioStatsRead(
            total_assigned=0,
            assessments_done=0,
            active_routines=0,
            avg_improvement_points=None,
            clients_improving=0,
            clients_stable=0,
            clients_need_attention=0,
            skin_type_distribution=[],
            top_concerns=[],
            portfolio_score_trend=[],
            recent_assessments=[],
        )

    skin_type_by_user = await skin_profile_service.list_current_skin_types_for_users(db, user_ids)
    concern_counts = await skin_profile_service.count_concern_occurrences_for_users(db, user_ids)
    all_skin_types = {
        t.skin_type_id: t.skin_type_name for t in await skin_profile_service.list_skin_types(db)
    }
    all_concerns = {
        c.concern_id: c.concern_name for c in await skin_profile_service.list_skin_concerns(db)
    }
    active_step_counts = await routines_service.list_active_step_counts_by_user(db, user_ids)
    user_rows = await _get_user_rows(db, user_ids)
    scores_by_user = await scores_service.get_recent_scores_for_users(db, user_ids, days=90)

    skin_type_counts: dict[int, int] = {}
    for skin_type_id in skin_type_by_user.values():
        skin_type_counts[skin_type_id] = skin_type_counts.get(skin_type_id, 0) + 1

    assessments_done = 0
    active_routines = 0
    improvements: list[float] = []
    clients_improving = 0
    clients_stable = 0
    clients_need_attention = 0
    trend_points_by_index: dict[int, list[float]] = {}
    recent_assessments: list[PortfolioRecentAssessment] = []

    for user_id in user_ids:
        name = user_rows.get(user_id, (None, ""))[0]
        scores = scores_by_user.get(user_id, [])
        assessments_done += len(scores)
        if user_id in active_step_counts:
            active_routines += 1
        for index, s in enumerate(scores):
            if s.overall_score is not None:
                trend_points_by_index.setdefault(index, []).append(float(s.overall_score))
        if scores:
            latest = scores[-1]
            recent_assessments.append(
                PortfolioRecentAssessment(
                    user_id=user_id,
                    name=name,
                    overall_score=latest.overall_score,
                    calculated_at=latest.calculated_at,
                )
            )

        series = [
            (s.calculated_at.date(), float(s.overall_score))
            for s in scores
            if s.calculated_at is not None and s.overall_score is not None
        ]
        insight = _trend_analyzer.analyze(series)
        if insight is not None:
            improvements.append(insight.magnitude)
            if insight.direction == "improving":
                clients_improving += 1
            elif insight.direction == "declining":
                clients_need_attention += 1
            else:
                clients_stable += 1

    recent_assessments.sort(key=lambda a: a.calculated_at or datetime.datetime.min, reverse=True)

    # The trend is a cohort curve — "average score at the Nth assessment" — so it
    # is keyed by position, not by date, and the frontend labels it that way
    # ("Assessment 1", "Assessment 2", ...). The catch is that the sample size
    # shrinks as N grows: if one client has 30 assessments and everyone else has
    # 3, index 29 is a single client's score rendered identically to index 0's
    # full-cohort average, and a rising tail reads as "my clients improve" when
    # it is one outlier. Truncate at the first index where fewer than half the
    # scoring clients contributed, so every plotted point is representative.
    scoring_clients = len(trend_points_by_index.get(0, []))
    # Floor of 1, not 2: with a single scoring client every point is 100% of the
    # cohort and is fully representative, so a floor of 2 would blank the chart
    # for exactly the professional who has just taken on their first client.
    min_sample = max(1, (scoring_clients + 1) // 2)
    portfolio_score_trend: list[float] = []
    for _, values in sorted(trend_points_by_index.items()):
        if len(values) < min_sample:
            break
        portfolio_score_trend.append(round(sum(values) / len(values), 1))

    return ClinicalPortfolioStatsRead(
        total_assigned=total_assigned,
        assessments_done=assessments_done,
        active_routines=active_routines,
        avg_improvement_points=(
            round(sum(improvements) / len(improvements), 1) if improvements else None
        ),
        clients_improving=clients_improving,
        clients_stable=clients_stable,
        clients_need_attention=clients_need_attention,
        skin_type_distribution=[
            PortfolioDistributionSlice(
                key=str(skin_type_id),
                label=all_skin_types.get(skin_type_id) or "Unknown",
                count=count,
            )
            for skin_type_id, count in sorted(skin_type_counts.items(), key=lambda kv: -kv[1])
        ],
        top_concerns=[
            PortfolioDistributionSlice(
                key=str(concern_id), label=all_concerns.get(concern_id) or "Unknown", count=count
            )
            for concern_id, count in sorted(concern_counts.items(), key=lambda kv: -kv[1])[:6]
        ],
        portfolio_score_trend=portfolio_score_trend,
        recent_assessments=recent_assessments[:5],
    )


async def get_client_detail(
    db: AsyncSession, professional_id: str, user_id: str
) -> ClientDetailRead:
    await _verify_assignment(db, professional_id, user_id)
    name, email = await _get_user_row(db, user_id)

    profile = await skin_profile_service.get_current_profile(db, user_id)
    scores = await scores_service.get_recent_scores(db, user_id, days=30)
    latest = scores[-1] if scores else None
    routines = await routines_service.get_or_generate_routines(db, user_id)
    # Detail view shows recent history, not the full note archive — the standalone
    # GET /clients/{user_id}/notes endpoint is the real paginated surface for that.
    notes, _total_notes = await list_notes(
        db, professional_id, user_id, page=1, page_size=_DETAIL_VIEW_NOTES_PAGE_SIZE
    )

    return ClientDetailRead(
        user_id=user_id,
        name=name,
        email=email,
        skin_profile=profile,
        score=ClientScoreRead.model_validate(latest) if latest else None,
        routines=routines,
        notes=notes,
    )


_DETAIL_VIEW_NOTES_PAGE_SIZE = 50


async def list_notes(
    db: AsyncSession, professional_id: str, user_id: str, *, page: int = 1, page_size: int = 20
) -> tuple[list[ConsultantNoteRead], int]:
    """Production-readiness audit finding (round 4): this had no LIMIT either —
    every note ever added for a client, unbounded, on every call. Same real
    LIMIT/OFFSET + count(*) pattern as list_my_clients above."""
    await _verify_assignment(db, professional_id, user_id)
    count_result = await db.execute(
        select(func.count())
        .select_from(ConsultantNote)
        .where(ConsultantNote.consultant_id == professional_id, ConsultantNote.user_id == user_id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(ConsultantNote)
        .where(ConsultantNote.consultant_id == professional_id, ConsultantNote.user_id == user_id)
        # note_id (monotonic SERIAL), not created_at — Postgres's now()/
        # CURRENT_TIMESTAMP is stable for the whole transaction, so two notes added
        # in quick succession (e.g. within the same request-scoped session) can get
        # an identical created_at; note_id always reflects real insertion order.
        .order_by(ConsultantNote.note_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    notes = [
        ConsultantNoteRead(
            note_id=n.note_id,
            note_text=n.note_text,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in result.scalars().all()
    ]
    return notes, total


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
