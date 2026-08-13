"""Role-Based Access Control — the single source of truth for permissions.

Every protected endpoint declares a permission string; a role may call the
endpoint only when its permission set contains that string. The administrator
role implicitly holds every permission and cannot be restricted.
"""
from .models import Role

# ----- Permission catalogue -------------------------------------------------
PERMISSIONS = {
    # Patient-facing
    "profile.read_own", "profile.update_own",
    "skin_profile.read_own", "skin_profile.update_own",
    "lifestyle.read_own", "lifestyle.create_own",
    "progress.read_own", "progress.create_own",
    "products.read", "ingredients.read",
    "dermatologists.read", "dermatologist_slots.read",
    "appointments.create", "appointments.read_own", "appointments.cancel_own", "appointments.reschedule_own",
    "consultants.read",
    "consultation_requests.create", "consultation_requests.read_own", "consultation_requests.cancel_own",
    "routines.read_own",
    "notifications.read_own", "notifications.update_own",
    # Dermatologist
    "appointments.read_incoming", "appointments.manage",       # accept / reject / complete / add notes
    "availability.manage", "derm_profile.update_own",
    "patients.read_assigned",
    # Consultant
    "consultation_requests.read_incoming", "consultation_requests.manage",
    "routines.create", "clients.read_assigned",
    "consultant_profile.update_own",
    # Milestone 2 — assessment, scoring, routine generation
    "assessment.create", "assessment.read_own",
    "routine.generate", "routine.read_own", "routine.log_own",
    # Administrator
    "admin.stats", "admin.users.read", "admin.users.create", "admin.users.update",
    "admin.users.delete", "admin.users.suspend", "admin.roles.assign",
    "admin.dermatologists.approve", "admin.consultants.approve",
    "admin.appointments.read_all", "admin.appointments.manage",
    "admin.products.create", "admin.products.update", "admin.products.delete",
    "admin.audit_logs.read", "admin.settings.manage", "admin.notifications.broadcast",
    "admin.export",
}

_COMMON = {
    "profile.read_own", "profile.update_own",
    "notifications.read_own", "notifications.update_own",
}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    Role.USER: _COMMON | {
        "skin_profile.read_own", "skin_profile.update_own",
        "lifestyle.read_own", "lifestyle.create_own",
        "progress.read_own", "progress.create_own",
        "products.read", "ingredients.read",
        "dermatologists.read", "dermatologist_slots.read",
        "appointments.create", "appointments.read_own",
        "appointments.cancel_own", "appointments.reschedule_own",
        "consultants.read",
        "consultation_requests.create", "consultation_requests.read_own", "consultation_requests.cancel_own",
        "routines.read_own",
        # Milestone 2
        "assessment.create", "assessment.read_own",
        "routine.generate", "routine.read_own", "routine.log_own",
    },
    Role.DERMATOLOGIST: _COMMON | {
        "appointments.read_incoming", "appointments.manage",
        "availability.manage", "derm_profile.update_own",
        "patients.read_assigned",
        "products.read", "ingredients.read",
    },
    Role.CONSULTANT: _COMMON | {
        "consultation_requests.read_incoming", "consultation_requests.manage",
        "routines.create", "clients.read_assigned",
        "consultant_profile.update_own",
        "products.read", "ingredients.read",
    },
    # Administrator: full platform control — every permission, cannot be restricted.
    Role.ADMIN: set(PERMISSIONS),
}


def role_has(role: str, permission: str) -> bool:
    if role == Role.ADMIN:
        return True
    return permission in ROLE_PERMISSIONS.get(role, set())
