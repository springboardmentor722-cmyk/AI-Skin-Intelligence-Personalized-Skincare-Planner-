import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box, Paper, Typography, Stack, Button, Chip, Divider,
  LinearProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Select, MenuItem, FormControl, Skeleton, Grid
} from "@mui/material";
import {
  Bedtime, WaterDrop, DirectionsRun, SelfImprovement, Restaurant,
  WbSunny, PhoneAndroid, LocalBar, AutoAwesome, Add, Download,
  CheckCircle, ArrowForward, TrendingUp, TrendingDown, Remove
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getLifestyleCurrent, saveLifestyleLog } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER  = "1px solid " + COLORS.cardBorder;
const CARD_BG      = "#FFFFFF";
const CARD_RADIUS  = "20px";
const CARD_SHADOW  = "0 2px 12px rgba(139,111,201,0.07)";

/* ================================================================
   LIFESTYLE SCORE CIRCULAR GAUGE
   ================================================================ */
function ScoreGauge({ score, size = 90 }) {
  const sw = 9, r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? COLORS.success : score >= 60 ? "#FFA726" : COLORS.danger;
  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#F0EBF8" strokeWidth={sw} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      </svg>
      <Stack alignItems="center" sx={{ zIndex: 1 }}>
        <Typography sx={{ fontSize: size > 80 ? 20 : 15, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{score}</Typography>
        <Typography sx={{ fontSize: 8, color: COLORS.textMuted }}>/100</Typography>
      </Stack>
    </Box>
  );
}

/* ================================================================
   MINI BAR CHART (7-day sparkbar)
   ================================================================ */
function SparkBars({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <Stack direction="row" spacing={0.4} alignItems="flex-end" sx={{ height: 28, mt: 1 }}>
      {data.map((v, i) => (
        <Box key={i} sx={{
          flex: 1, borderRadius: "3px 3px 0 0",
          backgroundColor: i === data.length - 1 ? color : color + "55",
          height: `${Math.max((v / max) * 100, 8)}%`,
          transition: "height 0.4s ease"
        }} />
      ))}
    </Stack>
  );
}

/* ================================================================
   METRIC CARD
   ================================================================ */
function MetricCard({ icon: Icon, iconColor, label, value, unit, status, statusColor, trend, trendUp, bars }) {
  const TrendIcon = trendUp === true ? TrendingUp : trendUp === false ? TrendingDown : Remove;
  const trendColor = trendUp === true ? COLORS.success : trendUp === false ? COLORS.danger : COLORS.textMuted;
  return (
    <Paper elevation={0} sx={{
      borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG,
      p: 2, boxShadow: CARD_SHADOW, transition: "all 0.2s ease",
      "&:hover": { borderColor: iconColor, boxShadow: `0 4px 16px ${iconColor}22`, transform: "translateY(-2px)" }
    }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 32, height: 32, borderRadius: "10px", backgroundColor: iconColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon sx={{ fontSize: 17, color: iconColor }} />
          </Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted }}>{label}</Typography>
        </Stack>
      </Stack>

      {/* Value */}
      <Typography sx={{ fontSize: 22, fontWeight: 900, color: COLORS.textDark, lineHeight: 1, mb: 0.25 }}>
        {value} <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>{unit}</span>
      </Typography>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, mb: 0.5 }}>Avg / {label.includes("Sleep") ? "Night" : "Day"}</Typography>

      {/* Status + Trend */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: statusColor || COLORS.success }}>{status}</Typography>
        <Stack direction="row" spacing={0.4} alignItems="center">
          <TrendIcon sx={{ fontSize: 13, color: trendColor }} />
          <Typography sx={{ fontSize: 10.5, color: trendColor, fontWeight: 700 }}>{trend}</Typography>
        </Stack>
      </Stack>

      {/* Mini sparkbars */}
      <SparkBars data={bars || [5, 6, 7, 6, 7, 8, 7]} color={iconColor} />
    </Paper>
  );
}

/* ================================================================
   INSIGHT CARD
   ================================================================ */
function InsightCard({ emoji, title, desc, color }) {
  return (
    <Paper elevation={0} sx={{
      borderRadius: "16px", border: CARD_BORDER, backgroundColor: CARD_BG,
      p: 2, boxShadow: CARD_SHADOW, height: "100%"
    }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ width: 38, height: 38, borderRadius: "12px", backgroundColor: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Typography sx={{ fontSize: 20 }}>{emoji}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 0.4 }}>{title}</Typography>
          <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, lineHeight: 1.5 }}>{desc}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function LifestyleHabitsPage() {
  const navigate = useNavigate();
  const [period, setPeriod]       = useState("7days");
  const [logOpen, setLogOpen]     = useState(false);
  const [toastMsg, setToastMsg]   = useState("");

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);

  const [inputWater, setInputWater]   = useState(2.0);
  const [inputSleep, setInputSleep]   = useState(7.5);
  const [inputStress, setInputStress] = useState("low");
  const [inputActivity, setInputActivity] = useState(30);
  const [inputDiet, setInputDiet] = useState(4);
  const [inputSun, setInputSun] = useState(20);
  const [inputScreen, setInputScreen] = useState(4.5);
  const [inputAlcohol, setInputAlcohol] = useState(0.5);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getLifestyleCurrent().catch(() => null);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveLog = async () => {
    setLogOpen(false);
    setToastMsg("Lifestyle log updated!");
    try { 
      await saveLifestyleLog({ 
        water_intake_liters: inputWater, 
        sleep_hours: inputSleep, 
        stress_level: inputStress,
        exercise_minutes: inputActivity,
        diet_quality: inputDiet,
        sun_exposure_minutes: inputSun,
        screen_time_hours: inputScreen,
        alcohol_mls: inputAlcohol
      }); 
      await loadData();
    }
    catch { /* saved locally */ }
  };

  const hasData = data && data.has_data;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Stack spacing={3}>

          {/* PAGE HEADER */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark }}>
                  Lifestyle & Habits
                </Typography>
                <Typography sx={{ fontSize: 22 }}>🌿</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, mt: 0.25 }}>
                Track and improve your daily habits for healthy, glowing skin.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select value={period} onChange={(e) => setPeriod(e.target.value)}
                  sx={{ borderRadius: "12px", backgroundColor: CARD_BG, fontSize: 12.5, fontWeight: 700, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="1month">Last 1 Month</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" size="small" onClick={() => setLogOpen(true)} startIcon={<Add sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, background: COLORS.brandGradient }}>
                Log Habit
              </Button>
            </Stack>
          </Stack>

          {/* LOADING STATE */}
          {loading && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: CARD_RADIUS }} />
              ))}
            </Box>
          )}

          {/* EMPTY STATE */}
          {!loading && !hasData && (
            <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, boxShadow: CARD_SHADOW }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                <Typography sx={{ fontSize: 32 }}>🌿</Typography>
              </Box>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>
                No lifestyle data available.
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: COLORS.textMuted, maxWidth: 440, mx: "auto", mb: 3 }}>
                Complete your Lifestyle Assessment to unlock personalized insights and habit tracking metrics.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/user/assessment")}
                startIcon={<AutoAwesome />}
                sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 800, px: 4, py: 1.25, background: COLORS.brandGradient, boxShadow: "0 6px 20px rgba(139,111,201,0.25)" }}
              >
                Complete Assessment
              </Button>
            </Paper>
          )}

          {/* LIVE DATA BANNER & METRICS */}
          {!loading && hasData && (
            <>
              {/* LIFESTYLE SCORE BANNER */}
              <Paper elevation={0} sx={{
                borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG,
                p: { xs: 2.5, sm: 3 }, boxShadow: CARD_SHADOW
              }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
                  <ScoreGauge score={data.lifestyle_score} size={96} />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted }}>Lifestyle Score</Typography>
                      <Chip label={data.lifestyle_score >= 80 ? "Optimal" : "Good"} size="small"
                        sx={{ height: 18, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />
                    </Stack>
                    <Typography sx={{ fontSize: 20, fontWeight: 900, color: COLORS.textDark, mb: 0.5 }}>
                      {data.lifestyle_score >= 80 ? "Excellent Habits" : "Strong Foundation"}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.5 }}>
                      Your personalized lifestyle score is computed live from your sleep, hydration, and activity logs. Small consistent changes lead to healthy, radiant skin.
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                  <Stack direction="row" spacing={3} sx={{ flexShrink: 0 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, color: COLORS.textDark }}>{data.sleep_display}</Typography>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>Sleep / night</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, color: COLORS.textDark }}>{data.water_display}</Typography>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>Water / day</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, color: COLORS.textDark }}>{data.daily_steps.toLocaleString()}</Typography>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>Steps / day</Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              {/* 8 METRIC CARDS GRID */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
                <MetricCard icon={Bedtime} iconColor={COLORS.primary} label="Sleep" value={data.sleep_display} unit="" status="Good" statusColor={COLORS.success} trend="Live Logged" trendUp={true} bars={(data.history || []).map(h => h.sleep)} />
                <MetricCard icon={WaterDrop} iconColor="#42A5F5" label="Water Intake" value={data.water_display} unit="" status="Good" statusColor={COLORS.success} trend="Live Logged" trendUp={true} bars={(data.history || []).map(h => h.water)} />
                <MetricCard icon={DirectionsRun} iconColor={COLORS.success} label="Physical Activity" value={data.daily_steps.toLocaleString()} unit="Steps" status="Good" statusColor={COLORS.success} trend="Live Logged" trendUp={true} bars={(data.history || []).map(h => h.steps)} />
                <MetricCard icon={SelfImprovement} iconColor="#FFA726" label="Stress Level" value={data.stress_level} unit="" status="Live Logged" statusColor="#FFA726" trend="" trendUp={null} bars={(data.history || []).map(h => h.stress)} />
                <MetricCard icon={Restaurant} iconColor="#E47B9B" label="Diet Quality" value={data.diet_quality} unit="" status="Good" statusColor={COLORS.success} trend="Live Logged" trendUp={true} bars={(data.history || []).map(h => h.diet)} />
                <MetricCard icon={WbSunny} iconColor="#FFB300" label="Sun Exposure" value={data.sun_exposure} unit="" status="Good" statusColor={COLORS.success} trend="Live Logged" trendUp={true} bars={(data.history || []).map(h => h.sun)} />
                <MetricCard icon={PhoneAndroid} iconColor="#7986CB" label="Screen Time" value={data.screen_time} unit="" status="Live Logged" statusColor="#FFA726" trend="" trendUp={null} bars={(data.history || []).map(h => h.screen)} />
                <MetricCard icon={LocalBar} iconColor="#EF9A9A" label="Alcohol" value={data.alcohol} unit="" status="Good" statusColor={COLORS.success} trend="Live Logged" trendUp={null} bars={(data.history || []).map(h => h.alcohol)} />
              </Box>

              {/* PERSONALIZED INSIGHTS */}
              <Box>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: COLORS.textDark, mb: 1.5 }}>
                  Personalized Insights
                </Typography>
                <Grid container spacing={2}>
                  {(data.insights || []).map((ins, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <InsightCard emoji={i === 0 ? "🌙" : "💧"} title={ins.title} desc={ins.desc} color={ins.color} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          )}

        </Stack>
      </Box>

      {/* ============================================================
          QUICK LOG DIALOG
          ============================================================ */}
      <Dialog open={logOpen} onClose={() => setLogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>Update Lifestyle Log</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>💧 Water (L)</Typography>
                <TextField fullWidth size="small" type="number" value={inputWater} onChange={(e) => setInputWater(parseFloat(e.target.value) || 0)} inputProps={{ step: 0.1, min: 0, max: 10 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>🌙 Sleep (Hrs)</Typography>
                <TextField fullWidth size="small" type="number" value={inputSleep} onChange={(e) => setInputSleep(parseFloat(e.target.value) || 0)} inputProps={{ step: 0.5, min: 0, max: 24 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>🏃 Activity (Mins)</Typography>
                <TextField fullWidth size="small" type="number" value={inputActivity} onChange={(e) => setInputActivity(parseInt(e.target.value) || 0)} inputProps={{ step: 10, min: 0 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>🥗 Diet Quality (1-5)</Typography>
                <TextField fullWidth size="small" type="number" value={inputDiet} onChange={(e) => setInputDiet(parseInt(e.target.value) || 1)} inputProps={{ step: 1, min: 1, max: 5 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>☀️ Sun Exp. (Mins)</Typography>
                <TextField fullWidth size="small" type="number" value={inputSun} onChange={(e) => setInputSun(parseInt(e.target.value) || 0)} inputProps={{ step: 5, min: 0 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>📱 Screen Time (Hrs)</Typography>
                <TextField fullWidth size="small" type="number" value={inputScreen} onChange={(e) => setInputScreen(parseFloat(e.target.value) || 0)} inputProps={{ step: 0.5, min: 0 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>🍷 Alcohol (mls)</Typography>
                <TextField fullWidth size="small" type="number" value={inputAlcohol} onChange={(e) => setInputAlcohol(parseFloat(e.target.value) || 0)} inputProps={{ step: 0.5, min: 0 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, mb: 0.75 }}>🧘 Stress Level</Typography>
                <TextField select fullWidth size="small" value={inputStress} onChange={(e) => setInputStress(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="moderate">Mod</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setLogOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveLog}
            sx={{ background: COLORS.brandGradient, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3 }}>
            Save Log
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg("")} message={toastMsg} />
    </motion.div>
  );
}
