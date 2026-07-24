from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.scores import service
from app.services.scores.schemas import ScoreRead

router = APIRouter()


# mile_2.docx Step 3.2 / Step 2.1 name GET /api/v1/assessment/score and
# POST /api/v1/assessment/evaluate as the canonical routes — both map to the same
# "recompute the score for the current user's already-saved profile" behavior (this
# app has no separate submit-a-whole-profile-inline endpoint; the Skin Profile
# service already owns profile writes, per MASTER_PROMPT.md Phase 1.3).
@router.get("/assessment/score")
@router.post("/assessment/evaluate")
async def get_my_score(
    # Skin Health Scoring is a `user`-role feature (ARCHITECTURE.md §2) — consultant/
    # dermatologist/admin accounts have no skin profile of their own to score.
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScoreRead:
    try:
        return await service.compute_and_store_score(db, user["id"])
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


# Milestone 2 P10 — MILESTONE 2.docx §2's by-id read: "Returns overall health
# score (0-100) and individual sub-scores". Ownership-checked (service.py's
# get_score_by_id filters by user_id in the query itself) — a score_id belonging
# to another user 404s exactly like an unknown one, never leaking existence.
@router.get("/assessment/score/{score_id}")
async def get_score_by_id(
    score_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScoreRead:
    result = await service.get_score_by_id(db, user["id"], score_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Score not found")
    return result
