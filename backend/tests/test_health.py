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


async def test_health_ready_checks_real_dependencies(client: AsyncClient) -> None:
    # Production-readiness audit finding: /health always returned 200 regardless of
    # whether Postgres/Redis/Mongo were actually reachable. This hits the real,
    # live Docker services (docker-compose.yml) this whole test suite already runs
    # against — not mocked — so a genuine 200 here is a genuine "all three are
    # actually up" signal. The reverse case (a real dependency outage -> 503) is
    # verified live in PROGRESS.md's dated entry, not here: there's no clean way to
    # simulate "Postgres is actually down" from inside a test that itself needs
    # Postgres for its own fixtures.
    response = await client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["checks"] == {"postgres": "ok", "redis": "ok", "mongo": "ok"}
