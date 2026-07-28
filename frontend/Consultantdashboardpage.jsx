import { useState } from "react";
import { Box, Stack, Typography, Avatar, IconButton, Badge, InputBase, Button, LinearProgress } from "@mui/material";
import {
  Search,
  NotificationsNone,
  CalendarMonth,
  KeyboardArrowDown,
  DashboardOutlined,
  PeopleAltOutlined,
  EventNoteOutlined,
  FactCheckOutlined,
  AssignmentOutlined,
  RecommendOutlined,
  Inventory2Outlined,
  TrendingUpOutlined,
  ChatBubbleOutlineOutlined,
  EventAvailableOutlined,
  BarChartOutlined,
  SettingsOutlined,
  Spa,
  Add,
  AutoAwesome,
  Groups,
  Diversity1,
  SentimentSatisfiedAlt,
  MenuOutlined,
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
const cWarning = getThemeColor("warning", "#C9861B");

const NAV_ITEMS = [
  { label: "Dashboard", icon: DashboardOutlined, key: "dashboard" },
  { label: "Clients", icon: PeopleAltOutlined, key: "clients" },
  { label: "Consultations", icon: EventNoteOutlined, key: "consultations" },
  { label: "Skin Analysis", icon: FactCheckOutlined, key: "analysis" },
  { label: "Routine Plans", icon: AssignmentOutlined, key: "routines" },
  { label: "Recommendations", icon: RecommendOutlined, key: "recommendations" },
  { label: "Products", icon: Inventory2Outlined, key: "products" },
  { label: "Progress Tracking", icon: TrendingUpOutlined, key: "progress" },
  { label: "Messages", icon: ChatBubbleOutlineOutlined, key: "messages", badge: 12 },
  { label: "Appointments", icon: EventAvailableOutlined, key: "appointments" },
  { label: "Reports & Insights", icon: BarChartOutlined, key: "reports" },
  { label: "Settings", icon: SettingsOutlined, key: "settings" },
];

const STATS = [
  { label: "Total Clients", value: "248", trend: "+18% this month", icon: Groups },
  { label: "Active Consultations", value: "32", trend: "+12% this week", icon: EventNoteOutlined },
  { label: "Completed Analyses", value: "186", trend: "+25% this month", icon: FactCheckOutlined },
  { label: "Client Satisfaction", value: "4.8/5", trend: "Excellent rating", icon: SentimentSatisfiedAlt },
];

const UPCOMING_APPOINTMENTS = [
  { name: "Priya Mehta", sub: "Acne Follow-up", time: "10:30 AM", status: "Confirmed" },
  { name: "Sneha Iyer", sub: "Pigmentation Follow-up", time: "11:30 AM", status: "Confirmed" },
  { name: "Ananya Reddy", sub: "Anti-aging Consultation", time: "02:00 PM", status: "Pending" },
  { name: "Neha Singh", sub: "Sensitive Skin Care", time: "04:30 PM", status: "Confirmed" },
];

const STATUS_STYLES = {
  Confirmed: { color: cSuccess, bg: "#EAF5ED" },
  Pending: { color: cWarning, bg: "#FBF1E2" },
};

const SKIN_CONCERNS = [
  { label: "Acne / Breakouts", value: 35, color: cPrimary },
  { label: "Pigmentation", value: 25, color: cSecondary },
  { label: "Aging / Fine Lines", value: 20, color: "#8FC1E3" },
  { label: "Sensitive Skin", value: 12, color: "#7FB88F" },
  { label: "Dryness", value: 8, color: "#F0C25E" },
];

const RECENT_ANALYSES = [
  { name: "Ritika Malhotra", time: "May 21, 2025 · 10:15 AM", score: 82, label: "Good" },
  { name: "Kavya Nair", time: "May 21, 2025 · 09:45 AM", score: 65, label: "Needs Care" },
  { name: "Megha Joshi", time: "May 20, 2025 · 08:20 PM", score: 78, label: "Good" },
  { name: "Pooja Verma", time: "May 20, 2025 · 04:10 PM", score: 68, label: "Needs Care" },
];

const ANALYSIS_STYLES = {
  Good: { color: cSuccess, bg: "#EAF5ED" },
  "Needs Care": { color: cWarning, bg: "#FBF1E2" },
};

const PROGRESS_IMPROVED = [40, 70, 55, 95, 80, 130, 175];
const PROGRESS_NEEDS_ATTENTION = [130, 100, 115, 90, 105, 75, 60];
const PROGRESS_LABELS = ["May 1", "May 6", "May 11", "May 16", "May 21", "May 26", "May 31"];

const TOP_ROUTINES = [
  { label: "Acne Control Routine", clients: 126, color: cPrimary },
  { label: "Brightening Routine", clients: 98, color: cSecondary },
  { label: "Anti-aging Routine", clients: 76, color: "#8FC1E3" },
  { label: "Sensitive Skin Routine", clients: 54, color: "#7FB88F" },
];

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function LineChart({ seriesA, seriesB, labels, height = 150 }) {
  const width = 460;
  const all = [...seriesA, ...seriesB];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;
  const stepX = width / (labels.length - 1);

  const toPoints = (data) =>
    data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 20) - 10;
      return [x, y];
    });

  const toPath = (points) => points.map(([x, y], i) => (i === 0 ? "M" + x + "," + y : "L" + x + "," + y)).join(" ");

  const pointsA = toPoints(seriesA);
  const pointsB = toPoints(seriesB);

  return (
    <Box sx={{ width: "100%" }}>
      <svg viewBox={"0 0 " + width + " " + height} width="100%" height={height} preserveAspectRatio="none">
        <path d={toPath(pointsA)} fill="none" stroke={cPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(pointsB)} fill="none" stroke={cSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pointsA.map(([x, y], i) => (
          <circle key={"a" + i} cx={x} cy={y} r={3} fill="#fff" stroke={cPrimary} strokeWidth="2" />
        ))}
        {pointsB.map(([x, y], i) => (
          <circle key={"b" + i} cx={x} cy={y} r={3} fill="#fff" stroke={cSecondary} strokeWidth="2" />
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

export default function ConsultantDashboardPage({ consultantName = "Dr. Ananya Sharma", title = "Senior Skincare Consultant" }) {
  const [active, setActive] = useState("dashboard");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FAF8FC" }}>
      {/* ================= SIDEBAR ================= */}
      <Box
        sx={{
          width: 240,
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
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: cPrimaryDark, lineHeight: 1.1 }}>
              Skin AI
            </Typography>
            <Typography sx={{ fontSize: 9.5, color: cTextMuted }}>Smart Skincare Consultation</Typography>
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
                justifyContent="space-between"
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
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Icon sx={{ fontSize: 18, color: isActive ? "#fff" : cTextMuted }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : cTextMuted }}>
                    {item.label}
                  </Typography>
                </Stack>
                {item.badge && (
                  <Box
                    sx={{
                      minWidth: 18,
                      height: 18,
                      px: 0.5,
                      borderRadius: "999px",
                      backgroundColor: isActive ? "rgba(255,255,255,0.25)" : cSecondary,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
              </Stack>
            );
          })}
        </Stack>

        {/* Decorative bottom illustration accent */}
        <Box
          sx={{
            mt: 1.5,
            height: 90,
            borderRadius: "18px",
            background: "linear-gradient(160deg, rgba(139,111,201,0.10) 0%, rgba(228,116,155,0.10) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spa sx={{ fontSize: 34, color: cPrimary, opacity: 0.5 }} />
        </Box>
      </Box>

      {/* ================= MAIN CONTENT ================= */}
      <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1500, mx: "auto", width: "100%" }}>
        {/* Top bar */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
          <IconButton sx={{ display: { xs: "flex", lg: "none" }, backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
            <MenuOutlined sx={{ fontSize: 19, color: cTextMuted }} />
          </IconButton>
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
              flex: 1,
              maxWidth: 420,
            }}
          >
            <Search sx={{ fontSize: 18, color: cTextFaint }} />
            <InputBase placeholder="Search clients, reports, products..." sx={{ fontSize: 13, flex: 1 }} />
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
              <Badge badgeContent={9} color="error" sx={{ "& .MuiBadge-badge": { fontSize: 9 } }}>
                <NotificationsNone sx={{ fontSize: 19, color: cTextMuted }} />
              </Badge>
            </IconButton>
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
              <CalendarMonth sx={{ fontSize: 19, color: cTextMuted }} />
            </IconButton>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 38, height: 38, background: cBrandGradient, fontSize: 12, fontWeight: 700 }}>
                {initials(consultantName)}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark, lineHeight: 1.2 }}>
                  {consultantName}
                </Typography>
                <Typography sx={{ fontSize: 10, color: cTextMuted }}>{title}</Typography>
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 16, color: cTextFaint }} />
            </Stack>
          </Stack>
        </Stack>

        {/* Welcome + CTA */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 800, color: cTextDark }}>
              Welcome back, {consultantName.replace("Dr. ", "Dr. ")} 👋
            </Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted, mt: 0.5 }}>
              Here's what's happening with your clients today.
            </Typography>
          </Box>
          <Button
            startIcon={<Add sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: "none",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
              background: cBrandGradient,
              px: 2.75,
              py: 1.1,
              boxShadow: "0 8px 20px rgba(139,111,201,0.3)",
            }}
          >
            New Consultation
          </Button>
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
                <Typography sx={{ fontSize: 10.5, color: cSuccess, fontWeight: 700, mt: 0.75 }}>{s.trend}</Typography>
              </Card>
            );
          })}
        </Box>

        {/* Row 2: Upcoming Appointments / Clients by Skin Concern / Recent Skin Analyses */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 1fr 1.1fr" }, gap: 2, mb: 2.5 }}>
          <Card>
            <CardHeader title="Upcoming Appointments" actionLabel="View Calendar" />
            <Stack spacing={1.5}>
              {UPCOMING_APPOINTMENTS.map((a) => {
                const st = STATUS_STYLES[a.status];
                return (
                  <Stack key={a.name} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, background: cBrandGradient, fontSize: 11, fontWeight: 700 }}>
                        {initials(a.name)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark }}>{a.name}</Typography>
                        <Typography sx={{ fontSize: 10.5, color: cTextFaint }}>{a.sub}</Typography>
                      </Box>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.4}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark }}>{a.time}</Typography>
                      <Box sx={{ px: 1, py: 0.2, borderRadius: "999px", backgroundColor: st.bg, color: st.color, fontSize: 9.5, fontWeight: 700 }}>
                        {a.status}
                      </Box>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Card>

          <Card>
            <CardHeader title="Clients by Skin Concern" />
            <Stack alignItems="center" sx={{ mb: 2 }}>
              <DonutChart data={SKIN_CONCERNS} />
            </Stack>
            <Stack spacing={1}>
              {SKIN_CONCERNS.map((d) => (
                <Stack key={d.label} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.color }} />
                    <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>{d.label}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: cTextDark }}>{d.value}%</Typography>
                </Stack>
              ))}
            </Stack>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: cPrimary, textAlign: "center", mt: 2, cursor: "pointer" }}>
              View full report →
            </Typography>
          </Card>

          <Card>
            <CardHeader title="Recent Skin Analyses" actionLabel="View all" />
            <Stack spacing={1.5}>
              {RECENT_ANALYSES.map((a) => {
                const st = ANALYSIS_STYLES[a.label];
                return (
                  <Stack key={a.name} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, background: cBrandGradient, fontSize: 11, fontWeight: 700 }}>
                        {initials(a.name)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark }}>{a.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: cTextFaint }}>{a.time}</Typography>
                      </Box>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.4}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: cTextDark }}>{a.score}/100</Typography>
                      <Box sx={{ px: 1, py: 0.2, borderRadius: "999px", backgroundColor: st.bg, color: st.color, fontSize: 9.5, fontWeight: 700 }}>
                        {a.label}
                      </Box>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </Box>

        {/* Row 3: Client Progress / Top Routines / AI Assistant */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.3fr 1fr 0.9fr" }, gap: 2 }}>
          <Card>
            <CardHeader title="Client Progress Overview" actionLabel="This Month ⌄" />
            <LineChart seriesA={PROGRESS_IMPROVED} seriesB={PROGRESS_NEEDS_ATTENTION} labels={PROGRESS_LABELS} />
            <Stack direction="row" spacing={2.5} justifyContent="center" sx={{ mt: 2 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cPrimary }} />
                <Typography sx={{ fontSize: 11, color: cTextMuted }}>Improved</Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cSecondary }} />
                <Typography sx={{ fontSize: 11, color: cTextMuted }}>Needs Attention</Typography>
              </Stack>
            </Stack>
          </Card>

          <Card>
            <CardHeader title="Top Recommended Routines" actionLabel="View all" />
            <Stack spacing={2}>
              {TOP_ROUTINES.map((r) => {
                const pct = Math.round((r.clients / TOP_ROUTINES[0].clients) * 100);
                return (
                  <Box key={r.label}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Diversity1 sx={{ fontSize: 15, color: r.color }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{r.label}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 11, color: cTextMuted }}>{r.clients} clients</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: "999px",
                        backgroundColor: "#EDE7F6",
                        "& .MuiLinearProgress-bar": { backgroundColor: r.color, borderRadius: "999px" },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Card>

          <Card
            sx={{
              background: "linear-gradient(160deg, rgba(139,111,201,0.10) 0%, rgba(228,116,155,0.10) 100%)",
              border: "1px solid rgba(139,111,201,0.18)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                background: cBrandGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <AutoAwesome sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: cTextDark, mb: 0.75 }}>
              AI Assistant for Consultants
            </Typography>
            <Typography sx={{ fontSize: 12, color: cTextMuted, mb: 2.5 }}>
              Get AI-powered insights and recommendations for your client consultations.
            </Typography>
            <Button
              startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: 12.5,
                color: "#fff",
                background: cBrandGradient,
                px: 2.5,
                py: 1,
                boxShadow: "0 8px 20px rgba(139,111,201,0.3)",
              }}
            >
              Ask AI Assistant
            </Button>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}