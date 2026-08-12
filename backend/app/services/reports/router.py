from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.storage import FileValidationError, get_presigned_url
from app.db.postgres import get_db
from app.services.reports import service
from app.services.reports.models import ProgressReport
from app.services.reports.schemas import (
    ReportGenerateRequest,
    ReportRead,
    ReportScheduleCreate,
    ReportScheduleRead,
    ReportScheduleUpdate,
)

router = APIRouter()


@router.post("/reports/generate")
async def generate_my_report(
    body: ReportGenerateRequest,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportRead:
    # Spec: generation failure -> 422 with a message, no partial row (the DB write
    # only happens after a successful upload in generate_report, so "no partial row"
    # already holds by construction).
    try:
        report = await service.generate_report(
            db, user["id"], body.report_type, include_profile_header=body.include_profile_header
        )
    except FileValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    return ReportRead.model_validate(report)


@router.get("/reports")
async def list_my_reports(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReportRead]:
    result = await db.execute(
        select(ProgressReport)
        .where(ProgressReport.user_id == user["id"])
        .order_by(ProgressReport.generated_at.desc())
    )
    return [ReportRead.model_validate(r) for r in result.scalars().all()]


@router.get("/reports/{report_id}/download")
async def download_my_report(
    report_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    result = await db.execute(
        select(ProgressReport).where(
            ProgressReport.report_id == report_id, ProgressReport.user_id == user["id"]
        )
    )
    report = result.scalar_one_or_none()
    if report is None or report.report_url is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    url = await get_presigned_url(report.report_url)
    return {"url": url}


@router.get("/reports/schedules")
async def get_my_report_schedules(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReportScheduleRead]:
    rows = await service.list_my_schedules(db, user["id"])
    return [ReportScheduleRead.model_validate(r) for r in rows]


@router.post("/reports/schedules")
async def create_my_report_schedule(
    body: ReportScheduleCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportScheduleRead:
    created = await service.create_schedule(db, user["id"], body)
    return ReportScheduleRead.model_validate(created)


@router.patch("/reports/schedules/{schedule_id}")
async def update_my_report_schedule(
    schedule_id: int,
    body: ReportScheduleUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportScheduleRead:
    try:
        updated = await service.update_schedule(db, user["id"], schedule_id, body)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return ReportScheduleRead.model_validate(updated)


@router.delete("/reports/schedules/{schedule_id}", status_code=204)
async def delete_my_report_schedule(
    schedule_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await service.delete_schedule(db, user["id"], schedule_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
