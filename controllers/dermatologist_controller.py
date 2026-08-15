"""Dermatologist controller — dashboard aggregate for Dermatologists."""

from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.booking import DermatologistAppointment
from models.user import User
from services import assessment_service, routine_service


def get_dashboard_summary(db: Session, dermatologist: User) -> dict:
    appointments = (
        db.query(DermatologistAppointment)
        .filter(DermatologistAppointment.dermatologist_id == dermatologist.id)
        .all()
    )
    patient_ids = list({a.patient_id for a in appointments})

    latest_by_patient = assessment_service.get_latest_assessments_for_users(db, patient_ids)
    users_with_routine = routine_service.get_users_with_active_routine(db, patient_ids)
    recent_assessments = assessment_service.get_recent_assessments_for_users(db, patient_ids, limit=5)

    today = datetime.now(timezone.utc).date()
    week_from_now = today + timedelta(days=7)
    pending_count = sum(1 for a in appointments if a.status == "Pending")
    follow_ups_due = sum(
        1
        for a in appointments
        if a.status in ("Pending", "Confirmed") and today <= a.appointment_date <= week_from_now
    )

    scores = [a.overall_score for a in latest_by_patient.values() if a.overall_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    improvement_by_patient = assessment_service.compute_improvement_for_users(db, patient_ids)
    improvement_pcts = [v["delta_percent"] for v in improvement_by_patient.values() if v is not None]
    avg_improvement_pct = round(sum(improvement_pcts) / len(improvement_pcts), 1) if improvement_pcts else None
    patients_improving = sum(1 for v in improvement_by_patient.values() if v and v["trend"] == "Improving")
    patients_need_attention = sum(1 for v in improvement_by_patient.values() if v and v["trend"] == "Declining")

    concern_counts = Counter(a.primary_concern for a in latest_by_patient.values() if a.primary_concern)

    # Most recent appointment per patient (for the "next follow-up" / status columns)
    latest_appointment_by_patient = {}
    for a in sorted(appointments, key=lambda x: x.created_at, reverse=True):
        latest_appointment_by_patient.setdefault(a.patient_id, a)

    patients_table = []
    for patient_id in patient_ids:
        assessment = latest_by_patient.get(patient_id)
        appointment = latest_appointment_by_patient.get(patient_id)
        patients_table.append(
            {
                "patient_id": patient_id,
                "patient_name": appointment.patient.full_name if appointment and appointment.patient else "",
                "age": appointment.patient.age if appointment and appointment.patient else None,
                "gender": appointment.patient.gender if appointment and appointment.patient else None,
                "primary_concern": assessment.primary_concern if assessment else None,
                "overall_score": assessment.overall_score if assessment else None,
                "last_assessment_at": assessment.created_at if assessment else None,
                "status": appointment.status if appointment else None,
                "next_appointment_date": appointment.appointment_date if appointment else None,
            }
        )
    patients_table.sort(key=lambda row: row["last_assessment_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    return {
        "assigned_patients_count": len(patient_ids),
        "total_appointments_count": len(appointments),
        "pending_reports": pending_count,
        "follow_ups_due": follow_ups_due,
        "assessments_done_count": len(latest_by_patient),
        "active_treatment_plans_count": len(users_with_routine),
        "avg_score": avg_score,
        "avg_improvement_pct": avg_improvement_pct,
        "patients_improving_count": patients_improving,
        "patients_need_attention_count": patients_need_attention,
        "top_concerns": [{"label": k, "count": v} for k, v in concern_counts.most_common(5)],
        "patients_table": patients_table,
        "recent_assessments": [
            {
                "patient_id": a.user_id,
                "patient_name": next((p["patient_name"] for p in patients_table if p["patient_id"] == a.user_id), ""),
                "overall_score": a.overall_score,
                "created_at": a.created_at,
            }
            for a in recent_assessments
        ],
        "ai_diagnosis_status": "Coming Soon",
    }
