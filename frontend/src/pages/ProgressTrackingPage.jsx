import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box, Paper, Typography, Stack, Button, Chip, Grid, LinearProgress,
  IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, Skeleton, useMediaQuery, useTheme
} from "@mui/material";
import {
  TrendingUp, AutoAwesome, CalendarMonth, Download, Share,
  CheckCircle, ArrowForward, PictureAsPdf, CameraAlt, SmartToy,
  Add, MedicalServices, WarningAmber, Star, EmojiEvents, CompareArrows
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getProgressDashboard } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";
const CARD_RADIUS = "20px";
const CARD_SHADOW = "0 2px 12px rgba(139,111,201,0.07)";

/* ================================================================
   MINI SPARKLINE (for KPI score card)
   ================================================================ */
function Sparkline({ data, color = COLORS.primary }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 80;
    const y = 20 - ((v - min) / range) * 18;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="80" height="22" viewBox="0 0 80 22">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================
   SVG LINE CHART — Skin Score Over Time
   ================================================================ */
function SkinScoreChart({ data }) {
  if (!data || data.length === 0) return null;

  const W = 560, H = 180;
  const pad = { top: 20, bottom: 10, left: 10, right: 10 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = 100, minV = 40;
  const range = maxV - minV;

  const xPos = (i) => pad.left + (i / Math.max(1, data.length - 1)) * chartW;
  const yPos = (v) => pad.top + chartH - ((v - minV) / range) * chartH;

  const realPts = data.map((d, i) => `${xPos(i)},${yPos(d.real || d.score || 70)}`).join(" ");
  const avgPts  = data.map((d, i) => `${xPos(i)},${yPos(d.avg || (d.real || 70) * 0.9)}`).join(" ");

  // Filled area under real line
  const areaPath = `M ${xPos(0)},${yPos(data[0].real || 70)} ` +
    data.map((d, i) => `L ${xPos(i)},${yPos(d.real || 70)}`).join(" ") +
    ` L ${xPos(data.length - 1)},${pad.top + chartH} L ${pad.left},${pad.top + chartH} Z`;

  const activeIdx = data.length - 1;

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 30}`} width="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139,111,201,0.20)" />
            <stop offset="100%" stopColor="rgba(139,111,201,0.00)" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[50, 65, 80, 95].map(v => (
          <line key={v} x1={pad.left} y1={yPos(v)} x2={W - pad.right} y2={yPos(v)}
            stroke="#F4EFF9" strokeWidth="1" strokeDasharray="4,4" />
        ))}
        {[50, 65, 80, 95].map(v => (
          <text key={"l" + v} x={pad.left} y={yPos(v) - 3} fontSize="9" fill={COLORS.textMuted}>{v}</text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Average dashed line */}
        <polyline points={avgPts} fill="none" stroke="#DDD6F3" strokeWidth="2"
          strokeDasharray="5,4" strokeLinejoin="round" />

        {/* Real score line */}
        <polyline points={realPts} fill="none" stroke={COLORS.primary} strokeWidth="3"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Nodes */}
        {data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d.real || d.score || 70)} r={i === activeIdx ? 5.5 : 4}
            fill={i === activeIdx ? "#FFF" : COLORS.primary}
            stroke={COLORS.primary} strokeWidth={i === activeIdx ? 3 : 0} />
        ))}

        {/* Tooltip on last active point */}
        {data[activeIdx] && (
          <g>
            <rect x={Math.max(10, xPos(activeIdx) - 100)} y={Math.max(10, yPos(data[activeIdx].real || 70) - 48)}
              width="106" height="42" rx="8" fill="#FFF"
              stroke={COLORS.primary} strokeWidth="1.2" filter="drop-shadow(0 2px 6px rgba(139,111,201,0.2))" />
            <text x={Math.max(16, xPos(activeIdx) - 94)} y={Math.max(25, yPos(data[activeIdx].real || 70) - 30)} fontSize="9" fill={COLORS.textMuted}>
              {data[activeIdx].label || "Latest"}
            </text>
            <text x={Math.max(16, xPos(activeIdx) - 94)} y={Math.max(37, yPos(data[activeIdx].real || 70) - 18)} fontSize="9" fill={COLORS.textDark} fontWeight="700">
              Your Score: {data[activeIdx].real || data[activeIdx].score}
            </text>
          </g>
        )}

        {/* X Labels */}
        {data.map((d, i) => (
          <text key={"x" + i} x={xPos(i)} y={H + 15} fontSize="9" fill={COLORS.textMuted}
            textAnchor="middle">{d.label}</text>
        ))}
      </svg>
    </Box>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function ProgressTrackingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [period, setPeriod] = useState("3months");
  const [reportOpen, setReportOpen] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const res = await getProgressDashboard().catch(() => null);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  const hasData = data && data.has_data && data.totalAssessments > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Stack spacing={3}>

          {/* PAGE HEADER */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark }}>
                  Progress Tracking
                </Typography>
                <AutoAwesome sx={{ fontSize: 22, color: COLORS.primary }} />
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, mt: 0.25 }}>
                Track your skin improvement journey and see real results.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  sx={{ borderRadius: "12px", backgroundColor: CARD_BG, fontSize: 12.5, fontWeight: 700, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}
                >
                  <MenuItem value="1month">Last 1 Month</MenuItem>
                  <MenuItem value="3months">Last 3 Months</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download sx={{ fontSize: 15 }} />}
                onClick={() => setReportOpen(true)}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, backgroundColor: CARD_BG, "&:hover": { borderColor: COLORS.primary } }}
              >
                Export Report
              </Button>
            </Stack>
          </Stack>

          {/* LOADING STATE */}
          {loading && (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Grid item xs={12} sm={2.4} key={i}>
                  <Skeleton variant="rounded" height={100} sx={{ borderRadius: CARD_RADIUS }} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* EMPTY STATE */}
          {!loading && !hasData && (
            <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, boxShadow: CARD_SHADOW }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                <TrendingUp sx={{ fontSize: 32, color: COLORS.primary }} />
              </Box>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>
                No Progress Data Available
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: COLORS.textMuted, maxWidth: 440, mx: "auto", mb: 3 }}>
                Complete your first skin assessment to start tracking your improvement journey and unlock personalized progress charts.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/user/assessment")}
                startIcon={<CameraAlt />}
                sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 800, px: 4, py: 1.25, background: COLORS.brandGradient, boxShadow: "0 6px 20px rgba(139,111,201,0.25)" }}
              >
                Start Assessment
              </Button>
            </Paper>
          )}

          {/* DATA AVAILABLE — KPI CARDS */}
          {!loading && hasData && (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(5, 1fr)" }, gap: 2 }}>

                {/* KPI 1 — Overall Skin Score */}
                <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>Overall Skin Score</Typography>
                      <Stack direction="row" alignItems="baseline" spacing={0.4}>
                        <Typography sx={{ fontSize: 30, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{data.currentSkinScore}</Typography>
                        <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>/100</Typography>
                      </Stack>
                      <Chip label={`${data.scoreChange} vs previous`} size="small"
                        sx={{ mt: 0.75, height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <Sparkline data={(data.progressHistory || []).map(p => p.real || p.score || 70)} color={COLORS.primary} />
                    </Box>
                  </Stack>
                </Paper>

                {/* KPI 2 — Assessments */}
                <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                    <CameraAlt sx={{ fontSize: 18, color: COLORS.primary }} />
                  </Box>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.25 }}>Assessments</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{data.totalAssessments}</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>Completed</Typography>
                </Paper>

                {/* KPI 3 — Routine Adherence */}
                <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(76,175,125,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                    <CheckCircle sx={{ fontSize: 18, color: COLORS.success }} />
                  </Box>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.25 }}>Routine Adherence</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.success, lineHeight: 1 }}>{data.routineAdherence}%</Typography>
                  <Chip label="Live Adherence" size="small" sx={{ mt: 0.5, height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />
                </Paper>

                {/* KPI 4 — Active Concerns */}
                <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(255,167,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                    <WarningAmber sx={{ fontSize: 18, color: "#FFA726" }} />
                  </Box>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.25 }}>Active Concerns</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{data.activeConcerns}</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>Unresolved</Typography>
                </Paper>

                {/* KPI 5 — Products Used */}
                <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(66,165,245,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                    <Star sx={{ fontSize: 18, color: "#42A5F5" }} />
                  </Box>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.25 }}>Products Used</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{data.productsUsed}</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>Routine Formulations</Typography>
                </Paper>

              </Box>

              {/* MAIN CONTENT GRID — CHART & CONCERN IMPROVEMENT */}
              <Grid container spacing={2.5}>

                {/* Chart Card */}
                <Grid item xs={12} md={7.5}>
                  <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW, height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>
                        Skin Score Over Time
                      </Typography>
                      <Chip label={`Last scan: ${data.lastAssessmentDate || "Today"}`} size="small" sx={{ fontSize: 10.5, fontWeight: 700, backgroundColor: "#FAF8FC" }} />
                    </Stack>
                    <SkinScoreChart data={data.progressHistory || []} />
                  </Paper>
                </Grid>

                {/* Concern Improvement */}
                <Grid item xs={12} md={4.5}>
                  <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW, height: "100%" }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>
                      Concern Improvement
                    </Typography>
                    <Stack spacing={2}>
                      {(data.concernImprovement || []).map((c, i) => (
                        <Box key={i}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark }}>{c.name}</Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: c.color || COLORS.success }}>{c.imp}</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={c.val || 50} sx={{ height: 6, borderRadius: "999px", backgroundColor: "#F0EBF8", "& .MuiLinearProgress-bar": { backgroundColor: c.color || COLORS.primary } }} />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>

              </Grid>
            </>
          )}

        </Stack>
      </Box>

      {/* Export Report Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Export Clinical Progress Report</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Generate a detailed PDF summary of your skin diagnostic scores, active routine adherence, and concern improvements for your dermatologist.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReportOpen(false)} sx={{ textTransform: "none", color: COLORS.textMuted }}>Cancel</Button>
          <Button variant="contained" onClick={() => setReportOpen(false)} startIcon={<PictureAsPdf />} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, background: COLORS.brandGradient }}>Download PDF</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}