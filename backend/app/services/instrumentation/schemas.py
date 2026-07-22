from pydantic import BaseModel, Field


class DashboardTtiReport(BaseModel):
    """A real, browser-measured Time-To-Interactive sample (M3-G,
    ARCHITECTURE.md §9's "dashboard load" metric) — never a value this backend
    invents. `le=60_000` is a sanity bound (a minute), not a real page ever takes
    that long; guards the rolling store against a corrupt client payload skewing
    every percentile."""

    duration_ms: float = Field(gt=0, le=60_000)
