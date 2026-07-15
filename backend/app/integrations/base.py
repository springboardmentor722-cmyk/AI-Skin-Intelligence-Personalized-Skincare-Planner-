# source: docs/DATASETS_AND_APIS.md → "Adapter contract & ops defaults"
"""Shared contract every external-data adapter in this package implements. One place
for the resilience policy (timeout/retry/circuit breaker) the doc specifies, so
openweather.py/openuv.py/pubmed.py don't each reinvent it."""

import asyncio
import random
import time
from dataclasses import dataclass, field
from typing import Any, Protocol


class AdapterError(Exception):
    """Raised once an adapter's resilience policy (retries + circuit breaker) is
    exhausted. Callers (routers/services) catch this and degrade gracefully — e.g.
    the weather/UV endpoint returns a "not available" response, never a 500."""


class Adapter(Protocol):
    source: str  # matches a section in docs/DATASETS_AND_APIS.md

    async def fetch(self, req: Any) -> Any: ...


@dataclass
class CircuitBreaker:
    """Opens after `failure_threshold` consecutive failures; half-open (one probe
    allowed through) after `reset_after_seconds`. Per-adapter-instance state, not
    shared across adapters — matches the doc's "open after 5 consecutive failures,
    half-open probe after 60 s" spec exactly."""

    failure_threshold: int = 5
    reset_after_seconds: float = 60.0
    _failures: int = field(default=0, init=False)
    _opened_at: float | None = field(default=None, init=False)

    def is_open(self) -> bool:
        if self._opened_at is None:
            return False
        if time.monotonic() - self._opened_at >= self.reset_after_seconds:
            return False  # half-open: let the next call probe through
        return True

    def record_success(self) -> None:
        self._failures = 0
        self._opened_at = None

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self.failure_threshold:
            self._opened_at = time.monotonic()


async def call_with_resilience(
    fn: Any,
    *,
    breaker: CircuitBreaker,
    retries: int = 3,
    timeout_seconds: float = 10.0,
) -> Any:
    """10 s timeout · 3 retries, exponential backoff + jitter · circuit breaker —
    docs/DATASETS_AND_APIS.md's resilience defaults, applied uniformly."""
    if breaker.is_open():
        raise AdapterError(f"circuit open — too many recent failures for {fn!r}")

    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            async with asyncio.timeout(timeout_seconds):
                result = await fn()
            breaker.record_success()
            return result
        except Exception as exc:  # deliberately broad: this *is* the resilience boundary
            last_exc = exc
            breaker.record_failure()
            if attempt < retries - 1:
                backoff = (2**attempt) + random.uniform(0, 1)
                await asyncio.sleep(backoff)
    raise AdapterError(f"exhausted {retries} retries: {last_exc}") from last_exc
