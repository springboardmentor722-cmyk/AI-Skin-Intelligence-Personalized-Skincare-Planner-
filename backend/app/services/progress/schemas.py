import datetime

from pydantic import BaseModel


class ScoreTrendPoint(BaseModel):
    date: datetime.date
    overall_score: float | None


class ProgressSummaryRead(BaseModel):
    points: list[ScoreTrendPoint]
