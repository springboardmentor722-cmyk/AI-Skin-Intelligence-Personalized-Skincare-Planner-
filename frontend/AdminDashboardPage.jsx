import { useState } from "react";
import { Box, Stack, Typography, Avatar, IconButton, Badge, InputBase } from "@mui/material";
import {
  Search,
  NotificationsNone,
  CalendarMonth,
  KeyboardArrowDown,
  DashboardOutlined,
  PeopleAltOutlined,
  MedicalServicesOutlined,
  EventNoteOutlined,
  FactCheckOutlined,
  Inventory2Outlined,
  ShoppingBagOutlined,
  BarChartOutlined,
  ChatBubbleOutlineOutlined,
  SettingsOutlined,
  HistoryOutlined,
  Spa,
  Groups,
  ShoppingBag,
  TrendingUp,
  AddCircleOutline,
  PersonAddAlt1Outlined,
  ScheduleOutlined,
  AssessmentOutlined,
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

const getThemeColor = (key, fallback) => {
  try {
    const parts = key.split(".");
    let current = COLORS;
    for (const part of parts) {
      if (current && typeof current === "object" && current[part] !== undefined) {
        current = current[part];
      } else {
        return fallback;
      }
    }
    return current || fallback;
  } catch (e) {
    return fallback;
  }
};

const cPrimary = getThemeColor("primary", "#8B6FC9");
const cPrimaryDark = getThemeColor("primaryDark", "#6E52AD");
const cSecondary = getThemeColor("secondary", "#E4749B");
const cBrandGradient = getThemeColor("brandGradient", "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)");
const cCardBorder = getThemeColor("cardBorder", "rgba(139, 111, 201, 0.12)");
const cTextDark = getThemeColor("textDark", "#1C1917");
const cTextMuted = getThemeColor("textMuted", "#6B7280");
const cTextFaint = getThemeColor("textFaint", "#9CA3AF");
const cSuccess = getThemeColor("success", "#2E9E5B");

const NAV_ITEMS = [
  { label: "Overview", icon: DashboardOutlined, key: "overview" },
  { label: "Users", icon: PeopleAltOutlined, key: "users" },
  { label: "Consultants", icon: MedicalServicesOutlined, key: "consultants" },
  { label: "Appointments", icon: EventNoteOutlined, key: "appointments" },
  { label: "Assessments", icon: FactCheckOutlined, key: "assessments" },
  { label: "Products", icon: Inventory2Outlined, key: "products" },
  { label: "Orders", icon: ShoppingBagOutlined, key: "orders" },
  { label: "Reports", icon: BarChartOutlined, key: "reports" },
  { label: "Feedback", icon: ChatBubbleOutlineOutlined, key: "feedback" },
  { label: "Settings", icon: SettingsOutlined, key: "settings" },
  { label: "Activity Logs", icon: HistoryOutlined, key: "logs" },
];

const STATS = [
  { label: "Total Users", value: "2,453", trend: "+12.5% from last month", icon: Groups },
  { label: "Total Appointments", value: "1,286", trend: "+8.4% from last month", icon: EventNoteOutlined },
  { label: "Total Assessments", value: "3,680", trend: "+15.3% from last month", icon: FactCheckOutlined },
  { label: "Total Orders", value: "1,024", trend: "+10.2% from last month", icon: ShoppingBag },
];

const USER_TREND = [820, 1240, 980, 1560, 1340, 1890, 1680, 2453];
const USER_TREND_LABELS = ["May 14", "May 15", "May 16", "May 17", "May 18", "May 19", "May 20"];

const SKIN_TYPE_BREAKDOWN = [
  { label: "Dry", value: 28, color: cPrimary },
  { label: "Oily", value: 24, color: cSecondary },
  { label: "Combination", value: 22, color: "#F0B45E" },
  { label: "Sensitive", value: 15, color: "#7FB88F" },
  { label: "Normal", value: 11, color: "#B9AEDD" },
];

const RECENT_APPOINTMENTS = [
  { name: "Priya Sharma", time: "10:00 AM", status: "Completed" },
  { name: "Ananya Mehta", time: "11:30 AM", status: "Confirmed" },
  { name: "Neha Kapoor", time: "01:00 PM", status: "Pending" },
  { name: "Riya Patel", time: "02:30 PM", status: "Confirmed" },
  { name: "Sneha Iyer", time: "04:00 PM", status: "Completed" },
];

const STATUS_STYLES = {
  Completed: { color: cSuccess, bg: "#EAF5ED" },
  Confirmed: { color: cPrimary, bg: "rgba(139,111,201,0.12)" },
  Pending: { color: "#C9861B", bg: "#FBF1E2" },
};

const ORDERS_TREND = [420, 610, 350, 780, 690, 540, 830];

const PLATFORM_ACTIVITY = [
  { text: "New user registered", sub: "Ananya Sharma", time: "10:20 AM", icon: PersonAddAlt1Outlined },
  { text: "New assessment completed", sub: "Priya Sharma", time: "09:45 AM", icon: FactCheckOutlined },
  { text: "New order placed", sub: "Order #1024", time: "09:30 AM", icon: ShoppingBagOutlined },
  { text: "New consultant joined", sub: "Dr. Radhika Iyer", time: "Yesterday", icon: MedicalServicesOutlined },
  { text: "System update completed", sub: "Version 2.5.1", time: "May 18", icon: SettingsOutlined },
];

const QUICK_ACTIONS = [
  { label: "Add New User", icon: PersonAddAlt1Outlined },
  { label: "Add Consultant", icon: MedicalServicesOutlined },
  { label: "Schedule Appointment", icon: ScheduleOutlined },
  { label: "View Reports", icon: AssessmentOutlined },
  { label: "Manage Products", icon: Inventory2Outlined },
  { label: "System Settings", icon: SettingsOutlined },
];

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

// --- Simple inline SVG line chart, no chart library dependency ---
function LineChart({ data, labels, height = 160, color = cPrimary }) {
  const width = 560;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 20) - 10;
    return [x, y];
  });
  const linePath = points.map(([x, y], i) => (i === 0 ? "M" + x + "," + y : "L" + x + "," + y)).join(" ");
  const areaPath = linePath + " L" + width + "," + height + " L0," + height + " Z";

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={"0 0 " + width + " " + height} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lineAreaFill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4.5 : 3} fill="#fff" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, mt: 0.5 }}>
        {labels.map((l) => (
          <Typography key={l} sx={{ fontSize: 9.5, color: cTextFaint }}>
            {l}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

// --- Simple inline SVG donut chart ---
function DonutChart({ data, size = 150, thickness = 22 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const innerRadius = radius - thickness;
  let cumulative = 0;

  const arcs = data.map((d) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);
    const ix1 = radius + innerRadius * Math.cos(startAngle);
    const iy1 = radius + innerRadius * Math.sin(startAngle);
    const ix2 = radius + innerRadius * Math.cos(endAngle);
    const iy2 = radius + innerRadius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = [
      "M", x1, y1,
      "A", radius, radius, 0, largeArc, 1, x2, y2,
      "L", ix2, iy2,
      "A", innerRadius, innerRadius, 0, largeArc, 0, ix1, iy1,
      "Z",
    ].join(" ");
    return { path, color: d.color };
  });

  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
      {arcs.map((a, i) => (
        <path key={i} d={a.path} fill={a.color} />
      ))}
    </svg>
  );
}

// --- Simple inline SVG bar chart ---
function BarChart({ data, labels, height = 160, color = cSecondary }) {
  const width = 460;
  const max = Math.max(...data);
  const barWidth = (width / data.length) * 0.5;
  const gap = (width / data.length) * 0.5;

  return (
    <Box sx={{ width: "100%" }}>
      <svg viewBox={"0 0 " + width + " " + height} width="100%" height={height} preserveAspectRatio="none">
        {data.map((v, i) => {
          const barHeight = (v / max) * (height - 10);
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barHeight;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill={i === data.length - 1 ? cPrimary : color}
              opacity={i === data.length - 1 ? 1 : 0.75}
            />
          );
        })}
      </svg>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, mt: 0.5 }}>
        {labels.map((l) => (
          <Typography key={l} sx={{ fontSize: 9.5, color: cTextFaint }}>
            {l}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function Card({ children, sx }) {
  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: "1px solid " + cCardBorder,
        boxShadow: "0 4px 18px rgba(139,111,201,0.06)",
        p: { xs: 2.25, sm: 2.75 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function CardHeader({ title, actionLabel }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark }}>{title}</Typography>
      {actionLabel && (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: cPrimary, cursor: "pointer" }}>
          {actionLabel}
        </Typography>
      )}
    </Stack>
  );
}

export default function AdminDashboardPage({ adminName = "Admin User" }) {
  const [active, setActive] = useState("overview");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FAF8FC" }}>
      {/* ================= SIDEBAR ================= */}
      <Box
        sx={{
          width: 232,
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          background: "linear-gradient(180deg, #FFFFFF 0%, #FDF6FA 100%)",
          borderRight: "1px solid " + cCardBorder,
          p: 2.5,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 3.5, px: 0.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "12px",
              background: cBrandGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spa sx={{ color: "#fff", fontSize: 19 }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: cTextDark, lineHeight: 1.1 }}>
              Admin
            </Typography>
            <Typography sx={{ fontSize: 10, color: cTextMuted }}>Dashboard</Typography>
          </Box>
        </Stack>

        <Stack spacing={0.4} sx={{ flex: 1, overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <Stack
                key={item.key}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => setActive(item.key)}
                sx={{
                  px: 1.5,
                  py: 1.1,
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: isActive ? cBrandGradient : "transparent",
                  boxShadow: isActive ? "0 6px 16px rgba(139,111,201,0.28)" : "none",
                  transition: "all 0.15s ease",
                  "&:hover": { backgroundColor: isActive ? undefined : "rgba(139,111,201,0.06)" },
                }}
              >
                <Icon sx={{ fontSize: 19, color: isActive ? "#fff" : cTextMuted }} />
                <Typography sx={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : cTextMuted }}>
                  {item.label}
                </Typography>
              </Stack>
            );
          })}
        </Stack>

        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ p: 1.25, borderRadius: "14px", backgroundColor: "#FFFFFF", border: "1px solid " + cCardBorder, mt: 1.5 }}
        >
          <Avatar sx={{ width: 34, height: 34, background: cBrandGradient, fontSize: 12, fontWeight: 700 }}>
            {initials(adminName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{adminName}</Typography>
            <Typography sx={{ fontSize: 10, color: cTextMuted }}>Super Admin</Typography>
          </Box>
          <KeyboardArrowDown sx={{ fontSize: 16, color: cTextFaint, ml: "auto" }} />
        </Stack>
      </Box>

      {/* ================= MAIN CONTENT ================= */}
      <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1500, mx: "auto", width: "100%" }}>
        {/* Top bar */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              backgroundColor: "#FFF",
              border: "1px solid " + cCardBorder,
              borderRadius: "999px",
              px: 2,
              py: 1,
              minWidth: 240,
              flex: { xs: 1, md: "none" },
            }}
          >
            <Search sx={{ fontSize: 18, color: cTextFaint }} />
            <InputBase placeholder="Search anything..." sx={{ fontSize: 13, flex: 1 }} />
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
              <Badge variant="dot" color="error">
                <NotificationsNone sx={{ fontSize: 19, color: cTextMuted }} />
              </Badge>
            </IconButton>
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
              <CalendarMonth sx={{ fontSize: 19, color: cTextMuted }} />
            </IconButton>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 36, height: 36, background: cBrandGradient, fontSize: 12, fontWeight: 700 }}>
                {initials(adminName)}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark, lineHeight: 1.2 }}>
                  {adminName}
                </Typography>
                <Typography sx={{ fontSize: 10, color: cTextMuted }}>Super Admin</Typography>
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 16, color: cTextFaint }} />
            </Stack>
          </Stack>
        </Stack>

        {/* Welcome + date */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 800, color: cTextDark }}>
              Welcome back, Admin! 👋
            </Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted, mt: 0.5 }}>
              Here's what's happening on your platform today.
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder, borderRadius: "14px", px: 2, py: 1 }}
          >
            <CalendarMonth sx={{ fontSize: 16, color: cPrimary }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>
              {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
          </Stack>
        </Stack>

        {/* Stat cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 2.5 }}>
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      backgroundColor: "rgba(139,111,201,0.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon sx={{ fontSize: 19, color: cPrimary }} />
                  </Box>
                  <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 600 }}>{s.label}</Typography>
                </Stack>
                <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: cTextDark, lineHeight: 1 }}>
                  {s.value}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                  <TrendingUp sx={{ fontSize: 13, color: cSuccess }} />
                  <Typography sx={{ fontSize: 10.5, color: cSuccess, fontWeight: 700 }}>{s.trend}</Typography>
                </Stack>
              </Card>
            );
          })}
        </Box>

        {/* Row 2: User Overview / Assessments by Skin Type / Recent Appointments */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.3fr 1fr 1.1fr" }, gap: 2, mb: 2.5 }}>
          <Card>
            <CardHeader title="User Overview" actionLabel="View all" />
            <LineChart data={USER_TREND.slice(-7)} labels={USER_TREND_LABELS} />
            <Stack direction="row" spacing={3} sx={{ mt: 2, pt: 2, borderTop: "1px solid " + cCardBorder }}>
              <Box>
                <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Total Users</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>2,453</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Active Users</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>1,892</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>New Users</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>561</Typography>
              </Box>
            </Stack>
          </Card>

          <Card>
            <CardHeader title="Assessments by Skin Type" actionLabel="View report" />
            <Stack alignItems="center" sx={{ mb: 2 }}>
              <DonutChart data={SKIN_TYPE_BREAKDOWN} />
            </Stack>
            <Stack spacing={1}>
              {SKIN_TYPE_BREAKDOWN.map((d) => (
                <Stack key={d.label} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.color }} />
                    <Typography sx={{ fontSize: 12, color: cTextMuted }}>{d.label}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{d.value}%</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Card>
            <CardHeader title="Recent Appointments" actionLabel="View all" />
            <Stack spacing={1.5}>
              {RECENT_APPOINTMENTS.map((a) => {
                const st = STATUS_STYLES[a.status];
                return (
                  <Stack key={a.name} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar sx={{ width: 30, height: 30, background: cBrandGradient, fontSize: 11, fontWeight: 700 }}>
                        {initials(a.name)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark }}>{a.name}</Typography>
                        <Typography sx={{ fontSize: 10.5, color: cTextFaint }}>{a.time}</Typography>
                      </Box>
                    </Stack>
                    <Box
                      sx={{
                        px: 1.1,
                        py: 0.3,
                        borderRadius: "999px",
                        backgroundColor: st.bg,
                        color: st.color,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {a.status}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </Box>

        {/* Row 3: Orders Overview / Platform Activity / Quick Actions */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.3fr 1fr 1.1fr" }, gap: 2 }}>
          <Card>
            <CardHeader title="Orders Overview" actionLabel="This Month ⌄" />
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <BarChart data={ORDERS_TREND} labels={["14", "15", "16", "17", "18", "19", "20"]} />
              </Box>
              <Box
                sx={{
                  minWidth: 130,
                  p: 1.5,
                  borderRadius: "14px",
                  backgroundColor: "rgba(139,111,201,0.06)",
                  border: "1px solid " + cCardBorder,
                }}
              >
                <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Total Revenue</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark }}>$45,680</Typography>
                <Typography sx={{ fontSize: 10, color: cSuccess, fontWeight: 700, mb: 1 }}>+14.8% from last month</Typography>
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Total Orders</Typography>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: cTextDark }}>1,024</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Pending</Typography>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: cTextDark }}>132</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Delivered</Typography>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: cTextDark }}>892</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Card>

          <Card>
            <CardHeader title="Platform Activity" actionLabel="View all" />
            <Stack spacing={1.75}>
              {PLATFORM_ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Stack key={i} direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        backgroundColor: "rgba(139,111,201,0.10)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 16, color: cPrimary }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{a.text}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: cTextFaint }}>{a.sub}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 10, color: cTextFaint, whiteSpace: "nowrap" }}>{a.time}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Card>

          <Card>
            <CardHeader title="Quick Actions" />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Stack
                    key={a.label}
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.75}
                    sx={{
                      p: 1.5,
                      borderRadius: "14px",
                      backgroundColor: "rgba(139,111,201,0.06)",
                      border: "1px solid " + cCardBorder,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                      "&:hover": { backgroundColor: "rgba(139,111,201,0.12)" },
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: cPrimary }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark, lineHeight: 1.2 }}>
                      {a.label}
                    </Typography>
                  </Stack>
                );
              })}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
