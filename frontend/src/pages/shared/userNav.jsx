import { TbUser, TbClipboardCheck, TbSparkles, TbGauge, TbListCheck, TbFlask, TbChartLine } from "react-icons/tb";

export const USER_NAV_ITEMS = [
  { label: "Skin health score", icon: <TbGauge />, to: "/dashboard" },
  { label: "Personalized routine", icon: <TbListCheck />, to: "/routine" },
  { label: "Product recommendations", icon: <TbFlask />, to: "/recommendations" },
  { label: "Progress tracking", icon: <TbChartLine />, to: "/progress" },
  { label: "Daily checklist", icon: <TbClipboardCheck />, to: "/planner" },
  { label: "My profile", icon: <TbUser />, to: "/profile" },
  { label: "Retake assessment", icon: <TbSparkles />, to: "/assessment" },
];
