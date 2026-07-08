from httpx import AsyncClient

from app.core.security import require_user
from app.main import app


async def test_me_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


async def test_me_returns_validated_claims(client: AsyncClient) -> None:
    # Overriding require_user, not hand-crafting a JWT — this endpoint's job is to prove
    # the *pipeline* wires claims through to the response; JWKS verification itself is
    # require_user's own responsibility, already covered by its own unit tests.
    app.dependency_overrides[require_user] = lambda: {
        "id": "user_123",
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.get("/api/v1/users/me")
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 200
    assert response.json() == {"id": "user_123", "role": "consultant"}
