import {
  LayoutDashboard,
  ClipboardCheck,
  CalendarClock,
  Sparkles,
  Droplets,
  UserCircle,
  ShoppingBag,
  Users,
  Star,
  BarChart3,
  Stethoscope,
  FileText,
  Settings,
  ShieldCheck,
  Activity,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

export const USER_SIDEBAR = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Assessment", to: "/assessment", icon: ClipboardCheck, group: "main" },
  { label: "Daily Planner", to: "/planner", icon: CalendarClock, group: "main" },
  { label: "Progress", to: "/progress", icon: TrendingUp, group: "main" },
  { label: "Bookings", to: "/bookings", icon: Stethoscope, group: "main" },
  { label: "Store", to: "/store", icon: ShoppingBag, group: "main" },
  { label: "Profile", to: "/profile", icon: UserCircle, group: "main" },
  { label: "Skin Profile", to: "/skin-profile", icon: Sparkles, group: "main" },
  { label: "Lifestyle", to: "/lifestyle", icon: Droplets, group: "main" },
  { label: "Settings", to: "/settings", icon: Settings, group: "main", comingSoon: true },
];

export const CONSULTANT_SIDEBAR = [
  { label: "Dashboard", to: "/consultant/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Assigned Clients", to: "/consultant/clients", icon: Users, group: "main" },
  { label: "Recommendations", to: "/consultant/recommendations", icon: Star, group: "main" },
  { label: "Analytics", to: "/consultant/analytics", icon: BarChart3, group: "main", comingSoon: true },
  { label: "Settings", to: "/settings", icon: Settings, group: "main", comingSoon: true },
];

export const DERMATOLOGIST_SIDEBAR = [
  { label: "Dashboard", to: "/dermatologist/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Patients", to: "/dermatologist/patients", icon: Users, group: "main" },
  { label: "Reports", to: "/dermatologist/reports", icon: FileText, group: "main", comingSoon: true },
  { label: "AI Diagnosis", to: "/dermatologist/ai-diagnosis", icon: Sparkles, group: "main", comingSoon: true },
  { label: "Settings", to: "/settings", icon: Settings, group: "main", comingSoon: true },
];

export const ADMIN_SIDEBAR = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Users", to: "/admin/users", icon: Users, group: "main" },
  { label: "Role Management", to: "/admin/roles", icon: ShieldCheck, group: "main", comingSoon: true },
  { label: "Recommendations", to: "/admin/recommendations", icon: Star, group: "main" },
  { label: "System Status", to: "/admin/system-status", icon: Activity, group: "main" },
  { label: "Activity Logs", to: "/admin/activity-logs", icon: ClipboardList, group: "main" },
  { label: "Settings", to: "/settings", icon: Settings, group: "main", comingSoon: true },
];
