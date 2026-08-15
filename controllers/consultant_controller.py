"""Consultant controller — dashboard aggregate for Skincare Consultants."""

from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.booking import ConsultantAssignment
from models.product import ProductRecommendation
from models.user import User
from services import assessment_service, routine_service
from utils.constants import ROLE_USER


def get_dashboard_summary(db: Session, consultant: User) -> dict:
    assignments = (
        db.query(ConsultantAssignment)
        .filter(ConsultantAssignment.consultant_id == consultant.id)
        .all()
    )
    active_assignments = [a for a in assignments if a.status == "Active"]
    active_client_ids = [a.client_id for a in active_assignments]

    latest_by_client = assessment_service.get_latest_assessments_for_users(db, active_client_ids)
    users_with_routine = routine_service.get_users_with_active_routine(db, active_client_ids)
    recent_assessments = assessment_service.get_recent_assessments_for_users(db, active_client_ids, limit=5)

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_this_week = sum(1 for a in assignments if a.created_at and a.created_at >= week_ago)

    scores = [a.overall_score for a in latest_by_client.values() if a.overall_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    improvement_by_client = assessment_service.compute_improvement_for_users(db, active_client_ids)
    improvement_pcts = [v["delta_percent"] for v in improvement_by_client.values() if v is not None]
    avg_improvement_pct = round(sum(improvement_pcts) / len(improvement_pcts), 1) if improvement_pcts else None
    clients_improved = sum(1 for v in improvement_by_client.values() if v and v["trend"] == "Improving")
    clients_need_attention = sum(1 for v in improvement_by_client.values() if v and v["trend"] == "Declining")

    skin_type_counts = Counter(a.skin_type for a in latest_by_client.values() if a.skin_type)
    concern_counts = Counter(a.primary_concern for a in latest_by_client.values() if a.primary_concern)

    id_to_client = {a.client_id: a for a in active_assignments}
    clients_table = []
    for client_id, assignment in id_to_client.items():
        assessment = latest_by_client.get(client_id)
        clients_table.append(
            {
                "client_id": client_id,
                "client_name": assignment.client.full_name if assignment.client else "",
                "age": assignment.client.age if assignment.client else None,
                "gender": assignment.client.gender if assignment.client else None,
                "skin_type": assessment.skin_type if assessment else None,
                "top_concern": assessment.primary_concern if assessment else None,
                "overall_score": assessment.overall_score if assessment else None,
                "last_assessment_at": assessment.created_at if assessment else None,
                "status": assignment.status,
            }
        )
    clients_table.sort(key=lambda row: row["last_assessment_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    total_clients = db.query(User).join(User.role).filter(User.role.has(name=ROLE_USER)).count()
    recommendations_sent = (
        db.query(ProductRecommendation)
        .filter(ProductRecommendation.consultant_id == consultant.id)
        .count()
    )

    return {
        "assigned_clients_count": len(active_assignments),
        "total_assignments_count": len(assignments),
        "total_platform_users": total_clients,
        "recommendations_sent": recommendations_sent,
        "assessments_done_count": len(latest_by_client),
        "active_routines_count": len(users_with_routine),
        "avg_score": avg_score,
        "avg_improvement_pct": avg_improvement_pct,
        "clients_improved_count": clients_improved,
        "clients_need_attention_count": clients_need_attention,
        "new_this_week": new_this_week,
        "skin_type_distribution": [{"label": k, "count": v} for k, v in skin_type_counts.most_common()],
        "top_concerns": [{"label": k, "count": v} for k, v in concern_counts.most_common(5)],
        "clients_table": clients_table,
        "recent_assessments": [
            {
                "client_id": a.user_id,
                "client_name": next((c["client_name"] for c in clients_table if c["client_id"] == a.user_id), ""),
                "overall_score": a.overall_score,
                "created_at": a.created_at,
            }
            for a in recent_assessments
        ],
        "analytics_status": "Coming Soon",
    }
