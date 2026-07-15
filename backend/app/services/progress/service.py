import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.progress.schemas import ProgressSummaryRead, ScoreTrendPoint
from app.services.scores import service as scores_service


async def get_progress_summary(
    db: AsyncSession, user_id: str, days: int = 30
) -> ProgressSummaryRead:
    """Minimal M1 slice of Progress Tracking (docs/ARCHITECTURE.md §4 #8) — just the
    dashboard's mini-chart, WIREFRAMES.md screen 3's `/progress/me/summary`. The full
    Progress screen (before/after photos, Mongo `progress_logs`, weekly milestones —
    WIREFRAMES.md screen 7) is separate, larger scope and isn't built here."""
    scores = await scores_service.get_recent_scores(db, user_id, days=days)
    return ProgressSummaryRead(
        points=[
            ScoreTrendPoint(
                date=score.calculated_at.date() if score.calculated_at else datetime.date.today(),
                overall_score=score.overall_score,
            )
            for score in scores
        ]
    )
