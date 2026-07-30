import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlarmClock,
  Archive,
  Bell,
  BellRing,
  BookOpen,
  Brain,
  Camera,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileBarChart,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  Lock,
  LayoutDashboard,
  NotebookText,
  Pill,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

// Role type matches Better Auth's user.role column exactly (ADR-003):
// database_schemas/skinlytics_postgresql_schema_v3.sql CHECK constraint.
export type Role = "user" | "consultant" | "dermatologist" | "admin";

export interface NavItem {
  id: string;
  label: string;
  /** Muted second line under the label — MILESTONE_2_UI_SPEC.md §2.2: "50% of the
   * sidebar's visual mass," not optional decoration. Omitted only for the active
   * Dashboard item per §3.1's own note ("active item shows label only"). */
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** False for a nav item whose page hasn't been built yet. Unlike the pre-M2 pattern
   * (a disabled button that never navigates), every item now gets a REAL route with a
   * titled empty-state stub page (components/app-shell/coming-soon.tsx) — Milestone 2
   * P2: "Every nav item gets a real route ... zero href='#', zero dead links." */
  built: boolean;
}

export interface NavSection {
  id: string;
  /** Omitted for the implicit first section (MAIN MENU is never itself labelled in
   * the screenshots — it's just "the items before the first labelled section"). */
  label?: string;
  items: NavItem[];
}

export interface FooterConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref: string;
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
  id: string;
  label: string;
  subtitle?: string;
  path: string;
  icon: LucideIcon;
  built?: boolean;
}

interface RawNavSection {
  id: string;
  label?: string;
  items: RawNavItem[];
}

// Canonical nav trees — MILESTONE_2_UI_SPEC.md §3 transcribed exactly (label,
// subtitle, order, section grouping), cross-checked against UI_EXTRACTION.md's OCR
// pass on the User sidebar crop (all labels/subtitles came back verbatim at 3x,
// P0). Two deliberate additions beyond the literal screenshot trees, each a real,
// already-built feature the screenshots' illustrative trees don't happen to show —
// dropping a working screen to match a screenshot literally would be a regression,
// not fidelity (see docs/DECISIONS.md ADR-022):
//   - User: "Insights" (real /insights, M3-F correlation analytics) kept alongside
//     the new "Reports" stub — different Milestone-2-PDF modules (8 vs 11).
//   - Admin: "Monitoring" (real /admin/monitoring) kept in SYSTEM & SECURITY
//     alongside the three new stubs.
const RAW_NAV: Record<Role, RawNavSection[]> = {
  user: [
    {
      id: "main",
      items: [
        { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        {
          id: "profile",
          label: "My Skin Profile",
          subtitle: "View & update your profile",
          path: "/profile",
          icon: UserRound,
        },
        {
          id: "assessment",
          label: "Skin Assessment",
          subtitle: "Analyze your skin condition",
          path: "/assessment",
          icon: ClipboardCheck,
        },
        {
          id: "routine",
          label: "My Routine",
          subtitle: "Your personalized routine",
          path: "/routine",
          icon: ClipboardList,
        },
        {
          id: "products",
          label: "Product Recommendations",
          subtitle: "Products for your skin",
          path: "/products",
          icon: ShoppingBag,
        },
        {
          id: "ingredients",
          label: "Ingredient Analyzer",
          subtitle: "Check ingredients & safety",
          path: "/ingredients",
          icon: FlaskConical,
        },
        {
          id: "progress",
          label: "Progress Tracking",
          subtitle: "Track your skin progress",
          path: "/progress",
          icon: TrendingUp,
        },
        {
          id: "check-in",
          label: "Lifestyle & Habits",
          subtitle: "Sleep, water & lifestyle",
          path: "/check-in",
          icon: AlarmClock,
        },
        // Real, already-built (M3-F) — kept alongside the docx's "Reports" (a
        // different, still-unbuilt module: export/download, not analytics).
        {
          id: "insights",
          label: "Insights",
          subtitle: "Correlations from your history",
          path: "/insights",
          icon: Sparkles,
        },
        {
          id: "reports",
          label: "Reports",
          subtitle: "View & download reports",
          path: "/reports",
          icon: FileText,
          built: false,
        },
        {
          id: "reminders",
          label: "Reminders",
          subtitle: "Routine & habit reminders",
          path: "/reminders",
          icon: BellRing,
          built: false,
        },
        {
          id: "settings",
          label: "Settings",
          subtitle: "Account & preferences",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
    {
      id: "quick-actions",
      label: "Quick Actions",
      items: [
        {
          id: "skin-scan",
          label: "Skin Scan",
          subtitle: "Start new skin assessment",
          path: "/assessment",
          icon: ClipboardCheck,
        },
        {
          id: "ask-ai",
          label: "Ask AI",
          subtitle: "Get skincare guidance",
          path: "/ask-ai",
          icon: Sparkles,
          built: false,
        },
        {
          id: "upload-photo",
          label: "Upload Photo",
          subtitle: "Analyze your skin",
          path: "/upload-photo",
          icon: Camera,
          built: false,
        },
      ],
    },
  ],
  consultant: [
    {
      id: "main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          subtitle: "Overview & key metrics",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "clients",
          label: "Clients",
          subtitle: "Manage client profiles",
          path: "/clients",
          icon: Users,
        },
        {
          id: "assessments",
          label: "Assessments",
          subtitle: "Skin assessments & analysis",
          path: "/assessments",
          icon: ClipboardCheck,
          built: false,
        },
        {
          id: "routine-plans",
          label: "Routine Plans",
          subtitle: "Create & manage routines",
          path: "/routine-plans",
          icon: ClipboardList,
          built: false,
        },
        {
          id: "recommendations",
          label: "Product Recommendations",
          subtitle: "View & recommend products",
          path: "/recommendations",
          icon: Sparkles,
          built: false,
        },
        {
          id: "progress",
          label: "Progress Tracking",
          subtitle: "Track client progress",
          path: "/progress",
          icon: TrendingUp,
          built: false,
        },
        {
          id: "reports",
          label: "Reports",
          subtitle: "Client reports & analytics",
          path: "/reports",
          icon: FileText,
          built: false,
        },
        {
          id: "follow-ups",
          label: "Follow-ups & Notes",
          subtitle: "Notes & follow-up history",
          path: "/follow-ups",
          icon: NotebookText,
          built: false,
        },
        {
          id: "reminders",
          label: "Reminders",
          subtitle: "Appointments & reminders",
          path: "/reminders",
          icon: AlarmClock,
          built: false,
        },
      ],
    },
    {
      id: "tools",
      label: "Tools & Resources",
      items: [
        {
          id: "ingredient-database",
          label: "Ingredient Database",
          subtitle: "Search & analyze ingredients",
          path: "/ingredient-database",
          icon: FlaskConical,
          built: true,
        },
        {
          id: "concerns-guide",
          label: "Skin Concerns Guide",
          subtitle: "Reference & solutions",
          path: "/concerns-guide",
          icon: BookOpen,
          built: false,
        },
        {
          id: "treatment-protocols",
          label: "Treatment Protocols",
          subtitle: "Clinical treatment guides",
          path: "/treatment-protocols",
          icon: Stethoscope,
          built: false,
        },
      ],
    },
  ],
  dermatologist: [
    {
      id: "main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          subtitle: "Overview & key insights",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "patients",
          label: "Patients",
          subtitle: "Manage patient profiles",
          path: "/patients",
          icon: UserRound,
        },
        {
          id: "assessments",
          label: "Assessments",
          subtitle: "Skin assessments & analysis",
          path: "/assessments",
          icon: ClipboardCheck,
          built: false,
        },
        {
          id: "clinical-insights",
          label: "Clinical Insights",
          subtitle: "AI insights & risk analysis",
          path: "/clinical-insights",
          icon: Brain,
          built: false,
        },
        {
          id: "treatment-plans",
          label: "Treatment Plans",
          subtitle: "Create & manage plans",
          path: "/treatment-plans",
          icon: Stethoscope,
          built: false,
        },
        {
          id: "progress",
          label: "Progress Tracking",
          subtitle: "Monitor patient progress",
          path: "/progress",
          icon: TrendingUp,
          built: false,
        },
        {
          id: "prescriptions",
          label: "Prescriptions",
          subtitle: "Manage prescriptions",
          path: "/prescriptions",
          icon: Pill,
          built: false,
        },
        {
          id: "reports",
          label: "Reports",
          subtitle: "Clinical reports & analytics",
          path: "/reports",
          icon: FileText,
          built: false,
        },
        {
          id: "consultations",
          label: "Consultations",
          subtitle: "Appointments & notes",
          path: "/consultations",
          icon: Users,
          built: false,
        },
        {
          id: "follow-ups",
          label: "Follow-ups",
          subtitle: "Follow-up tracking",
          path: "/follow-ups",
          icon: AlarmClock,
          built: false,
        },
        {
          id: "reminders",
          label: "Reminders",
          subtitle: "Treatment reminders",
          path: "/reminders",
          icon: BellRing,
          built: false,
        },
      ],
    },
    {
      id: "tools",
      label: "Tools & Resources",
      items: [
        {
          id: "ingredient-database",
          label: "Ingredient Database",
          subtitle: "Search & analyze ingredients",
          path: "/ingredient-database",
          icon: FlaskConical,
          built: true,
        },
        {
          id: "treatment-protocols",
          label: "Treatment Protocols",
          subtitle: "Clinical treatment guides",
          path: "/treatment-protocols",
          icon: Stethoscope,
          built: false,
        },
        {
          id: "conditions-guide",
          label: "Skin Conditions Guide",
          subtitle: "Reference & solutions",
          path: "/conditions-guide",
          icon: BookOpen,
          built: false,
        },
        {
          id: "research",
          label: "Research & Publications",
          subtitle: "Latest dermatology research",
          path: "/research",
          icon: GraduationCap,
          built: false,
        },
      ],
    },
  ],
  admin: [
    {
      id: "main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          subtitle: "Overview & Analytics",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "users",
          label: "User Management",
          subtitle: "Manage users & roles",
          path: "/users",
          icon: Users,
        },
        {
          id: "roles-permissions",
          label: "Role & Permissions",
          subtitle: "Manage roles & access",
          path: "/roles-permissions",
          icon: ShieldCheck,
          built: false,
        },
        {
          id: "assessments",
          label: "Skin Assessments",
          subtitle: "View all assessments",
          path: "/assessments",
          icon: ClipboardCheck,
          built: false,
        },
        {
          id: "routines",
          label: "Routine Management",
          subtitle: "Manage routines & plans",
          path: "/routines",
          icon: ClipboardList,
          built: false,
        },
        {
          id: "products",
          label: "Product Management",
          subtitle: "Manage products",
          path: "/products",
          icon: ShoppingBag,
          built: false,
        },
        {
          id: "ingredients",
          label: "Ingredient Database",
          subtitle: "Manage ingredients",
          path: "/ingredients",
          icon: FlaskConical,
          built: true,
        },
        {
          id: "content",
          label: "Content Management",
          subtitle: "Manage articles & resources",
          path: "/content",
          icon: Database,
        },
        {
          id: "system-reports",
          label: "Reports & Analytics",
          subtitle: "Platform reports",
          path: "/system-reports",
          icon: FileBarChart,
        },
        {
          id: "notifications",
          label: "Notifications",
          subtitle: "System notifications",
          path: "/notifications",
          icon: Bell,
          built: false,
        },
        {
          id: "settings",
          label: "System Settings",
          subtitle: "Configure platform settings",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
    {
      id: "system-security",
      label: "System & Security",
      items: [
        // Real, already-built — kept alongside the docx's 3 new items (see header
        // comment / ADR-022): a different, already-shipped system-health screen.
        {
          id: "monitoring",
          label: "Monitoring",
          subtitle: "System health & performance",
          path: "/monitoring",
          icon: Activity,
        },
        {
          id: "audit-logs",
          label: "Audit Logs",
          subtitle: "System activity logs",
          path: "/audit-logs",
          icon: History,
          built: false,
        },
        {
          id: "security",
          label: "Security & Access",
          subtitle: "Manage security settings",
          path: "/security",
          icon: Lock,
          built: false,
        },
        {
          id: "backup-restore",
          label: "Backup & Restore",
          subtitle: "Data backup & restore",
          path: "/backup-restore",
          icon: Archive,
          built: false,
        },
      ],
    },
  ],
};

export const NAV_SECTIONS: Record<Role, NavSection[]> = Object.fromEntries(
  (Object.entries(RAW_NAV) as [Role, RawNavSection[]][]).map(([role, sections]) => [
    role,
    sections.map((section) => ({
      id: section.id,
      label: section.label,
      items: section.items.map(({ id, label, subtitle, path, icon, built = true }) => ({
        id,
        label,
        subtitle,
        icon,
        built,
        href: `${ROLE_PATH_PREFIX[role]}${path}`,
      })),
    })),
  ])
) as Record<Role, NavSection[]>;

// Flat view — GlassTopbar's title lookup and any other consumer that just needs
// "all nav items for this role" without caring about section grouping.
export const NAV_ITEMS: Record<Role, NavItem[]> = Object.fromEntries(
  (Object.entries(NAV_SECTIONS) as [Role, NavSection[]][]).map(([role, sections]) => [
    role,
    sections.flatMap((s) => s.items),
  ])
) as Record<Role, NavItem[]>;

// GlassTopbar's fallback for any route with no matching NAV_ITEMS entry (a
// title-only mechanism, not a nav placement decision).
export const EXTRA_TITLES: Partial<Record<string, string>> = {};

// Every role's settings item has id "settings" (see RAW_NAV above) but a
// role-specific label ("Settings" vs admin's literal-per-UI_SPEC "System
// Settings") — match by the stable id, not the display label, so a copy change
// in one role's nav tree can't silently break the other three callers
// (GlassTopbar, NavUser, LandingNavbar) that all need "wherever Settings lives".
export function getSettingsHref(role: Role): string | undefined {
  return NAV_ITEMS[role].find((item) => item.id === "settings")?.href;
}

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  consultant: "Skincare Consultant",
  dermatologist: "Dermatologist",
  admin: "Administrator",
};

// Brand-block subtitle, MILESTONE_2_UI_SPEC.md §2.1.
export const ROLE_BRAND_SUBTITLE: Record<Role, string> = {
  user: "AI Skincare Companion",
  consultant: "Consultant Panel",
  dermatologist: "Dermatologist Panel",
  admin: "Admin Panel",
};

// Sidebar active-item treatment, MILESTONE_2_UI_SPEC.md §2.2: solid for
// user/dermatologist/admin, soft-tint for consultant. Both variants are real,
// deliberately preserved differences — not a single style picked over the other.
export const ROLE_ACTIVE_VARIANT: Record<Role, "solid" | "soft"> = {
  user: "solid",
  consultant: "soft",
  dermatologist: "solid",
  admin: "solid",
};

// Sidebar footer slot, MILESTONE_2_UI_SPEC.md §3 — per-role card, distinct wording
// for consultant vs. dermatologist (deliberately not normalised into one string).
export const ROLE_FOOTER: Record<Role, FooterConfig> = {
  // No premium/billing tier exists in this app yet (docs/DECISIONS.md ADR-033) — this
  // used to advertise "Upgrade to Premium" with a working button leading to a settings
  // page with no premium content at all (bug_report.md 2026-07-30, bug #2). Reframed
  // around Settings -> Appearance, a real shipped feature (8 palettes, light/dark/
  // system), same "no actionLabel, description-only" shape the other three roles
  // already use here so there's no dead-end button.
  user: {
    icon: Sparkles,
    title: "Make It Yours",
    description: "8 themes, light, dark, or system — tune it in Settings.",
    actionHref: "/settings",
  },
  consultant: {
    icon: Sparkles,
    title: "Ask AI Assistant",
    description: "Get AI-powered suggestions",
    actionHref: "/consultant/dashboard",
  },
  dermatologist: {
    icon: Sparkles,
    title: "Ask AI Assistant",
    description: "Get AI-powered clinical support",
    actionHref: "/dermatologist/dashboard",
  },
  admin: {
    icon: Activity,
    title: "Platform Status",
    description: "All systems operational · Uptime: 99.9%",
    actionHref: "/admin/monitoring",
  },
};

// Topbar chrome, MILESTONE_2_UI_SPEC.md §2.3. The dashboard's own greeting/subtitle
// hero copy is dashboard-page content (P4/P5), not global shell chrome — this table
// covers what's actually persistent across every route: search placeholder, avatar
// caption, and (consultant-only) the primary action button. Bell unread count used to
// be a hardcoded fixture here (bugs_report.md 2026-07-26, bug #4) — it's real data
// from GET /api/v1/notifications/me now (glass-topbar.tsx's NotificationBell), so it
// doesn't belong in a static per-role config.
export interface TopbarConfig {
  searchPlaceholder: string | null;
  avatarCaption: string;
  primaryActionLabel: string | null;
  primaryActionHref: string | null;
}

export const ROLE_TOPBAR: Record<Role, TopbarConfig> = {
  user: {
    searchPlaceholder: null,
    avatarCaption: "User",
    primaryActionLabel: null,
    primaryActionHref: null,
  },
  // primaryActionLabel/Href are null here now, same as every other role
  // (bugs_report.md 2026-07-26, bug #5) — a consultant has no self-service way to
  // add a client (consultant_clients rows are admin-assigned only, see
  // components/admin/assign-client-dialog.tsx), so a CTA promising that action was
  // the actual bug, not a missing destination for it to link to.
  consultant: {
    searchPlaceholder: "Search clients, assessments…",
    avatarCaption: "Skincare Consultant",
    primaryActionLabel: null,
    primaryActionHref: null,
  },
  dermatologist: {
    searchPlaceholder: "Search patients, assessments…",
    avatarCaption: "Dermatologist",
    primaryActionLabel: null,
    primaryActionHref: null,
  },
  admin: {
    searchPlaceholder: "Search users, reports, assessments…",
    avatarCaption: "Super Administrator",
    primaryActionLabel: null,
    primaryActionHref: null,
  },
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
