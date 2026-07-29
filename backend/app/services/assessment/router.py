from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.assessment import service
from app.services.assessment.schemas import AssessmentSubmitRequest, AssessmentSubmitResponse
from app.services.assessment.service import AssessmentValidationError

router = APIRouter()


# Milestone 2 P9 (MILESTONE 2.docx "4. Core Backend API Endpoints") — validates the
# survey payload, syncs the real skin profile + today's lifestyle log (Skin Profile
# service, AGENTS.md §2 rule 4), computes a real score, and persists an immutable
# raw snapshot. Router stays thin — all of that lives in service.submit_assessment.
@router.post("/assessment/submit")
async def submit_assessment(
    payload: AssessmentSubmitRequest,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AssessmentSubmitResponse:
    try:
        return await service.submit_assessment(db, user["id"], payload)
    except AssessmentValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=exc.errors) from exc
