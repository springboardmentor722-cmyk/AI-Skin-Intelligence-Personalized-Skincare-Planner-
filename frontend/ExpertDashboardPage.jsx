import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Badge,
  Chip,
  Button,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  Search,
  NotificationsNone,
  HomeRounded,
  PeopleAltOutlined,
  EventNoteOutlined,
  FactCheckOutlined,
  BarChartOutlined,
  SettingsOutlined,
  Spa,
  ChevronRight,
  AccessTime,
  CheckCircle,
  PendingActions,
  Groups,
  TrendingUp,
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

// --- Safe theme color lookup ---
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
const cWarning = getThemeColor("warning", "#C9A15A");
const cBg = getThemeColor("bgMain", "#FAF8FC");

const NAV_ITEMS = [
  { label: "Home", icon: HomeRounded, key: "home" },
  { label: "Patients", icon: PeopleAltOutlined, key: "patients" },
  { label: "Appointments", icon: EventNoteOutlined, key: "appointments" },
  { label: "Reviews", icon: FactCheckOutlined, key: "reviews", badge: 6 },
  { label: "Reports", icon: BarChartOutlined, key: "reports" },
  { label: "Settings", icon: SettingsOutlined, key: "settings" },
];

const STATS = [
  { label: "Total Patients", value: "248", icon: Groups, trend: "+12 this month", color: cPrimary },
  { label: "Pending Reviews", value: "6", icon: PendingActions, trend: "Needs attention", color: cWarning },
  { label: "Today's Appointments", value: "9", icon: EventNoteOutlined, trend: "3 completed", color: cSecondary },
  { label: "Avg. Response Time", value: "2.4h", icon: TrendingUp, trend: "-18% vs last week", color: cSuccess },
];

const PENDING_REVIEWS = [
  { name: "Ananya Rao", concern: "Acne, Hyperpigmentation", submitted: "2h ago", severity: "Moderate" },
  { name: "Vikram Shah", concern: "Dry Skin, Redness", submitted: "5h ago", severity: "Mild" },
  { name: "Priya Menon", concern: "Uneven Skin Tone", submitted: "Yesterday", severity: "Mild" },
  { name: "Karthik Iyer", concern: "Acne, Fine Lines", submitted: "Yesterday", severity: "Severe" },
];

const TODAY_APPOINTMENTS = [
  { name: "Sneha Kulkarni", time: "10:30 AM", type: "Follow-up", status: "Upcoming" },
  { name: "Rahul Verma", time: "11:15 AM", type: "New Consultation", status: "Upcoming" },
  { name: "Divya Nair", time: "2:00 PM", type: "Routine Check", status: "Upcoming" },
  { name: "Arjun Reddy", time: "9:00 AM", type: "Follow-up", status: "Completed" },
];

const SEVERITY_COLORS = {
  Mild: { color: cSuccess, bg: "#EAF5ED" },
  Moderate: { color: cWarning, bg: "#FAF4E8" },
  Severe: { color: "#E4749B", bg: "#FDF1F5" },
};

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

export default function ExpertDashboardPage({ doctorName = "Dr. Sharma" }) {
  const [active, setActive] = useState("home");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: cBg }}>
      {/* ================= SIDEBAR ================= */}
      <Box
        sx={{
          width: 250,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid " + cCardBorder,
          p: 3,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 4 }}>
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
            <Typography sx={{ fontSize: 10, color: cTextMuted, letterSpacing: "0.5px" }}>
              EXPERT PORTAL
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={0.5}>
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
                  px: 1.75,
                  py: 1.35,
                  borderRadius: "14px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "rgba(139,111,201,0.10)" : "transparent",
                  transition: "all 0.15s ease",
                  "&:hover": { backgroundColor: isActive ? undefined : "rgba(139,111,201,0.05)" },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Icon sx={{ fontSize: 20, color: isActive ? cPrimary : cTextMuted }} />
                  <Typography sx={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? cPrimaryDark : cTextMuted }}>
                    {item.label}
                  </Typography>
                </Stack>
                {item.badge && (
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      px: 0.6,
                      borderRadius: "999px",
                      background: cBrandGradient,
                      color: "#fff",
                      fontSize: 11,
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

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.5, borderRadius: "14px", backgroundColor: "#FAF8FC" }}>
          <Avatar sx={{ width: 36, height: 36, background: cBrandGradient, fontSize: 13, fontWeight: 700 }}>
            {initials(doctorName)}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark }}>{doctorName}</Typography>
            <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>Dermatologist</Typography>
          </Box>
        </Stack>
      </Box>

      {/* ================= MAIN CONTENT ================= */}
      <Box sx={{ flex: 1, p: { xs: 2.5, sm: 4 }, maxWidth: 1400, mx: "auto", width: "100%" }}>
        {/* Top bar */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3.5 }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 28 }, fontWeight: 800, color: cTextDark }}>
              Good morning, {doctorName.replace("Dr. ", "")}
            </Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted, mt: 0.5 }}>
              You have 6 assessments waiting for review and 9 appointments today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
              <Search sx={{ fontSize: 19, color: cTextMuted }} />
            </IconButton>
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + cCardBorder }}>
              <Badge variant="dot" color="error">
                <NotificationsNone sx={{ fontSize: 19, color: cTextMuted }} />
              </Badge>
            </IconButton>
            <Avatar sx={{ width: 38, height: 38, background: cBrandGradient, fontSize: 13, fontWeight: 700 }}>
              {initials(doctorName)}
            </Avatar>
          </Stack>
        </Stack>

        {/* Stat cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Box
                key={s.label}
                sx={{
                  backgroundColor: "#FFF",
                  borderRadius: "20px",
                  border: "1px solid " + cCardBorder,
                  p: 2.25,
                  boxShadow: "0 4px 16px rgba(139,111,201,0.05)",
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      backgroundColor: s.color + "1A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon sx={{ fontSize: 18, color: s.color }} />
                  </Box>
                </Stack>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, color: cTextDark, lineHeight: 1 }}>
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: 12, color: cTextMuted, mt: 0.5 }}>{s.label}</Typography>
                <Typography sx={{ fontSize: 10.5, color: s.color, fontWeight: 600, mt: 0.5 }}>{s.trend}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* Two-column: Pending Reviews + Today's Appointments */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 2.5 }}>
          {/* Pending Reviews */}
          <Box
            sx={{
              backgroundColor: "#FFF",
              borderRadius: "22px",
              border: "1px solid " + cCardBorder,
              p: { xs: 2.5, sm: 3 },
              boxShadow: "0 4px 16px rgba(139,111,201,0.05)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 800, color: cTextDark }}>
                Pending Skin Assessments
              </Typography>
              <Button
                endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
                sx={{ textTransform: "none", fontSize: 12.5, fontWeight: 700, color: cPrimary }}
              >
                View All
              </Button>
            </Stack>

            <Stack spacing={1.25}>
              {PENDING_REVIEWS.map((p) => {
                const sev = SEVERITY_COLORS[p.severity];
                return (
                  <Stack
                    key={p.name}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: "14px",
                      border: "1px solid " + cCardBorder,
                      "&:hover": { backgroundColor: "rgba(139,111,201,0.03)" },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, background: cBrandGradient, fontSize: 12, fontWeight: 700 }}>
                        {initials(p.name)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: cTextDark }}>{p.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: cTextMuted }}>{p.concern}</Typography>
                      </Box>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Chip
                        label={p.severity}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          color: sev.color,
                          backgroundColor: sev.bg,
                        }}
                      />
                      <Typography sx={{ fontSize: 10, color: cTextFaint }}>{p.submitted}</Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Box>

          {/* Today's Appointments */}
          <Box
            sx={{
              backgroundColor: "#FFF",
              borderRadius: "22px",
              border: "1px solid " + cCardBorder,
              p: { xs: 2.5, sm: 3 },
              boxShadow: "0 4px 16px rgba(139,111,201,0.05)",
            }}
          >
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 800, color: cTextDark, mb: 2 }}>
              Today's Appointments
            </Typography>
            <Stack spacing={1.75}>
              {TODAY_APPOINTMENTS.map((a) => {
                const isDone = a.status === "Completed";
                return (
                  <Stack key={a.name + a.time} direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "10px",
                        backgroundColor: isDone ? "#EAF5ED" : "rgba(139,111,201,0.10)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? (
                        <CheckCircle sx={{ fontSize: 17, color: cSuccess }} />
                      ) : (
                        <AccessTime sx={{ fontSize: 17, color: cPrimary }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: cTextMuted }}>{a.type}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: isDone ? cSuccess : cPrimaryDark, whiteSpace: "nowrap" }}>
                      {a.time}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>

            <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid " + cCardBorder }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>Today's progress</Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: cTextDark }}>3 / 9</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={33}
                sx={{
                  height: 6,
                  borderRadius: "999px",
                  backgroundColor: "#EDE7F6",
                  "& .MuiLinearProgress-bar": { background: cBrandGradient, borderRadius: "999px" },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}