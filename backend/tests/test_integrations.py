"""Real external-data adapters (docs/DATASETS_AND_APIS.md). No live API keys exist in
this environment (KAGGLE_USERNAME/KAGGLE_KEY/OPENWEATHER_API_KEY/OPENUV_API_KEY are
blank — training_dataset/README.md), so these tests cover what's actually verifiable
without live keys: the "unconfigured -> honest None" convention (real, since the keys
genuinely are blank right now), the pure response-parsing logic (fixture payloads, no
HTTP), and the resilience contract (CircuitBreaker/call_with_resilience) in isolation.
"""

import asyncio

import pytest

from app.integrations import openuv, openweather
from app.integrations.base import AdapterError, CircuitBreaker, call_with_resilience

# --- Unconfigured key -> honest None (real in this environment, not simulated) ---


async def test_openweather_returns_none_when_unconfigured() -> None:
    assert await openweather.fetch_current_weather(lat=51.5, lon=-0.1) is None


async def test_openuv_returns_none_when_unconfigured() -> None:
    assert await openuv.fetch_uv_index(lat=51.5, lon=-0.1) is None


# --- Pure response parsing (fixture payloads, no HTTP/mocking needed) ---


def test_openweather_parse_response_extracts_real_fields() -> None:
    payload = {
        "main": {"temp": 21.4, "humidity": 63},
        "weather": [{"main": "Clouds", "description": "overcast clouds"}],
    }
    result = openweather.parse_response(payload)
    assert result.temp_celsius == 21.4
    assert result.humidity_percent == 63
    assert result.condition == "Clouds"


def test_openweather_parse_response_handles_missing_weather_array() -> None:
    payload = {"main": {"temp": 10.0, "humidity": 40}, "weather": []}
    result = openweather.parse_response(payload)
    assert result.condition is None


def test_openuv_parse_response_extracts_real_fields() -> None:
    payload = {"result": {"uv": 5.2, "uv_max": 7.1, "ozone": 310.5}}
    result = openuv.parse_response(payload)
    assert result.uv == 5.2
    assert result.uv_max == 7.1
    assert result.ozone == 310.5


def test_openuv_parse_response_handles_missing_ozone() -> None:
    payload = {"result": {"uv": 1.0, "uv_max": 2.0}}
    result = openuv.parse_response(payload)
    assert result.ozone is None


# --- Resilience contract: CircuitBreaker + call_with_resilience, in isolation ---
# Tests that need a *retry* (a real call succeeding/failing more than once within
# one call_with_resilience invocation) monkeypatch asyncio.sleep to skip the real
# backoff wait — the retry *logic* (attempt counts) is unaffected, only the real
# wall-clock delay is. Tests that only need a single failed attempt use retries=1,
# which never sleeps at all (no monkeypatch needed), keeping them honest.


async def test_call_with_resilience_returns_on_first_success() -> None:
    breaker = CircuitBreaker()
    calls = 0

    async def _succeeds() -> str:
        nonlocal calls
        calls += 1
        return "ok"

    assert await call_with_resilience(_succeeds, breaker=breaker, retries=3) == "ok"
    assert calls == 1


async def test_call_with_resilience_retries_then_succeeds(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    real_sleep = asyncio.sleep
    monkeypatch.setattr(asyncio, "sleep", lambda _seconds: real_sleep(0))

    breaker = CircuitBreaker()
    attempts = 0

    async def _flaky() -> str:
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise RuntimeError("transient")
        return "recovered"

    result = await call_with_resilience(_flaky, breaker=breaker, retries=3, timeout_seconds=1.0)
    assert result == "recovered"
    assert attempts == 2


async def test_call_with_resilience_exhausts_retries_and_raises_adapter_error() -> None:
    breaker = CircuitBreaker()

    async def _always_fails() -> str:
        raise RuntimeError("permanent failure")

    # retries=1: a single failed attempt, no backoff sleep ever happens.
    with pytest.raises(AdapterError):
        await call_with_resilience(_always_fails, breaker=breaker, retries=1, timeout_seconds=1.0)


async def test_circuit_breaker_opens_after_failure_threshold() -> None:
    breaker = CircuitBreaker(failure_threshold=2, reset_after_seconds=60.0)

    async def _always_fails() -> str:
        raise RuntimeError("down")

    # Two separate calls (retries=1 each, no sleep) accumulate two real failures on
    # the same breaker instance — this is what actually trips failure_threshold=2,
    # not retries within a single call.
    with pytest.raises(AdapterError):
        await call_with_resilience(_always_fails, breaker=breaker, retries=1, timeout_seconds=0.5)
    assert not breaker.is_open()

    with pytest.raises(AdapterError):
        await call_with_resilience(_always_fails, breaker=breaker, retries=1, timeout_seconds=0.5)
    assert breaker.is_open()

    with pytest.raises(AdapterError, match="circuit open"):
        await call_with_resilience(_always_fails, breaker=breaker, retries=1, timeout_seconds=0.5)


async def test_circuit_breaker_half_opens_after_reset_window() -> None:
    breaker = CircuitBreaker(failure_threshold=1, reset_after_seconds=0.05)

    async def _fails_once() -> str:
        raise RuntimeError("down")

    with pytest.raises(AdapterError):
        await call_with_resilience(_fails_once, breaker=breaker, retries=1, timeout_seconds=0.5)
    assert breaker.is_open()

    # A real, short sleep — this test is specifically about real time elapsing past
    # reset_after_seconds, so it's the one case that must NOT have asyncio.sleep
    # patched away.
    await asyncio.sleep(0.1)
    assert not breaker.is_open()  # half-open: the next call is allowed to probe through
