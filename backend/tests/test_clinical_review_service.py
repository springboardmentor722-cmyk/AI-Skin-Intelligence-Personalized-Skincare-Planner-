"""Clinical review workflow (M2+) — consultant_clients/consultant_notes existed and
were ready since the M1 foundation expansion, but had no real assessment data to
review against until this session's real scoring/routine engine. Real Postgres
round trips via tests/conftest.py's rollback-wrapped db_session/test_user_id, same
discipline as every other service's tests — nothing here is ever actually persisted.
"""

import datetime
import uuid
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.db.postgres import external_user_table
from app.services.clinical_review.service import (
    add_note,
    create_assignment,
    get_client_detail,
    get_portfolio_stats,
    list_my_clients,
    list_notes,
)
from app.services.progress.service import get_compliance_percentages
from app.services.routines.models import Routine, RoutineStep
from app.services.scores.service import compute_and_store_score
from app.services.skin_profile.schemas import SkinProfileConcernInput, SkinProfileCreate
from app.services.skin_profile.service import create_profile
from app.services.user.schemas import UserProfileUpdate
from app.services.user.service import update_profile

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1


@pytest.fixture
async def professional_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    user_id = f"test-professional-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id,
            email=f"{user_id}@test.invalid",
            name="Dr. Professional",
            emailVerified=False,
        )
    )
    await db_session.flush()
    yield user_id


@pytest.fixture
async def client_user_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    user_id = f"test-client-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id,
            email=f"{user_id}@test.invalid",
            name="Real Client",
            emailVerified=False,
        )
    )
    await db_session.flush()
    yield user_id


async def test_list_my_clients_is_empty_with_no_assignments(
    db_session: AsyncSession, professional_id: str
) -> None:
    items, total = await list_my_clients(db_session, professional_id)
    assert items == []
    assert total == 0


async def test_get_client_detail_rejects_an_unassigned_user(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    with pytest.raises(ValueError, match="isn.t assigned"):
        await get_client_detail(db_session, professional_id, client_user_id)


async def test_add_note_rejects_an_unassigned_user(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    with pytest.raises(ValueError, match="isn.t assigned"):
        await add_note(db_session, professional_id, client_user_id, "Should not persist")


async def test_assigned_client_appears_with_real_data(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    await create_profile(
        db_session,
        client_user_id,
        SkinProfileCreate(
            skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=9, priority_level=9)],
        ),
    )
    await compute_and_store_score(db_session, client_user_id)
    await create_assignment(db_session, professional_id, client_user_id)

    clients, total = await list_my_clients(db_session, professional_id)

    assert total == 1
    assert len(clients) == 1
    summary = clients[0]
    assert summary.user_id == client_user_id
    assert summary.name == "Real Client"
    assert summary.skin_type_name == "Normal"
    assert summary.overall_score is not None
    assert summary.routine_adherence_score is not None
    assert summary.score_trend == [summary.overall_score]


async def test_get_client_detail_returns_real_profile_score_and_routines(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    await create_profile(
        db_session, client_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await compute_and_store_score(db_session, client_user_id)
    await create_assignment(db_session, professional_id, client_user_id)

    detail = await get_client_detail(db_session, professional_id, client_user_id)

    assert detail.skin_profile is not None
    assert detail.skin_profile.skin_type_id == _SKIN_TYPE_WITH_SEEDED_PRODUCTS
    assert detail.score is not None
    assert detail.score.overall_score is not None
    assert {r.routine_type for r in detail.routines} == {"AM", "PM", "Weekly", "Seasonal"}


async def test_add_and_list_notes_for_an_assigned_client(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    await create_assignment(db_session, professional_id, client_user_id)

    await add_note(db_session, professional_id, client_user_id, "First note")
    await add_note(db_session, professional_id, client_user_id, "Second note")

    notes, total = await list_notes(db_session, professional_id, client_user_id)

    assert total == 2
    assert [n.note_text for n in notes] == ["Second note", "First note"]


async def test_list_notes_pagination_is_real(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    """Production-readiness audit finding (round 4): list_notes had no LIMIT
    either — same shape as list_my_clients's own pagination bug and test."""
    await create_assignment(db_session, professional_id, client_user_id)
    for i in range(3):
        await add_note(db_session, professional_id, client_user_id, f"Note {i}")

    page_one, total_one = await list_notes(
        db_session, professional_id, client_user_id, page=1, page_size=2
    )
    page_two, total_two = await list_notes(
        db_session, professional_id, client_user_id, page=2, page_size=2
    )

    assert total_one == 3
    assert total_two == 3
    assert len(page_one) == 2
    assert len(page_two) == 1
    page_one_ids = {n.note_id for n in page_one}
    page_two_ids = {n.note_id for n in page_two}
    assert page_one_ids.isdisjoint(page_two_ids)


async def test_create_assignment_is_idempotent(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    await create_assignment(db_session, professional_id, client_user_id)
    await create_assignment(db_session, professional_id, client_user_id)

    clients, total = await list_my_clients(db_session, professional_id)

    assert len(clients) == 1
    assert total == 1


async def test_a_different_professionals_client_never_leaks_across(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    other_professional_id = f"test-other-professional-{client_user_id}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_professional_id,
            email=f"{other_professional_id}@test.invalid",
            name="Other Professional",
            emailVerified=False,
        )
    )
    await db_session.flush()
    await create_assignment(db_session, professional_id, client_user_id)

    other_items, other_total = await list_my_clients(db_session, other_professional_id)
    assert other_items == []
    assert other_total == 0
    with pytest.raises(ValueError, match="isn.t assigned"):
        await get_client_detail(db_session, other_professional_id, client_user_id)


async def test_list_my_clients_pagination_is_real(
    db_session: AsyncSession, professional_id: str
) -> None:
    """Production-readiness audit finding: list_my_clients had no LIMIT at all —
    every active assignment, unbounded, on every call. Real, non-trivial data: 3
    real assigned clients, page_size=2 — confirms page 1 returns exactly 2, page 2
    returns the remaining 1, total is always the true full count regardless of
    page, and no client appears on both pages (a real slicing bug, not just a
    count check)."""
    client_ids = []
    for i in range(3):
        client_id = f"test-page-client-{i}-{uuid.uuid4().hex[:12]}"
        await db_session.execute(
            external_user_table.insert().values(
                id=client_id,
                email=f"{client_id}@test.invalid",
                name=f"Client {i}",
                emailVerified=False,
            )
        )
        await db_session.flush()
        await create_assignment(db_session, professional_id, client_id)
        client_ids.append(client_id)

    page_one, total_one = await list_my_clients(db_session, professional_id, page=1, page_size=2)
    page_two, total_two = await list_my_clients(db_session, professional_id, page=2, page_size=2)

    assert total_one == 3
    assert total_two == 3
    assert len(page_one) == 2
    assert len(page_two) == 1
    page_one_ids = {c.user_id for c in page_one}
    page_two_ids = {c.user_id for c in page_two}
    assert page_one_ids.isdisjoint(page_two_ids)
    assert page_one_ids | page_two_ids == set(client_ids)


# --- Milestone 2 P14: age/gender + portfolio stats (ADR-024's deferred consequence) --


async def test_assigned_client_summary_includes_real_age_and_gender(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    await update_profile(
        db_session,
        client_user_id,
        UserProfileUpdate(date_of_birth=datetime.date.today().replace(year=1994), gender="Female"),
    )
    await create_profile(
        db_session, client_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await create_assignment(db_session, professional_id, client_user_id)

    clients, _total = await list_my_clients(db_session, professional_id)

    assert clients[0].gender == "Female"
    assert clients[0].age in (
        datetime.date.today().year - 1994,
        datetime.date.today().year - 1994 - 1,
    )


async def test_assigned_client_summary_age_is_none_without_a_date_of_birth(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    await create_assignment(db_session, professional_id, client_user_id)

    clients, _total = await list_my_clients(db_session, professional_id)

    assert clients[0].age is None
    assert clients[0].gender is None


async def test_portfolio_stats_are_all_zero_with_no_assignments(
    db_session: AsyncSession, professional_id: str
) -> None:
    stats = await get_portfolio_stats(db_session, professional_id)

    assert stats.total_assigned == 0
    assert stats.assessments_done == 0
    assert stats.avg_improvement_points is None
    assert stats.skin_type_distribution == []
    assert stats.top_concerns == []
    assert stats.recent_assessments == []


async def test_portfolio_stats_aggregate_real_assigned_clients(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    other_client_id = f"test-client-2-{client_user_id}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_client_id,
            email=f"{other_client_id}@test.invalid",
            name="Other Client",
            emailVerified=False,
        )
    )
    await db_session.flush()

    await create_profile(
        db_session,
        client_user_id,
        SkinProfileCreate(
            skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=8, priority_level=9)],
        ),
    )
    await create_profile(
        db_session,
        other_client_id,
        SkinProfileCreate(
            skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=5, priority_level=9)],
        ),
    )
    await compute_and_store_score(db_session, client_user_id)
    await compute_and_store_score(db_session, other_client_id)
    await create_assignment(db_session, professional_id, client_user_id)
    await create_assignment(db_session, professional_id, other_client_id)

    stats = await get_portfolio_stats(db_session, professional_id)

    assert stats.total_assigned == 2
    assert stats.assessments_done == 2
    # Both clients share skin_type_id=1 ("Normal") and concern_id=1 ("Acne") —
    # one real distribution slice each, count 2.
    assert len(stats.skin_type_distribution) == 1
    assert stats.skin_type_distribution[0].count == 2
    assert len(stats.top_concerns) == 1
    assert stats.top_concerns[0].count == 2
    assert len(stats.recent_assessments) == 2
    # Only one score point each yet — RealProgressTrendAnalyzer.analyze needs 2+
    # to return an insight at all, so no client is classified either way.
    assert stats.clients_improving == 0
    assert stats.clients_stable == 0
    assert stats.clients_need_attention == 0
    assert stats.avg_improvement_points is None


async def test_portfolio_stats_never_leak_a_different_professionals_clients(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    other_professional_id = f"test-other-professional-portfolio-{client_user_id}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_professional_id,
            email=f"{other_professional_id}@test.invalid",
            name="Other Professional",
            emailVerified=False,
        )
    )
    await db_session.flush()
    await create_assignment(db_session, professional_id, client_user_id)

    stats = await get_portfolio_stats(db_session, other_professional_id)

    assert stats.total_assigned == 0


# --- M3R Phase 5: roster search + compliance metrics ---


async def test_list_my_clients_search_filters_by_name_and_reflects_filtered_total(
    db_session: AsyncSession, professional_id: str
) -> None:
    """The rubric's "searchable list" — search is server-side over the identity
    table's name/email, applied to both the count and the page query so `total`
    never overstates a filtered result."""
    searchable_id = f"test-searchable-{uuid.uuid4().hex[:12]}"
    other_id = f"test-other-{uuid.uuid4().hex[:12]}"
    for user_id, name in ((searchable_id, "Zendaya Ipsum"), (other_id, "Bob Nomatch")):
        await db_session.execute(
            external_user_table.insert().values(
                id=user_id, email=f"{user_id}@test.invalid", name=name, emailVerified=False
            )
        )
        await db_session.flush()
        await create_assignment(db_session, professional_id, user_id)

    items, total = await list_my_clients(db_session, professional_id, search="Zendaya")

    assert total == 1
    assert len(items) == 1
    assert items[0].user_id == searchable_id


async def test_list_my_clients_search_never_returns_an_unassigned_user(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    """A name/email match alone must never be enough — only an active assignment
    to *this* professional can surface a client, regardless of search term."""
    unassigned_id = f"test-unassigned-{uuid.uuid4().hex[:12]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=unassigned_id,
            email=f"{unassigned_id}@test.invalid",
            name="Real Client Lookalike",
            emailVerified=False,
        )
    )
    await db_session.flush()
    await create_assignment(db_session, professional_id, client_user_id)

    items, total = await list_my_clients(db_session, professional_id, search="Real Client")

    assert total == 1
    assert [i.user_id for i in items] == [client_user_id]


async def test_list_my_clients_compliance_percentages_match_progress_service(
    db_session: AsyncSession, professional_id: str, client_user_id: str
) -> None:
    """Compliance fields are wired straight from progress_service.get_compliance_
    percentages, not recomputed — assert equality against that function's own
    directly-computed result rather than re-deriving the ratio here."""
    await create_assignment(db_session, professional_id, client_user_id)
    routine = Routine(
        user_id=client_user_id, routine_name="AM", routine_type="AM", is_active=True
    )
    db_session.add(routine)
    await db_session.flush()
    step = RoutineStep(routine_id=routine.routine_id, step_order=1, step_name="Cleanse")
    db_session.add(step)
    await db_session.flush()
    # Backdate so the routine counts as assigned across the whole 7-day window —
    # list_historical_active_step_ids only counts a routine from its created_at
    # onward (same setup as test_progress_service.py's own compliance test).
    await db_session.execute(
        update(Routine)
        .where(Routine.routine_id == routine.routine_id)
        .values(
            created_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
            - datetime.timedelta(days=100)
        )
    )
    await db_session.commit()

    today = datetime.datetime.now(datetime.UTC).date()
    try:
        await get_mongo_db()["routine_logs"].insert_one(
            {
                "user_id": client_user_id,
                "log_date": datetime.datetime.combine(today, datetime.time.min),
                "completed_steps": [{"routine_step_id": step.step_id}],
            }
        )

        expected = await get_compliance_percentages(db_session, client_user_id)
        items, _total = await list_my_clients(db_session, professional_id)

        assert len(items) == 1
        assert items[0].compliance_seven_day == expected.seven_day
        assert items[0].compliance_thirty_day == expected.thirty_day
        assert expected.seven_day is not None
    finally:
        await get_mongo_db()["routine_logs"].delete_many({"user_id": client_user_id})
