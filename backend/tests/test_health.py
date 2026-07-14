from httpx import AsyncClient


async def test_health(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_request_id_echoed(client: AsyncClient) -> None:
    response = await client.get("/health", headers={"X-Request-ID": "test-123"})
    assert response.headers["X-Request-ID"] == "test-123"


async def test_security_headers_present_on_every_response(client: AsyncClient) -> None:
    # Production-readiness audit finding: the browser hits this API directly
    # (NEXT_PUBLIC_API_URL, not proxied through Next.js), so it never had any of the
    # security headers web/next.config.ts already sets on the frontend's own
    # responses. /health is a real, unauthenticated route — no JWT/DB round trip
    # needed to prove SecurityHeadersMiddleware wraps every response path.
    response = await client.get("/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
