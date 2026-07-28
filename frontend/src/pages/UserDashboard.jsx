import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Box, Button, IconButton, Stack, Typography, Avatar,
  Paper, Chip, Checkbox, Select, MenuItem, LinearProgress, CircularProgress,
  Grid, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Skeleton, Snackbar
} from "@mui/material";
import {
  CheckCircle, WaterDrop, WbSunny, AutoAwesome,
  Star, NightlightRound, MedicalServices, CalendarMonth, AccessTime,
  VideoCall, Person, Close, CameraAlt, Description, SmartToy,
  Add, History, VerifiedUser, ShieldOutlined, Air
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getUserProfile, getUserLatestAssessment, getUserActiveRoutine, getUserRecommendedProducts } from "../api/dashboard";
import { getMyAppointmentsRich, updateAppointmentStatusNew } from "../api/engagement";
import AppointmentWizard from "../components/AppointmentWizard";
import AppointmentDetailModal from "../components/common/AppointmentDetailModal";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS — Single source of truth for all spacing & styles
   ================================================================ */
const CARD_RADIUS = "20px";
const CARD_PADDING = 3; // 24px
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";
const CARD_SHADOW = "0 4px 16px rgba(139,111,201,0.06)";
const CARD_HOVER_SHADOW = "0 8px 24px rgba(139,111,201,0.12)";
const SECTION_GAP = 3; // 24px between every section row
const INNER_GAP = 3; // 24px between cards in a row

const cardSx = {
  p: CARD_PADDING,
  borderRadius: CARD_RADIUS,
  border: CARD_BORDER,
  backgroundColor: CARD_BG,
  boxShadow: CARD_SHADOW,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxSizing: "border-box",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  "&:hover": { boxShadow: CARD_HOVER_SHADOW }
};

/* ================================================================
   SECTION HEADER — Reusable header for every dashboard card
   ================================================================ */
function SectionHeader({ icon: Icon, title, action }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        {Icon && <Icon sx={{ fontSize: 18, color: COLORS.primary }} />}
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800, color: COLORS.textDark }}>
          {title}
        </Typography>
      </Stack>
      {action || null}
    </Stack>
  );
}

/* ================================================================
   METRIC CARD — Small KPI card for the 5-card row
   ================================================================ */
function MetricCard({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: CARD_RADIUS,
        border: CARD_BORDER,
        backgroundColor: CARD_BG,
        boxShadow: CARD_SHADOW,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: 160,
        boxSizing: "border-box",
        transition: "box-shadow 0.2s ease",
        "&:hover": { boxShadow: CARD_HOVER_SHADOW }
      }}
    >
      {children}
    </Paper>
  );
}

/* ================================================================
   MAIN DASHBOARD COMPONENT
   ================================================================ */
export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [timeFilter, setTimeFilter] = useState("month");

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [apptDrawerOpen, setApptDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [checklist, setChecklist] = useState([]);
  const completedCount = checklist.filter(c => c.done || c.completed).length;

  const envData = {
    temp: "28°C",
    condition: "Partly Cloudy ⛅",
    uvIndex: "7 (High)",
    humidity: "65%",
    aqi: "42 (Good)"
  };

  const [recentActivities, setRecentActivities] = useState([]);

  const [products, setProducts] = useState([]);
  const [assessment, setAssessment] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [userProf, apptRes, recProducts, latestAss, activeRoutine] = await Promise.all([
        getUserProfile().catch(() => null),
        getMyAppointmentsRich().catch(() => null),
        getUserRecommendedProducts().catch(() => []),
        getUserLatestAssessment().catch(() => null),
        getUserActiveRoutine().catch(() => [])
      ]);
      if (userProf) setProfile(userProf);
      if (latestAss) setAssessment(latestAss);
      if (Array.isArray(recProducts) && recProducts.length > 0) {
        setProducts(recProducts);
      } else {
        // Fallback to empty if no recs, but we need to ensure the UI handles it
        setProducts([]);
      }
      const apptList = Array.isArray(apptRes) ? apptRes : apptRes?.as_patient || [];
      setAppointments(apptList);

      if (Array.isArray(activeRoutine) && activeRoutine.length > 0) {
        setChecklist(activeRoutine.map(step => ({
          id: step.id || step.step_id,
          label: step.product_name || step.action || step.step_name || "Routine Step",
          done: step.completed || false,
        })));
      }

      // Generate dynamic recent activities based on fetched data
      const acts = [];
      if (latestAss) {
        acts.push({ title: "Skin Assessment Completed", time: new Date(latestAss.created_at).toLocaleDateString(), icon: CameraAlt, color: COLORS.primary });
      }
      if (apptList.length > 0) {
        acts.push({ title: "Appointment Booked", time: new Date(apptList[0].created_at || apptList[0].scheduled_at).toLocaleDateString(), icon: MedicalServices, color: "#FFA726" });
      }
      if (activeRoutine && activeRoutine.length > 0) {
        acts.push({ title: "Routine Updated", time: "Today", icon: CheckCircle, color: COLORS.success });
      }
      setRecentActivities(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const toggleCheck = (id) => {
    setChecklist(checklist.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const handleCancelAppt = async (id) => {
    try {
      await updateAppointmentStatusNew(id, "cancelled");
      setToastMessage("Appointment cancelled successfully.");
      setApptDrawerOpen(false);
      loadDashboardData();
    } catch (e) {
      setToastMessage("Status updated.");
    }
  };

  const PRODUCTS = [
    { name: "Minimalist 2% Salicylic Acid Face Wash", tag: "Best Match", price: "₹349", rating: 4.6, img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80" },
    { name: "The Ordinary Niacinamide 10% + Zinc 1%", price: "₹550", rating: 4.7, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&auto=format&fit=crop&q=80" },
    { name: "La Roche-Posay Effaclar Duo+ Moisturizer", price: "₹1,250", rating: 4.5, img: "https://images.unsplash.com/photo-1608248597263-0007999658b0?w=200&auto=format&fit=crop&q=80" },
    { name: "Fixderma Shadow SPF 50+ Gel Sunscreen", price: "₹599", rating: 4.6, img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200&auto=format&fit=crop&q=80" },
    { name: "Minimalist Hyaluronic Acid 2% Serum", price: "₹599", rating: 4.6, img: "https://images.unsplash.com/photo-1617897903246-719242758050?w=200&auto=format&fit=crop&q=80" }
  ];

  const firstName = (profile?.full_name || user?.full_name || "Ananya").split(" ")[0];

  /* ================================================================
     JSX RENDER
     ================================================================ */
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Stack spacing={SECTION_GAP} sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>

        {/* ============================================================
            ROW 1 — HERO: AI DAILY SUMMARY & QUICK ACTIONS
            ============================================================ */}
        <Paper
          elevation={0}
          sx={{
            p: CARD_PADDING,
            borderRadius: CARD_RADIUS,
            background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 50%, #F5ECF6 100%)",
            border: CARD_BORDER,
            boxShadow: "0 8px 32px rgba(139,111,201,0.08)",
            overflow: "hidden"
          }}
        >
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", lg: "center" }} spacing={3}>
            <Box sx={{ maxWidth: 720 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Chip icon={<AutoAwesome sx={{ fontSize: 14, color: COLORS.primaryDark }} />} label="AI Healthcare Assistant" size="small" sx={{ backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, fontWeight: 700, fontSize: 11 }} />
                <Chip label="Personalized Daily Health Summary" size="small" sx={{ backgroundColor: "#FFF", border: CARD_BORDER, fontWeight: 700, fontSize: 11, color: COLORS.textMuted }} />
              </Stack>

              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 24, sm: 30 }, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.15 }}>
                Good Morning, {firstName}! ☀️
              </Typography>

              <Typography sx={{ fontSize: 13.5, color: COLORS.textDark, mt: 1, mb: 2.5, lineHeight: 1.5 }}>
                Today's UV Index is <strong>High ({envData.uvIndex})</strong>. Drink another <strong>500 ml of water</strong> before 4 PM, reapply SPF 50+ after 3 PM, and continue your evening <strong>Niacinamide routine</strong>.
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} alignItems="center">
                {[
                  { icon: <WbSunny sx={{ fontSize: 16, color: "#FFA726" }} />, text: `${envData.temp} · ${envData.condition}` },
                  { icon: <ShieldOutlined sx={{ fontSize: 16, color: COLORS.danger }} />, text: `UV Index: ${envData.uvIndex}`, danger: true },
                  { icon: <WaterDrop sx={{ fontSize: 16, color: "#42A5F5" }} />, text: `Humidity: ${envData.humidity}` },
                  { icon: <Air sx={{ fontSize: 16, color: COLORS.success }} />, text: `AQI: ${envData.aqi}` }
                ].map((tag, idx) => (
                  <Paper key={idx} elevation={0} sx={{ px: 1.5, py: 0.5, borderRadius: "10px", border: CARD_BORDER, backgroundColor: "#FFF", display: "flex", alignItems: "center", gap: 0.75 }}>
                    {tag.icon}
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textDark }}>{tag.text}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: CARD_RADIUS, backgroundColor: "#FFF", border: CARD_BORDER, maxWidth: { xs: "100%", lg: 300 }, width: "100%", boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button fullWidth variant="contained" onClick={() => setWizardOpen(true)} startIcon={<MedicalServices />} sx={{ background: COLORS.brandGradient, color: "#FFF", borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 12, py: 1 }}>
                  Book Consultation
                </Button>
                <Button fullWidth variant="outlined" onClick={() => navigate("/user/assessment")} startIcon={<CameraAlt />} sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 12, py: 0.8 }}>
                  Start Skin Scan
                </Button>
                <Button fullWidth variant="outlined" onClick={() => navigate("/user/analyzer")} startIcon={<SmartToy />} sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 12, py: 0.8 }}>
                  Ask AI Companion
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        {/* ============================================================
            ROW 2 — 5 METRIC KPI CARDS (computed from assessment & profile)
            ============================================================ */}
        {(() => {
          // Dynamic calculation from Assessment / Profile / LocalStorage
          const savedForm = (() => { try { return JSON.parse(localStorage.getItem("assessmentForm") || "{}"); } catch (e) { return {}; } })();
          const savedProfile = (() => { try { return JSON.parse(localStorage.getItem("skinProfile") || "{}"); } catch (e) { return {}; } })();
          const savedAssessment = (() => { try { return JSON.parse(localStorage.getItem("latestAssessment") || "{}"); } catch (e) { return {}; } })();
          const savedLifestyle = (() => { try { return JSON.parse(localStorage.getItem("lifestyle") || "{}"); } catch (e) { return {}; } })();

          // 1. Health Score
          const score = assessment?.overall_score || assessment?.health_score || profile?.health_score || savedAssessment.overall_score || savedProfile.health_score || 78;
          const scoreLabel = score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Moderate" : "Needs Care";
          const scoreColor = score >= 65 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.danger;

          // 2. Skin Type
          const rawSkinType = assessment?.skin_type || profile?.skin_type || savedForm.skin_type || savedProfile.skin_type || "Combination";
          const formattedSkinType = rawSkinType.charAt(0).toUpperCase() + rawSkinType.slice(1);

          // 3. Top Concerns
          const rawConcerns = assessment?.concerns || assessment?.detected_concerns || profile?.skin_concerns || profile?.concerns || savedForm.skin_concerns || savedProfile.concerns || ["Acne", "Post Acne Marks"];
          const formattedConcerns = Array.isArray(rawConcerns) && rawConcerns.length > 0
            ? rawConcerns.slice(0, 2).map(c => (typeof c === "string" ? c : c.key || c.name || "Skin Concern")).join(" & ")
            : "Acne & Post Acne Marks";

          // 4. Skin Age
          const actualAge = Number(profile?.age || user?.age || savedProfile.age || savedForm.age || 21);
          const skinAge = score >= 80 ? Math.max(18, actualAge - 2) : score >= 65 ? actualAge + 1 : actualAge + 3;

          // 5. Hydration
          const waterLiters = parseFloat(savedLifestyle.waterIntake || profile?.water_intake || "1.8");
          const hydrationPct = Math.min(100, Math.round((waterLiters / 2.5) * 100));
          const hydrationStatus = hydrationPct >= 75 ? "Good" : hydrationPct >= 50 ? "Moderate" : "Low";

          return (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }, gap: INNER_GAP }}>

              <MetricCard>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Skin Health Score</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography sx={{ fontSize: 32, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{score}</Typography>
                      <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>/100</Typography>
                    </Stack>
                    <Chip label={`● ${scoreLabel}`} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, backgroundColor: `${scoreColor}18`, color: scoreColor, mt: 0.75 }} />
                  </Box>
                  <Box sx={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="28" cy="28" r="22" stroke="#FAF8FC" strokeWidth="5" fill="none" />
                      <circle cx="28" cy="28" r="22" stroke="url(#scoreGrad)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="138" strokeDashoffset={138 - (138 * score) / 100} />
                      <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8B6FC9" /><stop offset="100%" stopColor="#FFA726" /></linearGradient></defs>
                    </svg>
                    <Typography sx={{ position: "absolute", fontSize: 16 }}>😊</Typography>
                  </Box>
                </Stack>
                <Typography sx={{ fontSize: 10.5, color: COLORS.success, fontWeight: 700 }}>↑ Dynamic assessment analysis</Typography>
              </MetricCard>

              <MetricCard>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Skin Type</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 900, color: COLORS.primaryDark }}>{formattedSkinType}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 13 }}>💧</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: COLORS.textDark, fontWeight: 700 }}>Status: <span style={{ color: COLORS.textMuted }}>Active</span></Typography>
                    <Typography sx={{ fontSize: 10, color: COLORS.textDark, fontWeight: 700 }}>Type: <span style={{ color: COLORS.textMuted }}>{formattedSkinType}</span></Typography>
                  </Box>
                </Stack>
                <Button variant="contained" size="small" onClick={() => navigate("/user/profile")} sx={{ background: "rgba(139,111,201,0.1)", color: COLORS.primaryDark, textTransform: "none", borderRadius: "8px", fontSize: 10.5, fontWeight: 700, py: 0.2, boxShadow: "none", "&:hover": { background: "rgba(139,111,201,0.2)" } }}>
                  View Details
                </Button>
              </MetricCard>

              <MetricCard>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Top Concerns</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: COLORS.primaryDark, maxWidth: 120, lineHeight: 1.2 }}>{formattedConcerns}</Typography>
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(228,116,155,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 13 }}>🎯</Typography>
                  </Box>
                </Stack>
                <Button variant="contained" size="small" onClick={() => navigate("/user/assessment")} sx={{ background: "rgba(139,111,201,0.1)", color: COLORS.primaryDark, textTransform: "none", borderRadius: "8px", fontSize: 10.5, fontWeight: 700, py: 0.2, boxShadow: "none", "&:hover": { background: "rgba(139,111,201,0.2)" } }}>
                  View Analysis
                </Button>
              </MetricCard>

              <MetricCard>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Skin Age</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{skinAge}</Typography>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.5 }}>Your actual age: <strong>{actualAge}</strong></Typography>
                  </Box>
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 13 }}>🔍</Typography>
                  </Box>
                </Stack>
                <Button variant="contained" size="small" onClick={() => navigate("/user/assessment")} sx={{ background: "rgba(139,111,201,0.1)", color: COLORS.primaryDark, textTransform: "none", borderRadius: "8px", fontSize: 10.5, fontWeight: 700, py: 0.2, boxShadow: "none", "&:hover": { background: "rgba(139,111,201,0.2)" } }}>
                  View Details
                </Button>
              </MetricCard>

              <MetricCard>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Hydration Level</Typography>
                  <WaterDrop sx={{ fontSize: 16, color: "#42A5F5" }} />
                </Stack>
                <Box>
                  <Typography sx={{ fontSize: 17, fontWeight: 900, color: COLORS.success }}>{hydrationStatus}</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.25 }}>Water Intake: <strong>{waterLiters} L / 2.5 L</strong></Typography>
                </Box>
                <Box>
                  <LinearProgress variant="determinate" value={hydrationPct} sx={{ height: 6, borderRadius: 3, backgroundColor: "#FAF8FC", "& .MuiLinearProgress-bar": { borderRadius: 3, backgroundColor: COLORS.success } }} />
                  <Typography sx={{ fontSize: 9.5, color: COLORS.textMuted, textAlign: "right", mt: 0.5, fontWeight: 700 }}>{hydrationPct}%</Typography>
                </Box>
              </MetricCard>
            </Box>
          );
        })()}

        {/* ============================================================
            ROW 3 — APPOINTMENTS (8 cols) + RECENT ACTIVITY (4 cols)
            ============================================================ */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: INNER_GAP, alignItems: "stretch" }}>

          {/* UPCOMING APPOINTMENTS */}
          <Paper elevation={0} sx={cardSx}>
            <SectionHeader
              icon={CalendarMonth}
              title="Upcoming Appointments"
              action={
                <Button size="small" variant="outlined" onClick={() => setWizardOpen(true)} startIcon={<Add />} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 11, borderColor: COLORS.cardBorder, color: COLORS.textDark }}>
                  Book New
                </Button>
              }
            />

            {appointments.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", border: CARD_BORDER, backgroundColor: "#FAF8FC", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <MedicalServices sx={{ fontSize: 36, color: COLORS.primary, mb: 1, opacity: 0.7 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>No appointments scheduled.</Typography>
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.5, mb: 2 }}>
                  Consult with verified Dermatologists & Skincare Consultants.
                </Typography>
                <Button variant="contained" onClick={() => setWizardOpen(true)} sx={{ background: COLORS.brandGradient, textTransform: "none", borderRadius: "10px", fontSize: 12, fontWeight: 700 }}>
                  Book Consultation
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {appointments.map((appt, idx) => {
                  const profName = appt.professional_name || appt.doctor_name || "Dr. Ananya Sharma";
                  const profRole = appt.professional_type || appt.role || "Dermatologist";
                  const spec = appt.specialization || "Clinical & Aesthetic Dermatology";
                  const isOnline = appt.meeting_type !== "Clinic";
                  return (
                    <Paper key={appt.id || idx} elevation={0} sx={{ p: 2, borderRadius: "16px", border: CARD_BORDER, backgroundColor: CARD_BG, transition: "border-color 0.2s", "&:hover": { borderColor: COLORS.primary } }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 44, height: 44, background: COLORS.brandGradient, fontSize: 15, fontWeight: 700, border: "2px solid #FFF", boxShadow: "0 4px 12px rgba(139,111,201,0.2)" }}>
                            {profName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                              <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: COLORS.textDark }}>{profName}</Typography>
                              <Chip label={profRole} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, backgroundColor: profRole.toLowerCase().includes("derm") ? "rgba(139,111,201,0.12)" : "rgba(255,167,38,0.12)", color: profRole.toLowerCase().includes("derm") ? COLORS.primaryDark : "#FFA726" }} />
                            </Stack>
                            <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mt: 0.25 }}>{spec}</Typography>
                            <Typography sx={{ fontSize: 11, color: COLORS.textDark, fontWeight: 600, mt: 0.5 }}>
                              📅 {appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleString() : "Tomorrow at 10:00 AM"} · {isOnline ? "📹 Online" : "🏥 Clinic"}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button size="small" variant="contained" onClick={() => { setSelectedAppointment({ ...appt, profName, profRole, spec }); setApptDrawerOpen(true); }} sx={{ background: COLORS.brandGradient, borderRadius: "8px", textTransform: "none", fontSize: 11, fontWeight: 700 }}>
                            View Details
                          </Button>
                          {isOnline && (
                            <Button size="small" variant="contained" color="success" startIcon={<VideoCall />} onClick={() => alert("Launching telemedicine video session...")} sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, fontWeight: 700 }}>
                              Join
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* RECENT ACTIVITY TIMELINE */}
          <Paper elevation={0} sx={cardSx}>
            <SectionHeader icon={History} title="Recent Health Activity" />
            <Stack spacing={2} sx={{ flex: 1 }}>
              {recentActivities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: act.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 16, color: act.color }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textDark, lineHeight: 1.2 }}>{act.title}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>{act.time}</Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        </Box>

        {/* ============================================================
            ROW 4 — 3-COLUMN GRID: ROUTINE / CHART / AI INSIGHTS
            All cards start at the SAME height, have EQUAL padding & gap
            ============================================================ */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: INNER_GAP, alignItems: "stretch" }}>

          {/* COL 1 — TODAY'S ROUTINE */}
          <Paper elevation={0} sx={{ ...cardSx, justifyContent: "space-between" }}>
            <Box>
              <SectionHeader
                icon={AutoAwesome}
                title="Today's Routine"
                action={<Chip label="75% Done" size="small" sx={{ fontWeight: 800, fontSize: 10, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />}
              />

              <LinearProgress variant="determinate" value={75} sx={{ height: 5, borderRadius: 3, mb: 2, backgroundColor: "#FAF8FC", "& .MuiLinearProgress-bar": { borderRadius: 3, background: COLORS.brandGradient } }} />

              {/* Morning */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <WbSunny sx={{ fontSize: 14, color: "#FFA726" }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark }}>Morning Routine</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, ml: "auto !important" }}>4/4</Typography>
                </Stack>
                <Stack spacing={0.5} sx={{ pl: 0.5 }}>
                  {["Cleanser", "Serum", "Moisturizer", "Sunscreen"].map((item) => (
                    <Stack key={item} direction="row" spacing={0.75} alignItems="center">
                      <CheckCircle sx={{ fontSize: 14, color: COLORS.success }} />
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textDark }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {/* Evening */}
              <Box sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <NightlightRound sx={{ fontSize: 14, color: COLORS.primary }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark }}>Evening Routine</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, ml: "auto !important" }}>3/4</Typography>
                </Stack>
                <Stack spacing={0.5} sx={{ pl: 0.5 }}>
                  {[
                    { label: "Cleanser", done: true },
                    { label: "Treatment", done: true },
                    { label: "Moisturizer", done: true },
                    { label: "Eye Cream", done: false }
                  ].map((step) => (
                    <Stack key={step.label} direction="row" spacing={0.75} alignItems="center">
                      {step.done
                        ? <CheckCircle sx={{ fontSize: 14, color: COLORS.primary }} />
                        : <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid " + COLORS.textFaint, boxSizing: "border-box" }} />
                      }
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: step.done ? COLORS.textDark : COLORS.textMuted }}>{step.label}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Paper elevation={0} sx={{ p: 1.25, borderRadius: "10px", backgroundColor: "#FAF8FC", border: CARD_BORDER }}>
                <Typography sx={{ fontSize: 10.5, color: COLORS.primaryDark, fontWeight: 600 }}>
                  💡 <strong>AI Tip:</strong> Apply SPF 50+ before 1:00 PM exposure.
                </Typography>
              </Paper>
            </Box>

            <Button fullWidth onClick={() => navigate("/user/daily-planner")} sx={{ mt: 2, textTransform: "none", color: COLORS.primaryDark, fontWeight: 800, fontSize: 12, borderTop: CARD_BORDER, pt: 1.5, pb: 0 }}>
              View Full Routine →
            </Button>
          </Paper>

          {/* COL 2 — SKIN HEALTH PROGRESS CHART */}
          <Paper elevation={0} sx={{ ...cardSx, justifyContent: "space-between" }}>
            <Box>
              <SectionHeader
                title="Skin Health Progress"
                action={
                  <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} size="small" sx={{ height: 28, fontSize: 11, fontWeight: 700, borderRadius: "8px" }}>
                    <MenuItem value="month">Monthly</MenuItem>
                    <MenuItem value="week">Weekly</MenuItem>
                  </Select>
                }
              />

              <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{assessment?.overall_score ? `${Math.round(assessment.overall_score)} / 100` : "No Score Yet"}</Typography>
                {assessment?.overall_score && <Chip label="+12%" size="small" sx={{ fontWeight: 800, fontSize: 10, height: 20, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />}
              </Stack>

              <Box sx={{ height: 170, position: "relative" }}>
                <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(139,111,201,0.22)" />
                      <stop offset="100%" stopColor="rgba(139,111,201,0.0)" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#F4EFF9" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="400" y2="80" stroke="#F4EFF9" strokeDasharray="3,3" />
                  <line x1="0" y1="130" x2="400" y2="130" stroke="#F4EFF9" strokeDasharray="3,3" />
                  <path d="M 0 120 Q 50 110 100 85 T 200 65 T 300 80 T 400 35 L 400 155 L 0 155 Z" fill="url(#areaGradDash)" />
                  <path d="M 0 120 Q 50 110 100 85 T 200 65 T 300 80 T 400 35" fill="none" stroke="#8B6FC9" strokeWidth="2.5" />
                  <circle cx="100" cy="85" r="3.5" fill="#8B6FC9" />
                  <circle cx="200" cy="65" r="3.5" fill="#8B6FC9" />
                  <circle cx="300" cy="80" r="3.5" fill="#8B6FC9" />
                  <circle cx="400" cy="35" r="4.5" fill="#FFF" stroke="#8B6FC9" strokeWidth="2.5" />
                </svg>
                <Box sx={{ position: "absolute", top: 6, right: 0, backgroundColor: "#FFF", border: "1px solid " + COLORS.primary, px: 1, py: 0.25, borderRadius: "6px", boxShadow: "0 2px 8px rgba(139,111,201,0.15)" }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primaryDark }}>Jul 25: 78/100</Typography>
                </Box>
              </Box>

              <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, mt: 0.5 }}>
                {["May 14", "Jun 01", "Jun 20", "Jul 25"].map(d => (
                  <Typography key={d} sx={{ fontSize: 10, color: COLORS.textMuted }}>{d}</Typography>
                ))}
              </Stack>
            </Box>

            <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mt: 1.5 }}>
              Latest Assessment: <strong>{assessment?.created_at ? new Date(assessment.created_at).toLocaleDateString() : "Pending"}</strong>
            </Typography>
          </Paper>

          {/* COL 3 — AI SKIN INSIGHTS */}
          <Paper elevation={0} sx={{ ...cardSx, justifyContent: "space-between" }}>
            <Box>
              <SectionHeader icon={AutoAwesome} title="AI Skin Insights" />

              <Stack spacing={1.25}>
                {[
                  { label: "💧 Hydration Alert", text: "Drink 500 ml water to reach daily target.", color: "#42A5F5" },
                  { label: "☀️ UV Index Warning", text: "UV Index is 7. Reapply SPF 50+ at 1 PM.", color: COLORS.danger },
                  { label: "🧪 Active Formulation", text: "Continue Niacinamide 10% for acne marks.", color: COLORS.primaryDark },
                  { label: "🏥 Telehealth Reminder", text: "Dermatologist video session tomorrow.", color: COLORS.success },
                  { label: "✅ Routine Streak", text: "7-day consistency streak! Keep it up.", color: COLORS.primary }
                ].map((insight, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 1.25, borderRadius: "10px", backgroundColor: "#FAF8FC", border: CARD_BORDER }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: insight.color, mb: 0.25 }}>{insight.label}</Typography>
                    <Typography sx={{ fontSize: 11, color: COLORS.textDark, lineHeight: 1.3 }}>{insight.text}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Button fullWidth onClick={() => navigate("/user/analyzer")} sx={{ mt: 2, textTransform: "none", color: COLORS.primaryDark, fontWeight: 800, fontSize: 12, borderTop: CARD_BORDER, pt: 1.5, pb: 0 }}>
              View All Insights →
            </Button>
          </Paper>
        </Box>

        {/* ============================================================
            ROW 5 — RECOMMENDED PRODUCTS + CONCERNS DONUT
            ============================================================ */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1fr" }, gap: INNER_GAP, alignItems: "stretch" }}>

          <Paper elevation={0} sx={cardSx}>
            <SectionHeader
              title="Recommended Products for You"
              action={
                <Button size="small" onClick={() => navigate("/user/products")} sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, color: COLORS.primary }}>
                  View All
                </Button>
              }
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 1.75 }}>
              {products.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: COLORS.textMuted, py: 4, gridColumn: "1 / -1", textAlign: "center" }}>
                  Complete your skin assessment to get personalized product recommendations.
                </Typography>
              ) : (
                products.map((prod, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: CARD_BORDER, backgroundColor: CARD_BG, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", transition: "box-shadow 0.2s, border-color 0.2s", "&:hover": { boxShadow: CARD_HOVER_SHADOW, borderColor: COLORS.primary } }}>
                    {prod.tag && (
                      <Chip label={prod.tag} size="small" sx={{ position: "absolute", top: 8, left: 8, height: 18, fontSize: 9, fontWeight: 800, backgroundColor: COLORS.success, color: "#FFF" }} />
                    )}
                    <Box sx={{ width: "100%", height: 85, borderRadius: "10px", overflow: "hidden", mb: 1, backgroundColor: "#FAF8FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={prod.img || prod.image_url || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80"} alt={prod.name || prod.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, lineHeight: 1.2, height: 28, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {prod.name || prod.product_name}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.75 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark }}>{prod.price || "₹349"}</Typography>
                        <Stack direction="row" spacing={0.25} alignItems="center">
                          <Star sx={{ fontSize: 12, color: "#FFA726" }} />
                          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>{prod.rating || 4.5}</Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>

          <Paper elevation={0} sx={cardSx}>
            <SectionHeader
              title="Skin Concerns Overview"
              action={
                <Button size="small" onClick={() => navigate("/user/assessment")} sx={{ textTransform: "none", fontSize: 12, fontWeight: 700, color: COLORS.primary }}>
                  View Details
                </Button>
              }
            />
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ position: "relative", width: 110, height: 110, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="55" cy="55" r="42" stroke="#8B6FC9" strokeWidth="14" fill="none" strokeDasharray="264" strokeDashoffset="105" />
                  <circle cx="55" cy="55" r="42" stroke="#E4749B" strokeWidth="14" fill="none" strokeDasharray="264" strokeDashoffset="198" />
                  <circle cx="55" cy="55" r="42" stroke="#FFA726" strokeWidth="14" fill="none" strokeDasharray="264" strokeDashoffset="224" />
                  <circle cx="55" cy="55" r="42" stroke="#66BB6A" strokeWidth="14" fill="none" strokeDasharray="264" strokeDashoffset="237" />
                  <circle cx="55" cy="55" r="42" stroke="#42A5F5" strokeWidth="14" fill="none" strokeDasharray="264" strokeDashoffset="250" />
                </svg>
                <Typography sx={{ position: "absolute", fontSize: 9.5, fontWeight: 800, color: COLORS.textDark, textAlign: "center", width: 50 }}>
                  Primary Concerns
                </Typography>
              </Box>

              <Stack spacing={0.75} sx={{ flexGrow: 1 }}>
                {(assessment?.primary_concerns || profile?.skin_concerns || []).length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>No concerns logged yet.</Typography>
                ) : (
                  (assessment?.primary_concerns || profile?.skin_concerns || []).slice(0, 5).map((concern, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ["#8B6FC9", "#E4749B", "#FFA726", "#66BB6A", "#42A5F5"][idx % 5] }} />
                        <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: COLORS.textDark }}>{concern}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: COLORS.textMuted }}>{(25 - idx*3)}%</Typography>
                    </Stack>
                  ))
                )}
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* ============================================================
            ROW 6 — DAILY CHECKLIST BAR
            ============================================================ */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, boxShadow: CARD_SHADOW }}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircle sx={{ fontSize: 22, color: COLORS.primary }} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Daily Checklist</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{completedCount} / 5 tasks completed</Typography>
              </Box>
              <Box sx={{ width: 100 }}>
                <LinearProgress variant="determinate" value={(completedCount / 5) * 100} sx={{ height: 5, borderRadius: 3, backgroundColor: "#FAF8FC", "& .MuiLinearProgress-bar": { borderRadius: 3, background: COLORS.brandGradient } }} />
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
              {checklist.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted, py: 1 }}>Set up your skincare routine to track daily progress.</Typography>
              ) : (
                checklist.map((item) => (
                  <Stack key={item.id} direction="row" spacing={0.5} alignItems="center" onClick={() => toggleCheck(item.id)} sx={{ cursor: "pointer", px: 1, py: 0.5, borderRadius: "8px", transition: "background 0.15s", "&:hover": { backgroundColor: "#FAF8FC" } }}>
                    <Checkbox checked={item.done} size="small" sx={{ p: 0, color: COLORS.cardBorder, "&.Mui-checked": { color: COLORS.primary } }} />
                    <Typography sx={{ fontSize: 12, fontWeight: item.done ? 700 : 500, color: item.done ? COLORS.textDark : COLORS.textMuted }}>
                      {item.label}
                    </Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* ============================================================
            APPOINTMENT DETAILS MODAL
            ============================================================ */}
        <AppointmentDetailModal
          open={apptDrawerOpen}
          onClose={() => setApptDrawerOpen(false)}
          appointment={selectedAppointment}
          profile={profile}
          assessment={assessment}
          onCancel={handleCancelAppt}
        />

        <AppointmentWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSuccess={() => { setWizardOpen(false); setToastMessage("Appointment successfully requested!"); loadDashboardData(); }}
        />

        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={4000}
          onClose={() => setToastMessage("")}
          message={toastMessage}
        />

      </Stack>
    </motion.div>
  );
}