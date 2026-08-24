"""backend/app/migrations/versions/d4a8f2c17b93 — new appointments tables actually
land with the exclusion constraint intact. Real Postgres (same discipline as every
other service's tests, no mocks)."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def test_appointments_exclusion_constraint_exists(db_session: AsyncSession) -> None:
    result = await db_session.execute(
        text(
            "SELECT conname FROM pg_constraint WHERE conname = "
            "'excl_appointments_provider_overlap'"
        )
    )
    assert result.scalar_one_or_none() == "excl_appointments_provider_overlap"


async def test_dermatologist_profiles_has_consultation_modes_column(
    db_session: AsyncSession,
) -> None:
    result = await db_session.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'dermatologist_profiles' AND column_name = 'consultation_modes'"
        )
    )
    assert result.scalar_one_or_none() == "consultation_modes"


async def test_appointments_table_has_concern_and_meeting_link_columns(
    db_session: AsyncSession,
) -> None:
    result = await db_session.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'appointments' AND column_name IN ('concern', 'meeting_link')"
        )
    )
    columns = {row.column_name for row in result.all()}
    assert columns == {"concern", "meeting_link"}
