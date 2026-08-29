import {
  TbLayoutDashboard,
  TbUsers,
  TbStethoscope,
  TbNotes,
  TbChartLine,
} from "react-icons/tb";

export const DERM_NAV_ITEMS = [
  { label: "Overview", icon: <TbLayoutDashboard />, to: "/dermatologist" },
  { label: "Patients", icon: <TbUsers />, to: "/dermatologist/patients" },
  { label: "Condition reports", icon: <TbStethoscope />, to: "/dermatologist/reports" },
  { label: "Progress analytics", icon: <TbChartLine />, to: "/dermatologist/progress" },
  { label: "Treatment notes", icon: <TbNotes />, to: "/dermatologist/notes" },
];
