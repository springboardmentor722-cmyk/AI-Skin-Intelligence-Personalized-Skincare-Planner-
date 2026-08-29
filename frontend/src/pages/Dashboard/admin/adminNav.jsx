import {
  TbLayoutDashboard,
  TbUsers,
  TbChartBar,
  TbShieldCheck,
  TbFileReport,
} from "react-icons/tb";

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", icon: <TbLayoutDashboard />, to: "/admin" },
  { label: "Users", icon: <TbUsers />, to: "/admin/users" },
  { label: "Analytics", icon: <TbChartBar />, to: "/admin/analytics" },
  { label: "Recommendations", icon: <TbShieldCheck />, to: "/admin/recommendations" },
  { label: "Reports", icon: <TbFileReport />, to: "/admin/reports" },
];
