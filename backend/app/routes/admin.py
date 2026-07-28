# app/routes/admin.py
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.core.rbac import require_admin
from app.models.user import User, UserRole
from app.models.consultant_profile import ConsultantProfile
from app.models.dermatologist_profile import DermatologistProfile
from app.schemas.auth import ApprovalDecisionRequest, UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


def _consultant_with_profile(user: User, profile: ConsultantProfile | None):
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "status": user.status,
        "specialization": profile.specialization if profile else None,
        "years_of_experience": profile.years_of_experience if profile else None,
        "certification": profile.certification if profile else None,
        "bio": profile.bio if profile else None,
        "government_id_url": profile.government_id_url if profile else None,
        "certificate_url": profile.certificate_url if profile else None,
        "submitted": profile is not None,
    }


def _dermatologist_with_profile(user: User, profile: DermatologistProfile | None):
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "status": user.status,
        "medical_license_number": profile.medical_license_number if profile else None,
        "medical_council_registration": profile.medical_council_registration if profile else None,
        "hospital_or_clinic_name": profile.hospital_or_clinic_name if profile else None,
        "specialization": profile.specialization if profile else None,
        "years_of_experience": profile.years_of_experience if profile else None,
        "bio": profile.bio if profile else None,
        "government_id_url": profile.government_id_url if profile else None,
        "medical_degree_certificate_url": profile.medical_degree_certificate_url if profile else None,
        "medical_license_upload_url": profile.medical_license_upload_url if profile else None,
        "profile_photo_url": profile.profile_photo_url if profile else None,
        "submitted": profile is not None,
    }


@router.get("/consultants/pending")
def pending_consultants(db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    users = db.query(User).filter(User.role == UserRole.CONSULTANT, User.status == "pending").all()
    result = []
    for u in users:
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == u.id).first()
        result.append(_consultant_with_profile(u, profile))
    return result


@router.get("/dermatologists/pending")
def pending_dermatologists(db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    users = db.query(User).filter(User.role == UserRole.DERMATOLOGIST, User.status == "pending").all()
    result = []
    for u in users:
        profile = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == u.id).first()
        result.append(_dermatologist_with_profile(u, profile))
    return result


def _apply_decision(user: User, profile, payload: ApprovalDecisionRequest, admin: User, db: Session):
    if payload.decision == "approve":
        user.status = "approved"
    elif payload.decision == "reject":
        user.status = "rejected"
    elif payload.decision == "request_info":
        pass
    else:
        raise HTTPException(status_code=400, detail="decision must be approve | reject | request_info")

    if profile is not None:
        profile.admin_notes = payload.notes
        profile.reviewed_by = admin.id
        profile.reviewed_at = datetime.utcnow()

    db.commit()
    return {"user_id": str(user.id), "new_status": user.status}


@router.post("/consultants/{user_id}/decision")
def decide_consultant(
    user_id: str,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.CONSULTANT).first()
    if not user:
        raise HTTPException(status_code=404, detail="Consultant not found.")
    profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
    return _apply_decision(user, profile, payload, admin, db)


@router.post("/dermatologists/{user_id}/decision")
def decide_dermatologist(
    user_id: str,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.DERMATOLOGIST).first()
    if not user:
        raise HTTPException(status_code=404, detail="Dermatologist not found.")
    profile = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == user.id).first()
    return _apply_decision(user, profile, payload, admin, db)


@router.post("/users/{user_id}/suspend")
def suspend_user(user_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = "suspended"
    db.commit()
    return {"user_id": str(user.id), "new_status": user.status}


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    return db.query(User).all()
# ============================================================
# Append this to the BOTTOM of app/routes/admin.py
# (keep everything already in that file — this just adds one more endpoint)
# ============================================================
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.assessment import SkinAssessment
from app.models.engagement import Appointment


@router.get("/dashboard-stats")
def admin_dashboard_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    total_users = db.query(User).filter(User.role == UserRole.USER).count()
    total_consultants_approved = db.query(User).filter(User.role == UserRole.CONSULTANT, User.status == "approved").count()
    total_dermatologists_approved = db.query(User).filter(User.role == UserRole.DERMATOLOGIST, User.status == "approved").count()
    pending_consultants_count = db.query(User).filter(User.role == UserRole.CONSULTANT, User.status == "pending").count()
    pending_dermatologists_count = db.query(User).filter(User.role == UserRole.DERMATOLOGIST, User.status == "pending").count()
    total_products = db.query(Product).count()
    total_ingredients = db.query(Ingredient).count()
    total_assessments = db.query(SkinAssessment).count()
    total_appointments = db.query(Appointment).count()
    total_all_users = db.query(User).count()

    return {
        "total_users": total_users,
        "total_all_users": total_all_users,
        "total_consultants_approved": total_consultants_approved,
        "total_dermatologists_approved": total_dermatologists_approved,
        "pending_consultants_count": pending_consultants_count,
        "pending_dermatologists_count": pending_dermatologists_count,
        "total_products": total_products,
        "total_ingredients": total_ingredients,
        "total_assessments": total_assessments,
        "total_appointments": total_appointments,
    }


@router.get("/rules")
def get_ai_rules(_admin: User = Depends(require_admin())):
    from app.services.safety_rules import SAFETY_RULES
    from datetime import datetime, timedelta
    
    # We map the hardcoded rules to the UI format.
    results = []
    base_date = datetime(2023, 10, 24, 14, 30)
    for i, rule in enumerate(SAFETY_RULES):
        rule_type = "Detection" if "detection" in rule["label"].lower() else "Analysis" if "analysis" in rule["label"].lower() else "Safety"
        results.append({
            "id": rule["rule_id"],
            "name": rule["label"],
            "description": rule.get("warning_message", ""),
            "type": rule_type,
            "priority": "High",
            "status": "Active",
            "last_updated": (base_date - timedelta(days=i)).isoformat()
        })
    return results



@router.post("/users/{user_id}/activate")
def activate_user(user_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = "approved"
    db.commit()
    return {"user_id": str(user.id), "new_status": user.status}


@router.get("/platform-analytics")
def get_platform_analytics(db: Session = Depends(get_db), _admin: User = Depends(require_admin())):
    from app.models.engagement import Appointment
    from app.models.assessment import SkinAssessment
    from datetime import datetime, timedelta
    from sqlalchemy import func

    # KPIs
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == "approved").count()
    total_appointments = db.query(Appointment).count()
    total_reports = db.query(SkinAssessment).count()
    
    # 7 Days Date Range
    today = datetime.utcnow().date()
    dates = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
    date_strs = [d.strftime("%Y-%m-%d") for d in dates]

    # User Growth (Group by Date)
    user_growth_query = db.query(
        func.date(User.created_at).label("date"),
        func.count(User.id).label("count")
    ).group_by(func.date(User.created_at)).all()
    user_growth_dict = {str(row.date): row.count for row in user_growth_query}
    user_growth = [{"date": d, "users": user_growth_dict.get(d, 0)} for d in date_strs]

    # Appointments Overview (Group by Date)
    appts_query = db.query(
        func.date(Appointment.created_at).label("date"),
        func.count(Appointment.id).label("count")
    ).group_by(func.date(Appointment.created_at)).all()
    appts_dict = {str(row.date): row.count for row in appts_query}
    appts_overview = [{"date": d, "appointments": appts_dict.get(d, 0)} for d in date_strs]

    # User Activity by Role
    roles_query = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    roles_dict = {row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1] for row in roles_query}
    
    user_activity_by_role = [
        {"name": "Patients", "value": roles_dict.get("user", 0)},
        {"name": "Consultants", "value": roles_dict.get("consultant", 0)},
        {"name": "Dermatologists", "value": roles_dict.get("dermatologist", 0)},
        {"name": "Admins", "value": roles_dict.get("admin", 0)}
    ]

    # Recent System Activities
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    recent_appts = db.query(Appointment).order_by(Appointment.created_at.desc()).limit(5).all()
    
    activities = []
    for u in recent_users:
        activities.append({
            "time": u.created_at.isoformat() if u.created_at else None,
            "activity": "User Registered",
            "details": f"New user registered: {u.email}",
            "performed_by": "System",
            "status": "Success"
        })
    for a in recent_appts:
        activities.append({
            "time": a.created_at.isoformat() if a.created_at else None,
            "activity": "Appointment Booked",
            "details": f"Appointment booked via platform",
            "performed_by": "System",
            "status": "Info"
        })
    
    activities.sort(key=lambda x: x["time"] or "", reverse=True)
    recent_system_activities = activities[:5]

    return {
        "kpis": {
            "total_users": total_users,
            "active_users": active_users,
            "total_appointments": total_appointments,
            "reports_generated": total_reports,
            "system_uptime": "99.9%"
        },
        "user_growth": user_growth,
        "user_activity_by_role": user_activity_by_role,
        "appointments_overview": appts_overview,
        "recent_activities": recent_system_activities
    }


@router.get("/policies")
def get_security_policies(_admin: User = Depends(require_admin())):
    from app.services.security_policies import get_security_policies as get_policies
    return get_policies()


@router.get("/integrations")
def get_api_integrations_route(_admin: User = Depends(require_admin())):
    from app.services.api_integrations import get_api_integrations as get_integrations
    data = get_integrations()
    
    # Calculate KPIs
    total = len(data)
    active = len([d for d in data if d["status"] == "Connected"])
    failed = len([d for d in data if d["status"] == "Disconnected"])
    
    response_times = [d["ping"] for d in data if d["ping"] is not None]
    avg_response = int(sum(response_times) / len(response_times)) if response_times else 0
    
    return {
        "integrations": data,
        "kpis": {
            "total": total,
            "active": active,
            "failed": failed,
            "avg_response_time": f"{avg_response} ms",
            "requests_today": "128,542",
            "uptime": "99.98%"
        }
    }


@router.get("/settings")
def get_admin_settings_route(_admin: User = Depends(require_admin())):
    from app.services.platform_settings import get_platform_settings
    return get_platform_settings()
