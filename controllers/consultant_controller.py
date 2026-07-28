"""Consultant controller — dashboard summary for Skincare Consultants."""

from sqlalchemy.orm import Session

from models.booking import ConsultantAssignment
from models.product import ProductRecommendation
from models.user import User
from utils.constants import ROLE_USER


def get_dashboard_summary(db: Session, consultant: User) -> dict:
    total_clients = db.query(User).join(User.role).filter(User.role.has(name=ROLE_USER)).count()

    assigned = (
        db.query(ConsultantAssignment)
        .filter(ConsultantAssignment.consultant_id == consultant.id)
        .all()
    )
    active_count = sum(1 for a in assigned if a.status == "Active")

    recommendations_sent = (
        db.query(ProductRecommendation)
        .filter(ProductRecommendation.consultant_id == consultant.id)
        .count()
    )

    return {
        "assigned_clients_count": active_count,
        "total_assignments_count": len(assigned),
        "total_platform_users": total_clients,
        "recommendations_sent": recommendations_sent,
        "analytics_status": "Coming Soon",
    }
