"""Reports service — generation writes a real PDF to storage and a real
progress_reports row, never a fabricated one (AGENTS.md §0.2)."""

import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.reports.models import ProgressReport
from app.services.reports.service import generate_report


@pytest.fixture
async def router_test_user() -> AsyncGenerator[str, None]:
    # The `client` fixture hits the real `get_db` (no rollback wrapper, unlike
    # `db_session`) — generating a report over HTTP really inserts a
    # `progress_reports` row FK'd to `user.id`, so this needs a real, committed
    # user row (same pattern as test_progress_router.py / test_notifications_service.py).
    user_id = f"test-reports-router-{uuid.uuid4().hex[:16]}"
    async with async_session_factory() as session:
        await session.execute(
            external_user_table.insert().values(
                id=user_id, email=f"{user_id}@test.invalid", name="Test User", emailVerified=False
            )
        )
        await session.commit()
    try:
        yield user_id
    finally:
        async with async_session_factory() as session:
            await session.execute(delete(ProgressReport).where(ProgressReport.user_id == user_id))
            await session.execute(
                delete(external_user_table).where(external_user_table.c.id == user_id)
            )
            await session.commit()


async def test_generate_assessment_report_writes_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    report = await generate_report(
        db_session, test_user_id, "assessment", include_profile_header=True
    )

    assert report.report_id is not None
    assert report.report_type == "assessment"
    assert report.report_url is not None
    assert report.summary is not None


async def test_generate_progress_report_writes_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    report = await generate_report(
        db_session, test_user_id, "progress", include_profile_header=False
    )

    assert report.report_type == "progress"
    assert report.report_url is not None


async def test_generate_routine_report_writes_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    report = await generate_report(
        db_session, test_user_id, "routine", include_profile_header=False
    )

    assert report.report_type == "routine"
    assert report.report_url is not None


async def test_generate_report_rejects_an_unknown_type(
    db_session: AsyncSession, test_user_id: str
) -> None:
    with pytest.raises(ValueError):
        await generate_report(
            db_session,
            test_user_id,
            "bogus",
            include_profile_header=False,  # type: ignore[arg-type]
        )


async def test_reports_endpoints_require_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reports")
    assert response.status_code in (401, 403)


async def test_generate_list_and_download_report_via_http(
    client: AsyncClient, router_test_user: str
) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": router_test_user,
        "role": "user",
        "claims": {},
    }
    try:
        generate_response = await client.post(
            "/api/v1/reports/generate",
            json={"report_type": "assessment", "include_profile_header": True},
        )
        assert generate_response.status_code == 200
        report_id = generate_response.json()["report_id"]

        list_response = await client.get("/api/v1/reports")
        assert list_response.status_code == 200
        assert any(r["report_id"] == report_id for r in list_response.json())

        download_response = await client.get(f"/api/v1/reports/{report_id}/download")
        assert download_response.status_code == 200
        assert download_response.json()["url"].startswith("http")
    finally:
        app.dependency_overrides.pop(require_user, None)


async def test_create_and_list_report_schedule(db_session: AsyncSession, test_user_id: str) -> None:
    from app.services.reports.schemas import ReportScheduleCreate
    from app.services.reports.service import create_schedule, list_my_schedules

    created = await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(report_type="progress", frequency="weekly", day_of_week=0),
    )
    await db_session.flush()

    assert created.schedule_id is not None
    rows = await list_my_schedules(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].frequency == "weekly"


async def test_update_report_schedule_rejects_another_user(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.reports.schemas import ReportScheduleCreate, ReportScheduleUpdate
    from app.services.reports.service import create_schedule, update_schedule

    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other",
            emailVerified=False,
        )
    )
    created = await create_schedule(
        db_session,
        other_user_id,
        ReportScheduleCreate(report_type="progress", frequency="monthly", day_of_month=1),
    )
    await db_session.flush()

    with pytest.raises(ValueError):
        await update_schedule(
            db_session, test_user_id, created.schedule_id, ReportScheduleUpdate(is_active=False)
        )
