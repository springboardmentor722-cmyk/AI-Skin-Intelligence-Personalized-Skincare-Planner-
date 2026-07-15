import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileBarChart,
  FileText,
  FileWarning,
  FlaskConical,
  LayoutDashboard,
  Settings,
  Sparkles,
  Stethoscope,
  ShoppingBag,
  TrendingUp,
  UserRound,
  Users,
  BarChart3,
} from "lucide-react";

// Role type matches Better Auth's user.role column exactly (ADR-003):
// database_schemas/skinlytics_postgresql_schema_v3.sql CHECK constraint.
export type Role = "user" | "consultant" | "dermatologist" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** False for a nav item whose page hasn't been built yet — Milestone 1 audit found
   * 7 of the User role's 10 nav items (and every non-Dashboard item for the other
   * three roles, whose dashboards are still M1 shell smoke-test stubs per
   * PROGRESS.md) linked to routes that 404. AGENTS.md §3 fixes the nav *list* — it
   * doesn't say every item must already have a live page — so items stay visible
   * (not removed) but render disabled with a "Coming soon" tooltip instead of
   * navigating to a dead link. */
  built: boolean;
}

// User keeps bare paths (app/(user)/... is a route group — no URL segment); the other
// three roles are prefixed (app/consultant/..., not a route group) so their routes don't
// collide with User's on the same path (e.g. /dashboard).
const ROLE_PATH_PREFIX: Record<Role, string> = {
  user: "",
  consultant: "/consultant",
  dermatologist: "/dermatologist",
  admin: "/admin",
};

interface RawNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Omit for a real, built page. Set false for a nav item with no page yet —
   * see NavItem.built. */
  built?: boolean;
}

// Canonical nav lists — AGENTS.md §3 is the single source of truth (fixed sets; don't
// add/remove/rename without a matching wireframe + an AGENTS.md update in the same PR).
// The wireframe HTML's sidebar text is not binding — docs/WIREFRAMES.md.
const RAW_NAV_ITEMS: Record<Role, RawNavItem[]> = {
  user: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "My Routine", path: "/routine", icon: ClipboardList },
    { label: "Daily Check-in", path: "/check-in", icon: CalendarCheck, built: false },
    // Milestone 1 audit: repointed at the real, built Product Recommendations screen
    // (app/(user)/recommendations) instead of a nonexistent /products catalog page —
    // the nearest real match for "Products" today, not a guess at a second, separate
    // product-browse feature. Flagged in the audit report as an assumption, not a
    // silent decision.
    { label: "Products", path: "/recommendations", icon: ShoppingBag },
    { label: "Ingredients", path: "/ingredients", icon: FlaskConical, built: false },
    { label: "Progress", path: "/progress", icon: TrendingUp },
    { label: "Insights", path: "/insights", icon: Sparkles, built: false },
    { label: "Reports", path: "/reports", icon: FileText, built: false },
    { label: "Notifications", path: "/notifications", icon: Bell, built: false },
    // Phase 3 (theme system): Settings now covers a real Appearance section.
    { label: "Settings", path: "/settings", icon: Settings },
  ],
  consultant: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Clients", path: "/clients", icon: Users },
    { label: "Assessments", path: "/assessments", icon: ClipboardCheck, built: false },
    { label: "Recommendations", path: "/recommendations", icon: Sparkles, built: false },
    { label: "Reports", path: "/reports", icon: FileText, built: false },
    { label: "Settings", path: "/settings", icon: Settings },
  ],
  dermatologist: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Patients", path: "/patients", icon: UserRound },
    {
      label: "Condition Reports",
      path: "/condition-reports",
      icon: FileWarning,
      built: false,
    },
    {
      label: "Treatment Plans",
      path: "/treatment-plans",
      icon: Stethoscope,
      built: false,
    },
    { label: "Analytics", path: "/analytics", icon: BarChart3, built: false },
    { label: "Settings", path: "/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    // Branch 6 (feature/admin-panel): Users now covers real search/ban/unban/role
    // assignment plus the verification queue (linked from that page, not a separate
    // nav item — the fixed 6-item admin nav doesn't grow for it).
    { label: "Users", path: "/users", icon: Users },
    { label: "Content & Data", path: "/content", icon: Database },
    { label: "Monitoring", path: "/monitoring", icon: Activity },
    { label: "System Reports", path: "/system-reports", icon: FileBarChart },
    { label: "Settings", path: "/settings", icon: Settings },
  ],
};

export const NAV_ITEMS: Record<Role, NavItem[]> = Object.fromEntries(
  (Object.entries(RAW_NAV_ITEMS) as [Role, RawNavItem[]][]).map(
    ([role, items]) => [
      role,
      items.map(({ label, path, icon, built = true }) => ({
        label,
        icon,
        built,
        href: `${ROLE_PATH_PREFIX[role]}${path}`,
      })),
    ]
  )
) as Record<Role, NavItem[]>;

// Milestone 1 audit finding: GlassTopbar derives its page title by matching the
// current path against NAV_ITEMS — /profile has no nav entry at all (PROGRESS.md
// Pending: "needs a product decision", not guessed here) so its title rendered
// blank. This is a title-only fallback, not a nav placement decision — it doesn't add
// /profile to any sidebar.
export const EXTRA_TITLES: Partial<Record<string, string>> = {
  "/profile": "Skin Profile",
};

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  consultant: "Skincare Consultant",
  dermatologist: "Dermatologist",
  admin: "Administrator",
};

// Where each role's own dashboard lives — the single source every per-role layout's
// session gate (app/{consultant,dermatologist,admin,(user)}/layout.tsx) and the login
// page redirect to, so a signed-in account is only ever sent to its *own* home, never
// left on (or bounced through) another role's route by a hardcoded "/dashboard".
export const ROLE_HOME: Record<Role, string> = {
  user: "/dashboard",
  consultant: "/consultant/dashboard",
  dermatologist: "/dermatologist/dashboard",
  admin: "/admin/dashboard",
};
