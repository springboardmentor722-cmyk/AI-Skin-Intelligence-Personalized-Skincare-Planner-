"""Branch 3 (feature/rbac) — the actual verification-workflow business logic behind
`backend/app/services/admin/router.py`. Real Postgres round trips via
tests/conftest.py's rollback-wrapped `db_session`/`test_user_id` fixtures, same
discipline as test_skin_profile_service.py — nothing here is ever actually persisted.
"""

import uuid
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.admin.service import (
    apply_verification_action,
    get_profile_for_review,
    list_verification_queue,
    write_audit_log,
)
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile


@pytest.fixture
async def second_user_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    """A second throwaway `user` row — pagination/multi-row assertions need more than
    the one `test_user_id` fixture provides; rolled back with everything else in
    `db_session`."""
    user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(id=user_id, email=f"{user_id}@test.invalid")
    )
    await db_session.flush()
    yield user_id


async def test_list_verification_queue_filters_by_role_and_status(
    db_session: AsyncSession, test_user_id: str
) -> None:
    db_session.add(ConsultantProfile(user_id=test_user_id, verification_status="pending"))
    await db_session.flush()

    items, total = await list_verification_queue(
        db_session, role="consultant", status="pending", page=1, page_size=20
    )

    assert total >= 1
    assert all(item["role"] == "consultant" for item in items)
    assert any(item["user_id"] == test_user_id for item in items)


async def test_list_verification_queue_excludes_other_roles(
    db_session: AsyncSession, test_user_id: str
) -> None:
    db_session.add(ConsultantProfile(user_id=test_user_id, verification_status="pending"))
    await db_session.flush()

    items, _total = await list_verification_queue(
        db_session, role="dermatologist", status=None, page=1, page_size=20
    )

    assert all(item["user_id"] != test_user_id for item in items)


async def test_list_verification_queue_paginates(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    db_session.add_all(
        [
            ConsultantProfile(user_id=test_user_id, verification_status="pending"),
            ConsultantProfile(user_id=second_user_id, verification_status="pending"),
        ]
    )
    await db_session.flush()

    page_one, total = await list_verification_queue(
        db_session, role="consultant", status="pending", page=1, page_size=1
    )
    page_two, _total = await list_verification_queue(
        db_session, role="consultant", status="pending", page=2, page_size=1
    )

    assert total >= 2
    assert len(page_one) == 1
    assert len(page_two) == 1
    assert page_one[0]["user_id"] != page_two[0]["user_id"]


async def test_get_profile_for_review_returns_profile_and_documents(
    db_session: AsyncSession, test_user_id: str
) -> None:
    db_session.add(
        DermatologistProfile(
            user_id=test_user_id,
            verification_status="pending",
            medical_registration_number="MED-123",
        )
    )
    await db_session.flush()

    result = await get_profile_for_review(db_session, role="dermatologist", user_id=test_user_id)

    assert result is not None
    profile, documents = result
    assert isinstance(profile, DermatologistProfile)
    assert profile.medical_registration_number == "MED-123"
    assert documents == []


async def test_get_profile_for_review_returns_none_when_missing(
    db_session: AsyncSession, test_user_id: str
) -> None:
    result = await get_profile_for_review(db_session, role="consultant", user_id=test_user_id)
    assert result is None


async def test_apply_verification_action_approve_transitions_status(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    # reviewed_by/audit_logs.actor_user_id are real FKs to "user"(id) — the reviewer
    # must be a genuine (throwaway) user row, not an arbitrary string.
    db_session.add(ConsultantProfile(user_id=test_user_id, verification_status="pending"))
    await db_session.flush()

    profile = await apply_verification_action(
        db_session,
        role="consultant",
        user_id=test_user_id,
        action="approve",
        reviewer_id=second_user_id,
        reason=None,
    )

    assert profile is not None
    assert profile.verification_status == "approved"
    assert profile.reviewed_by == second_user_id
    assert profile.reviewed_at is not None


async def test_apply_verification_action_reject_records_reason(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    db_session.add(ConsultantProfile(user_id=test_user_id, verification_status="pending"))
    await db_session.flush()

    profile = await apply_verification_action(
        db_session,
        role="consultant",
        user_id=test_user_id,
        action="reject",
        reviewer_id=second_user_id,
        reason="Missing professional certificate",
    )

    assert profile is not None
    assert profile.verification_status == "rejected"
    assert profile.rejection_reason == "Missing professional certificate"


async def test_apply_verification_action_returns_none_when_missing(
    db_session: AsyncSession, test_user_id: str
) -> None:
    profile = await apply_verification_action(
        db_session,
        role="consultant",
        user_id=test_user_id,
        action="approve",
        reviewer_id="reviewer-1",
        reason=None,
    )
    assert profile is None


async def test_write_audit_log_persists_expected_fields(
    db_session: AsyncSession, test_user_id: str
) -> None:
    entry = await write_audit_log(
        db_session,
        actor_user_id=test_user_id,
        action="role_changed",
        target_type="user",
        target_id="some-other-user",
        metadata={"from": "user", "to": "consultant"},
    )

    assert entry.audit_log_id is not None
    assert entry.action == "role_changed"
    assert entry.metadata_ == {"from": "user", "to": "consultant"}
