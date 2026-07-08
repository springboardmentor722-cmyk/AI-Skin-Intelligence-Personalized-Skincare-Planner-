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
}

// Canonical nav lists — AGENTS.md §3 is the single source of truth (fixed sets; don't
// add/remove/rename without a matching wireframe + an AGENTS.md update in the same PR).
// The wireframe HTML's sidebar text is not binding — docs/WIREFRAMES.md.
const RAW_NAV_ITEMS: Record<Role, RawNavItem[]> = {
  user: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "My Routine", path: "/routine", icon: ClipboardList },
    { label: "Daily Check-in", path: "/check-in", icon: CalendarCheck },
    { label: "Products", path: "/products", icon: ShoppingBag },
    { label: "Ingredients", path: "/ingredients", icon: FlaskConical },
    { label: "Progress", path: "/progress", icon: TrendingUp },
    { label: "Insights", path: "/insights", icon: Sparkles },
    { label: "Reports", path: "/reports", icon: FileText },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Settings", path: "/settings", icon: Settings },
  ],
  consultant: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Clients", path: "/clients", icon: Users },
    { label: "Assessments", path: "/assessments", icon: ClipboardCheck },
    { label: "Recommendations", path: "/recommendations", icon: Sparkles },
    { label: "Reports", path: "/reports", icon: FileText },
    { label: "Settings", path: "/settings", icon: Settings },
  ],
  dermatologist: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Patients", path: "/patients", icon: UserRound },
    {
      label: "Condition Reports",
      path: "/condition-reports",
      icon: FileWarning,
    },
    { label: "Treatment Plans", path: "/treatment-plans", icon: Stethoscope },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Settings", path: "/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
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
      items.map(({ label, path, icon }) => ({
        label,
        icon,
        href: `${ROLE_PATH_PREFIX[role]}${path}`,
      })),
    ]
  )
) as Record<Role, NavItem[]>;

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  consultant: "Skincare Consultant",
  dermatologist: "Dermatologist",
  admin: "Administrator",
};
