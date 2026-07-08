from httpx import AsyncClient


async def test_404_uses_error_envelope(client: AsyncClient) -> None:
    response = await client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "not_found"
    assert "message" in body["error"]
    # Must be populated even when the caller sent no X-Request-ID themselves.
    assert body["error"]["request_id"] != ""
    assert body["error"]["request_id"] == response.headers["X-Request-ID"]
