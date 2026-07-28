import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box, Paper, Typography, Stack, Button, Chip, TextField,
  InputAdornment, Select, MenuItem, FormControl, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  Divider, LinearProgress, Checkbox, Tab, Tabs
} from "@mui/material";
import {
  NotificationsActive, CheckCircle, AccessTime, Add, WbSunny,
  WaterDrop, AutoAwesome, CalendarMonth, MoreVert, Search,
  FilterList, MedicalServices, Spa, FitnessCenter, Restaurant,
  NightlightRound, Alarm, Settings, ArrowForward, VolumeUp,
  NotificationsNone, Snooze, Circle, HealthAndSafety
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getUserActiveRoutine, logRoutineStep } from "../api/dashboard";
import { getMyAppointmentsRich } from "../api/engagement";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER  = "1px solid " + COLORS.cardBorder;
const CARD_BG      = "#FFFFFF";
const CARD_RADIUS  = "20px";
const CARD_SHADOW  = "0 2px 12px rgba(139,111,201,0.07)";

/* ================================================================
   TODAY REMINDERS
   ================================================================ */
const CATEGORIES = ["All", "Medications", "Skincare Routine", "Appointments", "Supplements", "Lifestyle", "Custom"];

/* ================================================================
   REMINDER ROW
   ================================================================ */
function ReminderRow({ reminder, onToggle }) {
  const Icon = reminder.icon;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{
      py: 1.5, px: { xs: 0, sm: 0.5 },
      borderBottom: CARD_BORDER,
      opacity: reminder.done ? 0.65 : 1,
      transition: "opacity 0.2s"
    }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
        {/* Icon */}
        <Box sx={{ width: 36, height: 36, borderRadius: "11px", backgroundColor: reminder.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon sx={{ fontSize: 18, color: reminder.iconColor }} />
        </Box>
        {/* Info */}
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: reminder.done ? 600 : 800, color: reminder.done ? COLORS.textMuted : COLORS.textDark, textDecoration: reminder.done ? "line-through" : "none" }}>
            {reminder.title}
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{reminder.sub}</Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
        {/* Due badge */}
        {reminder.due && (
          <Chip label={reminder.due} size="small"
            sx={{ height: 20, fontSize: 9.5, fontWeight: 700,
              backgroundColor: reminder.dueColor + "18",
              color: reminder.dueColor,
              display: { xs: "none", sm: "flex" }
            }} />
        )}
        {/* Mark as Done */}
        <Button
          size="small"
          startIcon={<CheckCircle sx={{ fontSize: 13 }} />}
          onClick={() => onToggle(reminder.id)}
          sx={{
            textTransform: "none", fontSize: 11, fontWeight: 700,
            color: reminder.done ? COLORS.success : COLORS.textMuted,
            borderColor: reminder.done ? COLORS.success : COLORS.cardBorder,
            border: "1px solid",
            borderRadius: "10px", px: 1.25, py: 0.4,
            backgroundColor: reminder.done ? "rgba(76,175,125,0.06)" : "transparent",
            display: { xs: "none", sm: "flex" }
          }}
        >
          {reminder.done ? "Done" : "Mark as Done"}
        </Button>
        {/* Mobile checkbox */}
        <Checkbox
          checked={reminder.done}
          onChange={() => onToggle(reminder.id)}
          sx={{ display: { xs: "flex", sm: "none" }, color: COLORS.primary, "&.Mui-checked": { color: COLORS.success } }}
          size="small"
        />
        <IconButton size="small"><MoreVert sx={{ fontSize: 16, color: COLORS.textMuted }} /></IconButton>
      </Stack>
    </Stack>
  );
}

/* ================================================================
   UPCOMING CARD
   ================================================================ */
function UpcomingItem({ item }) {
  const Icon = item.icon;
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 1.25, borderBottom: CARD_BORDER }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon sx={{ fontSize: 17, color: item.iconColor }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark }}>{item.title}</Typography>
        <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{item.sub}</Typography>
        <Typography sx={{ fontSize: 10.5, color: COLORS.primary, fontWeight: 700, mt: 0.25 }}>{item.date}</Typography>
      </Box>
    </Stack>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function RemindersPage() {
  const navigate = useNavigate();

  const [categoryTab, setCategoryTab] = useState(0);
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMsg, setToastMsg]         = useState("");
  const [createOpen, setCreateOpen]     = useState(false);

  /* New reminder fields */
  const [newTitle, setNewTitle]       = useState("");
  const [newTime, setNewTime]         = useState("08:00");
  const [newCat, setNewCat]           = useState("Skincare Routine");
  const [newFreq, setNewFreq]         = useState("Daily");

  const [today, setToday]         = useState([]);
  const [tomorrow, setTomorrow]   = useState([]);
  const [upcoming, setUpcoming]   = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [routineRes, apptsRes] = await Promise.all([
          getUserActiveRoutine().catch(() => []),
          getMyAppointmentsRich().catch(() => null)
        ]);

        const routine = Array.isArray(routineRes) ? routineRes : [];
        const appts = Array.isArray(apptsRes) ? apptsRes : apptsRes?.as_patient || [];

        // Map routines to today's reminders
        const todayRems = routine.map((r, idx) => ({
          id: r.id || r.step_id || idx,
          title: r.step_name || r.step_category || "Skincare Step",
          sub: `${r.time_of_day?.toUpperCase()} Routine`,
          time: r.time_of_day?.includes("pm") ? "09:00 PM" : "08:00 AM",
          due: r.completed ? "Done" : "Pending",
          dueColor: r.completed ? COLORS.success : COLORS.danger,
          icon: r.time_of_day?.includes("pm") ? NightlightRound : WbSunny,
          iconColor: COLORS.primary,
          iconBg: "rgba(139,111,201,0.1)",
          done: r.completed || false
        }));

        setToday(todayRems);

        // Upcoming appointments
        const upc = appts.filter(a => a.status !== "cancelled" && a.status !== "completed").map((a, i) => ({
          id: a.id || i,
          title: "Doctor Appointment",
          sub: `${a.professional_name || "Dermatologist"} (${a.meeting_type})`,
          date: new Date(a.scheduled_at).toLocaleString(),
          icon: MedicalServices,
          iconColor: COLORS.primary,
          iconBg: "rgba(139,111,201,0.1)"
        }));
        setUpcoming(upc);

        // For demo, we can just leave tomorrow empty unless we build a recurring engine
        setTomorrow([]);

      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const toggleToday = async (id) => {
    const item = today.find(r => r.id === id);
    if (!item) return;
    const newState = !item.done;
    setToday(prev => prev.map(r => r.id === id ? { ...r, done: newState, due: newState ? "Done" : "Pending", dueColor: newState ? COLORS.success : COLORS.danger } : r));
    try {
      await logRoutineStep(id, newState);
    } catch(e) {}
  };
  const toggleTomorrow = (id) => setTomorrow((prev) => prev.map((r) => r.id === id ? { ...r, done: !r.done } : r));

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    setToday((prev) => [{
      id: Date.now(), title: newTitle, sub: `${newCat} · ${newTime}`,
      time: newTime, due: "", dueColor: COLORS.textMuted,
      icon: Alarm, iconColor: COLORS.primary, iconBg: "rgba(139,111,201,0.1)", done: false
    }, ...prev]);
    setToastMsg(`Reminder "${newTitle}" created!`);
    setCreateOpen(false);
    setNewTitle("");
  };

  const todayDone    = today.filter((r) => r.done).length;
  const todayTotal   = today.length;
  const adherencePct = Math.round((todayDone / todayTotal) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Stack spacing={3}>

          {/* ============================================================
              ROW 1 — PAGE HEADER
              ============================================================ */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark }}>Reminders</Typography>
                <NotificationsActive sx={{ fontSize: 22, color: COLORS.primary }} />
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, mt: 0.25 }}>
                Stay consistent with your skincare, health, and appointments.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button variant="outlined" size="small" startIcon={<CalendarMonth sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, backgroundColor: CARD_BG }}>
                View Calendar
              </Button>
              <Button variant="contained" size="small" startIcon={<Add sx={{ fontSize: 15 }} />}
                onClick={() => setCreateOpen(true)}
                sx={{ background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12 }}>
                + New Reminder
              </Button>
            </Stack>
          </Stack>

          {/* ============================================================
              ROW 2 — KPI SUMMARY CARDS
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: 2 }}>

            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "11px", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                <NotificationsActive sx={{ fontSize: 19, color: COLORS.primary }} />
              </Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>Total Reminders</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.textDark, lineHeight: 1, my: 0.5 }}>12</Typography>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600 }}>Active reminders</Typography>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "11px", backgroundColor: "rgba(255,167,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                <AccessTime sx={{ fontSize: 19, color: "#FFA726" }} />
              </Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>Due Today</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#FFA726", lineHeight: 1, my: 0.5 }}>5</Typography>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600 }}>Next: 2 in 30 mins</Typography>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "11px", backgroundColor: "rgba(76,175,125,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                <CheckCircle sx={{ fontSize: 19, color: COLORS.success }} />
              </Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>Completed</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.success, lineHeight: 1, my: 0.5 }}>28</Typography>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600 }}>This month</Typography>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "11px", backgroundColor: "rgba(66,165,245,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                <CalendarMonth sx={{ fontSize: 19, color: "#42A5F5" }} />
              </Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>Upcoming</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#42A5F5", lineHeight: 1, my: 0.5 }}>7</Typography>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600 }}>Next 7 days</Typography>
            </Paper>
          </Box>

          {/* ============================================================
              ROW 3 — CATEGORY TABS
              ============================================================ */}
          <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, px: 2, py: 0.5, boxShadow: CARD_SHADOW, overflowX: "auto" }}>
            <Tabs
              value={categoryTab}
              onChange={(_, v) => setCategoryTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 12.5, minHeight: 44, px: 1.5 },
                "& .Mui-selected": { color: COLORS.primary },
                "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, borderRadius: 2 }
              }}
            >
              {CATEGORIES.map((c) => <Tab key={c} label={c} />)}
            </Tabs>
          </Paper>

          {/* ============================================================
              ROW 4 — SEARCH + FILTER BAR
              ============================================================ */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
            <TextField
              size="small" placeholder="Search reminders..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: COLORS.textMuted }} /></InputAdornment>, sx: { borderRadius: "12px", backgroundColor: "#FAF8FC" } }}
              sx={{ flex: 1, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: "12px", backgroundColor: "#FAF8FC", fontSize: 12.5, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="done">Completed</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" startIcon={<FilterList sx={{ fontSize: 15 }} />}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, whiteSpace: "nowrap" }}>
              Filters
            </Button>
          </Stack>

          {/* ============================================================
              ROW 5 — MAIN CONTENT: REMINDERS LIST + RIGHT PANEL
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" }, gap: 2.5, alignItems: "start" }}>

            {/* LEFT — Reminder Lists */}
            <Stack spacing={2.5}>

              {/* TODAY */}
              <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textMuted, mb: 1.5 }}>
                  Today · 26 Jul 2026
                </Typography>
                {today
                  .filter((r) => {
                    if (statusFilter === "done") return r.done;
                    if (statusFilter === "pending") return !r.done;
                    return true;
                  })
                  .filter((r) => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((r) => <ReminderRow key={r.id} reminder={r} onToggle={toggleToday} />)
                }
              </Paper>

              {/* TOMORROW */}
              <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textMuted, mb: 1.5 }}>
                  Tomorrow · 27 Jul 2026
                </Typography>
                {tomorrow.map((r) => <ReminderRow key={r.id} reminder={r} onToggle={toggleTomorrow} />)}
              </Paper>

            </Stack>

            {/* RIGHT PANEL */}
            <Stack spacing={2.5}>

              {/* Upcoming Appointments */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", border: CARD_BORDER, backgroundColor: CARD_BG, boxShadow: CARD_SHADOW }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <CalendarMonth sx={{ fontSize: 18, color: COLORS.textDark }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Upcoming Appointments</Typography>
                </Stack>
                <Stack spacing={0}>
                  {upcoming.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: COLORS.textMuted, py: 2 }}>No upcoming appointments found.</Typography>
                  ) : (
                    upcoming.map((item) => <UpcomingItem key={item.id} item={item} />)
                  )}
                </Stack>
              </Paper>

              {/* Reminder Settings */}
              <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 1.75 }}>Reminder Settings</Typography>
                <Stack spacing={1.5}>
                  {[
                    { icon: AccessTime,  label: "Quiet Hours",         value: "10:00 PM - 07:00 AM", iconColor: COLORS.primary },
                    { icon: Snooze,      label: "Snooze Duration",      value: "10 minutes",          iconColor: "#42A5F5"     },
                    { icon: VolumeUp,    label: "Reminder Sound",       value: "Gentle Chime",        iconColor: "#FFA726"     },
                    { icon: NotificationsNone, label: "Push Notifications", value: "Enabled",         iconColor: COLORS.success }
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Icon sx={{ fontSize: 16, color: s.iconColor }} />
                          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{s.label}</Typography>
                        </Stack>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark }}>{s.value}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
                <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 13 }} />}
                  sx={{ mt: 2, textTransform: "none", fontSize: 12, fontWeight: 700, color: COLORS.primaryDark, p: 0 }}>
                  Manage Settings
                </Button>
              </Paper>

              {/* Consistency Banner */}
              <Paper elevation={0} sx={{
                borderRadius: CARD_RADIUS,
                background: "linear-gradient(135deg, #8B6FC9 0%, #C177A8 100%)",
                p: 2.5, boxShadow: CARD_SHADOW, overflow: "hidden", position: "relative"
              }}>
                <Box sx={{ position: "absolute", top: -15, right: -15, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <AutoAwesome sx={{ fontSize: 16, color: "#FFD54F" }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: "#FFF" }}>Consistency is Key!</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, mb: 1.5 }}>
                  You've been consistent with your reminders. Keep it up!
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={adherencePct || 89}
                  sx={{ height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)", "& .MuiLinearProgress-bar": { borderRadius: 4, backgroundColor: "#FFD54F" } }}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>Today's Progress</Typography>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#FFD54F" }}>{adherencePct || 89}%</Typography>
                </Stack>
              </Paper>

            </Stack>
          </Box>

        </Stack>
      </Box>

      {/* ============================================================
          CREATE REMINDER DIALOG
          ============================================================ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>+ New Reminder</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>Reminder Title</Typography>
              <TextField fullWidth size="small" placeholder="e.g. Apply Sunscreen" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>Category</Typography>
              <TextField select fullWidth size="small" value={newCat} onChange={(e) => setNewCat(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}>
                {["Skincare Routine", "Medications", "Supplements", "Lifestyle", "Appointments", "Custom"].map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>Time</Typography>
              <TextField fullWidth size="small" type="time" value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>Frequency</Typography>
              <TextField select fullWidth size="small" value={newFreq} onChange={(e) => setNewFreq(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}>
                {["Daily", "Weekly", "Bi-weekly", "Monthly", "Once"].map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}
            sx={{ background: COLORS.brandGradient, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3 }}>
            Create Reminder
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg("")} message={toastMsg} />
    </motion.div>
  );
}
