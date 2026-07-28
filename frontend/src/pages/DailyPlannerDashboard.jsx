import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box, Stack, Typography, Paper, Chip, Button, LinearProgress,
  IconButton, Avatar, Drawer, Divider, Snackbar, Alert, useMediaQuery, useTheme
} from "@mui/material";
import {
  WbSunny, NightsStay, AutoAwesome, CheckCircle, Check, Close,
  BookmarkBorder, Bookmark, AccessTime, CameraAlt, MedicalServices,
  ArrowForward, LocalPharmacy, VerifiedUser, SmartToy, Refresh,
  NotificationsNoneOutlined, EmojiEvents, History
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import AppointmentWizard from "../components/AppointmentWizard";
import { useNavigate } from "react-router-dom";
import { getUserActiveRoutine, getUserRecommendedProducts, logRoutineStep } from "../api/dashboard";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";
const CARD_RADIUS = "20px";
const CARD_SHADOW = "0 2px 12px rgba(139,111,201,0.07)";
const CARD_HOVER = "0 8px 24px rgba(139,111,201,0.15)";

/* ================================================================
   STEP DATA
   ================================================================ */
// We will generate MORNING_STEPS and EVENING_STEPS dynamically from API

const TABS = [
  { key: "morning", label: "Morning Routine", icon: WbSunny, color: "#FFA726" },
  { key: "evening", label: "Evening Routine", icon: NightsStay, color: COLORS.primary },
  { key: "weekly",  label: "Weekly Routine",  icon: AutoAwesome, color: COLORS.success },
  { key: "asneeded",label: "As Needed",       icon: EmojiEvents, color: "#42A5F5" }
];

/* ================================================================
   CIRCULAR PROGRESS SVG
   ================================================================ */
function CircleProgress({ pct, size = 72, strokeWidth = 7, color = COLORS.success }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F0EBF8" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <Typography sx={{ fontSize: size === 72 ? 15 : 11, fontWeight: 900, color: COLORS.textDark, zIndex: 1 }}>{pct}%</Typography>
    </Box>
  );
}

/* ================================================================
   STEP CARD — DESKTOP
   ================================================================ */
function StepCard({ step, isDone, onToggle, onOpenDrawer, onBookmark, bookmarked }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: CARD_RADIUS,
        border: isDone ? "2px solid " + COLORS.success : CARD_BORDER,
        backgroundColor: CARD_BG,
        boxShadow: CARD_SHADOW,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.25s ease",
        "&:hover": { boxShadow: CARD_HOVER, borderColor: COLORS.primary }
      }}
    >
      {/* Step Badge Row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 2, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{
            width: 26, height: 26, borderRadius: "50%",
            background: COLORS.brandGradient,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#FFF" }}>{step.num}</Typography>
          </Box>
          <Chip label={step.category} size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark }} />
        </Stack>
        <IconButton size="small" onClick={() => onBookmark(step.id)} sx={{ color: bookmarked ? COLORS.primary : COLORS.textMuted }}>
          {bookmarked ? <Bookmark sx={{ fontSize: 16 }} /> : <BookmarkBorder sx={{ fontSize: 16 }} />}
        </IconButton>
      </Stack>

      {/* Product Image */}
      <Box
        onClick={() => onOpenDrawer(step)}
        sx={{
          mx: 2, height: 180, borderRadius: "14px", overflow: "hidden",
          backgroundColor: "#FAF8FC", cursor: "pointer", position: "relative",
          flexShrink: 0
        }}
      >
        <img
          src={step.img}
          alt={step.product}
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80"; }}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Chip
          label="View Details"
          size="small"
          sx={{ position: "absolute", bottom: 8, right: 8, height: 20, fontSize: 9, fontWeight: 700, backgroundColor: "rgba(0,0,0,0.55)", color: "#FFF" }}
        />
      </Box>

      {/* Product Info */}
      <Box sx={{ px: 2, pt: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.2 }}>
          {step.product}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mt: 0.25 }}>
          By <strong>{step.brand}</strong>
        </Typography>

        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: "10px", backgroundColor: "#FAF8FC", border: CARD_BORDER }}>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.4px" }}>Purpose</Typography>
          <Typography sx={{ fontSize: 11.5, color: COLORS.textDark, mt: 0.25, lineHeight: 1.35 }}>{step.purpose}</Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
          <AccessTime sx={{ fontSize: 13, color: COLORS.textMuted }} />
          <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>Time: <strong>{step.estTime}</strong></Typography>
        </Stack>

        <Box sx={{ mt: 1, p: 1, borderRadius: "10px", backgroundColor: "rgba(139,111,201,0.06)", border: CARD_BORDER }}>
          <Typography sx={{ fontSize: 10, color: COLORS.primaryDark, lineHeight: 1.35 }}>
            <strong>💡 AI Tip:</strong> {step.aiTip}
          </Typography>
        </Box>

        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.25 }}>
          {step.tags.map((t, i) => (
            <Chip key={i} label={t} size="small" sx={{ height: 18, fontSize: 8.5, fontWeight: 700, backgroundColor: "#FAF4F8", color: COLORS.primaryDark }} />
          ))}
        </Stack>
      </Box>

      {/* Completion Footer */}
      <Box sx={{ mx: 2, mb: 2, mt: 1.5, pt: 1.5, borderTop: CARD_BORDER }}>
        {isDone ? (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CheckCircle sx={{ fontSize: 16, color: COLORS.success }} />
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.success }}>Completed</Typography>
              {step.completedAt && (
                <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>{step.completedAt}</Typography>
              )}
            </Stack>
            <IconButton size="small" onClick={() => onToggle(step.id)} sx={{ color: COLORS.textMuted }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onToggle(step.id)}
            startIcon={<Check sx={{ fontSize: 15 }} />}
            sx={{
              borderColor: COLORS.primary, color: COLORS.primary,
              borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 12,
              py: 0.75, "&:hover": { backgroundColor: "rgba(139,111,201,0.06)" }
            }}
          >
            Mark as Done
          </Button>
        )}
      </Box>
    </Paper>
  );
}

/* ================================================================
   STEP ROW — MOBILE
   ================================================================ */
function StepRow({ step, isDone, onToggle, onOpenDrawer }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: isDone ? "1.5px solid " + COLORS.success : CARD_BORDER,
        backgroundColor: isDone ? "#FAFDFB" : CARD_BG,
        p: 1.5, display: "flex", alignItems: "center", gap: 1.5,
        transition: "all 0.2s ease"
      }}
    >
      {/* Step Circle */}
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.brandGradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#FFF" }}>{step.num}</Typography>
      </Box>

      {/* Thumbnail */}
      <Box
        onClick={() => onOpenDrawer(step)}
        sx={{ width: 52, height: 52, borderRadius: "10px", overflow: "hidden", backgroundColor: "#FAF8FC", flexShrink: 0, cursor: "pointer" }}
      >
        <img src={step.img} alt={step.product} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 9.5, color: COLORS.primaryDark, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {step.category}
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {step.product}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>By {step.brand}</Typography>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
          <AccessTime sx={{ fontSize: 11, color: COLORS.textMuted }} />
          <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>{step.estTime}</Typography>
          {isDone && (
            <Chip icon={<Check sx={{ fontSize: 10, color: COLORS.success }} />} label="Completed" size="small"
              sx={{ height: 18, fontSize: 9, fontWeight: 700, backgroundColor: "rgba(46,158,91,0.1)", color: COLORS.success }} />
          )}
        </Stack>
      </Box>

      {/* Toggle Button */}
      <IconButton
        size="small"
        onClick={() => onToggle(step.id)}
        sx={{
          width: 32, height: 32, borderRadius: "10px", flexShrink: 0,
          backgroundColor: isDone ? COLORS.success : "rgba(139,111,201,0.1)",
          color: isDone ? "#FFF" : COLORS.primary
        }}
      >
        <Check sx={{ fontSize: 16 }} />
      </IconButton>
    </Paper>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function DailyPlannerDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeTab, setActiveTab] = useState("morning");
  const [morningSteps, setMorningSteps] = useState([]);
  const [eveningSteps, setEveningSteps] = useState([]);
  
  // Track done status: key = step.id, value = true/false
  const [doneStatus, setDoneStatus] = useState({});
  const [bookmarked, setBookmarked] = useState({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", sev: "success" });
  
  const streakDays = 12;
  const skinType = "Combination";
  const primaryConcern = "Acne & Marks";

  useEffect(() => {
    async function loadRoutine() {
      try {
        const [routineRes, recsRes] = await Promise.all([
          getUserActiveRoutine().catch(() => []),
          getUserRecommendedProducts().catch(() => [])
        ]);
        
        const routine = Array.isArray(routineRes) ? routineRes : [];
        const recommendations = Array.isArray(recsRes) ? recsRes : [];

        // Map routine steps to rich objects
        const enriched = routine.map(step => {
          const rec = recommendations.find(r => r.category?.toLowerCase() === step.step_category?.toLowerCase() || r.product_category?.toLowerCase() === step.step_category?.toLowerCase());
          
          return {
            id: step.id || step.step_id,
            num: step.step_number || 1,
            category: step.step_category || "Step",
            product: rec ? (rec.product_name || rec.name) : `Generic ${step.step_category}`,
            brand: rec?.brand || "Recommended",
            img: rec?.image_url || rec?.img || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
            purpose: rec?.description || rec?.reason || "Follow your personalized plan.",
            estTime: "2 min",
            completedAt: step.completed ? new Date().toLocaleTimeString() : null,
            aiTip: rec?.usage_instructions || "Apply gently to face.",
            tags: rec?.concerns ? rec.concerns.split(",") : ["Daily Routine"],
            instructions: rec?.usage_instructions || "Use as directed by your dermatologist.",
            ingredients: ["Active Ingredient"],
            warnings: "Discontinue if irritation occurs.",
            time_of_day: step.time_of_day?.toLowerCase() || "morning"
          };
        });

        const initialDone = {};
        enriched.forEach(s => {
          if (s.completedAt) initialDone[s.id] = true;
        });
        setDoneStatus(initialDone);

        setMorningSteps(enriched.filter(s => s.time_of_day.includes("am") || s.time_of_day.includes("morning")));
        setEveningSteps(enriched.filter(s => s.time_of_day.includes("pm") || s.time_of_day.includes("evening") || s.time_of_day.includes("night")));
      } catch (err) {
        console.error(err);
      }
    }
    loadRoutine();
  }, []);

  const handleToggleDone = async (id) => {
    const newState = !doneStatus[id];
    setDoneStatus(prev => ({ ...prev, [id]: newState }));
    try {
      await logRoutineStep(id, newState);
      setToast({ open: true, msg: `Step marked as ${newState ? "completed" : "pending"}!`, sev: "success" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to sync status.", sev: "error" });
    }
  };

  const handleToggleBookmark = (id) => {
    setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenDrawer = (s) => {
    setSelectedProduct(s);
    setDrawerOpen(true);
  };

  const currentSteps = activeTab === "morning" ? morningSteps : activeTab === "evening" ? eveningSteps : [];
  const totalDone = Object.values(doneStatus).filter(Boolean).length;
  const totalSteps = morningSteps.length + eveningSteps.length;
  const completionPct = totalSteps > 0 ? Math.round((totalDone / totalSteps) * 100) : 0;
  const morningPct = morningSteps.length > 0 ? Math.round((morningSteps.filter(s => doneStatus[s.id]).length / morningSteps.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Stack spacing={3}>

          {/* ============================================================
              ROW 1 — PAGE HEADER
              ============================================================ */}
          <Paper elevation={0} sx={{
            p: { xs: 2.5, sm: 3 }, borderRadius: CARD_RADIUS,
            background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 50%, #F5ECF6 100%)",
            border: CARD_BORDER, boxShadow: "0 4px 20px rgba(139,111,201,0.07)"
          }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <Chip icon={<AutoAwesome sx={{ fontSize: 12, color: COLORS.primaryDark }} />} label="AI Skincare Coach Active" size="small"
                    sx={{ backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, fontWeight: 700, fontSize: 10.5 }} />
                </Stack>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.15 }}>
                  My Routine 🧴
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, mt: 0.5 }}>
                  Your personalized skincare routine based on your skin assessment
                </Typography>
              </Box>

              {/* Completion + Streak */}
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Stack alignItems="center" spacing={0.5}>
                  <CircleProgress pct={morningPct} size={72} color={morningPct === 100 ? COLORS.success : COLORS.primary} />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>Routine Completion</Typography>
                    {morningPct === 100 && (
                      <Typography sx={{ fontSize: 9.5, color: COLORS.success, fontWeight: 700 }}>Great job! ✓</Typography>
                    )}
                  </Box>
                </Stack>

                <Divider orientation="vertical" flexItem />

                <Stack alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "rgba(255,167,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 28 }}>🔥</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#FFA726", lineHeight: 1 }}>{streakDays} days</Typography>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>Streak</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {/* ============================================================
              ROW 2 — TAB BAR
              ============================================================ */}
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", "&::-webkit-scrollbar": { display: "none" }, pb: 0.5 }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Box
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0,
                    px: 2.5, py: 1.25, borderRadius: "14px", cursor: "pointer",
                    backgroundColor: isActive ? CARD_BG : "transparent",
                    border: isActive ? "2px solid " + COLORS.primary : "2px solid transparent",
                    boxShadow: isActive ? "0 4px 14px rgba(139,111,201,0.15)" : "none",
                    transition: "all 0.2s ease",
                    "&:hover": { backgroundColor: isActive ? CARD_BG : "rgba(139,111,201,0.05)" }
                  }}
                >
                  <Icon sx={{ fontSize: 16, color: isActive ? tab.color : COLORS.textMuted }} />
                  <Typography sx={{ fontSize: 13, fontWeight: isActive ? 800 : 600, color: isActive ? COLORS.primaryDark : COLORS.textMuted, whiteSpace: "nowrap" }}>
                    {tab.label}
                  </Typography>
                  {isActive && (
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: tab.color, ml: 0.25 }} />
                  )}
                </Box>
              );
            })}
          </Box>

          {/* ============================================================
              ROW 3 — ROUTINE CONTENT
              ============================================================ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {(activeTab === "morning" || activeTab === "evening") && (
                <Stack spacing={2.5}>

                  {/* Routine Info Bar */}
                  <Paper elevation={0} sx={{
                    px: { xs: 2, sm: 3 }, py: 2, borderRadius: CARD_RADIUS,
                    background: activeTab === "morning"
                      ? "linear-gradient(135deg, #FFF9EE 0%, #FFF5E6 100%)"
                      : "linear-gradient(135deg, #F8F6FE 0%, #F5ECF6 100%)",
                    border: CARD_BORDER
                  }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                          width: 40, height: 40, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                          backgroundColor: activeTab === "morning" ? "rgba(255,167,38,0.15)" : "rgba(139,111,201,0.12)"
                        }}>
                          {activeTab === "morning"
                            ? <WbSunny sx={{ fontSize: 22, color: "#FFA726" }} />
                            : <NightsStay sx={{ fontSize: 22, color: COLORS.primary }} />
                          }
                        </Box>
                        <Box>
                          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.1 }}>
                            {activeTab === "morning" ? "Morning Routine" : "Evening Routine"}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
                            {currentSteps.length} Steps · Approx {activeTab === "morning" ? "5" : "8"} minutes
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                        <Chip label={`Skin Type: ${skinType}`} size="small" sx={{ height: 22, fontSize: 10.5, fontWeight: 700, backgroundColor: "#FFF", border: CARD_BORDER }} />
                        <Chip label={`Concern: ${primaryConcern}`} size="small" sx={{ height: 22, fontSize: 10.5, fontWeight: 700, backgroundColor: "#FFF", border: CARD_BORDER }} />
                        <Chip label="Last Updated: 25 Jul 2026" size="small" sx={{ height: 22, fontSize: 10.5, fontWeight: 700, backgroundColor: "#FFF", border: CARD_BORDER }} />
                        <Button
                          size="small"
                          startIcon={<AutoAwesome sx={{ fontSize: 13 }} />}
                          sx={{ height: 28, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 11.5, background: COLORS.brandGradient, color: "#FFF", px: 2 }}
                        >
                          Routine Tips
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>

                  {/* DESKTOP: 4-column card grid */}
                  {currentSteps.length === 0 ? (
                    <Typography sx={{ py: 8, textAlign: "center", color: COLORS.textMuted }}>No steps assigned for this routine yet.</Typography>
                  ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3 }}>
                      {currentSteps.map((step) => (
                        <StepCard
                          key={step.id}
                          step={step}
                          isDone={doneStatus[step.id]}
                          onToggle={handleToggleDone}
                          onOpenDrawer={handleOpenDrawer}
                          onBookmark={handleToggleBookmark}
                          bookmarked={bookmarked[step.id]}
                        />
                      ))}
                    </Box>
                  )}

                  {/* MOBILE: vertical step list */}
                  {isMobile && (
                    <Stack spacing={1.5}>
                      {currentSteps.map((step) => (
                        <StepRow
                          key={step.id}
                          step={step}
                          isDone={doneStatus[step.id] || false}
                          onToggle={handleToggleDone}
                          onOpenDrawer={(s) => { setSelectedProduct(s); setDrawerOpen(true); }}
                        />
                      ))}
                    </Stack>
                  )}

                  {/* AI Reminder Banner */}
                  <Paper elevation={0} sx={{
                    px: 3, py: 2, borderRadius: CARD_RADIUS,
                    backgroundColor: "rgba(139,111,201,0.05)", border: "1px solid rgba(139,111,201,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2
                  }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <AutoAwesome sx={{ fontSize: 18, color: COLORS.primary }} />
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark }}>AI Reminder</Typography>
                        <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>
                          Consistency is the key! Follow your routine daily for best results.
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: COLORS.primaryDark, "&:hover": { backgroundColor: "rgba(139,111,201,0.08)" } }}
                    >
                      View Full Routine History
                    </Button>
                  </Paper>
                </Stack>
              )}

              {/* WEEKLY & AS NEEDED — placeholder */}
              {(activeTab === "weekly" || activeTab === "asneeded") && (
                <Paper elevation={0} sx={{ p: 5, borderRadius: CARD_RADIUS, border: CARD_BORDER, textAlign: "center", backgroundColor: CARD_BG }}>
                  <Typography sx={{ fontSize: 36, mb: 1.5 }}>{activeTab === "weekly" ? "📅" : "⚡"}</Typography>
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark, mb: 1 }}>
                    {activeTab === "weekly" ? "Weekly Routine" : "As Needed Treatments"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: COLORS.textMuted, mb: 3, maxWidth: 440, mx: "auto" }}>
                    {activeTab === "weekly"
                      ? "Weekly deep treatments like face masks, exfoliation, and hydration boost routines."
                      : "Spot treatments, acne patches, and targeted serums for specific skin concerns."}
                  </Typography>
                  <Button variant="contained" onClick={() => navigate("/user/assessment")} startIcon={<CameraAlt />}
                    sx={{ background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700 }}>
                    Retake Assessment to Unlock
                  </Button>
                </Paper>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ============================================================
              ROW 4 — QUICK ACTIONS
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2 }}>
            {[
              { label: "New Assessment", icon: CameraAlt, path: "/user/assessment", color: COLORS.primary },
              { label: "View Products", icon: LocalPharmacy, path: "/user/products", color: COLORS.success },
              { label: "Book Consultation", icon: MedicalServices, action: () => setWizardOpen(true), color: "#42A5F5" },
              { label: "AI Ingredient Analyzer", icon: SmartToy, path: "/user/analyzer", color: "#FFA726" }
            ].map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <Paper
                  key={idx}
                  elevation={0}
                  onClick={() => btn.path ? navigate(btn.path) : btn.action()}
                  sx={{
                    p: 2, borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG,
                    textAlign: "center", cursor: "pointer", transition: "all 0.2s ease",
                    "&:hover": { borderColor: COLORS.primary, boxShadow: "0 4px 14px rgba(139,111,201,0.12)", transform: "translateY(-2px)" }
                  }}
                >
                  <Box sx={{ width: 38, height: 38, borderRadius: "12px", backgroundColor: btn.color + "18", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1 }}>
                    <Icon sx={{ fontSize: 20, color: btn.color }} />
                  </Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>{btn.label}</Typography>
                </Paper>
              );
            })}
          </Box>

        </Stack>
      </Box>

      {/* ============================================================
          PRODUCT DETAILS DRAWER
          ============================================================ */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, p: 3, borderTopLeftRadius: "20px", borderBottomLeftRadius: "20px" } }}
      >
        {selectedProduct && (
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Chip label={selectedProduct.category} size="small" sx={{ backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, fontWeight: 800 }} />
              <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ border: CARD_BORDER }}><Close sx={{ fontSize: 18 }} /></IconButton>
            </Stack>

            <Box sx={{ width: "100%", height: 200, borderRadius: "16px", overflow: "hidden", backgroundColor: "#FAF8FC" }}>
              <img src={selectedProduct.img} alt={selectedProduct.product} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>

            <Box>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 900, color: COLORS.textDark }}>{selectedProduct.product}</Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>By <strong>{selectedProduct.brand}</strong></Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, mb: 0.75 }}>🎯 Purpose</Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.4 }}>{selectedProduct.purpose}</Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, mb: 0.75 }}>📋 How to Apply</Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.textDark, lineHeight: 1.45 }}>{selectedProduct.instructions}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(139,111,201,0.06)", border: CARD_BORDER }}>
              <Typography sx={{ fontSize: 11.5, color: COLORS.primaryDark }}>
                <strong>💡 AI Tip:</strong> {selectedProduct.aiTip}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, mb: 0.75 }}>🧪 Key Ingredients</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {selectedProduct.ingredients.map((ing, i) => (
                  <Chip key={i} label={ing} size="small" sx={{ fontSize: 10.5, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark }} />
                ))}
              </Stack>
            </Box>

            <Alert severity="warning" sx={{ borderRadius: "12px", fontSize: 11.5 }}>
              {selectedProduct.warnings}
            </Alert>

            <Stack spacing={1}>
              <Button
                fullWidth variant="contained"
                onClick={() => { setToast({ open: true, msg: "Step marked as done! 🎉", sev: "success" }); setDrawerOpen(false); handleToggleDone(selectedProduct.id); }}
                sx={{ background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1 }}
              >
                Mark as Completed
              </Button>
              <Button
                fullWidth variant="outlined"
                onClick={() => setDrawerOpen(false)}
                sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
              >
                Close
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>

      {/* APPOINTMENT WIZARD */}
      <AppointmentWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSuccess={() => setToast({ open: true, msg: "Appointment requested!", sev: "success" })} />

      {/* TOAST */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} message={toast.msg} />
    </motion.div>
  );
}