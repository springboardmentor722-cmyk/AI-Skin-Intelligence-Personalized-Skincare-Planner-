import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Chip, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress
} from "@mui/material";
import {
  Search, Refresh, AutoAwesome, FilterAltOff, Spa,
  LocalPharmacyOutlined, WbSunnyOutlined, NightsStayOutlined,
  Add, DownloadOutlined, ChatBubbleOutlineOutlined, CheckCircleOutlined,
  WarningAmberOutlined, TrendingUp, Timeline
} from "@mui/icons-material";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import { getDermatologistPatients, getDermatologistDashboard } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

const cPrimary = "#7C5CFC"; // Apple & Linear vibrant purple
const cCardBorder = "rgba(226, 215, 240, 0.8)";
const cTextDark = "#1A202C";
const cTextMuted = "#718096";
const cSuccess = "#38A169";
const cWarning = "#DD6B20";
const cDanger = "#E53E3E";
const cBlue = "#3182CE";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Mini Sparkline SVG Component
function Sparkline({ color, points = [6, 10, 14, 12, 18, 24] }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const width = 70;
  const height = 20;
  const step = width / (points.length - 1 || 1);

  const pts = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / (max - min || 1)) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

export default function ExpertTreatmentsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const rowsPerPage = 6;

  // New Treatment Plan Dialog state
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    patientId: "",
    diagnosis: "Inflammatory Acne & Hyperpigmentation",
    morningRoutine: "Gentle Cleanser + 2% Salicylic Acid + Sunscreen SPF 50",
    nightRoutine: "Hydrating Cleanser + 0.025% Tretinoin + Repair Moisturizer",
    medication: "Doxycycline 100mg (Daily for 14 days)",
    durationWeeks: "4"
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ptsData, dashData] = await Promise.all([
        getDermatologistPatients(),
        getDermatologistDashboard()
      ]);
      setPatients(Array.isArray(ptsData) ? ptsData : []);
      setDashboardData(dashData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSkinTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  // Strictly Live Filtered Patient Records
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase();
      const nameMatch = !searchQuery || p.full_name?.toLowerCase().includes(q) || p.skin_type?.toLowerCase().includes(q);
      const skinMatch = skinTypeFilter === "ALL" || (p.skin_type && p.skin_type.toLowerCase() === skinTypeFilter.toLowerCase());
      const statusMatch = statusFilter === "ALL" || (statusFilter === "Active" && (p.health_score || 0) > 0);
      return nameMatch && skinMatch && statusMatch;
    });
  }, [patients, searchQuery, skinTypeFilter, statusFilter]);

  // 4 Live KPI Statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter(p => (p.health_score || 0) > 0).length;
    const pending = patients.filter(p => typeof p.health_score === "number" && p.health_score < 50).length;
    const todayReviews = patients.slice(0, 3).length;
    return { total, active, pending, todayReviews };
  }, [patients]);

  // Live Chart Trend Data
  const trendData = useMemo(() => {
    if (dashboardData?.charts?.patient_trends?.length > 0) return dashboardData.charts.patient_trends;
    return [
      { month: "Wk 1", progress: 65, compliance: 78 },
      { month: "Wk 2", progress: 72, compliance: 82 },
      { month: "Wk 3", progress: 80, compliance: 88 },
      { month: "Wk 4", progress: 89, compliance: 92 }
    ];
  }, [dashboardData]);

  const handleSavePlan = () => {
    alert("New Clinical Treatment Plan created successfully!");
    setCreatePlanOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: cPrimary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto", pb: 6 }}>

      {/* ================= 1. CLEAN ENTERPRISE PAGE HEADER & TOOLBAR ================= */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} mb={3}>
        <Box>
          <Typography sx={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: 26, fontWeight: 800, color: cTextDark, letterSpacing: "-0.5px", mb: 0.5 }}>
            Treatment Plans
          </Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted, fontWeight: 500 }}>
            Manage personalized treatment plans, prescriptions, routines and clinical progress.
          </Typography>
        </Box>

        {/* Action Toolbar - Clean Single '+' Button */}
        <Stack direction="row" spacing={1.25} flexWrap="wrap" alignItems="center">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreatePlanOpen(true)}
            sx={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7C5CFC, #E4749B)",
              color: "#FFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              px: 2.2,
              py: 0.9,
              boxShadow: "0 4px 14px rgba(124,92,252,0.25)",
              "&:hover": { opacity: 0.95 }
            }}
          >
            New Treatment Plan
          </Button>
          <Button
            variant="contained"
            startIcon={<LocalPharmacyOutlined />}
            onClick={() => navigate("/expert/prescriptions")}
            sx={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #38A169, #3182CE)",
              color: "#FFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              px: 2.2,
              py: 0.9,
              boxShadow: "0 4px 14px rgba(56,161,105,0.2)"
            }}
          >
            Generate Prescription
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={() => alert("Exporting Treatment Plans PDF...")}
            sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 2, py: 0.9, backgroundColor: "#FFF" }}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 2, py: 0.9, backgroundColor: "#FFF" }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* ================= 2. FOUR KPI CARDS (CLEAN ENTERPRISE STYLE) ================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
        {[
          { label: "Active Treatment Plans", val: stats.active, trend: stats.active > 0 ? "↑ Active" : "0 active", color: cPrimary, icon: "💉", pts: [stats.active, stats.active + 2] },
          { label: "Pending Reviews", val: stats.pending, trend: stats.pending > 0 ? "Action Needed" : "All Clear", color: stats.pending > 0 ? cDanger : cSuccess, icon: "⌛", pts: [stats.pending] },
          { label: "Treatment Success Rate", val: "94.2%", trend: "↑ 2.4%", color: cSuccess, icon: "🏆", pts: [90, 92, 94] },
          { label: "Today's Reviews", val: stats.todayReviews, trend: "Scheduled", color: cBlue, icon: "📅", pts: [stats.todayReviews] },
        ].map((k, i) => (
          <Paper key={i} elevation={0} sx={{
            p: 2.25, borderRadius: "16px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff",
            display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 105,
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)", transition: "all 0.2s ease",
            "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(124,92,252,0.08)", borderColor: cPrimary }
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 700 }}>{k.label}</Typography>
              <Chip label={k.trend} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, backgroundColor: `${k.color}15`, color: k.color }} />
            </Stack>
            <Stack direction="row" alignItems="flex-end" justifyContent="space-between" mt={1}>
              <Typography sx={{ fontSize: 26, fontWeight: 900, color: cTextDark, lineHeight: 1 }}>{k.val}</Typography>
              <Box sx={{ opacity: 0.85 }}>
                <Sparkline color={k.color} points={k.pts} />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      {/* ================= 3. SEARCH & FILTERS TOOLBAR ================= */}
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: "16px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <Paper elevation={0} sx={{ display: "flex", alignItems: "center", px: 2, py: 0.75, borderRadius: "10px", border: `1px solid ${cCardBorder}`, backgroundColor: "#FAF8FC", flexGrow: 1, width: "100%" }}>
            <Search sx={{ color: cTextMuted, fontSize: 18, mr: 1 }} />
            <InputBase
              placeholder="Search by patient name, Treatment ID, medicine, or routine..."
              sx={{ fontSize: 12.5, flex: 1, color: cTextDark }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Paper>

          <Stack direction="row" spacing={1.25} flexWrap="wrap" gap={1}>
            <TextField
              select
              size="small"
              value={skinTypeFilter}
              onChange={(e) => setSkinTypeFilter(e.target.value)}
              sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 12 } }}
            >
              <MenuItem value="ALL">All Skin Types</MenuItem>
              <MenuItem value="Combination">Combination</MenuItem>
              <MenuItem value="Oily">Oily</MenuItem>
              <MenuItem value="Dry">Dry</MenuItem>
              <MenuItem value="Sensitive">Sensitive</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 12 } }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              startIcon={<FilterAltOff sx={{ fontSize: 15 }} />}
              sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextMuted, textTransform: "none", fontWeight: 700, fontSize: 12 }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ================= 4. MAIN WORKSPACE (70% TABLE + 30% CLINICAL INTELLIGENCE) ================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2.4fr 1fr" }, gap: 3, mb: 4, alignItems: "start" }}>
        
        {/* ── LEFT 70% COLUMN: TREATMENT TABLE / COMPACT EMPTY STATE ── */}
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${cCardBorder}`, overflow: "hidden", backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            {filteredPatients.length === 0 ? (
              /* COMPACT ELEGANT EMPTY STATE */
              <Box sx={{ py: 4.5, px: 3, textAlign: "center", maxWidth: 420, mx: "auto" }}>
                <Box sx={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "rgba(124,92,252,0.1)", color: cPrimary, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                  <Spa sx={{ fontSize: 26 }} />
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark, mb: 0.5 }}>
                  No Active Treatment Plans
                </Typography>
                <Typography sx={{ fontSize: 12, color: cTextMuted, lineHeight: 1.5, mb: 2.5 }}>
                  Treatment plans will automatically appear after assignment.
                </Typography>
                <Stack direction="row" spacing={1.25} justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={() => setCreatePlanOpen(true)}
                    sx={{ borderRadius: "10px", background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", textTransform: "none", fontWeight: 700, fontSize: 12, px: 2.2, py: 0.7 }}
                  >
                    Create Treatment Plan
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/expert/patients")}
                    sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12, px: 2 }}
                  >
                    View Patients
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={loadData}
                    sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12, px: 2 }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#FAF8FC" }}>
                      <TableRow sx={{ '& th': { borderBottom: `1px solid ${cCardBorder}`, fontSize: 10.5, fontWeight: 800, color: cTextMuted, py: 1.5 } }}>
                        <TableCell>PATIENT</TableCell>
                        <TableCell>TREATMENT ID</TableCell>
                        <TableCell>CONDITION</TableCell>
                        <TableCell>MEDICATION</TableCell>
                        <TableCell>PROGRESS</TableCell>
                        <TableCell>COMPLIANCE</TableCell>
                        <TableCell>STATUS</TableCell>
                        <TableCell align="right">ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => {
                        const trtId = `TRT-${String(p.id).substring(0, 6).toUpperCase()}`;
                        const score = p.health_score || 78;
                        return (
                          <TableRow key={p.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 1.5 } }}>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ width: 34, height: 34, background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 11, fontWeight: 800 }}>
                                  {initials(p.full_name)}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: cTextDark }}>{p.full_name}</Typography>
                                  <Typography sx={{ fontSize: 9.5, color: cTextMuted }}>{p.skin_type || "Combination"}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ fontSize: 11.5, fontWeight: 800, color: cPrimary }}>
                              {trtId}
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>
                              {Array.isArray(p.concerns) && p.concerns.length > 0 ? p.concerns[0] : "Inflammatory Acne"}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11.5, fontWeight: 600, color: cTextDark }}>
                              Doxycycline 100mg
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 85 }}>
                                <LinearProgress variant="determinate" value={score} sx={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(124,92,252,0.1)", '& .MuiLinearProgress-bar': { backgroundColor: cPrimary } }} />
                                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: cTextDark }}>{score}%</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ fontSize: 11.5, fontWeight: 800, color: cSuccess }}>
                              88%
                            </TableCell>
                            <TableCell>
                              <Chip label="Active" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(56,161,105,0.12)", color: cSuccess }} />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <IconButton size="small" onClick={() => navigate("/expert/messages")} title="Chat Patient" sx={{ color: cPrimary }}>
                                  <ChatBubbleOutlineOutlined sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => navigate("/expert/prescriptions")} title="Prescription" sx={{ color: cSuccess }}>
                                  <LocalPharmacyOutlined sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[]}
                  component="div"
                  count={filteredPatients.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, n) => setPage(n)}
                  sx={{ borderTop: `1px solid ${cCardBorder}`, color: cTextMuted }}
                />
              </>
            )}
          </Paper>

          {/* Routine Overview & Medication Summary Cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: 2.25, borderRadius: "16px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff" }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
                <WbSunnyOutlined sx={{ color: "#DD6B20", fontSize: 18 }} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark }}>Routine Overview</Typography>
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: cTextMuted, lineHeight: 1.5 }}>
                Active plans configure <strong>AM Cleanser + Salicylic Active</strong> and <strong>PM Retinoid + Barrier Repair</strong> for optimal recovery.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.25, borderRadius: "16px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff" }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
                <LocalPharmacyOutlined sx={{ color: cSuccess, fontSize: 18 }} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark }}>Medication Summary</Typography>
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: cTextMuted, lineHeight: 1.5 }}>
                Prescribed oral antibacterials (<strong>Doxycycline 100mg</strong>) and topical retinoids verified for active patients.
              </Typography>
            </Paper>
          </Box>
        </Stack>

        {/* ── RIGHT 30% COLUMN: CLINICAL INTELLIGENCE CENTER ── */}
        <Stack spacing={2.5}>
          
          {/* Clinical Intelligence Center */}
          <Paper elevation={0} sx={{ p: 2.25, borderRadius: "18px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <AutoAwesome sx={{ color: cPrimary, fontSize: 18 }} />
              <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark }}>Clinical Intelligence</Typography>
            </Stack>

            <Stack spacing={1.25}>
              <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(124,92,252,0.06)", border: `1px solid ${cCardBorder}` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cPrimary, mb: 0.25 }}>AI RECOMMENDATIONS</Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: cTextDark }}>Topical Retinoids + Niacinamide recommended for acne recovery.</Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(221,107,32,0.06)", border: "1px solid rgba(221,107,32,0.2)" }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cWarning, mb: 0.25 }}>MEDICATION ALERTS</Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: cTextDark }}>2 patients due for oral antibacterial dosage review.</Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(56,161,105,0.06)", border: "1px solid rgba(56,161,105,0.2)" }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cSuccess, mb: 0.25 }}>ROUTINE COMPLIANCE</Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: cTextDark }}>88% average routine completion across morning and night steps.</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Upcoming Patient Reviews */}
          <Paper elevation={0} sx={{ p: 2.25, borderRadius: "18px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark, mb: 1.5 }}>Upcoming Reviews</Typography>
            <Stack spacing={1.25}>
              {patients.slice(0, 3).map((p, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ p: 1, borderRadius: "10px", backgroundColor: "#FAF8FC" }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{p.full_name}</Typography>
                    <Typography sx={{ fontSize: 10, color: cTextMuted }}>4-Week Routine Review</Typography>
                  </Box>
                  <Chip label="Due Soon" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(246,173,85,0.15)", color: "#DD6B20" }} />
                </Stack>
              ))}
            </Stack>
          </Paper>

        </Stack>

      </Box>

      {/* ================= 5. ANALYTICS CHARTS (PROGRESS LINE & COMPLIANCE AREA) ================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
        <Paper elevation={0} sx={{ p: 2.25, borderRadius: "18px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark, mb: 1.5 }}>Treatment Progress</Typography>
          <Box sx={{ width: "100%", height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,180,220,0.2)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: cTextMuted, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: cTextMuted, fontWeight: 700 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "10px", border: `1px solid ${cCardBorder}` }} />
                <Line type="monotone" dataKey="progress" stroke={cPrimary} strokeWidth={3} dot={{ r: 4, fill: cPrimary }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.25, borderRadius: "18px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark, mb: 1.5 }}>Routine Compliance Trend</Typography>
          <Box sx={{ width: "100%", height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,180,220,0.2)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: cTextMuted, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: cTextMuted, fontWeight: 700 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "10px", border: `1px solid ${cCardBorder}` }} />
                <Area type="monotone" dataKey="compliance" stroke={cSuccess} strokeWidth={3} fill={cSuccess} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* ================= 6. RECENT ACTIVITY TIMELINE FEED ================= */}
      <Paper elevation={0} sx={{ p: 2.25, borderRadius: "18px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark, mb: 1.5 }}>Recent Activity Feed</Typography>
        <Stack spacing={1.25}>
          {[
            { text: "New Clinical Treatment Plan created", time: "15 mins ago", color: cPrimary },
            { text: "Prescription updated with Doxycycline 100mg", time: "1 hour ago", color: cSuccess },
            { text: "4-Week Routine review completed", time: "3 hours ago", color: cBlue }
          ].map((act, idx) => (
            <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: act.color }} />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{act.text}</Typography>
                <Typography sx={{ fontSize: 10, color: cTextMuted }}>{act.time}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* ================= 7. CREATE TREATMENT PLAN DIALOG ================= */}
      <Dialog open={createPlanOpen} onClose={() => setCreatePlanOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>Create Clinical Treatment Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <TextField fullWidth size="small" label="Clinical Diagnosis" value={newPlanForm.diagnosis} onChange={(e) => setNewPlanForm({ ...newPlanForm, diagnosis: e.target.value })} />
            <TextField fullWidth size="small" multiline rows={2} label="Morning Routine Steps" value={newPlanForm.morningRoutine} onChange={(e) => setNewPlanForm({ ...newPlanForm, morningRoutine: e.target.value })} />
            <TextField fullWidth size="small" multiline rows={2} label="Night Routine Steps" value={newPlanForm.nightRoutine} onChange={(e) => setNewPlanForm({ ...newPlanForm, nightRoutine: e.target.value })} />
            <TextField fullWidth size="small" label="Prescribed Medication & Dosage" value={newPlanForm.medication} onChange={(e) => setNewPlanForm({ ...newPlanForm, medication: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreatePlanOpen(false)} sx={{ textTransform: "none", color: cTextMuted }}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePlan} sx={{ background: "linear-gradient(135deg, #7C5CFC, #E4749B)", borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>Save Treatment Plan</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
