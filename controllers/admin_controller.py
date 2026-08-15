"""Admin controller — platform-wide user/role management and statistics."""

from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.assessment import SkinAssessment
from models.audit import AuditLog
from models.product import Order, Product
from models.role import Role
from models.user import User
from services import assessment_service, product_service


def list_all_users(db: Session) -> list[User]:
    return db.query(User).filter(User.is_deleted.is_(False)).order_by(User.created_at.desc()).all()


def get_platform_statistics(db: Session) -> dict:
    total_users = db.query(User).filter(User.is_deleted.is_(False)).count()
    per_role = {}
    for role in db.query(Role).all():
        per_role[role.name] = (
            db.query(User)
            .filter(User.role_id == role.id, User.is_deleted.is_(False))
            .count()
        )

    # User growth: signups per week, last 8 weeks — real, from users.created_at.
    now = datetime.now(timezone.utc)
    weeks = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i)
        weeks.append(week_start)
    growth = []
    cumulative_base = (
        db.query(User).filter(User.created_at < weeks[0], User.is_deleted.is_(False)).count()
    )
    running_total = cumulative_base
    for week_start in weeks:
        week_end = week_start + timedelta(weeks=1)
        count_in_week = (
            db.query(User)
            .filter(User.created_at >= week_start, User.created_at < week_end, User.is_deleted.is_(False))
            .count()
        )
        running_total += count_in_week
        growth.append({"week_of": week_start.date().isoformat(), "total_users": running_total})

    total_assessments = db.query(SkinAssessment).count()
    concern_counts = Counter(
        row[0]
        for row in db.query(SkinAssessment.primary_concern).filter(SkinAssessment.primary_concern.isnot(None)).all()
    )

    total_products = db.query(Product).filter(Product.is_active.is_(True)).count()
    orders = db.query(Order).all()
    total_revenue = sum(float(o.total_amount) for o in orders)

    all_user_ids_with_assessments = [
        row[0] for row in db.query(SkinAssessment.user_id).distinct().all()
    ]
    improvement_by_user = assessment_service.compute_improvement_for_users(db, all_user_ids_with_assessments)
    improvement_pcts = [v["delta_percent"] for v in improvement_by_user.values() if v is not None]
    avg_improvement_pct = round(sum(improvement_pcts) / len(improvement_pcts), 1) if improvement_pcts else None

    return {
        "total_users": total_users,
        "users_per_role": per_role,
        "active_users": db.query(User).filter(User.is_active.is_(True), User.is_deleted.is_(False)).count(),
        "user_growth": growth,
        "total_assessments": total_assessments,
        "avg_improvement_pct": avg_improvement_pct,
        "top_concerns_platform": [{"label": k, "count": v} for k, v in concern_counts.most_common(5)],
        "total_products": total_products,
        "total_orders": len(orders),
        "total_revenue": round(total_revenue, 2),
    }


def get_recent_activity(db: Session, limit: int = 20) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()


def get_recommendation_monitoring(db: Session) -> dict:
    """
    Admin visibility into what consultants are recommending and how well
    the recommendation engine performs — real data, including a
    recommendation-to-order conversion rate (did the client actually buy
    the recommended product afterward?).
    """
    recommendations = product_service.list_all_recommendations(db)

    product_counts = Counter(r.product.name for r in recommendations if r.product)
    consultant_counts = Counter(r.consultant.full_name for r in recommendations if r.consultant)

    converted = 0
    for r in recommendations:
        if product_service.has_client_ordered_product(db, r.client_id, r.product_id):
            converted += 1
    conversion_rate = round((converted / len(recommendations)) * 100, 1) if recommendations else None

    return {
        "total_recommendations": len(recommendations),
        "conversion_rate_pct": conversion_rate,
        "top_recommended_products": [{"label": k, "count": v} for k, v in product_counts.most_common(5)],
        "top_recommending_consultants": [{"label": k, "count": v} for k, v in consultant_counts.most_common(5)],
        "recent_recommendations": [
            {
                "id": r.id,
                "consultant_name": r.consultant.full_name if r.consultant else None,
                "client_name": r.client.full_name if r.client else None,
                "product_name": r.product.name if r.product else None,
                "product_brand": r.product.brand if r.product else None,
                "product_category": r.product.category if r.product else None,
                "note": r.note,
                "was_ordered": product_service.has_client_ordered_product(db, r.client_id, r.product_id),
                "created_at": r.created_at,
            }
            for r in recommendations[:30]
        ],
    }


def set_user_active_status(db: Session, user: User, is_active: bool) -> User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
