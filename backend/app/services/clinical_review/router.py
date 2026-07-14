from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_verified_professional
from app.db.postgres import get_db
from app.services.clinical_review import service
from app.services.clinical_review.schemas import (
    ClientDetailRead,
    ClientListPage,
    ClientListPageMeta,
    ConsultantNoteCreate,
    ConsultantNoteListPage,
    ConsultantNoteListPageMeta,
    ConsultantNoteRead,
)

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
) -> ClientListPage:
    items, total = await service.list_my_clients(
        db, professional["id"], page=page, page_size=page_size
    )
    return ClientListPage(
        items=items, meta=ClientListPageMeta(page=page, page_size=page_size, total=total)
    )


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
