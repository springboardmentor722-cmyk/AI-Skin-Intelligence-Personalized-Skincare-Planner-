import { useState, useEffect, useCallback } from "react";
import {
  Box, Stack, Typography, Avatar, Button, IconButton, Chip,
  CircularProgress, Dialog, DialogContent, InputBase, Paper, Alert,
  TextField, LinearProgress, Skeleton
} from "@mui/material";
import {
  Close, Search, Star, CheckCircle, ArrowBack, ArrowForward,
  EventNote, AccessTime, MedicalServices, Spa, CalendarMonth,
  Person, VerifiedUser, Celebration, WorkspacePremium, Refresh
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getAvailableSlots, bookAppointmentWizard, requestConsultant, requestDermatologist } from "../api/engagement";
import { getConsultantsList, getDermatologistsList } from "../api/dashboard";

const cPrimary = COLORS.primary || "#8B6FC9";
const cBrandGradient = COLORS.brandGradient || "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)";
const cCardBorder = COLORS.cardBorder || "rgba(139,111,201,0.12)";
const cTextDark = COLORS.textDark || "#1E1A2D";
const cTextMuted = COLORS.textMuted || "#6B667A";
const cSuccess = COLORS.success || "#4CAF7D";
const cWarning = COLORS.warning || "#E0A54C";

const STEPS = [
  { label: "Professional Type", icon: MedicalServices },
  { label: "Choose Expert", icon: Person },
  { label: "Select Slot", icon: CalendarMonth },
  { label: "Confirm Booking", icon: CheckCircle },
];

const SKIN_CONCERNS = [
  "Acne & Breakouts", "Dry Skin", "Oily Skin", "Hyperpigmentation",
  "Redness & Rosacea", "Anti-aging", "Sensitive Skin", "Uneven Texture",
  "Dark Circles", "Eczema", "General Skincare", "Post-acne Scars",
];

function StepIndicator({ currentStep }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
        {STEPS.map((step, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;
          const Icon = step.icon;
          return (
            <Stack key={idx} direction="row" alignItems="center">
              <Stack alignItems="center" spacing={0.5}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: done ? cSuccess : active ? cBrandGradient : "rgba(139,111,201,0.08)",
                  border: `2px solid ${done ? cSuccess : active ? "transparent" : cCardBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: active ? "0 4px 14px rgba(139,111,201,0.3)" : "none",
                  transition: "all 0.3s"
                }}>
                  {done
                    ? <CheckCircle sx={{ fontSize: 18, color: "#fff" }} />
                    : <Icon sx={{ fontSize: 17, color: active ? "#fff" : cTextMuted }} />
                  }
                </Box>
                <Typography sx={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? cPrimary : cTextMuted, maxWidth: 60, textAlign: "center", lineHeight: 1.2 }}>
                  {step.label}
                </Typography>
              </Stack>
              {idx < STEPS.length - 1 && (
                <Box sx={{ width: 40, height: 2, backgroundColor: done ? cSuccess : cCardBorder, mx: 0.5, mt: -2, transition: "background 0.3s" }} />
              )}
            </Stack>
          );
        })}
      </Stack>
      <LinearProgress
        variant="determinate"
        value={((currentStep) / (STEPS.length - 1)) * 100}
        sx={{ mt: 2, height: 3, borderRadius: 99, backgroundColor: "rgba(139,111,201,0.08)",
          "& .MuiLinearProgress-bar": { background: cBrandGradient } }}
      />
    </Box>
  );
}

function ProfessionalCard({ prof, selected, onClick }) {
  const initials = (name) => (name || "?").split(" ").map(n => n[0]).slice(0, 2).join("");
  return (
    <Paper onClick={onClick} elevation={0} sx={{
      p: 2, borderRadius: "16px", cursor: "pointer",
      border: `2px solid ${selected ? cPrimary : cCardBorder}`,
      background: selected ? "rgba(139,111,201,0.04)" : "#fff",
      boxShadow: selected ? "0 0 0 3px rgba(139,111,201,0.15)" : "none",
      transition: "all 0.2s", "&:hover": { borderColor: cPrimary, boxShadow: "0 4px 16px rgba(139,111,201,0.12)" }
    }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          {prof.profile_photo
            ? <Avatar src={prof.profile_photo} sx={{ width: 52, height: 52, border: `2px solid ${selected ? cPrimary : cCardBorder}` }} />
            : <Avatar sx={{ width: 52, height: 52, background: cBrandGradient, fontSize: 16, fontWeight: 800, border: `2px solid ${selected ? cPrimary : cCardBorder}` }}>
                {initials(prof.full_name)}
              </Avatar>
          }
          {prof.has_availability !== false && (
            <Box sx={{
              position: "absolute", bottom: 0, right: 0, width: 12, height: 12,
              borderRadius: "50%", backgroundColor: cSuccess, border: "2px solid #fff"
            }} />
          )}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark, lineHeight: 1.2 }}>
              {prof.full_name}
            </Typography>
            {prof.is_verified && (
              <Chip label="Verified" size="small" icon={<VerifiedUser sx={{ fontSize: "11px !important", color: `${cSuccess} !important` }} />}
                sx={{ height: 18, fontSize: 9.5, fontWeight: 700, backgroundColor: "rgba(76,175,125,0.1)", color: cSuccess }} />
            )}
          </Stack>

          <Typography sx={{ fontSize: 11.5, color: cPrimary, fontWeight: 600, mt: 0.25 }}>
            {prof.specialization || (prof.role === "dermatologist" ? "Clinical Dermatology" : "Skincare Consultant")}
          </Typography>

          <Typography sx={{ fontSize: 11, color: cTextMuted, mt: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            🎓 {prof.qualification || "Certified Practitioner"} · 🏥 {prof.clinic || "SkinAI Health Center"}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.3}>
              <Star sx={{ fontSize: 13, color: cWarning }} />
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: cTextDark }}>{prof.rating || "4.9"}</Typography>
              <Typography sx={{ fontSize: 10, color: cTextMuted }}>({prof.reviews || 120})</Typography>
            </Stack>
            <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>
              💼 {prof.experience || 5} yrs exp
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: cPrimary, ml: "auto" }}>
              {prof.fee || (prof.role === "dermatologist" ? "₹1,000" : "₹500")}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function DateCalendar({ selectedDate, onDateSelect, professionalId }) {
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    if (!professionalId) return;
    setLoadingMap(true);
    getAvailableSlots(professionalId, null)
      .then(data => {
        const map = {};
        (data.availability || []).forEach(a => {
          map[a.date] = a.available_count || 0;
        });
        setAvailabilityMap(map);
      })
      .catch(() => {})
      .finally(() => setLoadingMap(false));
  }, [professionalId]);

  const today = new Date();
  const days = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) days.push(d); // skip Sundays
  }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <Box>
      {loadingMap && <LinearProgress sx={{ mb: 1, borderRadius: 99, height: 2 }} />}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }}>
        {DAY_LABELS.map(d => (
          <Typography key={d} sx={{ fontSize: 9.5, fontWeight: 700, color: cTextMuted, textAlign: "center", mb: 0.5 }}>{d}</Typography>
        ))}
        {/* Empty leading cells for weekday offset */}
        {Array.from({ length: (days[0]?.getDay() || 1) - 1 }).map((_, i) => <Box key={`empty-${i}`} />)}
        {days.map(d => {
          const iso = d.toISOString().split("T")[0];
          const avail = availabilityMap[iso] ?? -1;
          const isSelected = selectedDate === iso;
          const hasSlots = avail > 0;
          const noData = avail === -1;
          return (
            <Box key={iso} onClick={() => hasSlots || noData ? onDateSelect(iso) : null}
              sx={{
                p: 0.5, borderRadius: "10px", textAlign: "center", cursor: (hasSlots || noData) ? "pointer" : "default",
                background: isSelected ? cBrandGradient : hasSlots ? "rgba(76,175,125,0.07)" : noData ? "#fafafa" : "#f8f8f8",
                border: `1.5px solid ${isSelected ? "transparent" : hasSlots ? "rgba(76,175,125,0.2)" : cCardBorder}`,
                boxShadow: isSelected ? "0 4px 12px rgba(139,111,201,0.25)" : "none",
                transition: "all 0.2s", "&:hover": { borderColor: (hasSlots || noData) ? cPrimary : undefined }
              }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: isSelected ? "#fff" : cTextDark }}>{d.getDate()}</Typography>
              <Typography sx={{ fontSize: 8.5, color: isSelected ? "rgba(255,255,255,0.8)" : cTextMuted }}>{MONTH_NAMES[d.getMonth()]}</Typography>
              {!isSelected && hasSlots && (
                <Box sx={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: cSuccess, mx: "auto", mt: 0.25 }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function TimeSlots({ professionalId, selectedDate, selectedSlot, onSlotSelect }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!professionalId || !selectedDate) return;
    setLoading(true);
    getAvailableSlots(professionalId, selectedDate)
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [professionalId, selectedDate]);

  if (!selectedDate) return (
    <Box sx={{ p: 2.5, textAlign: "center", border: `1px dashed ${cCardBorder}`, borderRadius: "12px" }}>
      <CalendarMonth sx={{ color: cTextMuted, fontSize: 28, mb: 0.5 }} />
      <Typography sx={{ fontSize: 12, color: cTextMuted }}>Select a date to view available slots</Typography>
    </Box>
  );

  if (loading) return <Stack alignItems="center" sx={{ py: 2 }}><CircularProgress size={22} sx={{ color: cPrimary }} /></Stack>;
  if (!slots.length) return (
    <Box sx={{ p: 2, textAlign: "center", border: `1px dashed ${cCardBorder}`, borderRadius: "12px" }}>
      <Typography sx={{ fontSize: 12, color: cTextMuted }}>No available slots on this date. Please choose another day.</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
      {slots.map((slot) => {
        const isSelected = selectedSlot?.id === slot.id;
        const isBooked = slot.is_booked;
        return (
          <Box key={slot.id} onClick={() => !isBooked && onSlotSelect(slot)}
            sx={{
              p: 1.25, borderRadius: "10px", textAlign: "center", cursor: isBooked ? "default" : "pointer",
              border: `1.5px solid ${isSelected ? cPrimary : isBooked ? "#eee" : cCardBorder}`,
              background: isSelected ? cBrandGradient : isBooked ? "#f9f9f9" : "#fff",
              boxShadow: isSelected ? "0 4px 12px rgba(139,111,201,0.25)" : "none",
              opacity: isBooked ? 0.5 : 1, transition: "all 0.2s",
              "&:hover": { borderColor: !isBooked ? cPrimary : undefined }
            }}>
            <AccessTime sx={{ fontSize: 13, color: isSelected ? "#fff" : isBooked ? cTextMuted : cPrimary }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: isSelected ? "#fff" : isBooked ? cTextMuted : cTextDark }}>
              {slot.start_time}
            </Typography>
            {isBooked && <Typography sx={{ fontSize: 8.5, color: cTextMuted }}>Taken</Typography>}
          </Box>
        );
      })}
    </Box>
  );
}

export default function AppointmentWizard({ open, onClose, onSuccess, consultants = [], dermatologists = [] }) {
  const [step, setStep] = useState(0);
  const [profType, setProfType] = useState(null);        // "consultant" | "dermatologist"
  const [selectedProf, setSelectedProf] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [skinConcern, setSkinConcern] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  // Live professional data from PostgreSQL
  const [liveConsultants, setLiveConsultants] = useState([]);
  const [liveDermatologists, setLiveDermatologists] = useState([]);
  const [loadingProfs, setLoadingProfs] = useState(false);

  const fetchProfessionals = useCallback(async (type) => {
    if (!type) return;
    setLoadingProfs(true);
    setError("");
    try {
      if (type === "consultant") {
        const list = await getConsultantsList();
        setLiveConsultants(Array.isArray(list) ? list : []);
      } else {
        const list = await getDermatologistsList();
        setLiveDermatologists(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError("Failed to fetch verified professionals from PostgreSQL server.");
    } finally {
      setLoadingProfs(false);
    }
  }, []);

  useEffect(() => {
    if (profType && open) {
      fetchProfessionals(profType);
    }
  }, [profType, open, fetchProfessionals]);

  const professionalsList = profType === "consultant" 
    ? (liveConsultants.length > 0 ? liveConsultants : consultants)
    : (liveDermatologists.length > 0 ? liveDermatologists : dermatologists);

  const filtered = professionalsList.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clinic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canNext = () => {
    if (step === 0) return !!profType;
    if (step === 1) return !!selectedProf;
    if (step === 2) return !!selectedDate && !!selectedSlot && reason.trim().length > 3;
    return false;
  };

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
    setError("");
  };

  const handleClose = () => {
    setStep(0); setProfType(null); setSelectedProf(null); setSearchTerm("");
    setSelectedDate(""); setSelectedSlot(null); setReason(""); setSkinConcern(""); setMessage("");
    setError(""); setConfirmed(null); setSubmitting(false);
    onClose();
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await bookAppointmentWizard({
        professional_id: selectedProf.id,
        professional_type: profType,
        slot_date: selectedDate,
        slot_start_time: selectedSlot.start_time_raw,
        reason,
        skin_concern: skinConcern || null,
        message: message || null,
      });

      // Auto-assign the user as a client to the professional
      try {
        if (profType === "consultant") {
          await requestConsultant(selectedProf.id);
        } else if (profType === "dermatologist") {
          await requestDermatologist(selectedProf.id);
        }
      } catch (linkErr) {
        console.warn("User may already be linked", linkErr);
      }

      setConfirmed(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err?.response?.data?.detail || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden", maxHeight: "92vh" } }}>

      {/* Header */}
      <Box sx={{ background: cBrandGradient, px: 3, py: 2.5, position: "relative" }}>
        <IconButton onClick={handleClose} size="small"
          sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}>
          <Close fontSize="small" />
        </IconButton>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EventNote sx={{ color: "#fff", fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
              Book Expert Consultation
            </Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
              Real-time professional scheduling from PostgreSQL
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3, overflowY: "auto" }}>
        {/* ─── SUCCESS SCREEN ─── */}
        {confirmed ? (
          <Stack alignItems="center" spacing={2.5} sx={{ py: 3, textAlign: "center" }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #4CAF7D 0%, #2E9E5B 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(76,175,125,0.3)",
              animation: "bounceIn 0.5s ease"
            }}>
              <Celebration sx={{ color: "#fff", fontSize: 36 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: cTextDark }}>
                Appointment Requested!
              </Typography>
              <Typography sx={{ fontSize: 13, color: cTextMuted, mt: 0.5, maxWidth: 340 }}>
                Your consultation request has been saved to PostgreSQL and sent to <strong>{confirmed.professional_name}</strong>.
              </Typography>
            </Box>

            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: "16px", border: `1px solid ${cCardBorder}`,
              backgroundColor: "rgba(139,111,201,0.04)", width: "100%", textAlign: "left"
            }}>
              <Stack spacing={1.25}>
                {[
                  { label: "Professional", value: confirmed.professional_name },
                  { label: "Type", value: confirmed.professional_type === "consultant" ? "Skincare Consultant" : "Dermatologist" },
                  { label: "Date", value: formatDate(confirmed.slot_date) },
                  { label: "Time", value: confirmed.slot_time },
                  { label: "Status", value: "Pending Confirmation" },
                ].map(row => (
                  <Stack key={row.label} direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 600 }}>{row.label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: cTextDark, textAlign: "right", maxWidth: "60%" }}>
                      {row.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Chip label="Pending Confirmation" icon={<AccessTime sx={{ fontSize: "12px !important" }} />}
              sx={{ height: 24, fontSize: 11, fontWeight: 700, backgroundColor: "#FFF9EC", color: cWarning }} />

            <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
              <Button fullWidth variant="outlined" onClick={handleClose}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, borderColor: cCardBorder, color: cTextMuted }}>
                Close
              </Button>
              <Button fullWidth variant="contained" onClick={handleClose}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, background: cBrandGradient, color: "#fff" }}>
                View Appointments
              </Button>
            </Stack>
          </Stack>
        ) : (
          <>
            <StepIndicator currentStep={step} />

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }} onClose={() => setError("")}>{error}</Alert>
            )}

            {/* ─── STEP 0: Professional Type ─── */}
            {step === 0 && (
              <Stack spacing={2}>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: cTextDark }}>
                  Who would you like to consult?
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: cTextMuted, mt: -0.5 }}>
                  Choose the type of skincare professional best suited to your needs.
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1 }}>
                  {[
                    {
                      type: "consultant", title: "Skincare Consultant", icon: Spa,
                      desc: "Personalised skincare advice, routine planning & product guidance.",
                      color: "#8B6FC9", bgColor: "rgba(139,111,201,0.06)"
                    },
                    {
                      type: "dermatologist", title: "Dermatologist", icon: VerifiedUser,
                      desc: "Clinical diagnosis, prescriptions & medical-grade treatment plans.",
                      color: "#E4749B", bgColor: "rgba(228,116,155,0.06)"
                    },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const isSelected = profType === opt.type;
                    return (
                      <Paper key={opt.type} onClick={() => setProfType(opt.type)} elevation={0} sx={{
                        p: 2.5, borderRadius: "18px", cursor: "pointer", textAlign: "center",
                        border: `2px solid ${isSelected ? opt.color : cCardBorder}`,
                        background: isSelected ? opt.bgColor : "#fff",
                        boxShadow: isSelected ? `0 0 0 3px ${opt.color}22` : "none",
                        transition: "all 0.2s", "&:hover": { borderColor: opt.color, boxShadow: `0 4px 16px ${opt.color}22` }
                      }}>
                        <Box sx={{
                          width: 52, height: 52, borderRadius: "16px",
                          background: isSelected ? `linear-gradient(135deg, ${opt.color}, ${opt.color}99)` : opt.bgColor,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          mx: "auto", mb: 1.5, transition: "all 0.2s"
                        }}>
                          <Icon sx={{ fontSize: 26, color: isSelected ? "#fff" : opt.color }} />
                        </Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark, mb: 0.75 }}>{opt.title}</Typography>
                        <Typography sx={{ fontSize: 11, color: cTextMuted, lineHeight: 1.5 }}>{opt.desc}</Typography>
                        {isSelected && (
                          <Chip label="Selected" size="small" sx={{ mt: 1.5, height: 20, fontSize: 10, fontWeight: 700,
                            backgroundColor: opt.color, color: "#fff" }} />
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Stack>
            )}

            {/* ─── STEP 1: Choose Expert ─── */}
            {step === 1 && (
              <Stack spacing={2}>
                <Box direction="row" display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: cTextDark }}>
                      Choose your {profType === "consultant" ? "Skincare Consultant" : "Dermatologist"}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: cTextMuted }}>
                      {loadingProfs ? "Fetching from PostgreSQL..." : `${filtered.length} verified professionals available`}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => fetchProfessionals(profType)} disabled={loadingProfs}>
                    <Refresh fontSize="small" sx={{ color: cPrimary }} />
                  </IconButton>
                </Box>

                <Paper elevation={0} sx={{ display: "flex", alignItems: "center", px: 1.5, py: 0.75,
                  border: `1px solid ${cCardBorder}`, borderRadius: "12px" }}>
                  <Search sx={{ color: cTextMuted, fontSize: 18, mr: 1 }} />
                  <InputBase placeholder="Search by name, specialization, or clinic..."
                    sx={{ fontSize: 13, flex: 1 }} value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} />
                </Paper>

                {loadingProfs ? (
                  <Stack spacing={1.5}>
                    {[1, 2, 3].map(i => (
                      <Paper key={i} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${cCardBorder}` }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Skeleton variant="circular" width={52} height={52} />
                          <Box sx={{ width: "100%" }}>
                            <Skeleton variant="text" width="60%" height={20} />
                            <Skeleton variant="text" width="40%" height={16} />
                            <Skeleton variant="text" width="80%" height={16} />
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : filtered.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <WorkspacePremium sx={{ fontSize: 40, color: cTextMuted, mb: 1 }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark }}>
                      No verified {profType === "consultant" ? "consultants" : "dermatologists"} available.
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => fetchProfessionals(profType)} startIcon={<Refresh />} sx={{ mt: 1.5, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
                      Refresh Directory
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1.5} sx={{ maxHeight: 340, overflowY: "auto", pr: 0.5 }}>
                    {filtered.map(prof => (
                      <ProfessionalCard
                        key={prof.id}
                        prof={prof}
                        selected={selectedProf?.id === prof.id}
                        onClick={() => setSelectedProf(prof)}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            )}

            {/* ─── STEP 2: Date & Slot ─── */}
            {step === 2 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: cTextDark }}>
                    Choose a date & time slot
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: cTextMuted }}>
                    Consulting with <strong>{selectedProf?.full_name}</strong> · Real-time availability
                  </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 2, border: `1px solid ${cCardBorder}`, borderRadius: "16px" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark, mb: 1.5 }}>📅 Select Date (next 14 days)</Typography>
                  <DateCalendar
                    selectedDate={selectedDate}
                    onDateSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                    professionalId={selectedProf?.id}
                  />
                </Paper>

                <Paper elevation={0} sx={{ p: 2, border: `1px solid ${cCardBorder}`, borderRadius: "16px" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark, mb: 1.5 }}>
                    ⏰ Available Time Slots{selectedDate ? ` – ${new Date(selectedDate).toLocaleDateString("en-US", { month:"short",day:"numeric" })}` : ""}
                  </Typography>
                  <TimeSlots
                    professionalId={selectedProf?.id}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSlotSelect={setSelectedSlot}
                  />
                </Paper>

                <Stack spacing={1.5}>
                  <TextField
                    label="Consultation Reason *"
                    fullWidth multiline rows={2}
                    placeholder="Describe what you'd like to discuss..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: cTextMuted, mb: 1 }}>
                      Primary Skin Concern (optional)
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75 }}>
                      {SKIN_CONCERNS.map(c => (
                        <Chip key={c} label={c} size="small" clickable
                          onClick={() => setSkinConcern(skinConcern === c ? "" : c)}
                          sx={{ fontSize: 10.5, height: 24, fontWeight: 600,
                            backgroundColor: skinConcern === c ? cPrimary : "rgba(139,111,201,0.06)",
                            color: skinConcern === c ? "#fff" : cPrimary,
                            border: `1px solid ${skinConcern === c ? cPrimary : cCardBorder}`,
                            "&:hover": { backgroundColor: skinConcern === c ? cPrimary : "rgba(139,111,201,0.12)" }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <TextField
                    label="Additional notes (optional)"
                    fullWidth multiline rows={1}
                    placeholder="Any allergies, medications, or prior treatments to mention..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Stack>
              </Stack>
            )}

            {/* ─── STEP 3: Confirm ─── */}
            {step === 3 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: cTextDark }}>
                    Confirm your booking
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: cTextMuted }}>
                    Review the details before confirming your appointment.
                  </Typography>
                </Box>

                {/* Professional summary card */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${cCardBorder}`, background: "rgba(139,111,201,0.03)" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {selectedProf?.profile_photo
                      ? <Avatar src={selectedProf.profile_photo} sx={{ width: 52, height: 52, border: `2px solid ${cPrimary}` }} />
                      : <Avatar sx={{ width: 52, height: 52, background: cBrandGradient, fontSize: 16, fontWeight: 800 }}>
                          {(selectedProf?.full_name || "?").split(" ").map(n=>n[0]).slice(0,2).join("")}
                        </Avatar>
                    }
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 900, color: cTextDark }}>{selectedProf?.full_name}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>{selectedProf?.specialization}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                        <Star sx={{ fontSize: 11, color: cWarning }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{selectedProf?.rating || "4.9"}</Typography>
                        <Typography sx={{ fontSize: 11, color: cTextMuted }}>· {selectedProf?.experience || 5}yrs experience</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>

                {/* Booking details */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${cCardBorder}` }}>
                  <Stack spacing={1.5}>
                    {[
                      { icon: MedicalServices, label: "Type", value: profType === "consultant" ? "Skincare Consultant" : "Dermatologist", color: cPrimary },
                      { icon: CalendarMonth, label: "Date", value: formatDate(selectedDate), color: "#26A69A" },
                      { icon: AccessTime, label: "Time", value: selectedSlot?.start_time, color: "#FFA726" },
                      { icon: EventNote, label: "Reason", value: reason, color: "#E4749B" },
                      ...(skinConcern ? [{ icon: Spa, label: "Skin Concern", value: skinConcern, color: "#8B6FC9" }] : []),
                    ].map((row) => {
                      const Icon = row.icon;
                      return (
                        <Stack key={row.label} direction="row" spacing={1.5} alignItems="flex-start">
                          <Box sx={{ width: 30, height: 30, borderRadius: "8px", backgroundColor: `${row.color}12`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon sx={{ fontSize: 15, color: row.color }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 10.5, color: cTextMuted, fontWeight: 600 }}>{row.label}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{row.value}</Typography>
                          </Box>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Paper>

                <Alert severity="info" icon={<AccessTime fontSize="small" />}
                  sx={{ borderRadius: "12px", fontSize: 12 }}>
                  After booking, the professional will review and confirm your request. You'll receive a notification.
                </Alert>
              </Stack>
            )}

            {/* Navigation Buttons */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
              <Button onClick={step === 0 ? handleClose : handleBack}
                startIcon={step === 0 ? <Close /> : <ArrowBack />}
                sx={{ textTransform: "none", fontWeight: 600, color: cTextMuted, borderRadius: "12px", px: 2 }}>
                {step === 0 ? "Cancel" : "Back"}
              </Button>

              {step < 3 ? (
                <Button
                  variant="contained"
                  disabled={!canNext()}
                  endIcon={<ArrowForward />}
                  onClick={handleNext}
                  sx={{ background: cBrandGradient, textTransform: "none", fontWeight: 700,
                    borderRadius: "12px", px: 3, boxShadow: "0 4px 14px rgba(139,111,201,0.3)" }}>
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  startIcon={submitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CheckCircle />}
                  sx={{ background: cBrandGradient, textTransform: "none", fontWeight: 700,
                    borderRadius: "12px", px: 3, boxShadow: "0 4px 14px rgba(139,111,201,0.3)" }}>
                  {submitting ? "Booking…" : "Confirm Booking"}
                </Button>
              )}
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
