# source: docs/DATASETS_AND_APIS.md → "5. Weather & UV" / OpenUV
"""Dedicated real-time UV index — the doc's recommendation since OpenWeather's
standalone UV Index API was retired (2021) and One Call 3.0/4.0 (which folds UV back
in) is a paid tier this adapter deliberately doesn't target yet."""

from typing import Any

import httpx

from app.core.config import settings
from app.integrations.base import CircuitBreaker, call_with_resilience

source = "openuv"
_BASE_URL = "https://api.openuv.io/api/v1/uv"
_breaker = CircuitBreaker()


class OpenUVResult:
    def __init__(self, uv: float, uv_max: float, ozone: float | None, raw: dict[str, Any]):
        self.uv = uv
        self.uv_max = uv_max
        self.ozone = ozone
        self.raw = raw


def parse_response(data: dict[str, Any]) -> OpenUVResult:
    """Pure — no I/O — unit-testable against a fixture payload directly."""
    result = data["result"]
    return OpenUVResult(
        uv=result["uv"],
        uv_max=result["uv_max"],
        ozone=result.get("ozone"),
        raw=data,
    )


async def fetch_uv_index(lat: float, lon: float) -> OpenUVResult | None:
    """Returns None if OPENUV_API_KEY isn't configured — same honest "not available"
    convention as openweather.py, not a raised error."""
    if not settings.openuv_api_key:
        return None

    async def _call() -> OpenUVResult:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                _BASE_URL,
                params={"lat": lat, "lng": lon},
                headers={"x-access-token": settings.openuv_api_key},
            )
            response.raise_for_status()
            data = response.json()
        return parse_response(data)

    result: OpenUVResult = await call_with_resilience(_call, breaker=_breaker)
    return result
