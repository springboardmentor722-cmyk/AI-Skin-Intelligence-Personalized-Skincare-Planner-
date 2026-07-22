from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.mongo import get_mongo_db
from app.db.postgres import get_db
from app.services.analytics import service
from app.services.analytics.schemas import AnalyticsAdminRead, AnalyticsMeRead

router = APIRouter(prefix="/analytics")


@router.get("/me")
async def get_my_analytics(
    # Insights is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: Annotated[int, Query(ge=1, le=365)] = 90,
) -> AnalyticsMeRead:
    return await service.get_my_analytics(db, user["id"], days=days)


@router.get("/admin")
async def get_admin_analytics(
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnalyticsAdminRead:
    return await service.get_admin_analytics(db, get_mongo_db())
