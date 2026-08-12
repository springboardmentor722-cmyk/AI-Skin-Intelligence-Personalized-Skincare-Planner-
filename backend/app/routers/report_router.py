from datetime import date
from html import escape
from io import BytesIO
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
from app.models.progress import Progress
from app.models.report import Report
from app.models.skin_profile import SkinProfile
from app.models.skin_assessment import SkinAssessment
from app.models.user import User
from app.schemas.report_schema import ReportCreate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

def assigned_consultation(db, consultation_id, dermatologist_id):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.expert_id == dermatologist_id).first()
    if not consultation: raise HTTPException(status_code=404, detail="Assigned consultation not found")
    return consultation

def authorize(report, user):
    if (user.role == "USER" and report.patient_id == user.id) or (user.role == "DERMATOLOGIST" and report.dermatologist_id == user.id): return
    raise HTTPException(status_code=403, detail="You do not have access to this report")

def report_list(reports, db):
    result = []
    for report in reports:
        item = jsonable_encoder(report)
        dermatologist = db.query(User).filter(User.id == report.dermatologist_id).first()
        item["dermatologist_name"] = dermatologist.name if dermatologist else None
        result.append(item)
    return result

@router.post("/")
@router.post("/generate")
def save_report(data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "DERMATOLOGIST": raise HTTPException(status_code=403, detail="Dermatologist access required")
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
    return {"message": "Report saved successfully.", "report": report}

@router.get("/mine")
def my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "USER": return report_list(db.query(Report).filter(Report.patient_id == current_user.id).order_by(Report.report_date.desc()).all(), db)
    if current_user.role == "DERMATOLOGIST": return report_list(db.query(Report).filter(Report.dermatologist_id == current_user.id).order_by(Report.report_date.desc()).all(), db)
    raise HTTPException(status_code=403, detail="Report access is not available for this role")

@router.get("/patient/{patient_id}")
def patient_reports(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "USER":
        if current_user.id != patient_id: raise HTTPException(status_code=403, detail="You can only view your own reports")
        return report_list(db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.report_date.desc()).all(), db)
    if current_user.role == "DERMATOLOGIST":
        if not db.query(Consultation).filter(Consultation.user_id == patient_id, Consultation.expert_id == current_user.id).first(): raise HTTPException(status_code=403, detail="You do not have an assigned consultation with this patient")
        return report_list(db.query(Report).filter(Report.patient_id == patient_id, Report.dermatologist_id == current_user.id).order_by(Report.report_date.desc()).all(), db)
    raise HTTPException(status_code=403, detail="Report access is not available for this role")

@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    authorize(report, current_user)
    return {"report": report, "dermatologist": db.query(User).filter(User.id == report.dermatologist_id).first()}

def section(story, styles, title, value):
    if value is not None and str(value).strip():
        story += [Paragraph(f"<b>{escape(title)}</b>", styles["Heading3"]), Paragraph(escape(str(value)).replace("\n", "<br/>"), styles["BodyText"]), Spacer(1, 4 * mm)]

@router.get("/{report_id}/pdf")
def report_pdf(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    authorize(report, current_user)
    patient = db.query(User).filter(User.id == report.patient_id).first(); dermatologist = db.query(User).filter(User.id == report.dermatologist_id).first(); profile = db.query(SkinProfile).filter(SkinProfile.user_id == report.patient_id).first(); lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == report.patient_id).first(); progress = db.query(Progress).filter(Progress.user_id == report.patient_id).order_by(Progress.assessment_date.desc(), Progress.progress_id.desc()).first(); ai_assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == report.patient_id).order_by(SkinAssessment.assessment_date.desc(), SkinAssessment.assessment_id.desc()).first(); consultant_review = db.query(Consultation).filter(Consultation.user_id == report.patient_id, Consultation.expert_id == 13).order_by(Consultation.id.desc()).first()
    buffer = BytesIO(); document = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=18*mm); styles = getSampleStyleSheet(); story = [Paragraph("Skin Intelligence", styles["Title"]), Paragraph("Dermatologist Consultation Report", styles["Heading2"]), Spacer(1, 6*mm)]
    rows = [["Patient", patient.name if patient else "Not available"], ["Age", profile.age if profile else "Not available"], ["Gender", profile.gender if profile else "Not available"], ["Report date", str(report.report_date)]]; table = Table(rows, colWidths=[45*mm, 120*mm]); table.setStyle(TableStyle([("BACKGROUND", (0,0), (0,-1), colors.HexColor("#FCECF3")), ("GRID", (0,0), (-1,-1), .25, colors.HexColor("#E6C9D7")), ("PADDING", (0,0), (-1,-1), 7)])); story += [table, Spacer(1, 6*mm)]
    section(story, styles, "Skin Profile", f"Skin type: {getattr(profile, 'skin_type', None) or 'Not provided'}\nConcerns: {getattr(profile, 'skin_concerns', None) or 'Not provided'}\nAllergies: {getattr(profile, 'allergies', None) or 'Not provided'}\nSensitivities: {getattr(profile, 'sensitivities', None) or 'Not provided'}")
    section(story, styles, "Latest Assessment", f"Skin score: {getattr(progress, 'skin_score', None) if progress else 'Not assessed'}\nHydration: {getattr(progress, 'hydration_score', None) if progress else 'Not assessed'}\nAcne level: {getattr(progress, 'acne_level', None) if progress else 'Not assessed'}\nAssessment date: {getattr(progress, 'assessment_date', None) if progress else 'Not assessed'}\nNotes: {getattr(progress, 'notes', None) if progress else 'Not provided'}")
    section(story, styles, "AI Skin Assessment", f"Skin health score: {getattr(ai_assessment, 'final_score', None) if ai_assessment else 'Not assessed'}\nRisk level: {getattr(ai_assessment, 'risk_level', None) if ai_assessment else 'Not assessed'}\nSummary: {getattr(ai_assessment, 'condition_summary', None) if ai_assessment else 'Not provided'}")
    section(story, styles, "Consultant Review", f"Status: {getattr(consultant_review, 'status', None) if consultant_review else 'Not available'}\nSuggestions: {getattr(consultant_review, 'recommendation', None) if consultant_review else 'Not provided'}\nProgress observations: {getattr(consultant_review, 'progress_observations', None) if consultant_review else 'Not provided'}\nFollow-up: {getattr(consultant_review, 'follow_up_suggestion', None) if consultant_review else 'Not provided'}")
    if lifestyle: section(story, styles, "Lifestyle Summary", f"Sleep: {lifestyle.sleep_duration}\nWater intake: {lifestyle.water_intake}\nExercise: {lifestyle.exercise}\nStress level: {lifestyle.stress_level}\nEnvironmental exposure: {lifestyle.environmental_exposure}")
    for label, value in [("Patient Summary", report.patient_summary), ("Clinical Observations", report.clinical_observations), ("Skin Assessment", report.skin_assessment), ("Recommendations", report.recommendations), ("Suggested Skincare Routine", report.skincare_routine), ("Follow-up Instructions", report.follow_up_instructions), ("Additional Notes", report.additional_notes)]: section(story, styles, label, value)
    section(story, styles, "Dermatologist Information", f"Name: {getattr(dermatologist, 'name', None) or 'Not provided'}\nQualification: {getattr(dermatologist, 'qualification', None) or 'Not provided'}\nSpecialization: {getattr(dermatologist, 'specialization', None) or 'Not provided'}\nLicense number: {getattr(dermatologist, 'license_number', None) or 'Not provided'}")
    story += [Spacer(1, 6*mm), Paragraph("This report is based on information available during the consultation and does not provide an automated medical diagnosis.", styles["Italic"])]; document.build(story); buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="skin-intelligence-report-{report.report_id}.pdf"'})
