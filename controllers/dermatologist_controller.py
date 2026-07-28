"""Dermatologist controller — dashboard summary for Dermatologists."""

from sqlalchemy.orm import Session

from models.booking import DermatologistAppointment
from models.user import User


def get_dashboard_summary(db: Session, dermatologist: User) -> dict:
    appointments = (
        db.query(DermatologistAppointment)
        .filter(DermatologistAppointment.dermatologist_id == dermatologist.id)
        .all()
    )
    distinct_patients = {a.patient_id for a in appointments}
    pending_count = sum(1 for a in appointments if a.status == "Pending")

    return {
        "assigned_patients_count": len(distinct_patients),
        "total_appointments_count": len(appointments),
        "pending_reports": pending_count,
        "ai_diagnosis_status": "Coming Soon",
    }
