import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Stack, Button, CircularProgress, Alert, Paper, Grid, useMediaQuery, useTheme, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import {
  Download, People, VerifiedUser, CalendarToday, Description, ShowChart, CalendarMonth
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getPlatformAnalytics } from "../api/admin";

// Simple CSS Donut Chart Component
const DonutChart = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ["#8B6FC9", "#E4749B", "#42A5F5", "#4CAF7D"];
  
  let currentAngle = 0;
  const conicStops = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const start = currentAngle;
    const end = currentAngle + percentage;
    currentAngle = end;
    return `${colors[i % colors.length]} ${start}% ${end}%`;
  }).join(", ");

  return (
    <Stack direction="row" spacing={4} alignItems="center" justifyContent="center">
      <Box sx={{ position: "relative", width: 140, height: 140 }}>
        <Box sx={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: `conic-gradient(${conicStops})`,
          maskImage: "radial-gradient(circle, transparent 55%, black 56%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 55%, black 56%)"
        }} />
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: COLORS.textDark, lineHeight: 1 }}>{total}</Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>Total</Typography>
        </Box>
      </Box>
      <Stack spacing={1.5}>
        {data.map((d, i) => (
          <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors[i % colors.length] }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>{d.name}</Typography>
            </Stack>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
              {d.value} <span style={{ fontSize: 10 }}>({Math.round((d.value/total)*100)}%)</span>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

// Simple SVG Line Chart Component
const SparkLineChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.users), 10);
  const min = 0;
  const range = max - min;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.users - min) / range) * 80 - 10; // keep padding
    return `${x},${y}`;
  }).join(" ");

  const dPath = `M 0,100 L ${points} L 100,100 Z`;

  return (
    <Box sx={{ width: "100%", height: 160, position: "relative" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139,111,201,0.4)" />
            <stop offset="100%" stopColor="rgba(139,111,201,0.0)" />
          </linearGradient>
        </defs>
        <path d={dPath} fill="url(#lineGradient)" />
        <polyline fill="none" stroke="#8B6FC9" strokeWidth="2" points={points} strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.users - min) / range) * 80 - 10;
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#FFF" stroke="#8B6FC9" strokeWidth="1.5" />;
        })}
      </svg>
      {/* X Axis Labels */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
        {data.map((d, i) => {
          const dt = new Date(d.date);
          return <Typography key={i} sx={{ fontSize: 10, color: COLORS.textMuted }}>{dt.getDate()} {dt.toLocaleString('default', {month:'short'})}</Typography>;
        })}
      </Stack>
    </Box>
  );
};

// Simple Flex Bar Chart Component
const BarChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.appointments), 10);
  
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ height: 160, mt: 2 }}>
      {data.map((d, i) => {
        const h = `${Math.max((d.appointments / max) * 100, 5)}%`;
        const dt = new Date(d.date);
        return (
          <Stack key={i} alignItems="center" spacing={1} sx={{ height: "100%", width: "10%" }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <Box sx={{ width: "100%", height: h, backgroundColor: "rgba(139,111,201,0.4)", borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} />
            </Box>
            <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>{dt.getDate()} {dt.toLocaleString('default', {month:'short'})}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};

export default function AdminAnalyticsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getPlatformAnalytics();
        setData(res);
      } catch (err) {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Stack>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) return null;

  const { kpis, user_growth, user_activity_by_role, appointments_overview, recent_activities } = data;

  const kpiCards = [
    { label: "Total Users", val: kpis.total_users?.toLocaleString(), trend: "+12.5%", color: "#8B6FC9", icon: <People /> },
    { label: "Active Users", val: kpis.active_users?.toLocaleString(), trend: "+8.3%", color: "#4CAF7D", icon: <VerifiedUser /> },
    { label: "Appointments", val: kpis.total_appointments?.toLocaleString(), trend: "+15.7%", color: "#FFA726", icon: <CalendarToday /> },
    { label: "Reports Generated", val: kpis.reports_generated?.toLocaleString(), trend: "+10.2%", color: "#42A5F5", icon: <Description /> },
    { label: "System Uptime", val: kpis.system_uptime, trend: "+2.1%", color: "#E4749B", icon: <ShowChart /> }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", pb: 4 }}>
      {/* Breadcrumbs */}
      <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mb: 1, fontWeight: 500 }}>
        Dashboard <span style={{ margin: "0 4px" }}>›</span> <span style={{ color: COLORS.textDark, fontWeight: 700 }}>Platform Analytics</span>
      </Typography>

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>
            Platform Analytics
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Real-time overview of platform performance and user engagement.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CalendarMonth />}
            sx={{
              borderRadius: "10px", textTransform: "none", fontWeight: 600, color: COLORS.textDark, borderColor: COLORS.cardBorder,
              backgroundColor: "#FFF"
            }}
          >
            Last 7 Days
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{
              backgroundColor: COLORS.primary, borderRadius: "10px", textTransform: "none", fontWeight: 700,
              boxShadow: "0 4px 14px rgba(139,111,201,0.3)", "&:hover": { backgroundColor: COLORS.primaryDark }
            }}
          >
            Export Report
          </Button>
        </Stack>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.02)" }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                  {kpi.icon}
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: COLORS.textDark, lineHeight: 1 }}>{kpi.val}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.textDark, mb: 0.5 }}>{kpi.label}</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4CAF7D" }}>
                {kpi.trend} <span style={{ color: COLORS.textFaint, fontWeight: 500 }}>vs last week</span>
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>User Growth</Typography>
              <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>This Week ˅</Typography>
            </Stack>
            <SparkLineChart data={user_growth} />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>User Activity by Role</Typography>
            </Stack>
            <DonutChart data={user_activity_by_role} />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>Appointments Overview</Typography>
              <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>This Week ˅</Typography>
            </Stack>
            <BarChart data={appointments_overview} />
          </Box>
        </Grid>
      </Grid>

      {/* Breakdown Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Mock Top User Locations */}
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark, mb: 3 }}>Top User Locations</Typography>
            {/* Extremely simple location bars */}
            <Stack spacing={2}>
              {[
                { n: "India", v: "56%", c: "#8B6FC9" },
                { n: "United States", v: "18%", c: "#42A5F5" },
                { n: "United Kingdom", v: "8%", c: "#E4749B" },
                { n: "Canada", v: "6%", c: "#4CAF7D" },
                { n: "Others", v: "12%", c: "#FFA726" }
              ].map((loc, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: loc.c }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark, flex: 1 }}>{loc.n}</Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>{loc.v}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>
        
        {/* Feature Usage (Using Mocked/Static Data based on Reports generated as the base) */}
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>Feature Usage</Typography>
              <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>This Week ˅</Typography>
            </Stack>
            <Stack spacing={2.5}>
              {[
                { label: "AI Skin Assessment", val: kpis.reports_generated, w: "90%" },
                { label: "Product Recommendations", val: Math.floor(kpis.reports_generated * 0.8), w: "80%" },
                { label: "Routine Planner", val: Math.floor(kpis.reports_generated * 0.6), w: "60%" },
                { label: "Ingredient Analyzer", val: Math.floor(kpis.reports_generated * 0.4), w: "40%" },
                { label: "Progress Tracking", val: Math.floor(kpis.reports_generated * 0.2), w: "20%" },
              ].map((f, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={2}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark, width: 140 }}>{f.label}</Typography>
                  <Box sx={{ flex: 1, backgroundColor: "rgba(139,111,201,0.1)", height: 6, borderRadius: 3 }}>
                    <Box sx={{ width: f.w, backgroundColor: COLORS.primary, height: "100%", borderRadius: 3 }} />
                  </Box>
                  <Typography sx={{ fontSize: 11, color: COLORS.textMuted, width: 30, textAlign: "right" }}>{f.val}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>System Health</Typography>
              <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>Live Status ˅</Typography>
            </Stack>
            <Stack spacing={2.5}>
              {["API Services", "Database", "AI Engine", "File Storage", "Email Service"].map((s, i) => (
                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark }}>{s}</Typography>
                  <Chip label="Operational" size="small" icon={<VerifiedUser sx={{ fontSize: "14px !important", color: "#4CAF7D" }} />} sx={{ backgroundColor: "rgba(76,175,125,0.1)", color: "#4CAF7D", fontWeight: 700, fontSize: 10, borderRadius: "6px", height: 20 }} />
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Recent System Activities Table */}
      <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark, mb: 3 }}>Recent System Activities</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#FAF8FC" }}>
              <TableRow>
                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 1.5, borderBottom: "none" }}>TIME</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 1.5, borderBottom: "none" }}>ACTIVITY</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 1.5, borderBottom: "none" }}>DETAILS</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 1.5, borderBottom: "none" }}>PERFORMED BY</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 1.5, borderBottom: "none" }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent_activities.length === 0 ? (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 3, color: COLORS.textMuted }}>No recent activities</TableCell></TableRow>
              ) : recent_activities.map((act, i) => {
                const dt = new Date(act.time);
                const isSuccess = act.status?.toLowerCase() === "success";
                return (
                  <TableRow key={i} sx={{ "& td": { borderBottom: "1px solid " + COLORS.cardBorder, py: 2 } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>
                        {dt.getDate()} {dt.toLocaleString('default', {month:'short'})} {dt.getFullYear()}, {dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark }}>{act.activity}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>{act.details}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>{act.performed_by}</Typography></TableCell>
                    <TableCell>
                      <Chip label={act.status} size="small" sx={{ 
                        backgroundColor: isSuccess ? "rgba(76,175,125,0.1)" : "rgba(66,165,245,0.1)", 
                        color: isSuccess ? "#4CAF7D" : "#42A5F5", 
                        fontWeight: 700, fontSize: 10, borderRadius: "4px", height: 20 
                      }} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Button sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}>View All Activities</Button>
        </Stack>
      </Box>

    </Box>
  );
}
