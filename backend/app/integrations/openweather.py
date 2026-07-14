# source: docs/DATASETS_AND_APIS.md → "5. Weather & UV" / OpenWeather
"""Current temperature + humidity. Deliberately targets the free `/data/2.5/weather`
endpoint, not One Call 3.0/4.0 (the doc's own caveat: that tier is paid and its
pricing needs verifying before relying on it) — and not the standalone UV Index API
(retired 2021, per the doc). UV comes from openuv.py instead; the two adapters aren't
a fallback pair for the same field, they cover different fields at the free tier."""

from typing import Any

import httpx

from app.core.config import settings
from app.integrations.base import CircuitBreaker, call_with_resilience

source = "openweather"
_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
_breaker = CircuitBreaker()


class OpenWeatherResult:
    def __init__(
        self,
        temp_celsius: float,
        humidity_percent: int,
        condition: str | None,
        raw: dict[str, Any],
    ):
        self.temp_celsius = temp_celsius
        self.humidity_percent = humidity_percent
        self.condition = condition
        self.raw = raw


def parse_response(data: dict[str, Any]) -> OpenWeatherResult:
    """Pure — no I/O — so it's unit-testable against a fixture payload without
    mocking HTTP at all."""
    weather_list = data.get("weather") or []
    return OpenWeatherResult(
        temp_celsius=data["main"]["temp"],
        humidity_percent=data["main"]["humidity"],
        condition=weather_list[0]["main"] if weather_list else None,
        raw=data,
    )


async def fetch_current_weather(lat: float, lon: float) -> OpenWeatherResult | None:
    """Returns None if OPENWEATHER_API_KEY isn't configured — a real, honest "not
    available" rather than raising, matching the topbar's existing stub-chip
    precedent. Raises AdapterError if the key IS configured but the call still fails
    after the full resilience policy (timeout/retry/circuit breaker)."""
    if not settings.openweather_api_key:
        return None

    async def _call() -> OpenWeatherResult:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                _BASE_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": settings.openweather_api_key,
                    "units": "metric",
                },
            )
            response.raise_for_status()
            data = response.json()
        return parse_response(data)

    result: OpenWeatherResult = await call_with_resilience(_call, breaker=_breaker)
    return result
