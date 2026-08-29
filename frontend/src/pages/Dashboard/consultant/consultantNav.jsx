import {
  TbLayoutDashboard,
  TbUsers,
  TbClipboardText,
  TbShieldCheck,
} from "react-icons/tb";

export const CONSULTANT_NAV_ITEMS = [
  { label: "Overview", icon: <TbLayoutDashboard />, to: "/consultant" },
  { label: "Clients", icon: <TbUsers />, to: "/consultant/clients" },
  { label: "Assessments", icon: <TbClipboardText />, to: "/consultant/assessments" },
  { label: "Recommendations", icon: <TbShieldCheck />, to: "/consultant/recommendations" },
];
