from typing import Annotated, Any

from fastapi import APIRouter, Depends, status

from app.core.metrics import record_latency
from app.core.security import require_user
from app.services.instrumentation.schemas import DashboardTtiReport

router = APIRouter(prefix="/instrumentation")


@router.post("/dashboard-tti", status_code=status.HTTP_204_NO_CONTENT)
async def report_dashboard_tti(
    body: DashboardTtiReport,
    # Any signed-in identity — every one of the four roles has its own
    # dashboard (ARCHITECTURE.md §9), this isn't a `user`-role-only surface.
    _identity: Annotated[dict[str, Any], Depends(require_user)],
) -> None:
    await record_latency("dashboard_tti", body.duration_ms)
