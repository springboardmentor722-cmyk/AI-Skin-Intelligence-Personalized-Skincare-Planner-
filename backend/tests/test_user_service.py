"""app/services/user/service.py — profile CRUD (`user_profiles`) had zero test
coverage before this (a real Milestone 1 gap, found during a re-audit — every other
service package had at least a service-level test file). Appearance preferences
(`user_appearance_preferences`, Phase 3's theme system) are new in the same pass, so
they're covered from day one instead of accumulating the same gap.
"""

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user.schemas import AppearancePreferenceUpdate, UserProfileUpdate
from app.services.user.service import (
    get_or_create_appearance,
    get_or_create_profile,
    reset_appearance,
    update_appearance,
    update_profile,
)


async def test_get_or_create_profile_creates_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    profile = await get_or_create_profile(db_session, test_user_id)

    assert profile.user_id == test_user_id
    assert profile.first_name is None


async def test_get_or_create_profile_is_idempotent(
    db_session: AsyncSession, test_user_id: str
) -> None:
    first = await get_or_create_profile(db_session, test_user_id)
    second = await get_or_create_profile(db_session, test_user_id)

    assert first.profile_id == second.profile_id


async def test_update_profile_applies_only_the_fields_given(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await get_or_create_profile(db_session, test_user_id)

    updated = await update_profile(
        db_session, test_user_id, UserProfileUpdate(first_name="Ada", location="Remote")
    )

    assert updated.first_name == "Ada"
    assert updated.location == "Remote"
    assert updated.last_name is None


async def test_get_or_create_appearance_defaults_to_default_palette_and_system_mode(
    db_session: AsyncSession, test_user_id: str
) -> None:
    preference = await get_or_create_appearance(db_session, test_user_id)

    assert preference.palette == "default"
    assert preference.theme_mode == "system"
    assert preference.accent_color is None


async def test_get_or_create_appearance_is_idempotent(
    db_session: AsyncSession, test_user_id: str
) -> None:
    first = await get_or_create_appearance(db_session, test_user_id)
    second = await get_or_create_appearance(db_session, test_user_id)

    assert first.preference_id == second.preference_id


async def test_update_appearance_applies_only_the_fields_given(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await get_or_create_appearance(db_session, test_user_id)

    updated = await update_appearance(
        db_session, test_user_id, AppearancePreferenceUpdate(palette="ocean")
    )

    assert updated.palette == "ocean"
    # theme_mode wasn't in this partial update — stays at its own default, not reset.
    assert updated.theme_mode == "system"


async def test_update_appearance_rejects_a_palette_outside_the_fixed_set() -> None:
    with pytest.raises(ValidationError):
        AppearancePreferenceUpdate(palette="neon")  # type: ignore[arg-type]


async def test_reset_appearance_returns_to_the_schema_defaults(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await update_appearance(
        db_session,
        test_user_id,
        AppearancePreferenceUpdate(palette="forest", theme_mode="dark", font_size="lg"),
    )

    reset = await reset_appearance(db_session, test_user_id)

    assert reset.palette == "default"
    assert reset.theme_mode == "system"
    assert reset.font_size is None
