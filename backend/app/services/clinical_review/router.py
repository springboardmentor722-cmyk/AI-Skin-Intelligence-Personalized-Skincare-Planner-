from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_verified_professional
from app.db.postgres import get_db
from app.services.analytics import service as analytics_service
from app.services.analytics.schemas import AnalyticsMeRead
from app.services.clinical_review import service
from app.services.clinical_review.schemas import (
    ClientDetailRead,
    ClientListPage,
    ClientListPageMeta,
    ClientScoreRead,
    ClinicalPortfolioStatsRead,
    ConsultantNoteCreate,
    ConsultantNoteListPage,
    ConsultantNoteListPageMeta,
    ConsultantNoteRead,
)
from app.services.progress import service as progress_service
from app.services.progress.schemas import ProgressPhotosRead
from app.services.recommendations.schemas import ProductRead
from app.services.routines.schemas import RoutineRead, StepCreate, StepUpdate
from app.services.routines.service import UnsafeProductError
from app.services.scores.schemas import ScoreRead

router = APIRouter()

# require_verified_professional already composes require_role internally (it takes
# a `user: dict = Depends(require_role(*roles))` of its own) — this is that
# dependency's first real consumer (core/security.py's own docstring: "Gates
# *operational* consultant/dermatologist endpoints (M2+)").
_professional = require_verified_professional("consultant", "dermatologist")


@router.get("/clients/me")
async def get_my_clients(
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    q: str | None = Query(default=None),
) -> ClientListPage:
    items, total = await service.list_my_clients(
        db, professional["id"], page=page, page_size=page_size, search=q
    )
    return ClientListPage(
        items=items, meta=ClientListPageMeta(page=page, page_size=page_size, total=total)
    )


@router.get("/clients/me/portfolio-stats")
async def get_my_portfolio_stats(
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClinicalPortfolioStatsRead:
    return await service.get_portfolio_stats(db, professional["id"])


@router.get("/clients/{user_id}")
async def get_client(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClientDetailRead:
    try:
        return await service.get_client_detail(db, professional["id"], user_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/clients/{user_id}/analytics")
async def get_client_analytics(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnalyticsMeRead:
    try:
        await service.verify_assignment(db, professional["id"], user_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await analytics_service.get_my_analytics(db, user_id)


@router.get("/clients/{user_id}/photos")
async def get_client_photos(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProgressPhotosRead:
    try:
        await service.verify_assignment(db, professional["id"], user_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await progress_service.get_progress_photos(db, user_id)


@router.get("/clients/{user_id}/assessments")
async def get_client_assessments(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(default=365, ge=1, le=1825),
) -> list[ClientScoreRead]:
    try:
        return await service.list_client_assessments(db, professional["id"], user_id, days=days)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/clients/{user_id}/assessments/{score_id}")
async def get_client_assessment_detail(
    user_id: str,
    score_id: int,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScoreRead:
    try:
        return await service.get_client_assessment_detail(db, professional["id"], user_id, score_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/clients/{user_id}/notes")
async def get_client_notes(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ConsultantNoteListPage:
    try:
        items, total = await service.list_notes(
            db, professional["id"], user_id, page=page, page_size=page_size
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return ConsultantNoteListPage(
        items=items, meta=ConsultantNoteListPageMeta(page=page, page_size=page_size, total=total)
    )


@router.post("/clients/{user_id}/notes")
async def add_client_note(
    user_id: str,
    body: ConsultantNoteCreate,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConsultantNoteRead:
    try:
        return await service.add_note(db, professional["id"], user_id, body.note_text)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


# --- Routine-overwrite (M3R Phase 5 Task 4) ---
# Assignment-gated wrappers around routines/service.py's real single-writer
# mutation functions (via clinical_review/service.py's thin delegation layer) —
# mirrors routines/router.py's own request/response/error shapes exactly, just
# professional-scoped. Each successful mutation also writes an audit-log row
# (service.py) before the professional sees the updated routine.


@router.get("/clients/{user_id}/routines/products/search")
async def search_client_products(
    user_id: str,
    category: str,
    q: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ProductRead]:
    try:
        return await service.search_client_products(db, professional["id"], user_id, category, q)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.post("/clients/{user_id}/routines/{routine_id}/steps")
async def add_client_routine_step(
    user_id: str,
    routine_id: int,
    body: StepCreate,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.add_client_routine_step(
            db, professional["id"], user_id, routine_id, body.step_name, body.product_id
        )
    except UnsafeProductError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.patch("/clients/{user_id}/routines/steps/{step_id}")
async def update_client_routine_step(
    user_id: str,
    step_id: int,
    body: StepUpdate,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.update_client_routine_step(
            db,
            professional["id"],
            user_id,
            step_id,
            body.step_name,
            body.product_id,
            body.usage_notes,
        )
    except UnsafeProductError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.delete("/clients/{user_id}/routines/steps/{step_id}")
async def delete_client_routine_step(
    user_id: str,
    step_id: int,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.delete_client_routine_step(db, professional["id"], user_id, step_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
