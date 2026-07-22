import datetime
from typing import Literal

from app.ai.schemas import TrendInsight

_STABLE_EPSILON = 0.01  # points/day — below this, call it "stable" rather than a rounding artifact
_LOW_CONFIDENCE_THRESHOLD = 0.6  # milestone_3.md §8's own UI-warning threshold


class RealProgressTrendAnalyzer:
    """Deterministic linear-trend (ordinary least squares) over the series' values
    against day-offset from the first point — see app/ai/schemas.py's
    `ProgressTrendAnalyzer` Protocol docstring for why this has no stub/real split.
    `confidence` is R², a standard measure of how well a straight line explains the
    data — a genuinely noisy series honestly gets low confidence, never a
    fabricated one."""

    def analyze(
        self, series: list[tuple[datetime.date, float]]
    ) -> TrendInsight | None:
        if len(series) < 2:
            return None

        first_date = series[0][0]
        xs = [(date - first_date).days for date, _ in series]
        ys = [value for _, value in series]
        n = len(series)

        mean_x = sum(xs) / n
        mean_y = sum(ys) / n
        ss_xy = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=True))
        ss_xx = sum((x - mean_x) ** 2 for x in xs)
        ss_yy = sum((y - mean_y) ** 2 for y in ys)

        slope = ss_xy / ss_xx if ss_xx else 0.0
        # R^2 — 1.0 when every point sits exactly on the fitted line, 0.0 when the
        # line explains none of the variance. A flat series (ss_yy == 0) is a
        # perfect fit by definition (the "line" is just the constant itself).
        r_squared = 1.0 if ss_yy == 0 else max(0.0, min(1.0, (ss_xy**2) / (ss_xx * ss_yy)))

        magnitude = round(slope * 7, 2)  # points per week — the unit the UI shows
        direction: Literal["improving", "declining", "stable"]
        if abs(slope) < _STABLE_EPSILON:
            direction = "stable"
        elif slope > 0:
            direction = "improving"
        else:
            direction = "declining"

        summary = self._summarize(direction, magnitude, r_squared)
        return TrendInsight(
            direction=direction,
            magnitude=magnitude,
            confidence=round(r_squared, 2),
            summary=summary,
        )

    def _summarize(self, direction: str, magnitude: float, confidence: float) -> str:
        if confidence < _LOW_CONFIDENCE_THRESHOLD:
            return "Not enough of a consistent pattern yet to call a clear trend."
        if direction == "stable":
            return "Holding steady over this period."
        verb = "improving" if direction == "improving" else "declining"
        return f"Trending {verb} by about {abs(magnitude):.1f} points/week."
