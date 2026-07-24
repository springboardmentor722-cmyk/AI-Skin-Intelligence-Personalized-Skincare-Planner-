"""Milestone 2 P6 — schema validation for the in-built visual datasets
(web/lib/assessment/skin-{types,concerns}.json, MILESTONE 2.docx §A/§B,
docs/DECISIONS.md ADR-021 C1/C2, ADR-025). Single source of truth: reads the
same JSON the frontend imports directly (web/lib/assessment/datasets.ts) rather
than a backend-side copy that could drift, and cross-checks every
backend_enum/backend_field against the live skin_types/skin_concerns tables
(seeded by migration a9c3d2f81b47) rather than a hardcoded expected list.
"""

import json
import re
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.skin_profile.service import list_skin_concerns, list_skin_types

_REPO_ROOT = Path(__file__).resolve().parents[2]
_WEB_LIB_ASSESSMENT = _REPO_ROOT / "web" / "lib" / "assessment"
_WEB_PUBLIC = _REPO_ROOT / "web" / "public"

_ID_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*[A-Z0-9]$")


class SkinTypeEntry(BaseModel):
    id: str
    title: str
    description: str
    image_url: str
    backend_enum: str


class SkinConcernEntry(BaseModel):
    id: str
    title: str
    description: str
    image_url: str
    backend_field: str


def _load(filename: str) -> list[dict[str, Any]]:
    path = _WEB_LIB_ASSESSMENT / filename
    assert path.exists(), f"{path} does not exist"
    data: list[dict[str, Any]] = json.loads(path.read_text(encoding="utf-8"))
    return data


def _concern_name_from_field(backend_field: str) -> str:
    """dark_spots_severity -> "Dark Spots" — the naming convention every
    backend_field follows, so no separate backend_concern_name field is needed."""
    return backend_field.removesuffix("_severity").replace("_", " ").title()


@pytest.fixture
def skin_types_raw() -> list[dict[str, Any]]:
    return _load("skin-types.json")


@pytest.fixture
def skin_concerns_raw() -> list[dict[str, Any]]:
    return _load("skin-concerns.json")


def test_skin_types_has_the_docx_literal_four_plus_normal(
    skin_types_raw: list[dict[str, Any]],
) -> None:
    ids = {t["id"] for t in skin_types_raw}
    assert ids == {
        "SKIN_TYPE_OILY",
        "SKIN_TYPE_DRY",
        "SKIN_TYPE_COMBINATION",
        "SKIN_TYPE_SENSITIVE",
        "SKIN_TYPE_NORMAL",
    }


def test_skin_concerns_has_the_docx_literal_ten(skin_concerns_raw: list[dict[str, Any]]) -> None:
    # MILESTONE 2.docx's literal "Common Skin Concerns" list (docs/DECISIONS.md
    # ADR-025) — the 10th is Sensitive Skin, not "Post Acne Marks".
    ids = {c["id"] for c in skin_concerns_raw}
    assert ids == {
        "CONCERN_ACNE",
        "CONCERN_HYPERPIGMENTATION",
        "CONCERN_DARK_SPOTS",
        "CONCERN_DRY_SKIN",
        "CONCERN_OILY_SKIN",
        "CONCERN_SENSITIVE_SKIN",
        "CONCERN_WRINKLES",
        "CONCERN_FINE_LINES",
        "CONCERN_REDNESS",
        "CONCERN_UNEVEN_SKIN_TONE",
    }


def test_skin_types_every_entry_has_required_fields(skin_types_raw: list[dict[str, Any]]) -> None:
    for entry in skin_types_raw:
        SkinTypeEntry.model_validate(entry)


def test_skin_concerns_every_entry_has_required_fields(
    skin_concerns_raw: list[dict[str, Any]],
) -> None:
    for entry in skin_concerns_raw:
        SkinConcernEntry.model_validate(entry)


def test_skin_types_ids_are_unique_and_screaming_snake(
    skin_types_raw: list[dict[str, Any]],
) -> None:
    ids = [t["id"] for t in skin_types_raw]
    assert len(ids) == len(set(ids)), "duplicate skin type ids"
    for entry_id in ids:
        assert _ID_PATTERN.match(entry_id), f"{entry_id} is not SCREAMING_SNAKE_CASE"


def test_skin_concerns_ids_are_unique_and_screaming_snake(
    skin_concerns_raw: list[dict[str, Any]],
) -> None:
    ids = [c["id"] for c in skin_concerns_raw]
    assert len(ids) == len(set(ids)), "duplicate skin concern ids"
    for entry_id in ids:
        assert _ID_PATTERN.match(entry_id), f"{entry_id} is not SCREAMING_SNAKE_CASE"


async def test_every_backend_enum_maps_to_a_real_skin_type_row(
    db_session: AsyncSession, skin_types_raw: list[dict[str, Any]]
) -> None:
    real_names = {t.skin_type_name for t in await list_skin_types(db_session) if t.skin_type_name}
    for entry in skin_types_raw:
        assert entry["backend_enum"] in real_names, (
            f"{entry['id']}'s backend_enum {entry['backend_enum']!r} has no matching "
            f"row in skin_types (real names: {sorted(real_names)})"
        )


async def test_every_backend_field_maps_to_a_real_skin_concern_row(
    db_session: AsyncSession, skin_concerns_raw: list[dict[str, Any]]
) -> None:
    real_names = {c.concern_name for c in await list_skin_concerns(db_session) if c.concern_name}
    for entry in skin_concerns_raw:
        derived_name = _concern_name_from_field(entry["backend_field"])
        assert derived_name in real_names, (
            f"{entry['id']}'s backend_field {entry['backend_field']!r} derives to "
            f"{derived_name!r}, which has no matching row in skin_concerns "
            f"(real names: {sorted(real_names)})"
        )


def test_every_image_url_resolves_to_a_real_file(
    skin_types_raw: list[dict[str, Any]], skin_concerns_raw: list[dict[str, Any]]
) -> None:
    for entry in [*skin_types_raw, *skin_concerns_raw]:
        image_path = _WEB_PUBLIC / entry["image_url"].lstrip("/")
        assert image_path.is_file(), (
            f"{entry['id']}'s image_url {entry['image_url']} -> {image_path} missing"
        )


def test_image_url_paths_are_the_docx_literal_paths_unchanged(
    skin_types_raw: list[dict[str, Any]], skin_concerns_raw: list[dict[str, Any]]
) -> None:
    # Guardrail: /assets/skin_types/*.svg and /assets/concerns/*.svg, never rewritten
    # (docs/DECISIONS.md ADR-021 C5).
    for entry in skin_types_raw:
        assert entry["image_url"].startswith("/assets/skin_types/")
    for entry in skin_concerns_raw:
        assert entry["image_url"].startswith("/assets/concerns/")
