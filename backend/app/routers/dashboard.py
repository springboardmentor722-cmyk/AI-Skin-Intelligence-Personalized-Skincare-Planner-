from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, mongo, cache
from ..database import get_db
from ..deps import get_current_user, require_roles
from ..ml import predict as ml_predict

router = APIRouter(prefix="/api/dashboard", tags=["Dashboards"])


@router.get("/user")
def user_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    latest_score = (
        db.query(models.SkinHealthScore)
        .filter(models.SkinHealthScore.user_id == current_user.id)
        .order_by(models.SkinHealthScore.computed_at.desc())
        .first()
    )
    active_routines = (
        db.query(models.Routine)
        .filter(models.Routine.user_id == current_user.id, models.Routine.is_active == True)  # noqa: E712
        .all()
    )
    unread_notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False)  # noqa: E712
        .count()
    )
    recent_logs = (
        db.query(models.ProgressLog)
        .filter(models.ProgressLog.user_id == current_user.id)
        .order_by(models.ProgressLog.log_date.desc())
        .limit(7)
        .all()
    )

    return {
        "has_profile": profile is not None,
        "skin_health_score": latest_score.overall_score if latest_score else None,
        "active_routine_count": len(active_routines),
        "active_routines": [r.routine_type for r in active_routines],
        "unread_notifications": unread_notifications,
        "recent_adherence": [l.routine_adherence_percent for l in reversed(recent_logs)],
    }


@router.get("/consultant")
def consultant_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("consultant", "admin")),
):
    clients = db.query(models.User).filter(models.User.role == "user").all()
    client_summaries = []
    for client in clients:
        latest_score = (
            db.query(models.SkinHealthScore)
            .filter(models.SkinHealthScore.user_id == client.id)
            .order_by(models.SkinHealthScore.computed_at.desc())
            .first()
        )
        profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == client.id).first()
        client_summaries.append({
            "user_id": client.id,
            "name": client.name,
            "skin_type": profile.skin_type if profile else None,
            "latest_score": latest_score.overall_score if latest_score else None,
        })
    return {"client_count": len(clients), "clients": client_summaries}


@router.get("/dermatologist")
def dermatologist_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("dermatologist", "admin")),
):
    assessments = (
        db.query(models.SkinAssessment)
        .order_by(models.SkinAssessment.created_at.desc())
        .limit(25)
        .all()
    )
    patient_insights = []
    for a in assessments:
        user = db.query(models.User).filter(models.User.id == a.user_id).first()
        patient_insights.append({
            "user_id": a.user_id,
            "name": user.name if user else "Unknown",
            "overall_condition_score": a.overall_condition_score,
            "prioritized_concerns": a.prioritized_concerns,
            "risk_factors": a.risk_factors,
            "created_at": a.created_at,
        })
    return {"recent_assessments": patient_insights}


@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin")),
):
    return {
        "total_users": db.query(models.User).count(),
        "total_profiles": db.query(models.SkinProfile).count(),
        "total_assessments": db.query(models.SkinAssessment).count(),
        "total_routines": db.query(models.Routine).count(),
        "total_products": db.query(models.Product).count(),
        "total_ingredients": db.query(models.Ingredient).count(),
        "users_by_role": {
            role: db.query(models.User).filter(models.User.role == role).count()
            for role in ["user", "consultant", "dermatologist", "admin"]
        },
        "system_status": {
            "postgres_or_sqlite": True,
            "mongodb": mongo.is_mongo_available(),
            "redis": cache.is_redis_available(),
            **ml_predict.models_available(),
        },
    }
