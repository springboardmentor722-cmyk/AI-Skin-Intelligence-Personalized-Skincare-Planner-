"""app/ai/trend.py — deterministic linear-trend + moving-average insight
(milestone_3.md §M3-E), not ML. Pure math on fixed fixtures, same "no stub/real
split" reasoning as app/ai/recommender.py: no cost tradeoff to gate behind AI_IMPL."""

import datetime

from app.ai.trend import RealProgressTrendAnalyzer

_D = datetime.date


def _dates(count: int, start: datetime.date = _D(2026, 1, 1)) -> list[datetime.date]:
    return [start + datetime.timedelta(days=7 * i) for i in range(count)]


def test_returns_none_for_fewer_than_two_points() -> None:
    analyzer = RealProgressTrendAnalyzer()
    assert analyzer.analyze([]) is None
    assert analyzer.analyze([(_D(2026, 1, 1), 70.0)]) is None


def test_a_clean_upward_line_is_improving_with_high_confidence() -> None:
    analyzer = RealProgressTrendAnalyzer()
    series = list(zip(_dates(5), [60.0, 65.0, 70.0, 75.0, 80.0], strict=True))

    insight = analyzer.analyze(series)

    assert insight is not None
    assert insight.direction == "improving"
    assert insight.magnitude > 0
    assert insight.confidence > 0.9  # a perfect line has R^2 == 1


def test_a_clean_downward_line_is_declining() -> None:
    analyzer = RealProgressTrendAnalyzer()
    series = list(zip(_dates(5), [80.0, 75.0, 70.0, 65.0, 60.0], strict=True))

    insight = analyzer.analyze(series)

    assert insight is not None
    assert insight.direction == "declining"
    assert insight.magnitude < 0


def test_a_flat_series_is_stable() -> None:
    analyzer = RealProgressTrendAnalyzer()
    series = list(zip(_dates(5), [75.0, 75.0, 75.0, 75.0, 75.0], strict=True))

    insight = analyzer.analyze(series)

    assert insight is not None
    assert insight.direction == "stable"
    assert abs(insight.magnitude) < 0.01


def test_a_noisy_series_gets_low_confidence() -> None:
    analyzer = RealProgressTrendAnalyzer()
    series = list(zip(_dates(6), [70.0, 40.0, 85.0, 30.0, 90.0, 20.0], strict=True))

    insight = analyzer.analyze(series)

    assert insight is not None
    assert insight.confidence < 0.6  # milestone_3.md's own UI-warning threshold


def test_every_insight_carries_a_human_readable_summary() -> None:
    analyzer = RealProgressTrendAnalyzer()
    series = list(zip(_dates(3), [60.0, 70.0, 80.0], strict=True))

    insight = analyzer.analyze(series)

    assert insight is not None
    assert insight.summary
