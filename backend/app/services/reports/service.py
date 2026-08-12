import datetime
import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import build_key, upload
from app.services.analytics.service import get_my_analytics
from app.services.recommendations.service import get_recommendations
from app.services.reports.models import ProgressReport, ReportSchedule
from app.services.reports.schemas import ReportScheduleCreate, ReportScheduleUpdate, ReportType
from app.services.routines.service import get_or_generate_routines
from app.services.scores.service import get_latest_score
from app.services.skin_profile.models import SkinType
from app.services.skin_profile.service import get_current_profile

_STYLES = getSampleStyleSheet()


async def _profile_header_flowables(db: AsyncSession, user_id: str) -> list[Any]:
    profile = await get_current_profile(db, user_id)
    if profile is None:
        return []
    skin_type_name = "Unknown"
    result = await db.execute(
        select(SkinType.skin_type_name).where(SkinType.skin_type_id == profile.skin_type_id)
    )
    row = result.scalar_one_or_none()
    if row:
        skin_type_name = row
    generated_on = datetime.datetime.now(datetime.UTC).strftime("%B %d, %Y")
    return [
        Paragraph(f"Skin type: {skin_type_name}", _STYLES["Normal"]),
        Paragraph(f"Generated on: {generated_on}", _STYLES["Normal"]),
        Spacer(1, 12),
    ]


async def _assessment_flowables(db: AsyncSession, user_id: str) -> tuple[list[Any], str]:
    score = await get_latest_score(db, user_id)
    if score is None:
        return (
            [Paragraph("No skin assessment recorded yet.", _STYLES["Normal"])],
            "No assessment data available.",
        )
    rows = [
        ["Metric", "Score"],
        ["Skin Condition (35%)", f"{score.skin_condition_score or 0:.1f}"],
        ["Lifestyle (20%)", f"{score.lifestyle_score or 0:.1f}"],
        ["Routine Adherence (20%)", f"{score.routine_adherence_score or 0:.1f}"],
        ["Sleep Quality (15%)", f"{score.sleep_quality_score or 0:.1f}"],
        ["Hydration (10%)", f"{score.hydration_score or 0:.1f}"],
        ["Overall Score", f"{score.overall_score or 0:.1f}"],
    ]
    table = Table(rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
            ]
        )
    )
    summary = f"Overall skin health score: {score.overall_score or 0:.1f}/100."
    return ([Paragraph("Skin Assessment", _STYLES["Heading1"]), Spacer(1, 8), table], summary)


async def _progress_flowables(db: AsyncSession, user_id: str) -> tuple[list[Any], str]:
    analytics = await get_my_analytics(db, user_id, days=90)
    rows = [["Window", "Compliance %"]]
    rows.append(["7-day", f"{analytics.compliance.seven_day or 0:.0f}%"])
    rows.append(["30-day", f"{analytics.compliance.thirty_day or 0:.0f}%"])
    rows.append(["90-day", f"{analytics.compliance.ninety_day or 0:.0f}%"])
    table = Table(rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    summary = f"30-day routine compliance: {analytics.compliance.thirty_day or 0:.0f}%."
    return ([Paragraph("Progress Report", _STYLES["Heading1"]), Spacer(1, 8), table], summary)


async def _routine_flowables(db: AsyncSession, user_id: str) -> tuple[list[Any], str]:
    routines = await get_or_generate_routines(db, user_id)
    recs = await get_recommendations(db, user_id)
    flowables: list[Any] = [
        Paragraph("Routine & Recommendations", _STYLES["Heading1"]),
        Spacer(1, 8),
    ]
    for routine in routines:
        flowables.append(
            Paragraph(
                routine.routine_name or routine.routine_type or "Routine", _STYLES["Heading2"]
            )
        )
        for step in routine.steps:
            flowables.append(Paragraph(f"- {step.step_name or 'Step'}", _STYLES["Normal"]))
        flowables.append(Spacer(1, 8))
    if recs:
        flowables.append(Paragraph("Recommended Products", _STYLES["Heading2"]))
        for rec in recs[:5]:
            flowables.append(
                Paragraph(
                    f"- {rec.product.product_name or 'Product'} ({rec.match_percentage}% match)",
                    _STYLES["Normal"],
                )
            )
    summary = f"{len(routines)} routine(s), {len(recs)} recommendation(s)."
    return (flowables, summary)


_SECTION_BUILDERS = {
    "assessment": _assessment_flowables,
    "progress": _progress_flowables,
    "routine": _routine_flowables,
}


async def generate_report(
    db: AsyncSession, user_id: str, report_type: ReportType, *, include_profile_header: bool
) -> ProgressReport:
    builder = _SECTION_BUILDERS.get(report_type)
    if builder is None:
        raise ValueError(f"Unknown report_type: {report_type!r}")

    flowables: list[Any] = []
    if include_profile_header:
        flowables.extend(await _profile_header_flowables(db, user_id))

    section_flowables, summary = await builder(db, user_id)
    flowables.extend(section_flowables)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    doc.build(flowables)
    pdf_bytes = buffer.getvalue()

    key = build_key(prefix="reports", owner_user_id=user_id, filename=f"{report_type}.pdf")
    await upload(key, pdf_bytes, allowed_content_types={"application/pdf"})

    report = ProgressReport(
        user_id=user_id, report_type=report_type, summary=summary, report_url=key
    )
    db.add(report)
    await db.commit()
    return report


async def list_my_schedules(db: AsyncSession, user_id: str) -> list[ReportSchedule]:
    result = await db.execute(select(ReportSchedule).where(ReportSchedule.user_id == user_id))
    return list(result.scalars().all())


async def create_schedule(
    db: AsyncSession, user_id: str, data: ReportScheduleCreate
) -> ReportSchedule:
    schedule = ReportSchedule(user_id=user_id, **data.model_dump())
    db.add(schedule)
    await db.commit()
    return schedule


async def _get_owned_schedule(db: AsyncSession, user_id: str, schedule_id: int) -> ReportSchedule:
    result = await db.execute(
        select(ReportSchedule).where(
            ReportSchedule.schedule_id == schedule_id, ReportSchedule.user_id == user_id
        )
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        raise ValueError(f"Report schedule {schedule_id} not found for this user")
    return schedule


async def update_schedule(
    db: AsyncSession, user_id: str, schedule_id: int, data: ReportScheduleUpdate
) -> ReportSchedule:
    schedule = await _get_owned_schedule(db, user_id, schedule_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    await db.commit()
    return schedule


async def delete_schedule(db: AsyncSession, user_id: str, schedule_id: int) -> None:
    schedule = await _get_owned_schedule(db, user_id, schedule_id)
    await db.delete(schedule)
    await db.commit()
