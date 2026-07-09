"""RBAC — `require_role` unit coverage plus a representative sample of the `user`-role
routes actually enforcing it end to end. Per docs/CONVENTIONS.md's testing guidance
("auth matrix: valid/expired/wrong-role JWT") and the fine-grained ACL matrix task in
PROGRESS.md: every `/me`-scoped endpoint under skin-profiles, lifestyle-logs, scores,
routines, recommendations, and progress is a `user`-role feature (ARCHITECTURE.md §2) —
consultant/dermatologist/admin accounts have no skin profile of their own and must get a
403, not a 200 with empty/nonsensical data.

Route-level cases below only assert the 403 (wrong-role) path, not the 200 (right-role)
path — the right-role path needs a real Postgres session (`get_db`), which these tests
deliberately avoid; `require_role`'s own allow-path is covered directly, and each route's
200 behavior is covered by that service's own tests/live verification.
"""

import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.core.security import require_role, require_user
from app.main import app


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
