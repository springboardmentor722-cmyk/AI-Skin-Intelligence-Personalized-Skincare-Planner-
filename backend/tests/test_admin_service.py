"""Branch 3 (feature/rbac) — the actual verification-workflow business logic behind
`backend/app/services/admin/router.py`. Real Postgres round trips via
tests/conftest.py's rollback-wrapped `db_session`/`test_user_id` fixtures, same
discipline as test_skin_profile_service.py — nothing here is ever actually persisted.
"""

import uuid
from collections.abc import AsyncGenerator

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import build_key, upload
from app.core.storage import delete as delete_object
from app.db.postgres import external_user_table
from app.services.admin.service import (
    apply_verification_action,
    create_document,
    get_document_view_url,
    get_pending_verification_counts,
    get_profile_for_review,
    list_audit_logs,
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


async def test_list_audit_logs_filters_by_action_and_paginates(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    await write_audit_log(db_session, actor_user_id=test_user_id, action="role_changed")
    await write_audit_log(db_session, actor_user_id=test_user_id, action="role_changed")
    await write_audit_log(db_session, actor_user_id=second_user_id, action="verification_approve")
    await db_session.commit()

    items, total = await list_audit_logs(db_session, action="role_changed", page=1, page_size=20)
    assert total >= 2
    assert all(item.action == "role_changed" for item in items)

    page_one, _total = await list_audit_logs(db_session, action="role_changed", page=1, page_size=1)
    page_two, _total = await list_audit_logs(db_session, action="role_changed", page=2, page_size=1)
    assert len(page_one) == 1
    assert len(page_two) == 1
    assert page_one[0].audit_log_id != page_two[0].audit_log_id


async def test_list_audit_logs_orders_newest_first(
    db_session: AsyncSession, test_user_id: str
) -> None:
    first = await write_audit_log(db_session, actor_user_id=test_user_id, action="event_one")
    await db_session.commit()
    second = await write_audit_log(db_session, actor_user_id=test_user_id, action="event_two")
    await db_session.commit()

    items, _total = await list_audit_logs(db_session, action=None, page=1, page_size=2)
    ids = [item.audit_log_id for item in items]
    assert ids.index(second.audit_log_id) < ids.index(first.audit_log_id)


async def test_get_pending_verification_counts_reflects_real_rows(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    db_session.add(ConsultantProfile(user_id=test_user_id, verification_status="pending"))
    db_session.add(DermatologistProfile(user_id=second_user_id, verification_status="pending"))
    await db_session.flush()

    consultant_count, dermatologist_count = await get_pending_verification_counts(db_session)

    assert consultant_count >= 1
    assert dermatologist_count >= 1


async def test_get_document_view_url_returns_a_working_presigned_url(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # create_document doesn't upload bytes itself (that's consultant/dermatologist
    # profile service's job, storage.upload) — upload directly here so there's a real
    # object behind the presigned URL this test actually fetches.
    key = build_key(
        prefix="verification-documents", owner_user_id=test_user_id, filename="cert.pdf"
    )
    await upload(key, b"admin review test bytes", content_type="application/pdf")
    document = await create_document(
        db_session,
        owner_user_id=test_user_id,
        document_type="professional_certificate",
        storage_key=key,
        original_filename="cert.pdf",
    )

    try:
        url = await get_document_view_url(
            db_session, owner_user_id=test_user_id, document_id=document.document_id
        )
        assert url is not None

        async with httpx.AsyncClient() as client:
            response = await client.get(url)
        assert response.status_code == 200
        assert response.content == b"admin review test bytes"
    finally:
        await delete_object(document.storage_key)


async def test_get_document_view_url_returns_none_when_missing(
    db_session: AsyncSession, test_user_id: str
) -> None:
    url = await get_document_view_url(db_session, owner_user_id=test_user_id, document_id=999999)
    assert url is None
