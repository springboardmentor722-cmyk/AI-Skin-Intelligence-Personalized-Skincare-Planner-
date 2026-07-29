import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.services.ingredients.schemas import IngredientRead
from app.services.recommendations.schemas import ProductRead

ProfessionalRole = Literal["consultant", "dermatologist"]
VerificationStatus = Literal[
    "pending", "approved", "rejected", "more_info_requested", "suspended", "deactivated"
]


class ConsultantClientAssignmentRequest(BaseModel):
    professional_id: str
    user_id: str


class VerificationQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    role: ProfessionalRole
    verification_status: VerificationStatus
    submitted_at: datetime.datetime | None
    reviewed_at: datetime.datetime | None


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int


class VerificationQueuePage(BaseModel):
    items: list[VerificationQueueItem]
    meta: PageMeta


class VerificationDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    document_type: str
    original_filename: str | None
    uploaded_at: datetime.datetime | None
    verified_at: datetime.datetime | None


class DocumentViewUrl(BaseModel):
    url: str


class ConsultantProfileDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    profile_image_url: str | None
    qualifications: str | None
    years_of_experience: int | None
    current_organization: str | None
    license_number: str | None
    specializations: list[str] | None
    areas_of_expertise: list[str] | None
    languages: list[str] | None
    consultation_modes: list[str] | None
    availability: str | None
    biography: str | None
    linkedin_url: str | None
    portfolio_url: str | None
    clinic_address: str | None
    location: str | None
    phone: str | None
    verification_status: VerificationStatus
    reviewed_by: str | None
    reviewed_at: datetime.datetime | None
    rejection_reason: str | None
    submitted_at: datetime.datetime | None
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


class DermatologistProfileDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    profile_image_url: str | None
    medical_registration_number: str | None
    medical_council: str | None
    hospital_clinic: str | None
    years_of_practice: int | None
    degrees: list[str] | None
    board_certifications: list[str] | None
    specializations: list[str] | None
    research_interests: str | None
    professional_biography: str | None
    phone: str | None
    location: str | None
    verification_status: VerificationStatus
    reviewed_by: str | None
    reviewed_at: datetime.datetime | None
    rejection_reason: str | None
    submitted_at: datetime.datetime | None
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


class VerificationReviewDetail(BaseModel):
    role: ProfessionalRole
    profile: ConsultantProfileDetail | DermatologistProfileDetail
    documents: list[VerificationDocumentRead]


class VerificationActionRequest(BaseModel):
    """approve / deactivate — a reason is useful but not required."""

    reason: str | None = None


class VerificationActionWithReasonRequest(BaseModel):
    """reject / request-info / suspend — a real reason is the whole point of the
    action (the professional reads it back on their locked dashboard)."""

    reason: str = Field(min_length=1)


class AuditLogCreate(BaseModel):
    """Body for POST /admin/audit-logs — the one write path `audit_logs` has (this
    service, docs/CONVENTIONS.md's single-writer rule), used both by this service's own
    verification actions and by the Next.js admin role-assignment wrapper (Branch 3;
    Better Auth's own `set-role` action has no audit trail of its own)."""

    action: str = Field(min_length=1)
    target_type: str | None = None
    target_id: str | None = None
    metadata: dict[str, Any] | None = None


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    audit_log_id: int
    actor_user_id: str | None
    action: str
    target_type: str | None
    target_id: str | None
    # Named metadata_ (not metadata), matching AuditLog.metadata_ exactly — an alias
    # back to "metadata" silently returns None on `from_attributes` validation
    # (Pydantic resolves aliased fields by alias even in ORM mode, and the real
    # attribute here is `metadata_`, not `metadata`; confirmed directly before
    # writing this comment). Not worth the footgun for a cosmetic JSON key.
    metadata_: dict[str, Any] | None
    created_at: datetime.datetime | None


class AuditLogPage(BaseModel):
    items: list[AuditLogRead]
    meta: PageMeta


class PlatformCounts(BaseModel):
    """Milestone 2 P4 — Admin dashboard's 3 additional real KPIs (Assessments
    Completed, Active Routines, Total Products). Platform Revenue and System Uptime
    have no real backing (no billing/payments processing, no uptime monitoring
    service) and stay UI-layer fixtures — see docs/DECISIONS.md ADR-023, not
    invented here."""

    total_assessments: int
    active_routines: int
    total_products: int


class TopConcernStat(BaseModel):
    """One row of the admin-wide top-concerns aggregate — count of skin profiles
    reporting this concern, platform-wide (not one user's, unlike the Assessment
    Engine's per-user prioritisation)."""

    concern_name: str
    count: int


class DashboardStats(BaseModel):
    """Admin dashboard (Branch 6) — real counts only, no invented KPIs. User-role
    counts come from Better Auth (web/app/api/admin/dashboard-stats/route.ts calls
    its own listUsers, not this endpoint) — this covers only what FastAPI actually
    owns: the verification queue and the audit trail, platform counts, and the
    top-concerns aggregate (Milestone 2 P4)."""

    pending_consultant_count: int
    pending_dermatologist_count: int
    recent_activity: list[AuditLogRead]
    platform_counts: PlatformCounts
    top_concerns: list[TopConcernStat]


class IngredientPage(BaseModel):
    """Admin's read-only Ingredient Management view (Branch 6) — full CRUD stays M3
    scope; this wraps ingredients.schemas.IngredientRead, not a redefinition."""

    items: list[IngredientRead]
    meta: PageMeta


class ProductPage(BaseModel):
    """Admin's read-only Product Management view (Branch 6) — same reasoning as
    IngredientPage."""

    items: list[ProductRead]
    meta: PageMeta
