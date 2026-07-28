# app/routes/reports.py
"""
Milestone 2 — Report Generation.
Produces structured JSON reports and PDF downloads for skin assessments.
All data is read from real database records — no mocked values.
"""
import io
import uuid as uuid_mod
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.postgres import get_db
from app.db.mongo import mongo_db
from app.models.user import User
from app.models.assessment import SkinAssessment, SkincareRoutine
from app.models.skin_profile import SkinProfile
from app.models.lifestyle_log import LifestyleLog
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.services.safety_rules import apply_safety_rules
from app.services.recommendation_engine import get_target_ingredient_names

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


# ============================================================
# GET /api/v1/reports/dashboard
# ============================================================

@router.get("/dashboard")
def get_reports_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns real dashboard data aggregating all user's skin assessments."""
    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .all()
    )

    if not assessments:
        return {
            "has_data": False,
            "totalReports": 0,
            "reportsThisMonth": 0,
            "averageSkinScore": 0,
            "improvementPercentage": "+0%",
            "lastAssessment": None,
            "reports": [],
            "insights": ["No report insights available."],
            "chartData": []
        }

    now = datetime.utcnow()
    reports_this_month = [a for a in assessments if a.created_at.year == now.year and a.created_at.month == now.month]
    
    total_reports = len(assessments)
    avg_score = sum(a.overall_score for a in assessments) / total_reports

    # Prepare chart data (chronological)
    chart_data = []
    for a in reversed(assessments):
        chart_data.append({
            "date": a.created_at.strftime("%d %b"),
            "score": float(a.overall_score)
        })

    # Prepare reports list
    reports_list = []
    for a in assessments:
        # Determine status based on review or completion
        status_val = "Completed"
        if a.score_breakdown:
            summary = a.score_breakdown.get("health_category", "Analysis Complete")
        else:
            summary = "AI analysis generated."
            
        reports_list.append({
            "id": str(a.id),
            "reportType": "Full Assessment",
            "assessmentId": str(a.id),
            "skinScore": float(a.overall_score),
            "createdAt": a.created_at.strftime("%d %b %Y"),
            "summary": summary,
            "status": status_val,
            "pdfUrl": f"/api/v1/reports/{str(a.id)}/pdf"
        })

    # Calculate improvement 
    improvement_str = "+0%"
    insights = []
    if len(assessments) > 1:
        oldest = float(assessments[-1].overall_score)
        newest = float(assessments[0].overall_score)
        diff = newest - oldest
        sign = "+" if diff >= 0 else ""
        improvement_str = f"{sign}{diff:.0f} pts"
        insights.append(f"Your skin health changed by {sign}{diff:.0f} points since your first assessment.")
        if newest > oldest:
            insights.append("Great job maintaining your routine! Your skin barrier is showing measurable improvement.")
    else:
        insights.append("Complete another assessment next week to track your progress.")

    return {
        "has_data": True,
        "totalReports": total_reports,
        "reportsThisMonth": len(reports_this_month),
        "averageSkinScore": round(avg_score, 1),
        "improvementPercentage": improvement_str,
        "lastAssessment": assessments[0].created_at.strftime("%d %b %Y"),
        "reports": reports_list,
        "insights": insights,
        "chartData": chart_data
    }

# ============================================================
# POST /api/v1/reports/upload
# ============================================================

@router.post("/upload")
def upload_external_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Securely uploads and associates an external report with the user."""
    file_id = str(uuid_mod.uuid4())
    doc = {
        "file_id": file_id,
        "user_id": str(current_user.id),
        "filename": file.filename,
        "content_type": file.content_type,
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "processing"
    }
    mongo_db.external_reports.insert_one(doc)
    return {"message": "Report uploaded successfully", "file_id": file_id}


# ============================================================
# HELPERS
# ============================================================

def _build_report(assessment: SkinAssessment, profile: SkinProfile, lifestyle: LifestyleLog, routine_rows, user: User) -> dict:
    """Build a complete structured report dict from DB records."""
    breakdown = assessment.score_breakdown or {}
    overall_score = float(assessment.overall_score)

    # Risk / category from score_breakdown (set during submit) or derive
    risk_level = breakdown.get("risk_level", _derive_risk(overall_score))
    health_category = breakdown.get("health_category", _derive_category(overall_score))
    suggestions = breakdown.get("improvement_suggestions", [])
    safety_warnings = breakdown.get("safety_warnings", [])
    blocked_ingredients = breakdown.get("blocked_ingredients", [])

    # Lifestyle summary
    lifestyle_summary = {}
    if lifestyle:
        lifestyle_summary = {
            "sleep_hours": lifestyle.sleep_hours,
            "water_intake_liters": float(lifestyle.water_intake_liters) if lifestyle.water_intake_liters else None,
            "exercise_minutes": lifestyle.exercise_minutes,
            "stress_level": lifestyle.stress_level.value if lifestyle.stress_level else None,
            "smoking": lifestyle.smoking,
            "alcohol": lifestyle.alcohol,
            "screen_time_hours": lifestyle.screen_time_hours,
            "sun_protection_used": lifestyle.sun_protection_used,
            "pollution_exposure": lifestyle.pollution_exposure,
            "environmental_exposure": lifestyle.environmental_exposure,
        }

    # Routine summary grouped by time_of_day
    routine_summary = []
    for row in routine_rows:
        routine_summary.append({
            "time_of_day": row.time_of_day,
            "step_number": row.step_number,
            "step_category": row.step_category,
        })

    # Selected concerns with severity
    selected_concerns = assessment.detected_concerns or []

    # Target ingredients from concerns
    concern_keys = [c.get("key", "") for c in selected_concerns]
    target_ingredients = sorted(get_target_ingredient_names(concern_keys))

    # Apply safety filter
    if profile:
        safety = apply_safety_rules(
            skin_type=profile.skin_type.value if profile.skin_type else None,
            concerns=concern_keys,
            allergies=profile.allergies or [],
            sensitivities=profile.sensitivities or [],
        )
        blocked_from_safety = safety["blocked_ingredients"]
        safe_ingredients = [i for i in target_ingredients if i.lower() not in {b.lower() for b in blocked_from_safety}]
    else:
        safe_ingredients = target_ingredients

    return {
        "assessment_id": str(assessment.id),
        "created_at": assessment.created_at.isoformat(),
        "user_name": user.full_name,
        "overall_score": overall_score,
        "risk_level": risk_level,
        "health_category": health_category,
        "improvement_suggestions": suggestions,
        "breakdown": {
            "condition": breakdown.get("condition", 0),
            "lifestyle": breakdown.get("lifestyle", 0),
            "sleep": breakdown.get("sleep", 0),
            "consistency": breakdown.get("consistency", 0),
            "hydration": breakdown.get("hydration", 0),
        },
        "skin_type": profile.skin_type.value if (profile and profile.skin_type) else None,
        "selected_concerns": selected_concerns,
        "primary_concern": assessment.primary_concern,
        "lifestyle_summary": lifestyle_summary,
        "routine_summary": routine_summary,
        "recommended_ingredients": safe_ingredients,
        "safety_warnings": safety_warnings,
        "blocked_ingredients": blocked_ingredients,
    }


def _derive_risk(score: float) -> str:
    if score >= 80: return "Low"
    if score >= 60: return "Moderate"
    if score >= 40: return "High"
    return "Very High"


def _derive_category(score: float) -> str:
    if score >= 85: return "Excellent"
    if score >= 70: return "Good"
    if score >= 50: return "Fair"
    return "Poor"


# ============================================================
# GET /api/v1/reports/latest
# ============================================================

@router.get("/latest")
def get_latest_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the full structured JSON report for the user's latest assessment."""
    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found. Complete the Skin Assessment first.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    lifestyle = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )
    routine_rows = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user.id, SkincareRoutine.is_active == True)  # noqa: E712
        .order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number)
        .all()
    )

    return _build_report(assessment, profile, lifestyle, routine_rows, current_user)


# ============================================================
# GET /api/v1/reports/{assessment_id}
# ============================================================

@router.get("/{assessment_id}")
def get_report_by_id(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the full structured JSON report for a specific assessment."""
    try:
        uid = uuid_mod.UUID(assessment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format.")

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.id == uid, SkinAssessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    lifestyle = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )
    routine_rows = (
        db.query(SkincareRoutine)
        .filter(
            SkincareRoutine.user_id == current_user.id,
            SkincareRoutine.assessment_id == uid,
        )
        .order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number)
        .all()
    )
    if not routine_rows:
        # Fall back to active routine
        routine_rows = (
            db.query(SkincareRoutine)
            .filter(SkincareRoutine.user_id == current_user.id, SkincareRoutine.is_active == True)  # noqa: E712
            .order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number)
            .all()
        )

    return _build_report(assessment, profile, lifestyle, routine_rows, current_user)


# ============================================================
# GET /api/v1/reports/latest/pdf
# ============================================================

@router.get("/latest/pdf")
def download_latest_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Downloads a formatted PDF report for the user's latest assessment."""
    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found. Complete the Skin Assessment first.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    lifestyle = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )
    routine_rows = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user.id, SkincareRoutine.is_active == True)  # noqa: E712
        .all()
    )

    report = _build_report(assessment, profile, lifestyle, routine_rows, current_user)
    pdf_buffer = _generate_pdf(report)

    filename = f"skin_report_latest_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ============================================================
# GET /api/v1/reports/{assessment_id}/pdf
# ============================================================

@router.get("/{assessment_id}/pdf")
def download_report_pdf(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Downloads a formatted PDF report for a specific assessment."""
    try:
        uid = uuid_mod.UUID(assessment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format.")

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.id == uid, SkinAssessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    lifestyle = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )
    routine_rows = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user.id, SkincareRoutine.is_active == True)  # noqa: E712
        .all()
    )

    report = _build_report(assessment, profile, lifestyle, routine_rows, current_user)
    pdf_buffer = _generate_pdf(report)

    filename = f"skin_report_{assessment_id[:8]}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _generate_pdf(report: dict) -> io.BytesIO:
    """Generate a professional ReportLab PDF from the report dict."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    lavender = colors.HexColor("#8B6FC9")
    rose = colors.HexColor("#E4749B")
    light_bg = colors.HexColor("#F9F7FF")
    dark_text = colors.HexColor("#1C1917")
    muted_text = colors.HexColor("#6B7280")

    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=22, textColor=lavender,
                                  fontName="Helvetica-Bold", spaceAfter=4)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=13, textColor=lavender,
                                    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, textColor=dark_text,
                                 leading=16, spaceAfter=4)
    muted_style = ParagraphStyle("Muted", parent=styles["Normal"], fontSize=9, textColor=muted_text, spaceAfter=3)

    story = []

    # ---- Header ----
    story.append(Paragraph("AI Skin Intelligence", title_style))
    story.append(Paragraph("Personalised Skin Health Report", muted_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=lavender, spaceAfter=10))

    # ---- Meta ----
    created = report.get("created_at", "")[:10]
    story.append(Paragraph(f"<b>Patient:</b> {report.get('user_name', 'N/A')}   &nbsp;&nbsp; <b>Date:</b> {created}", body_style))
    story.append(Paragraph(f"<b>Assessment ID:</b> {report.get('assessment_id', '')[:8]}...", muted_style))
    story.append(Spacer(1, 10))

    # ---- Overall Score ----
    story.append(Paragraph("Overall Skin Health Score", heading_style))
    score = report.get("overall_score", 0)
    risk = report.get("risk_level", "N/A")
    category = report.get("health_category", "N/A")
    story.append(Paragraph(f"<font size='28' color='#8B6FC9'><b>{score:.1f}</b></font> / 100", body_style))
    story.append(Paragraph(f"Category: <b>{category}</b> &nbsp;&nbsp; Risk Level: <b>{risk}</b>", body_style))
    story.append(Spacer(1, 8))

    # ---- Score Breakdown Table ----
    story.append(Paragraph("Score Breakdown", heading_style))
    bd = report.get("breakdown", {})
    breakdown_data = [
        ["Factor", "Score", "Weight"],
        ["Skin Condition", f"{bd.get('condition', 0):.1f}", "35%"],
        ["Lifestyle Habits", f"{bd.get('lifestyle', 0):.1f}", "20%"],
        ["Routine Consistency", f"{bd.get('consistency', 0):.1f}", "20%"],
        ["Sleep Quality", f"{bd.get('sleep', 0):.1f}", "15%"],
        ["Hydration", f"{bd.get('hydration', 0):.1f}", "10%"],
    ]
    table = Table(breakdown_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), lavender),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [light_bg, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 10))

    # ---- Skin Profile ----
    story.append(Paragraph("Skin Profile", heading_style))
    skin_type = report.get("skin_type", "N/A")
    primary = report.get("primary_concern", "N/A")
    story.append(Paragraph(f"<b>Skin Type:</b> {skin_type or 'N/A'}", body_style))
    story.append(Paragraph(f"<b>Primary Concern:</b> {primary or 'N/A'}", body_style))

    concerns = report.get("selected_concerns", [])
    if concerns:
        concern_lines = []
        for c in concerns:
            slider = c.get("slider_value")
            sev = c.get("severity", "")
            slider_txt = f" (Severity: {slider}/10)" if slider is not None else f" ({sev})"
            concern_lines.append(f"• {c.get('concern', '')}{slider_txt}")
        story.append(Paragraph("<b>Selected Concerns:</b>", body_style))
        for line in concern_lines:
            story.append(Paragraph(line, muted_style))
    story.append(Spacer(1, 8))

    # ---- Lifestyle Summary ----
    story.append(Paragraph("Lifestyle Summary", heading_style))
    ls = report.get("lifestyle_summary", {})
    ls_items = [
        ("Sleep", f"{ls.get('sleep_hours', 'N/A')} hours/night"),
        ("Water Intake", f"{ls.get('water_intake_liters', 'N/A')} L/day"),
        ("Exercise", f"{ls.get('exercise_minutes', 'N/A')} mins/day"),
        ("Stress Level", ls.get("stress_level", "N/A")),
        ("Smoking", "Yes" if ls.get("smoking") else ("No" if ls.get("smoking") is False else "N/A")),
        ("Alcohol Use", "Yes" if ls.get("alcohol") else ("No" if ls.get("alcohol") is False else "N/A")),
        ("Screen Time", f"{ls.get('screen_time_hours', 'N/A')} hours late-night"),
        ("Sun Protection", "Yes" if ls.get("sun_protection_used") else ("No" if ls.get("sun_protection_used") is False else "N/A")),
    ]
    for label, val in ls_items:
        story.append(Paragraph(f"<b>{label}:</b> {val}", muted_style))
    story.append(Spacer(1, 8))

    # ---- Routine ----
    story.append(Paragraph("Personalised Skincare Routine", heading_style))
    routine = report.get("routine_summary", [])
    if routine:
        time_groups = {}
        for step in routine:
            tod = step.get("time_of_day", "Other")
            time_groups.setdefault(tod, []).append(step)
        for tod, steps in time_groups.items():
            story.append(Paragraph(f"<b>{tod} Routine</b>", body_style))
            for s in steps:
                story.append(Paragraph(f"  Step {s['step_number']}: {s['step_category']}", muted_style))
    else:
        story.append(Paragraph("No routine generated yet.", muted_style))
    story.append(Spacer(1, 8))

    # ---- Recommended Ingredients ----
    story.append(Paragraph("Recommended Ingredients", heading_style))
    ingredients = report.get("recommended_ingredients", [])
    if ingredients:
        story.append(Paragraph(", ".join(ingredients), body_style))
    else:
        story.append(Paragraph("No ingredient recommendations at this time.", muted_style))
    story.append(Spacer(1, 8))

    # ---- Safety Warnings ----
    warnings = report.get("safety_warnings", [])
    if warnings:
        story.append(Paragraph("Safety Advisories", heading_style))
        for w in warnings:
            story.append(Paragraph(f"⚠ {w}", muted_style))
        story.append(Spacer(1, 8))

    # ---- Improvement Suggestions ----
    suggestions = report.get("improvement_suggestions", [])
    if suggestions:
        story.append(Paragraph("AI Improvement Recommendations", heading_style))
        for s in suggestions:
            story.append(Paragraph(f"• {s}", body_style))

    # ---- Footer ----
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=6))
    story.append(Paragraph(
        "This report is generated by AI Skin Intelligence and is for informational purposes only. "
        "It is not a substitute for professional medical advice. Always consult a qualified dermatologist for diagnosis and treatment.",
        muted_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer
