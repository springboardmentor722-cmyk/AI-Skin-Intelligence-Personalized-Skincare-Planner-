"""RBAC — `require_role`/`require_verified_professional` unit coverage plus a
representative sample of the `user`-role and `admin`-role routes actually enforcing it
end to end. Per docs/CONVENTIONS.md's testing guidance ("auth matrix: valid/expired/
wrong-role JWT") and the fine-grained ACL matrix task in PROGRESS.md: every `/me`-scoped
endpoint under skin-profiles, lifestyle-logs, scores, routines, recommendations, and
progress is a `user`-role feature (ARCHITECTURE.md §2) — consultant/dermatologist/admin
accounts have no skin profile of their own and must get a 403, not a 200 with empty/
nonsensical data. Same shape for `/admin/*` — only an admin may reach it.

Route-level cases below only assert the 403 (wrong-role) path, not the 200 (right-role)
path — the right-role path needs a real Postgres session (`get_db`), which these tests
deliberately avoid; `require_role`'s own allow-path is covered directly, and each route's
200 behavior is covered by that service's own tests (`test_admin_service.py`)/live
verification.
"""

from typing import Any

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role, require_user, require_verified_professional
from app.main import app
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile


async def test_require_role_allows_matching_role() -> None:
    dep = require_role("user")
    result = await dep(user={"id": "u1", "role": "user", "claims": {}})
    assert result["role"] == "user"


async def test_require_role_allows_any_of_multiple_roles() -> None:
    dep = require_role("admin", "consultant")
    result = await dep(user={"id": "a1", "role": "admin", "claims": {}})
    assert result["role"] == "admin"


async def test_require_role_rejects_non_matching_role() -> None:
    dep = require_role("user")
    with pytest.raises(HTTPException) as exc_info:
        await dep(user={"id": "c1", "role": "consultant", "claims": {}})
    assert exc_info.value.status_code == 403


async def test_require_verified_professional_allows_approved_consultant(
    db_session: AsyncSession, test_user_id: str
) -> None:
    db_session.add(ConsultantProfile(user_id=test_user_id, verification_status="approved"))
    await db_session.flush()

    dep = require_verified_professional("consultant")
    result = await dep(user={"id": test_user_id, "role": "consultant", "claims": {}}, db=db_session)
    assert result["id"] == test_user_id


@pytest.mark.parametrize(
    "status_value", ["pending", "rejected", "more_info_requested", "suspended"]
)
async def test_require_verified_professional_rejects_unapproved_status(
    db_session: AsyncSession, test_user_id: str, status_value: str
) -> None:
    db_session.add(DermatologistProfile(user_id=test_user_id, verification_status=status_value))
    await db_session.flush()

    dep = require_verified_professional("dermatologist")
    with pytest.raises(HTTPException) as exc_info:
        await dep(user={"id": test_user_id, "role": "dermatologist", "claims": {}}, db=db_session)
    assert exc_info.value.status_code == 403


async def test_require_verified_professional_rejects_wrong_role(
    db_session: AsyncSession, test_user_id: str
) -> None:
    dep = require_verified_professional("consultant")
    with pytest.raises(HTTPException) as exc_info:
        await dep(user={"id": test_user_id, "role": "user", "claims": {}}, db=db_session)
    assert exc_info.value.status_code == 403


async def test_require_verified_professional_rejects_missing_profile(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # A real consultant role with no consultant_profiles row yet (never onboarded) —
    # must fail closed, not treat "no row" as implicitly approved.
    dep = require_verified_professional("consultant")
    with pytest.raises(HTTPException) as exc_info:
        await dep(user={"id": test_user_id, "role": "consultant", "claims": {}}, db=db_session)
    assert exc_info.value.status_code == 403


@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/api/v1/users/me/profile"),
        ("PUT", "/api/v1/users/me/profile"),
        ("GET", "/api/v1/skin-profiles/me"),
        ("POST", "/api/v1/skin-profiles"),
        ("POST", "/api/v1/lifestyle-logs"),
        ("GET", "/api/v1/lifestyle-logs/me"),
        ("GET", "/api/v1/scores/me"),
        ("GET", "/api/v1/routines/me"),
        ("GET", "/api/v1/recommendations/me"),
        ("GET", "/api/v1/progress/me/summary"),
    ],
)
async def test_user_only_routes_reject_other_roles(
    client: AsyncClient, method: str, path: str
) -> None:
    # require_role raises before any sibling dependency (get_db) is resolved, so this
    # never touches Postgres — the 403 is the whole point of the test.
    app.dependency_overrides[require_user] = lambda: {
        "id": "consultant_1",
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.request(method, path, json={} if method != "GET" else None)
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 403, f"{method} {path} returned {response.status_code}"


@pytest.mark.parametrize(
    "method,path,json_body",
    [
        ("GET", "/api/v1/admin/verification-queue", None),
        ("GET", "/api/v1/admin/verification-queue/consultant/some-user", None),
        ("POST", "/api/v1/admin/verification-queue/consultant/some-user/approve", {}),
        (
            "POST",
            "/api/v1/admin/verification-queue/consultant/some-user/reject",
            {"reason": "incomplete documents"},
        ),
        (
            "POST",
            "/api/v1/admin/verification-queue/consultant/some-user/request-info",
            {"reason": "please upload a license"},
        ),
        (
            "POST",
            "/api/v1/admin/verification-queue/consultant/some-user/suspend",
            {"reason": "policy violation"},
        ),
        ("POST", "/api/v1/admin/verification-queue/consultant/some-user/deactivate", {}),
        ("POST", "/api/v1/admin/audit-logs", {"action": "test"}),
    ],
)
async def test_admin_only_routes_reject_non_admin_roles(
    client: AsyncClient, method: str, path: str, json_body: dict[str, Any] | None
) -> None:
    # Same reasoning as test_user_only_routes_reject_other_roles above: require_role
    # raises before get_db is ever resolved, so no real Postgres round trip happens here.
    app.dependency_overrides[require_user] = lambda: {
        "id": "consultant_1",
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.request(method, path, json=json_body)
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 403, f"{method} {path} returned {response.status_code}"


@pytest.mark.parametrize(
    "method,path,json_body",
    [
        ("GET", "/api/v1/consultant-profiles/me", None),
        ("POST", "/api/v1/consultant-profiles/me/submit", {}),
        ("PATCH", "/api/v1/consultant-profiles/me", {}),
        ("GET", "/api/v1/consultant-profiles/me/documents", None),
        ("DELETE", "/api/v1/consultant-profiles/me/documents/1", None),
    ],
)
async def test_consultant_profile_routes_reject_dermatologist_role(
    client: AsyncClient, method: str, path: str, json_body: dict[str, Any] | None
) -> None:
    # A dermatologist is neither "user" (first-time onboarding) nor "consultant"
    # (already onboarded) — every one of these routes must 403 them, submit included.
    app.dependency_overrides[require_user] = lambda: {
        "id": "dermatologist_1",
        "role": "dermatologist",
        "claims": {},
    }
    try:
        response = await client.request(method, path, json=json_body)
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 403, f"{method} {path} returned {response.status_code}"


@pytest.mark.parametrize(
    "method,path,json_body",
    [
        ("GET", "/api/v1/consultant-profiles/me", None),
        ("PATCH", "/api/v1/consultant-profiles/me", {}),
        ("GET", "/api/v1/consultant-profiles/me/documents", None),
        ("DELETE", "/api/v1/consultant-profiles/me/documents/1", None),
    ],
)
async def test_consultant_profile_management_routes_reject_plain_user_role(
    client: AsyncClient, method: str, path: str, json_body: dict[str, Any] | None
) -> None:
    # A plain "user" (never submitted onboarding) has no profile row by construction —
    # only .../submit is reachable before the role flips to "consultant".
    app.dependency_overrides[require_user] = lambda: {
        "id": "user_1",
        "role": "user",
        "claims": {},
    }
    try:
        response = await client.request(method, path, json=json_body)
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 403, f"{method} {path} returned {response.status_code}"


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/admin/verification-queue/consultant/some-user/reject",
        "/api/v1/admin/verification-queue/consultant/some-user/request-info",
        "/api/v1/admin/verification-queue/consultant/some-user/suspend",
    ],
)
async def test_verification_actions_require_a_non_empty_reason(
    client: AsyncClient, path: str
) -> None:
    # A required reason is the whole point of these three actions (the professional
    # reads it back on their locked dashboard) — an admin accidentally submitting one
    # blank must get a real validation error, not a silently reason-less transition.
    app.dependency_overrides[require_user] = lambda: {
        "id": "admin_1",
        "role": "admin",
        "claims": {},
    }
    try:
        response = await client.post(path, json={"reason": ""})
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 422


async def test_me_stays_role_agnostic(client: AsyncClient) -> None:
    # GET /users/me is the one deliberate exception (role-probing endpoint) — every role
    # must be able to call it to learn which dashboard to land on.
    for role in ("user", "consultant", "dermatologist", "admin"):
        app.dependency_overrides[require_user] = lambda role=role: {
            "id": f"{role}_1",
            "role": role,
            "claims": {},
        }
        try:
            response = await client.get("/api/v1/users/me")
        finally:
            app.dependency_overrides.pop(require_user, None)
        assert response.status_code == 200
        assert response.json()["role"] == role
