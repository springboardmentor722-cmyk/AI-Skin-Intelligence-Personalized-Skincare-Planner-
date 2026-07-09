"""Branch 5 (feature/dermatologist-module) — same shape as
test_consultant_profile_service.py, distinct medical field set. Real Postgres round
trips via tests/conftest.py's rollback-wrapped `db_session`/`test_user_id`; document
tests hit the real MinIO container and always clean up the objects they create.
"""

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import delete as delete_object
from app.core.storage import get_presigned_url
from app.services.admin.models import AuditLog
from app.services.dermatologist_profile.schemas import (
    DermatologistProfileSubmit,
    DermatologistProfileUpdate,
)
from app.services.dermatologist_profile.service import (
    delete_own_document,
    get_own_profile,
    list_own_documents,
    submit_profile,
    update_own_profile,
    upload_document,
)


def _submission(**overrides: object) -> DermatologistProfileSubmit:
    defaults: dict[str, object] = {
        "medical_registration_number": "MED-REG-12345",
        "medical_council": "General Medical Council",
        "hospital_clinic": "City Dermatology Hospital",
        "years_of_practice": 10,
        "degrees": ["MBBS", "MD Dermatology"],
        "board_certifications": ["Board Certified Dermatologist"],
        "specializations": ["psoriasis", "eczema"],
        "research_interests": "Autoimmune skin conditions",
        "professional_biography": "Consultant dermatologist with 10 years of practice.",
        "phone": "+44 20 9999 8888",
        "location": "Manchester, UK",
    }
    defaults.update(overrides)
    return DermatologistProfileSubmit(**defaults)  # type: ignore[arg-type]


async def test_submit_profile_creates_a_pending_row_and_audit_log(
    db_session: AsyncSession, test_user_id: str
) -> None:
    profile = await submit_profile(db_session, user_id=test_user_id, data=_submission())

    assert profile.verification_status == "pending"
    assert profile.submitted_at is not None
    assert profile.medical_registration_number == "MED-REG-12345"

    result = await db_session.execute(select(AuditLog).where(AuditLog.target_id == test_user_id))
    audit_entries = result.scalars().all()
    assert any(e.action == "verification_profile_submitted" for e in audit_entries)


async def test_submit_profile_twice_while_pending_conflicts(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await submit_profile(db_session, user_id=test_user_id, data=_submission())

    with pytest.raises(ValueError, match="cannot be resubmitted"):
        await submit_profile(db_session, user_id=test_user_id, data=_submission())


async def test_resubmit_after_rejection_resets_to_pending(
    db_session: AsyncSession, test_user_id: str
) -> None:
    profile = await submit_profile(db_session, user_id=test_user_id, data=_submission())
    profile.verification_status = "rejected"
    profile.rejection_reason = "Missing medical council name"
    await db_session.commit()

    resubmitted = await submit_profile(
        db_session,
        user_id=test_user_id,
        data=_submission(medical_registration_number="MED-REG-UPDATED"),
    )

    assert resubmitted.verification_status == "pending"
    assert resubmitted.rejection_reason is None
    assert resubmitted.medical_registration_number == "MED-REG-UPDATED"


async def test_resubmit_while_approved_conflicts(
    db_session: AsyncSession, test_user_id: str
) -> None:
    profile = await submit_profile(db_session, user_id=test_user_id, data=_submission())
    profile.verification_status = "approved"
    await db_session.commit()

    with pytest.raises(ValueError, match="cannot be resubmitted"):
        await submit_profile(db_session, user_id=test_user_id, data=_submission())


async def test_update_own_profile_edits_fields_without_touching_status(
    db_session: AsyncSession, test_user_id: str
) -> None:
    profile = await submit_profile(db_session, user_id=test_user_id, data=_submission())
    profile.verification_status = "approved"
    await db_session.commit()

    updated = await update_own_profile(
        db_session,
        user_id=test_user_id,
        data=DermatologistProfileUpdate(phone="+1 555 000 2222"),
    )

    assert updated is not None
    assert updated.phone == "+1 555 000 2222"
    assert updated.verification_status == "approved"
    assert updated.medical_registration_number == "MED-REG-12345"


async def test_update_own_profile_returns_none_when_missing(
    db_session: AsyncSession, test_user_id: str
) -> None:
    result = await update_own_profile(
        db_session, user_id=test_user_id, data=DermatologistProfileUpdate(phone="+1 555 000 2222")
    )
    assert result is None


async def test_get_own_profile_returns_none_when_missing(
    db_session: AsyncSession, test_user_id: str
) -> None:
    assert await get_own_profile(db_session, user_id=test_user_id) is None


async def test_document_upload_list_and_delete_round_trip(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await submit_profile(db_session, user_id=test_user_id, data=_submission())

    document = await upload_document(
        db_session,
        user_id=test_user_id,
        document_type="medical_license",
        data=b"fake medical license bytes",
        filename="license.pdf",
        content_type="application/pdf",
    )

    try:
        documents = await list_own_documents(db_session, user_id=test_user_id)
        assert any(d.document_id == document.document_id for d in documents)

        url = await get_presigned_url(document.storage_key, expires_in=60)
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
        assert response.status_code == 200
        assert response.content == b"fake medical license bytes"

        deleted = await delete_own_document(
            db_session, user_id=test_user_id, document_id=document.document_id
        )
        assert deleted is True

        remaining = await list_own_documents(db_session, user_id=test_user_id)
        assert all(d.document_id != document.document_id for d in remaining)
    finally:
        await delete_object(document.storage_key)


async def test_delete_own_document_returns_false_for_someone_elses_document(
    db_session: AsyncSession, test_user_id: str
) -> None:
    result = await delete_own_document(db_session, user_id=test_user_id, document_id=999999)
    assert result is False
