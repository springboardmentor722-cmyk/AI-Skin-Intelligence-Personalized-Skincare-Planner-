import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box, Paper, Typography, Stack, Button, Chip, TextField,
  InputAdornment, Select, MenuItem, FormControl, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  Divider, useMediaQuery, useTheme, Skeleton
} from "@mui/material";
import {
  Description, Download, Search, FilterList, Visibility,
  PictureAsPdf, AutoAwesome, FileUpload, Add, ArrowForward,
  SmartToy, Science, TrendingUp, Spa, EventAvailable, MoreVert,
  CalendarMonth, CheckCircle, Assessment, MonitorHeart
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getReportsDashboard, downloadAssessmentPDF, uploadExternalReport } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG     = "#FFFFFF";
const CARD_RADIUS = "20px";
const CARD_SHADOW = "0 2px 12px rgba(139,111,201,0.07)";

/* ================================================================
   MINI SPARKLINE for avg skin score card
   ================================================================ */
function Sparkline({ data, color = COLORS.primary }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 80;
    const y = 22 - ((v - min) / range) * 20;
    return `${x},${y}`;
  }).join(" ");
  const areaPath = `M 0,${22 - ((data[0] - min) / range) * 20} ` +
    data.map((v, i) => `L ${(i / (data.length - 1)) * 80},${22 - ((v - min) / range) * 20}`).join(" ") +
    ` L 80,22 L 0,22 Z`;
  return (
    <svg width="80" height="24" viewBox="0 0 80 24">
      <defs>
        <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spkGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================
   SCORE TREND SVG (right panel insight chart)
   ================================================================ */
/* ================================================================
   SCORE TREND SVG (right panel insight chart)
   ================================================================ */
function TrendChart({ chartData = [] }) {
  if (chartData.length === 0) {
    return (
      <Box sx={{ width: "100%", height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>Complete your first assessment to view trends.</Typography>
      </Box>
    );
  }
  
  const data = chartData.map(d => d.score);
  const labels = chartData.map(d => d.date);
  if (data.length === 1) {
    // Duplicate single point so it draws a line
    data.push(data[0]);
    labels.push(labels[0]);
  }
  
  const W = 230, H = 90;
  const max = 100, min = 50, range = max - min;
  const xPos = (i) => (i / (data.length - 1)) * (W - 20) + 10;
  const yPos = (v) => H - 20 - ((v - min) / range) * (H - 30);
  const pts = data.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");
  const area = `M ${xPos(0)},${yPos(data[0])} ` +
    data.map((v, i) => `L ${xPos(i)},${yPos(v)}`).join(" ") +
    ` L ${xPos(data.length - 1)},${H - 20} L ${xPos(0)},${H - 20} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(139,111,201,0.25)" />
          <stop offset="100%" stopColor="rgba(139,111,201,0.0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendGrad)" />
      <polyline points={pts} fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={xPos(i)} cy={yPos(v)} r={i === data.length - 1 ? 4.5 : 3}
          fill={i === data.length - 1 ? "#FFF" : COLORS.primary}
          stroke={COLORS.primary} strokeWidth={i === data.length - 1 ? 2.5 : 0} />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={xPos(i)} y={H - 4} fontSize="8.5" fill={COLORS.textMuted} textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

/* ================================================================
   REPORT DATA
   ================================================================ */
// Mock reports removed, using live data

/* ================================================================
   REPORT ROW (desktop table)
   ================================================================ */
function ReportRow({ report, onDownload, onPreview }) {
  const Icon = report.icon;
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1fr 90px 2fr 100px", gap: 1.5, alignItems: "center", py: 1.5, borderBottom: CARD_BORDER }}>
      {/* Title */}
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: report.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon sx={{ fontSize: 17, color: report.iconColor }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark }}>{report.title}</Typography>
          <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>{report.sub}</Typography>
        </Box>
      </Stack>
      {/* Type */}
      <Chip label={report.type} size="small"
        sx={{ fontSize: 10, fontWeight: 800, height: 20, backgroundColor: report.typeBg, color: report.typeColor }} />
      {/* Date */}
      <Box>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textDark }}>{report.date}</Typography>
        <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>{report.ago}</Typography>
      </Box>
      {/* Score */}
      <Stack alignItems="flex-start" spacing={0.25}>
        <Typography sx={{ fontSize: 14, fontWeight: 900, color: COLORS.textDark }}>{report.score}<span style={{ fontSize: 10, color: COLORS.textMuted }}>/100</span></Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 800, color: report.gradeColor }}>{report.grade}</Typography>
      </Stack>
      {/* Summary */}
      <Typography sx={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{report.summary}</Typography>
      {/* Actions */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton size="small" onClick={() => onPreview(report)} sx={{ "&:hover": { color: COLORS.primary } }}>
          <Visibility sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" onClick={() => onDownload(report)} sx={{ "&:hover": { color: COLORS.primary } }}>
          <Download sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small"><MoreVert sx={{ fontSize: 16 }} /></IconButton>
      </Stack>
    </Box>
  );
}

/* ================================================================
   REPORT CARD (mobile)
   ================================================================ */
function ReportCard({ report, onDownload, onPreview }) {
  const Icon = report.icon;
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: report.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon sx={{ fontSize: 18, color: report.iconColor }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{report.title}</Typography>
            <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{report.sub} · {report.date}</Typography>
          </Box>
        </Stack>
        <Stack alignItems="flex-end" spacing={0.25}>
          <Typography sx={{ fontSize: 15, fontWeight: 900, color: COLORS.textDark }}>{report.score}<span style={{ fontSize: 10, color: COLORS.textMuted }}>/100</span></Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: report.gradeColor }}>{report.grade}</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
        <Chip label={report.type} size="small"
          sx={{ fontSize: 9.5, fontWeight: 800, height: 18, backgroundColor: report.typeBg, color: report.typeColor }} />
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => onPreview(report)}><Visibility sx={{ fontSize: 15, color: COLORS.primary }} /></IconButton>
          <IconButton size="small" onClick={() => onDownload(report)}><Download sx={{ fontSize: 15, color: COLORS.primary }} /></IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function ReportsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange]     = useState("3months");
  const [reportType, setReportType]   = useState("all");
  const [previewReport, setPreviewReport] = useState(null);
  const [toastMsg, setToastMsg]       = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getReportsDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        setToastMsg("Failed to load reports data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = async (report) => {
    setDownloading(true);
    try {
      const blob = await downloadAssessmentPDF(report.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url; a.download = `Skin_Report_${report.date.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setToastMsg(`Downloaded Report PDF`);
    } catch { setToastMsg("Failed to download report PDF."); }
    finally { setDownloading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadExternalReport(file);
      setToastMsg("External report uploaded successfully!");
    } catch (err) {
      setToastMsg("Failed to upload report.");
    }
  };

  // Convert raw API reports to UI report format
  const formattedReports = dashboardData?.reports?.map((r, i) => {
    const score = r.skinScore || 0;
    const grade = score >= 80 ? "Good" : score >= 60 ? "Fair" : "Needs Attention";
    const gradeColor = score >= 80 ? COLORS.success : score >= 60 ? "#FFA726" : COLORS.error;
    return {
      id: r.id,
      title: "Skin Assessment Report",
      sub: "Full Analysis",
      type: r.reportType || "Full Assessment",
      typeBg: "rgba(139,111,201,0.1)",
      typeColor: COLORS.primary,
      date: r.createdAt,
      ago: i === 0 ? "Latest" : "Previous",
      score: score,
      grade: grade,
      gradeColor: gradeColor,
      summary: r.summary,
      icon: Assessment,
      iconColor: COLORS.primary,
      iconBg: "rgba(139,111,201,0.1)"
    };
  }) || [];

  const filtered = formattedReports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return !q || r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: "20px", mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "20px" }} />
      </Box>
    );
  }

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
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark }}>Reports</Typography>
                <Description sx={{ fontSize: 22, color: COLORS.primary }} />
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, mt: 0.25 }}>
                View, download and share your skin health reports and analysis.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button component="label" variant="outlined" size="small" startIcon={<FileUpload sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, backgroundColor: CARD_BG }}>
                Upload External Report
                <input type="file" hidden accept=".pdf,image/*" onChange={handleUpload} />
              </Button>
              <Button variant="contained" size="small" startIcon={<Add sx={{ fontSize: 15 }} />}
                onClick={() => navigate("/user/assessment")}
                sx={{ background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12 }}>
                + New Assessment
              </Button>
            </Stack>
          </Stack>

          {/* ============================================================
              ROW 2 — KPI CARDS
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(5,1fr)" }, gap: 2 }}>

            {/* Total Reports */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>Total Reports</Typography>
              <Stack direction="row" alignItems="flex-end" spacing={0.5}>
                <Typography sx={{ fontSize: 30, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{dashboardData?.totalReports || 0}</Typography>
                <Description sx={{ fontSize: 22, color: COLORS.primary, mb: 0.25 }} />
              </Stack>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>All time</Typography>
            </Paper>

            {/* This Month */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>This Month</Typography>
              <Stack direction="row" alignItems="flex-end" spacing={0.5}>
                <Typography sx={{ fontSize: 30, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{dashboardData?.reportsThisMonth || 0}</Typography>
                <CalendarMonth sx={{ fontSize: 22, color: "#42A5F5", mb: 0.25 }} />
              </Stack>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>Reports</Typography>
            </Paper>

            {/* Average Skin Score */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>Average Skin Score</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Box>
                  <Stack direction="row" alignItems="baseline" spacing={0.3}>
                    <Typography sx={{ fontSize: 26, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{dashboardData?.averageSkinScore || 0}</Typography>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>/100</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: COLORS.success, mt: 0.25 }}>Good</Typography>
                </Box>
                <Sparkline data={dashboardData?.chartData?.length > 0 ? dashboardData.chartData.map(c => c.score) : [0]} color={COLORS.primary} />
              </Stack>
            </Paper>

            {/* Improvement */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>Improvement</Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 900, color: COLORS.success, lineHeight: 1 }}>{dashboardData?.improvementPercentage || '+0%'}</Typography>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>vs last 3 months</Typography>
            </Paper>

            {/* Last Assessment */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>Last Assessment</Typography>
              <Stack direction="row" alignItems="flex-end" spacing={0.5}>
                <Typography sx={{ fontSize: 14, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.2 }}>{dashboardData?.lastAssessment || 'N/A'}</Typography>
                <CheckCircle sx={{ fontSize: 18, color: COLORS.success, mb: 0.1 }} />
              </Stack>
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, mt: 0.5, fontWeight: 600 }}>7 days ago</Typography>
            </Paper>
          </Box>

          {/* ============================================================
              ROW 3 — SEARCH & FILTERS
              ============================================================ */}
          <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
              {/* Search */}
              <TextField
                size="small" placeholder="Search reports..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: COLORS.textMuted }} /></InputAdornment>, sx: { borderRadius: "12px", backgroundColor: "#FAF8FC" } }}
                sx={{ flex: 1, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}
              />
              {/* Date Range */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                  sx={{ borderRadius: "12px", backgroundColor: "#FAF8FC", fontSize: 12.5, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}>
                  <MenuItem value="1month">Last 1 Month</MenuItem>
                  <MenuItem value="3months">Last 3 Months</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="1year">Last 1 Year</MenuItem>
                </Select>
              </FormControl>
              {/* Type Filter */}
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select value={reportType} onChange={(e) => setReportType(e.target.value)}
                  sx={{ borderRadius: "12px", backgroundColor: "#FAF8FC", fontSize: 12.5, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }}>
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="assessment">Assessment</MenuItem>
                  <MenuItem value="growth">Growth Analysis</MenuItem>
                  <MenuItem value="routine">Routine Report</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" size="small" startIcon={<FilterList sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, whiteSpace: "nowrap" }}>
                Filters
              </Button>
            </Stack>
          </Paper>

          {/* ============================================================
              ROW 4 — REPORTS TABLE + INSIGHTS PANEL
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 280px" }, gap: 2.5, alignItems: "start" }}>

            {/* LEFT — Your Reports */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>Your Reports</Typography>

              {/* Desktop Table */}
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                {/* Header row */}
                <Box sx={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1fr 90px 2fr 100px", gap: 1.5, pb: 1.25, borderBottom: "2px solid " + COLORS.cardBorder }}>
                  {["Report", "Type", "Date", "Skin Score", "Summary", "Action"].map((h) => (
                    <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</Typography>
                  ))}
                </Box>
                {filtered.length > 0 ? filtered.map((r) => (
                  <ReportRow key={r.id} report={r} onDownload={handleDownload} onPreview={setPreviewReport} />
                )) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: COLORS.textMuted }}>No reports available. Complete your first skin assessment to generate AI reports.</Typography>
                  </Box>
                )}
              </Box>

              {/* Mobile Cards */}
              <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
                {filtered.length > 0 ? filtered.map((r) => (
                  <ReportCard key={r.id} report={r} onDownload={handleDownload} onPreview={setPreviewReport} />
                )) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: COLORS.textMuted }}>No reports available.</Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* RIGHT — Insights + Need Help */}
            <Stack spacing={2.5}>
              {/* Report Insights */}
              <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>Report Insights</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mb: 1.5 }}>Your skin score trend</Typography>
                <TrendChart chartData={dashboardData?.chartData || []} />
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1}>
                  {dashboardData?.insights?.map((text, i) => (
                    <Typography key={i} sx={{ fontSize: 11.5, color: COLORS.textMuted, lineHeight: 1.4 }}>
                      • {text}
                    </Typography>
                  ))}
                  {[
                    { label: "Score improved",  val: dashboardData?.improvementPercentage, color: COLORS.success },
                    { label: "Assessments done", val: `${dashboardData?.totalReports} total`, color: COLORS.primary },
                  ].map((s, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>{s.label}</Typography>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: s.color }}>{s.val}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {/* Need Help */}
              <Paper elevation={0} sx={{
                borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG,
                p: 2.5, boxShadow: CARD_SHADOW
              }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <SmartToy sx={{ fontSize: 20, color: COLORS.primary }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Need Help?</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, lineHeight: 1.5, mb: 2 }}>
                  Ask our AI assistant to help you understand your results better.
                </Typography>
                <Button fullWidth variant="contained"
                  startIcon={<AutoAwesome sx={{ fontSize: 15 }} />}
                  sx={{ background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12 }}>
                  Ask AI
                </Button>
              </Paper>
            </Stack>
          </Box>

          {/* ============================================================
              ROW 5 — SCHEDULE BANNER
              ============================================================ */}
          <Paper elevation={0} sx={{
            borderRadius: CARD_RADIUS, border: CARD_BORDER,
            background: "linear-gradient(135deg, #8B6FC9 0%, #C177A8 100%)",
            p: { xs: 2.5, sm: 3 }, boxShadow: CARD_SHADOW, overflow: "hidden", position: "relative"
          }}>
            <Box sx={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", bottom: -30, right: 80, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Box>
                <Typography sx={{ fontSize: 17, fontWeight: 900, color: "#FFF", mb: 0.5 }}>
                  Track your skin journey, consistently ✨
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
                  Regular assessments help you understand your skin better and achieve your skincare goals faster.
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
                onClick={() => navigate("/user/assessment")}
                sx={{ backgroundColor: "#FFF", color: COLORS.primaryDark, borderRadius: "12px", textTransform: "none", fontWeight: 800, px: 3, flexShrink: 0, "&:hover": { backgroundColor: "#F5ECF6" } }}>
                Schedule Next Assessment
              </Button>
            </Stack>
          </Paper>

        </Stack>
      </Box>

      {/* ============================================================
          PREVIEW DIALOG
          ============================================================ */}
      <Dialog open={Boolean(previewReport)} onClose={() => setPreviewReport(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        {previewReport && (
          <>
            <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>{previewReport.title}</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip label={previewReport.type} size="small" sx={{ backgroundColor: previewReport.typeBg, color: previewReport.typeColor, fontWeight: 800 }} />
                  <Chip label={previewReport.date} size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={`${previewReport.score}/100`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                </Stack>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "14px", backgroundColor: "#FAF8FC", border: CARD_BORDER }}>
                  <Typography sx={{ fontSize: 13, color: COLORS.textDark, lineHeight: 1.6 }}>
                    {previewReport.summary} This is an AI-generated skin health report providing insights based on your latest assessment results, routine adherence data, and lifestyle factors.
                  </Typography>
                </Paper>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setPreviewReport(null)} sx={{ textTransform: "none" }}>Close</Button>
              <Button variant="contained" startIcon={<Download />} onClick={() => { handleDownload(previewReport); setPreviewReport(null); }}
                sx={{ background: COLORS.brandGradient, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
                Download PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg("")} message={toastMsg} />
    </motion.div>
  );
}
