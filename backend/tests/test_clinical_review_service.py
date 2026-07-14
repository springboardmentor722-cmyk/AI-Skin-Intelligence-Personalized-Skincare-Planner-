"""Clinical review workflow (M2+) — consultant_clients/consultant_notes existed and
were ready since the M1 foundation expansion, but had no real assessment data to
review against until this session's real scoring/routine engine. Real Postgres
round trips via tests/conftest.py's rollback-wrapped db_session/test_user_id, same
discipline as every other service's tests — nothing here is ever actually persisted.
"""

import uuid
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.clinical_review.service import (
    add_note,
    create_assignment,
    get_client_detail,
    list_my_clients,
    list_notes,
)
from app.services.scores.service import compute_and_store_score
from app.services.skin_profile.schemas import SkinProfileConcernInput, SkinProfileCreate
from app.services.skin_profile.service import create_profile

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1


@pytest.fixture
async def professional_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    user_id = f"test-professional-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Dr. Professional"
        )
    )
    await db_session.flush()
    yield user_id


@pytest.fixture
async def client_user_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    user_id = f"test-client-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Real Client"
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

    notes = await list_notes(db_session, professional_id, client_user_id)

    assert [n.note_text for n in notes] == ["Second note", "First note"]


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
            id=other_professional_id, email=f"{other_professional_id}@test.invalid"
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
                id=client_id, email=f"{client_id}@test.invalid", name=f"Client {i}"
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
