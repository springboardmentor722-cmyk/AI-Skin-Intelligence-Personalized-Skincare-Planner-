// Milestone 2 P4 — fixtures for the handful of screenshot concepts this app
// genuinely has no real backing for yet (docs/DECISIONS.md ADR-023). Every other
// number on both dashboards comes from a real query; these are the exceptions,
// logged individually in the ADR, not a wholesale fixture layer.

/** User dashboard's "Skin Age" KPI — no derivation exists yet (ADR-021 C6, P10
 * builds it for real). Shape matches what a real derivation would return. */
export const SKIN_AGE_FIXTURE = { skinAge: 24, actualAge: 21 } as const;

/** Admin: no billing/payments system exists in this app at all. */
export const PLATFORM_REVENUE_FIXTURE = {
  amountInr: 2_480_500,
  deltaLabel: "20% vs last month",
  deltaDirection: "up" as const,
};

/** Admin: no uptime-monitoring service exists. */
export const SYSTEM_UPTIME_FIXTURE = { percent: 99.9, statusLabel: "All systems healthy" };

/** Admin: "Completed/In Progress/Pending" doesn't correspond to any real
 * skin_assessments state (compute-and-store is synchronous, never multi-stage). */
export const ASSESSMENTS_OVERVIEW_FIXTURE = [
  { key: "completed", label: "Completed", value: 6742, percent: 75 },
  { key: "in_progress", label: "In Progress", value: 1452, percent: 16 },
  { key: "pending", label: "Pending", value: 738, percent: 8 },
] as const;

/** Admin: Better Auth has no day-bucketed growth endpoint; querying the identity
 * table directly from FastAPI would violate ADR-016. */
export const USER_GROWTH_FIXTURE = [
  { x: "Apr 21", y: 9800 },
  { x: "Apr 28", y: 10450 },
  { x: "May 5", y: 11100 },
  { x: "May 12", y: 11900 },
  { x: "May 19", y: 12845 },
] as const;

/** Admin: web-analytics instrumentation (page views, sessions, bounce rate) isn't
 * something this app's backend owns as a domain concept. */
export const PLATFORM_ANALYTICS_FIXTURE = [
  { key: "page_views", label: "Page Views", value: "125,430", deltaLabel: "14%", direction: "up" as const },
  { key: "active_sessions", label: "Active Sessions", value: "8,245", deltaLabel: "17%", direction: "up" as const },
  { key: "bounce_rate", label: "Bounce Rate", value: "32.6%", deltaLabel: "5%", direction: "down" as const },
  { key: "avg_session", label: "Avg. Session", value: "04:32", deltaLabel: "8%", direction: "up" as const },
] as const;

/** Admin: display-only status tiles — no live healthcheck wired to the frontend
 * yet (a real version would ping the existing /health, /health/ready probes). */
export const SYSTEM_HEALTH_FIXTURE = [
  { key: "database", label: "Database", status: "Healthy", healthy: true },
  { key: "api", label: "API Services", status: "Healthy", healthy: true },
  { key: "storage", label: "Storage", status: "Healthy", healthy: true },
  { key: "email", label: "Email Service", status: "Healthy", healthy: true },
] as const;
