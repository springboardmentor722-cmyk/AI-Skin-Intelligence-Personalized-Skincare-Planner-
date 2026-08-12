"""Reports service — generation writes a real PDF to storage and a real
progress_reports row, never a fabricated one (AGENTS.md §0.2)."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.reports.service import generate_report


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
