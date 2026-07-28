import { useState } from "react";
import {
  Dialog, DialogContent, Box, Stack, Typography, Button, Chip, Avatar,
  IconButton, Divider, LinearProgress, Paper, Tooltip
} from "@mui/material";
import {
  Close, ArrowBack, Verified, Star, VideoCall, CalendarMonth, AccessTime,
  LocationOn, Language, MedicalServices, AutoAwesome, CheckCircle,
  Download, Message, EventRepeat, Cancel, Description, TrendingUp, Spa,
  Person, Fingerprint, Science, KeyboardArrowRight
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../../theme/colors";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CB = "1px solid " + COLORS.cardBorder;
const CR = "16px";
const CS = "0 2px 12px rgba(139,111,201,0.07)";
const CBG = "#FFFFFF";

/* ================================================================
   STATUS CONFIG
   ================================================================ */
const STATUS = {
  pending:   { label: "Pending",   bg: "rgba(255,167,38,0.12)",  color: "#FFA726", dot: "#FFA726"  },
  confirmed: { label: "Confirmed", bg: "rgba(76,175,125,0.12)",  color: "#43A047", dot: "#43A047"  },
  completed: { label: "Completed", bg: "rgba(66,165,245,0.12)",  color: "#1976D2", dot: "#1976D2"  },
  cancelled: { label: "Cancelled", bg: "rgba(244,67,54,0.12)",   color: "#D32F2F", dot: "#D32F2F"  }
};

/* ================================================================
   SMALL STAT ROW
   ================================================================ */
function InfoRow({ icon: Icon, label, value, color = COLORS.primary, copyable }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
        <Icon sx={{ fontSize: 14, color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textDark, wordBreak: "break-all" }}>{value || "—"}</Typography>
      </Box>
    </Stack>
  );
}

/* ================================================================
   SMALL CIRCULAR GAUGE
   ================================================================ */
function MiniGauge({ value, size = 52, color = COLORS.primary }) {
  const sw = 6, r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F0EBF8" strokeWidth={sw} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <Typography sx={{ fontSize: 12, fontWeight: 900, color: COLORS.textDark, zIndex: 1 }}>{value}</Typography>
    </Box>
  );
}

/* ================================================================
   CHECKLIST ITEM
   ================================================================ */
function CheckItem({ label, done, desc }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Box sx={{ mt: 0.15 }}>
        {done
          ? <CheckCircle sx={{ fontSize: 18, color: COLORS.success }} />
          : <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + COLORS.cardBorder, boxSizing: "border-box" }} />
        }
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12.5, fontWeight: done ? 700 : 600, color: done ? COLORS.textDark : COLORS.textMuted, textDecoration: done ? "none" : "none" }}>
          {label}
        </Typography>
        {desc && <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>{desc}</Typography>}
      </Box>
      {done && <Chip label="Completed" size="small" sx={{ ml: "auto !important", height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.1)", color: COLORS.success }} />}
    </Stack>
  );
}

/* ================================================================
   REPORT MINI CARD
   ================================================================ */
function ReportCard({ icon: Icon, title, date, color }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: "12px", border: CB, backgroundColor: CBG, display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0, minWidth: 170, transition: "all 0.2s", "&:hover": { borderColor: color, boxShadow: `0 4px 12px ${color}22` } }}>
      <Box sx={{ width: 32, height: 32, borderRadius: "9px", backgroundColor: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon sx={{ fontSize: 16, color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>{date}</Typography>
      </Box>
      <Stack direction="row" spacing={0.25}>
        <Tooltip title="View">
          <IconButton size="small" sx={{ p: 0.4 }}><Science sx={{ fontSize: 13, color: COLORS.textMuted }} /></IconButton>
        </Tooltip>
        <Tooltip title="Download PDF">
          <IconButton size="small" sx={{ p: 0.4 }}><Download sx={{ fontSize: 13, color: COLORS.textMuted }} /></IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

/* ================================================================
   MAIN MODAL COMPONENT
   ================================================================ */
export default function AppointmentDetailModal({ open, onClose, appointment, profile, assessment, onCancel }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  if (!appointment) return null;

  /* --- Derive display fields from real appointment data --- */
  const isOnline     = appointment.meeting_type !== "Clinic";
  const statusKey    = (appointment.status || "pending").toLowerCase();
  const st           = STATUS[statusKey] || STATUS.pending;
  const profName     = appointment.profName     || appointment.consultant_name     || appointment.dermatologist_name || "Specialist";
  const profRole     = appointment.profRole     || appointment.consultant_role     || "Dermatologist";
  const spec         = appointment.spec         || "Skin & Cosmetic Dermatology";
  const profImg      = appointment.profImg      || appointment.consultant_photo    || null;
  const profExp      = appointment.experience   || "12 Years Experience";
  const profRating   = appointment.rating       || "4.9";
  const profReviews  = appointment.reviews      || "128";
  const profLang     = appointment.languages    || "English, Hindi, Tamil";
  const profFee      = appointment.fee          || "₹1,000";
  const profHospital = appointment.hospital     || "Apollo Skin Care & Research Center";
  const profQual     = appointment.qualification|| "MD Dermatology, MBBS";
  const meetingLink  = appointment.meeting_link || appointment.video_link || "meet.skinintelligence.com/abc123";
  const bookingId    = appointment.id           || appointment.booking_id          || "APT-76291";
  const bookedOn     = appointment.created_at   ? new Date(appointment.created_at).toLocaleString() : "20 Jul 2026, 06:47 PM";
  const reason       = appointment.reason       || appointment.consultation_reason || "Barrier Repair & Acne Scars";
  const payStatus    = appointment.payment_status                                  || "Paid";
  const drNotes      = appointment.notes        || appointment.doctor_notes        || "Follow up after 4 weeks";
  const duration     = appointment.duration     || "30 Minutes";
  const scheduledAt  = appointment.scheduled_at ? new Date(appointment.scheduled_at) : null;
  const dateStr      = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Fri, 24 Jul 2026";
  const timeStr      = scheduledAt ? scheduledAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "10:00 AM";

  /* --- Patient from profile prop --- */
  const patientName   = profile?.full_name        || "K harichandana";
  const patientAge    = profile?.age              || "20";
  const patientGender = profile?.gender           || "Female";
  const patientSkin   = profile?.skin_type        || "Combination";
  const skinScore     = assessment?.overall_score || assessment?.skin_score || 82;
  const assessDate    = assessment?.created_at    ? new Date(assessment.created_at).toLocaleDateString() : "19 Jul 2026";
  const concerns      = profile?.skin_concerns    || assessment?.primary_concerns || ["Acne", "Pigmentation", "Sensitive Skin"];

  /* --- AI summary from assessment --- */
  const aiDetected    = assessment?.ai_detected     || ["Mild Acne", "Post Acne Pigmentation", "Slight Dehydration", "Barrier Damage"];
  const aiTopics      = assessment?.recommendations || ["Barrier repair routine", "Vitamin C & Niacinamide", "Acne control plan", "Sun protection & skincare layering"];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          width: { xs: "100%", md: "96vw", lg: "1100px" },
          maxWidth: "1100px",
          borderRadius: { xs: "16px", sm: "24px" },
          boxShadow: "0 24px 64px rgba(139,111,201,0.18)",
          backgroundColor: "#F9F7FC",
          m: { xs: 1, sm: 2 },
          maxHeight: "95vh"
        }
      }}
      TransitionProps={{ style: { transition: "opacity 0.25s ease" } }}
    >
      <DialogContent sx={{ p: 0, overflow: "auto" }}>

        {/* ============================================================
            TOP HEADER BAR
            ============================================================ */}
        <Box sx={{
          px: { xs: 2, sm: 3 }, py: 1.75,
          backgroundColor: CBG, borderBottom: CB,
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton size="small" onClick={onClose} sx={{ "&:hover": { backgroundColor: "#F5ECF6" } }}>
              <ArrowBack sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 15, sm: 17 }, fontWeight: 900, color: COLORS.textDark }}>
              Appointment Details
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Online/Offline badge */}
            <Chip
              label={isOnline ? "📹 Online Video Call" : "🏥 In-Person"}
              size="small"
              sx={{ fontSize: 11, fontWeight: 800, backgroundColor: isOnline ? "rgba(66,165,245,0.1)" : "rgba(76,175,125,0.1)", color: isOnline ? "#1976D2" : COLORS.success, display: { xs: "none", sm: "flex" } }}
            />
            {/* Status pill */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.5, borderRadius: "20px", backgroundColor: st.bg, border: `1px solid ${st.color}30` }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: st.dot }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: st.color }}>{st.label}</Typography>
            </Box>
            <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>

          {/* ============================================================
              ROW 1 — DOCTOR HEADER + PATIENT SUMMARY
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>

            {/* DOCTOR CARD */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                {/* Avatar */}
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Avatar
                    src={profImg || undefined}
                    sx={{ width: 72, height: 72, border: "3px solid #FFF", boxShadow: "0 4px 16px rgba(139,111,201,0.2)", borderRadius: "18px" }}
                  >
                    {profName.charAt(0)}
                  </Avatar>
                  {/* Online indicator */}
                  <Box sx={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", backgroundColor: COLORS.success, border: "2px solid #FFF" }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: COLORS.textDark }}>{profName}</Typography>
                    <Tooltip title="Verified Dermatologist">
                      <Verified sx={{ fontSize: 16, color: "#1976D2" }} />
                    </Tooltip>
                  </Stack>
                  <Typography sx={{ fontSize: 12, color: COLORS.primaryDark, fontWeight: 700 }}>{profRole}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>{spec}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" gap={0.5}>
                    <Chip label={profExp} size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 700, backgroundColor: "#F0F8FF", color: "#1976D2" }} />
                    <Chip icon={<Star sx={{ fontSize: 11, color: "#FFA726" }} />} label={`${profRating} (${profReviews} Reviews)`} size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 700, backgroundColor: "#FFF8E1", color: "#795548" }} />
                  </Stack>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.75 }} />

              <Stack spacing={0.25}>
                <InfoRow icon={MedicalServices} label="Qualification"     value={profQual}      color={COLORS.primary} />
                <InfoRow icon={Language}         label="Languages"         value={profLang}      color="#42A5F5"        />
                <InfoRow icon={LocationOn}        label="Hospital / Clinic" value={profHospital}  color={COLORS.success} />
                <InfoRow icon={AccessTime}        label="Consultation Fee"  value={profFee}       color="#FFA726"        />
              </Stack>
            </Paper>

            {/* PATIENT SUMMARY CARD */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.75 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Person sx={{ fontSize: 17, color: COLORS.primary }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Patient Summary</Typography>
                </Stack>
                <Button size="small" endIcon={<KeyboardArrowRight sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: "none", fontSize: 11.5, fontWeight: 700, color: COLORS.primaryDark, p: 0 }}>
                  View Profile
                </Button>
              </Stack>

              {/* Name / Age / Skin Type */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 1.5, mb: 1.75 }}>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Name</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{patientName}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Age / Gender</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{patientAge} / {patientGender}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Skin Type</Typography>
                  <Chip label={patientSkin} size="small" sx={{ mt: 0.25, height: 22, fontSize: 11, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark }} />
                </Box>
              </Box>

              <Divider sx={{ mb: 1.75 }} />

              {/* Primary Concerns */}
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.75 }}>Primary Concerns</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.75 }}>
                {(Array.isArray(concerns) ? concerns : [concerns]).map((c, i) => (
                  <Chip key={i} label={c} size="small"
                    sx={{ height: 22, fontSize: 10.5, fontWeight: 700,
                      backgroundColor: ["rgba(228,116,155,0.1)", "rgba(139,111,201,0.1)", "rgba(255,167,38,0.1)", "rgba(66,165,245,0.1)"][i % 4],
                      color: [COLORS.danger, COLORS.primaryDark, "#E65100", "#1976D2"][i % 4]
                    }} />
                ))}
              </Stack>

              {/* Skin Score + Date */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Latest Skin Score</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                    <MiniGauge value={skinScore} color={COLORS.primary} />
                    <Box>
                      <Typography sx={{ fontSize: 16, fontWeight: 900, color: COLORS.textDark }}>{skinScore}<span style={{ fontSize: 10, color: COLORS.textMuted }}>/100</span></Typography>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: COLORS.success }}>Good</Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Assessment Date</Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, mt: 0.25 }}>{assessDate}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* ============================================================
              ROW 2 — APPOINTMENT INFO + AI CLINICAL SUMMARY
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>

            {/* APPOINTMENT DETAILS */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                <CalendarMonth sx={{ fontSize: 17, color: COLORS.primary }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Appointment Information</Typography>
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                <InfoRow icon={CalendarMonth} label="Date"           value={dateStr}                   color={COLORS.primary} />
                <InfoRow icon={AccessTime}    label="Time"           value={`${timeStr} · ${duration}`} color="#42A5F5"        />
                <InfoRow icon={VideoCall}     label="Mode"           value={isOnline ? "Online Video Call" : "In-Person Clinic"} color={isOnline ? "#1976D2" : COLORS.success} />
                <InfoRow icon={LocationOn}    label="Clinic"         value={isOnline ? "Telehealth" : profHospital} color={COLORS.success} />
              </Box>

              {isOnline && (
                <Box sx={{ mt: 1, p: 1.25, borderRadius: "10px", backgroundColor: "#F0F8FF", border: "1px solid rgba(25,118,210,0.15)" }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, mb: 0.25 }}>MEETING LINK</Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#1976D2", wordBreak: "break-all" }}>{meetingLink}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Booking ID</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark }}>{bookingId}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Reason</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>{reason}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Payment Status</Typography>
                  <Chip label={payStatus} size="small" sx={{ mt: 0.25, height: 20, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.1)", color: COLORS.success }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Booked On</Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textDark }}>{bookedOn}</Typography>
                </Box>
              </Box>

              {drNotes && (
                <Box sx={{ mt: 1.25, p: 1.25, borderRadius: "10px", backgroundColor: "rgba(255,167,38,0.07)", border: "1px solid rgba(255,167,38,0.2)" }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#FFA726", textTransform: "uppercase", mb: 0.25 }}>Doctor Notes</Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.textDark, fontWeight: 600 }}>{drNotes}</Typography>
                </Box>
              )}
            </Paper>

            {/* AI CLINICAL SUMMARY */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                <AutoAwesome sx={{ fontSize: 17, color: COLORS.primary }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>AI Clinical Summary</Typography>
              </Stack>

              {/* AI Detected */}
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.75 }}>AI Detected</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
                {aiDetected.map((d, i) => {
                  const colors = [COLORS.danger, "#9C27B0", "#1976D2", "#FFA726"];
                  const bgs    = ["rgba(244,67,54,0.09)", "rgba(156,39,176,0.09)", "rgba(25,118,210,0.09)", "rgba(255,167,38,0.09)"];
                  return (
                    <Chip key={i} label={d} size="small"
                      sx={{ height: 24, fontSize: 11, fontWeight: 800, borderRadius: "8px",
                        backgroundColor: bgs[i % 4], color: colors[i % 4]
                      }} />
                  );
                })}
              </Stack>

              {/* Recommended Discussion */}
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.75 }}>Recommended Discussion</Typography>
              <Stack spacing={0.6} sx={{ mb: 1.5 }}>
                {aiTopics.map((t, i) => (
                  <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: COLORS.primary, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 12, color: COLORS.textDark, fontWeight: 600 }}>{t}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Box sx={{ p: 1.5, borderRadius: "10px", backgroundColor: "rgba(139,111,201,0.05)", border: "1px solid rgba(139,111,201,0.15)" }}>
                <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontStyle: "italic" }}>
                  ✨ All insights are generated from your latest assessment on {assessDate}.
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* ============================================================
              ROW 3 — PREPARATION CHECKLIST + PHOTOS + REPORTS
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2, mb: 2 }}>

            {/* PREPARATION CHECKLIST */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Preparation Checklist</Typography>
                <Chip label="5 / 5 Completed" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.1)", color: COLORS.success }} />
              </Stack>
              <Stack spacing={0.25}>
                <CheckItem label="Upload latest skin photos"       done={true}  desc="Last uploaded: 19 Jul 2026" />
                <CheckItem label="Complete skin assessment"        done={true}  desc="Score: 82/100 — Good" />
                <CheckItem label="Fill consultation notes"         done={true}  />
                <CheckItem label="Upload previous reports"         done={true}  />
                <CheckItem label="Complete lifestyle questionnaire"done={true}  />
              </Stack>
            </Paper>

            {/* UPLOADED SKIN PHOTOS */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Uploaded Skin Photos</Typography>
                <Button size="small" sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, color: COLORS.primaryDark, p: 0 }}>View All</Button>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, position: "relative" }}>
                {/* Before */}
                <Box>
                  <Box sx={{ height: 110, borderRadius: "12px", backgroundColor: "#FAF0F5", border: CB, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                    <Typography sx={{ fontSize: 28 }}>📸</Typography>
                    <Box sx={{ position: "absolute", bottom: 4, left: 4, px: 0.75, py: 0.25, borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#FFF" }}>Before</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center", mt: 0.5 }}>10 Jul 2026</Typography>
                </Box>
                {/* Latest */}
                <Box>
                  <Box sx={{ height: 110, borderRadius: "12px", backgroundColor: "#F0F5FA", border: CB, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                    <Typography sx={{ fontSize: 28 }}>🤳</Typography>
                    <Box sx={{ position: "absolute", bottom: 4, left: 4, px: 0.75, py: 0.25, borderRadius: "6px", backgroundColor: "rgba(76,175,125,0.8)" }}>
                      <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#FFF" }}>Latest</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center", mt: 0.5 }}>19 Jul 2026</Typography>
                </Box>
                {/* Compare badge */}
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2, width: 28, height: 28, borderRadius: "50%", backgroundColor: CBG, border: CB, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <Typography sx={{ fontSize: 12 }}>↔</Typography>
                </Box>
              </Box>
            </Paper>

            {/* PREVIOUS REPORTS */}
            <Paper elevation={0} sx={{ borderRadius: CR, border: CB, backgroundColor: CBG, p: 2.5, boxShadow: CS }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Previous Reports</Typography>
                <Button size="small" sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, color: COLORS.primaryDark, p: 0 }}>View All</Button>
              </Stack>
              <Stack spacing={1}>
                <ReportCard icon={Description}  title="Skin Assessment Report" date="19 Jul 2026" color={COLORS.primary} />
                <ReportCard icon={TrendingUp}    title="Routine Report"          date="18 Jul 2026" color={COLORS.success} />
                <ReportCard icon={Spa}           title="Progress Report"         date="10 Jul 2026" color="#42A5F5"        />
              </Stack>
            </Paper>
          </Box>

        </Box>

        {/* ============================================================
            STICKY BOTTOM ACTION BAR
            ============================================================ */}
        <Box sx={{
          position: "sticky", bottom: 0, zIndex: 10,
          px: { xs: 2, sm: 3 }, py: 1.75,
          backgroundColor: CBG, borderTop: CB,
          display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center", justifyContent: "space-between"
        }}>
          {/* Left: secondary actions */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Button variant="outlined" size="small" startIcon={<Message sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, "&:hover": { borderColor: COLORS.primary } }}>
              Message Doctor
            </Button>
            <Button variant="outlined" size="small" startIcon={<EventRepeat sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, "&:hover": { borderColor: COLORS.primary } }}>
              Reschedule
            </Button>
            <Button variant="outlined" size="small" startIcon={<Download sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, "&:hover": { borderColor: COLORS.primary } }}>
              Download Report
            </Button>
            <Button variant="outlined" size="small" startIcon={<Cancel sx={{ fontSize: 14 }} />}
              onClick={() => onCancel?.(appointment.id)}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: "rgba(244,67,54,0.3)", color: "#D32F2F", "&:hover": { borderColor: "#D32F2F", backgroundColor: "rgba(244,67,54,0.04)" } }}>
              Cancel Appointment
            </Button>
          </Stack>

          {/* Right: primary join button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<VideoCall sx={{ fontSize: 18 }} />}
            disabled={!isOnline || statusKey === "cancelled"}
            sx={{ background: COLORS.brandGradient, borderRadius: "14px", textTransform: "none", fontWeight: 800, fontSize: 14, px: 3, py: 1.1, boxShadow: "0 4px 16px rgba(139,111,201,0.3)", "&:hover": { transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(139,111,201,0.4)" }, transition: "all 0.2s" }}
            onClick={() => window.open(`https://${meetingLink}`, "_blank")}
          >
            Join Consultation
          </Button>
        </Box>

      </DialogContent>
    </Dialog>
  );
}
