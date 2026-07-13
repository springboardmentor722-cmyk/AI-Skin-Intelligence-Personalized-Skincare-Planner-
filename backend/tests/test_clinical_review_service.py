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
    assert await list_my_clients(db_session, professional_id) == []


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

    clients = await list_my_clients(db_session, professional_id)

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
    assert {r.routine_type for r in detail.routines} == {"AM", "PM", "Weekly"}


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

    clients = await list_my_clients(db_session, professional_id)

    assert len(clients) == 1


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

    assert await list_my_clients(db_session, other_professional_id) == []
    with pytest.raises(ValueError, match="isn.t assigned"):
        await get_client_detail(db_session, other_professional_id, client_user_id)
