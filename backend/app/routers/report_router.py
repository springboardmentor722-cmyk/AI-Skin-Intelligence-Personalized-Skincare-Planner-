from datetime import date
from html import escape
from io import BytesIO
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.consultation import Consultation
from app.models.lifestyle import Lifestyle
from app.models.notification import Notification
from app.models.progress import Progress
from app.models.report import Report
from app.models.skin_profile import SkinProfile
from app.models.skin_assessment import SkinAssessment
from app.models.user import User
from app.schemas.report_schema import ReportCreate
from app.schemas.user_schema import UserResponse
from app.utils.auth import get_current_user
from app.services.notification_service import create_notification
from app.services.gemini_service import GeminiServiceError, get_gemini_service

router = APIRouter(prefix="/reports", tags=["Reports"])


def report_sent_event_key(report_id: int) -> str:
    return f"report-sent-{report_id}"

def assigned_consultation(db, consultation_id, professional_id):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.expert_id == professional_id).first()
    if not consultation: raise HTTPException(status_code=404, detail="Assigned consultation not found")
    return consultation

def authorize(report, user):
    if (user.role == "USER" and report.patient_id == user.id) or (user.role in {"CONSULTANT", "DERMATOLOGIST"} and report.dermatologist_id == user.id): return
    raise HTTPException(status_code=403, detail="You do not have access to this report")

def report_list(reports, db):
    result = []
    for report in reports:
        item = jsonable_encoder(report)
        professional = db.query(User).filter(User.id == report.dermatologist_id).first()
        item["dermatologist_name"] = professional.name if professional else None
        item["professional_name"] = professional.name if professional else None
        item["sent_to_user"] = db.query(Notification.id).filter(Notification.event_key == report_sent_event_key(report.report_id)).first() is not None
        result.append(item)
    return result

REPORT_DRAFT_FIELDS = (
    "patient_summary", "clinical_observations", "skin_assessment", "recommendations",
    "skincare_routine", "follow_up_instructions", "additional_notes",
)

REPORT_DRAFT_SCHEMA = {
    "type": "object",
    "properties": {field: {"type": "string"} for field in REPORT_DRAFT_FIELDS},
    "required": list(REPORT_DRAFT_FIELDS),
}


def report_draft_context(db, consultation):
    """Build a deliberately allow-listed, assignment-scoped prompt context."""
    patient = db.query(User).filter(User.id == consultation.user_id).first()
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == consultation.user_id).first()
    lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == consultation.user_id).first()
    progress = db.query(Progress).filter(Progress.user_id == consultation.user_id).order_by(Progress.assessment_date.desc(), Progress.progress_id.desc()).all()
    assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == consultation.user_id).order_by(SkinAssessment.assessment_date.desc(), SkinAssessment.assessment_id.desc()).first()
    consultant_review = (
        db.query(Consultation)
        .join(User, Consultation.expert_id == User.id)
        .filter(Consultation.user_id == consultation.user_id, User.role == "CONSULTANT")
        .order_by(Consultation.id.desc())
        .first()
    )
    return {
        "patient": {"name": patient.name if patient else None},
        "skin_profile": {key: getattr(profile, key, None) if profile else None for key in ("age", "gender", "skin_type", "skin_concerns", "allergies", "sensitivities")},
        "lifestyle": {key: str(getattr(lifestyle, key)) if lifestyle and getattr(lifestyle, key) is not None else None for key in ("sleep_duration", "water_intake", "exercise", "stress_level", "environmental_exposure")},
        "latest_ai_assessment": {key: getattr(assessment, key, None) if assessment else None for key in ("final_score", "risk_level", "primary_concerns", "condition_summary", "observations", "recommendations", "morning_routine", "night_routine", "ingredients_to_look_for", "ingredients_to_avoid")},
        "progress_history": [{"assessment_date": str(item.assessment_date), "skin_score": item.skin_score, "hydration_score": item.hydration_score, "acne_level": item.acne_level, "notes": item.notes} for item in progress],
        "consultant_review": {key: getattr(consultant_review, key, None) if consultant_review else None for key in ("recommendation", "consultant_notes", "progress_observations", "routine_suggestions", "follow_up_suggestion", "requires_dermatologist")},
    }


@router.post("/draft/{consultation_id}")
def generate_report_draft(consultation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate an unsaved, editable report draft for an assigned professional case."""
    if current_user.role not in {"CONSULTANT", "DERMATOLOGIST"}:
        raise HTTPException(status_code=403, detail="Professional access required")
    consultation = assigned_consultation(db, consultation_id, current_user.id)
    context = report_draft_context(db, consultation)
    prompt = """Create an editable professional consultation report DRAFT from only the JSON case data below.\n\nRules:\n- Use only supplied facts. Do not invent allergies, sensitivities, symptoms, diagnoses, medications, history, or patient details.\n- Do not contradict known allergies or sensitivities. If information is absent, state that it was not provided or omit it.\n- Do not diagnose and do not claim AI has diagnosed the patient.\n- Use professional, cautious wording and make this clear is a draft requiring professional review before it is saved.\n- Return all requested sections as JSON strings; do not include markdown.\n\nCase data:\n""" + json.dumps(context, default=str)
    try:
        generated = get_gemini_service().generate_json(prompt, REPORT_DRAFT_SCHEMA)
    except (RuntimeError, GeminiServiceError) as error:
        raise HTTPException(status_code=503, detail="Unable to generate a report draft right now. Please try again or write the report manually.") from error
    draft = {field: str(generated.get(field, "")).strip() for field in REPORT_DRAFT_FIELDS}
    return {"draft": draft}

@router.post("/")
@router.post("/generate")
def save_report(data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in {"CONSULTANT", "DERMATOLOGIST"}: raise HTTPException(status_code=403, detail="Professional access required")
    consultation = assigned_consultation(db, data.consultation_id, current_user.id)
    report = db.query(Report).filter(Report.consultation_id == consultation.id).first()
    values = data.model_dump(exclude={"consultation_id"})
    if report is None:
        report = Report(patient_id=consultation.user_id, dermatologist_id=current_user.id, consultation_id=consultation.id, report_date=values.pop("report_date") or date.today(), **values)
        db.add(report)
    else:
        for field, value in values.items():
            if field != "report_date" or value is not None: setattr(report, field, value)
    db.commit(); db.refresh(report)
    if current_user.role == "DERMATOLOGIST":
        create_notification(db, consultation.user_id, "Dermatologist Report Available", "Your dermatologist has completed a professional report. You can now view or download it from Reports.", "dermatologist_report", f"dermatologist-report-{report.report_id}")
        db.commit()
    return {"message": "Report saved successfully.", "report": report}


@router.post("/{report_id}/send")
def send_report_to_user(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Notify the patient that their already-saved assigned professional report is available."""
    if current_user.role not in {"CONSULTANT", "DERMATOLOGIST"}:
        raise HTTPException(status_code=403, detail="Professional access required")
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    consultation = assigned_consultation(db, report.consultation_id, current_user.id)
    if report.dermatologist_id != current_user.id or report.patient_id != consultation.user_id:
        raise HTTPException(status_code=403, detail="You are not authorized to send this report")
    event_key = report_sent_event_key(report.report_id)
    if db.query(Notification.id).filter(Notification.event_key == event_key).first():
        return {"message": "Report already sent to the user.", "sent": True}
    try:
        create_notification(db, consultation.user_id, "Consultant Report Available" if current_user.role == "CONSULTANT" else "Dermatologist Report Available", "Your consultant report is now available. You can view it from your Reports section." if current_user.role == "CONSULTANT" else "Your dermatologist report is now available. You can view it from your Reports section.", "professional_report", event_key)
        db.commit()
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=503, detail="Unable to send the report notification right now. Please try again.") from error
    return {"message": "Report sent to the user.", "sent": True}

@router.get("/mine")
def my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "USER": return report_list(db.query(Report).filter(Report.patient_id == current_user.id).order_by(Report.report_date.desc()).all(), db)
    if current_user.role in {"CONSULTANT", "DERMATOLOGIST"}: return report_list(db.query(Report).filter(Report.dermatologist_id == current_user.id).order_by(Report.report_date.desc()).all(), db)
    raise HTTPException(status_code=403, detail="Report access is not available for this role")

@router.get("/patient/{patient_id}")
def patient_reports(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "USER":
        if current_user.id != patient_id: raise HTTPException(status_code=403, detail="You can only view your own reports")
        return report_list(db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.report_date.desc()).all(), db)
    if current_user.role in {"CONSULTANT", "DERMATOLOGIST"}:
        if not db.query(Consultation).filter(Consultation.user_id == patient_id, Consultation.expert_id == current_user.id).first(): raise HTTPException(status_code=403, detail="You do not have an assigned consultation with this patient")
        return report_list(db.query(Report).filter(Report.patient_id == patient_id, Report.dermatologist_id == current_user.id).order_by(Report.report_date.desc()).all(), db)
    raise HTTPException(status_code=403, detail="Report access is not available for this role")

@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    authorize(report, current_user)
    dermatologist = db.query(User).filter(User.id == report.dermatologist_id).first()
    return {"report": report, "dermatologist": UserResponse.model_validate(dermatologist).model_dump() if dermatologist else None}

def section(story, styles, title, value):
    if value is not None and str(value).strip():
        story += [Paragraph(f"<b>{escape(title)}</b>", styles["Heading3"]), Paragraph(escape(str(value)).replace("\n", "<br/>"), styles["BodyText"]), Spacer(1, 4 * mm)]

@router.get("/{report_id}/pdf")
def report_pdf(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    authorize(report, current_user)
    patient = db.query(User).filter(User.id == report.patient_id).first(); professional = db.query(User).filter(User.id == report.dermatologist_id).first(); profile = db.query(SkinProfile).filter(SkinProfile.user_id == report.patient_id).first(); lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == report.patient_id).first(); progress = db.query(Progress).filter(Progress.user_id == report.patient_id).order_by(Progress.assessment_date.desc(), Progress.progress_id.desc()).first(); ai_assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == report.patient_id).order_by(SkinAssessment.assessment_date.desc(), SkinAssessment.assessment_id.desc()).first(); consultant_review = db.query(Consultation).filter(Consultation.user_id == report.patient_id, Consultation.expert_id == 13).order_by(Consultation.id.desc()).first()
    professional_label = "Consultant" if professional and professional.role == "CONSULTANT" else "Dermatologist"
    buffer = BytesIO(); document = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=18*mm); styles = getSampleStyleSheet(); story = [Paragraph("Skin Intelligence", styles["Title"]), Paragraph(f"{professional_label} Consultation Report", styles["Heading2"]), Spacer(1, 6*mm)]
    rows = [["Patient", patient.name if patient else "Not available"], ["Age", profile.age if profile else "Not available"], ["Gender", profile.gender if profile else "Not available"], ["Report date", str(report.report_date)]]; table = Table(rows, colWidths=[45*mm, 120*mm]); table.setStyle(TableStyle([("BACKGROUND", (0,0), (0,-1), colors.HexColor("#FCECF3")), ("GRID", (0,0), (-1,-1), .25, colors.HexColor("#E6C9D7")), ("PADDING", (0,0), (-1,-1), 7)])); story += [table, Spacer(1, 6*mm)]
    section(story, styles, "Skin Profile", f"Skin type: {getattr(profile, 'skin_type', None) or 'Not provided'}\nConcerns: {getattr(profile, 'skin_concerns', None) or 'Not provided'}\nAllergies: {getattr(profile, 'allergies', None) or 'Not provided'}\nSensitivities: {getattr(profile, 'sensitivities', None) or 'Not provided'}")
    section(story, styles, "Latest Assessment", f"Skin score: {getattr(progress, 'skin_score', None) if progress else 'Not assessed'}\nHydration: {getattr(progress, 'hydration_score', None) if progress else 'Not assessed'}\nAcne level: {getattr(progress, 'acne_level', None) if progress else 'Not assessed'}\nAssessment date: {getattr(progress, 'assessment_date', None) if progress else 'Not assessed'}\nNotes: {getattr(progress, 'notes', None) if progress else 'Not provided'}")
    section(story, styles, "AI Skin Assessment", f"Skin health score: {getattr(ai_assessment, 'final_score', None) if ai_assessment else 'Not assessed'}\nRisk level: {getattr(ai_assessment, 'risk_level', None) if ai_assessment else 'Not assessed'}\nSummary: {getattr(ai_assessment, 'condition_summary', None) if ai_assessment else 'Not provided'}")
    section(story, styles, "Consultant Review", f"Status: {getattr(consultant_review, 'status', None) if consultant_review else 'Not available'}\nSuggestions: {getattr(consultant_review, 'recommendation', None) if consultant_review else 'Not provided'}\nProgress observations: {getattr(consultant_review, 'progress_observations', None) if consultant_review else 'Not provided'}\nFollow-up: {getattr(consultant_review, 'follow_up_suggestion', None) if consultant_review else 'Not provided'}")
    if lifestyle: section(story, styles, "Lifestyle Summary", f"Sleep: {lifestyle.sleep_duration}\nWater intake: {lifestyle.water_intake}\nExercise: {lifestyle.exercise}\nStress level: {lifestyle.stress_level}\nEnvironmental exposure: {lifestyle.environmental_exposure}")
    section(story, styles, f"{professional_label} Professional Report", f"The following findings and guidance were provided by the assigned {professional_label.lower()}.")
    for label, value in [("Patient Summary", report.patient_summary), ("Clinical Observations", report.clinical_observations), ("Skin Assessment", report.skin_assessment), ("Recommendations", report.recommendations), ("Suggested Skincare Routine", report.skincare_routine), ("Follow-up Instructions", report.follow_up_instructions), ("Additional Notes", report.additional_notes)]: section(story, styles, label, value)
    section(story, styles, f"{professional_label} Information", f"Name: {getattr(professional, 'name', None) or 'Not provided'}\nQualification: {getattr(professional, 'qualification', None) or 'Not provided'}\nSpecialization: {getattr(professional, 'specialization', None) or 'Not provided'}\nLicense number: {getattr(professional, 'license_number', None) or 'Not provided'}")
    story += [Spacer(1, 6*mm), Paragraph("This report is based on information available during the consultation and does not provide an automated medical diagnosis.", styles["Italic"])]; document.build(story); buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="skin-intelligence-report-{report.report_id}.pdf"'})
