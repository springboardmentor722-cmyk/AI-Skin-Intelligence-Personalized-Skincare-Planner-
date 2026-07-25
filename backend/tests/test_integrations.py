"""Real external-data adapters (docs/DATASETS_AND_APIS.md). These tests cover what is
verifiable without live keys: the "unconfigured -> honest None" convention, the pure
response-parsing logic (fixture payloads, no HTTP), and the resilience contract
(CircuitBreaker/call_with_resilience) in isolation.

The unconfigured-key tests used to rely on OPENWEATHER_API_KEY/OPENUV_API_KEY simply
being blank in the developer's own `.env` — this file's original docstring asserted
"no live API keys exist in this environment" as a standing fact. That stopped being
true the moment someone added real keys, and the failure mode was worse than a red
test: with a key present the guard doesn't short-circuit, so the "returns None when
unconfigured" tests issued **live HTTP requests to OpenWeather and OpenUV on every
`pytest` run**, spending real API quota and making the suite network-dependent —
against MILESTONE_2_MASTER_PROMPT.md P13's own rule ("Deterministic, no network
dependence, no flakes").

They now force the unconfigured state with monkeypatch, so they assert the actual
contract regardless of what is in anyone's `.env`, and assert it without I/O.
"""

import asyncio
from typing import Any

import httpx
import pytest

from app.core.config import settings
from app.integrations import openuv, openweather
from app.integrations.base import AdapterError, CircuitBreaker, call_with_resilience

# --- Unconfigured key -> honest None ---


@pytest.fixture
def no_http(monkeypatch: pytest.MonkeyPatch) -> None:
    """Turn any outbound HTTP attempt into an immediate failure.

    Makes "returns None because the key is missing" a stronger claim than "returns
    None": these adapters must short-circuit *before* constructing a client, so a
    test that passes with the network fused off has proven the guard is a real
    early return and not a swallowed request failure."""

    def _forbidden(*args: Any, **kwargs: Any) -> Any:
        raise AssertionError(
            "adapter attempted an outbound HTTP request while its API key was unset"
        )

    monkeypatch.setattr(httpx, "AsyncClient", _forbidden)


async def test_openweather_returns_none_when_unconfigured(
    monkeypatch: pytest.MonkeyPatch, no_http: None
) -> None:
    monkeypatch.setattr(settings, "openweather_api_key", "")
    assert await openweather.fetch_current_weather(lat=51.5, lon=-0.1) is None


async def test_openuv_returns_none_when_unconfigured(
    monkeypatch: pytest.MonkeyPatch, no_http: None
) -> None:
    monkeypatch.setattr(settings, "openuv_api_key", "")
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
