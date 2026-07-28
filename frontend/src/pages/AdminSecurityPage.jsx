import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Stack, Button, InputBase, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem,
  CircularProgress, Alert, Pagination, Paper, useMediaQuery, useTheme, Grid,
  Divider
} from "@mui/material";
import {
  Search, Add, FilterList, MoreVert, Circle, Edit, Delete, ContentCopy,
  Security, Lock, DataUsage, PrivacyTip, Api, VerifiedUser, LockClock, WarningAmber,
  CalendarToday, TaskAlt, AccessTime, ArrowForward
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getSecurityPolicies } from "../api/admin";

// Simple CSS Donut Chart for Policy Types
const PolicyTypesDonut = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ["#8B6FC9", "#4CAF7D", "#42A5F5", "#FFA726", "#E4749B"];
  
  let currentAngle = 0;
  const conicStops = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const start = currentAngle;
    const end = currentAngle + percentage;
    currentAngle = end;
    return `${colors[i % colors.length]} ${start}% ${end}%`;
  }).join(", ");

  return (
    <Stack direction="row" spacing={3} alignItems="center" justifyContent="flex-start">
      <Box sx={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
        <Box sx={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: `conic-gradient(${conicStops})`,
          maskImage: "radial-gradient(circle, transparent 60%, black 61%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 60%, black 61%)"
        }} />
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: COLORS.textDark, lineHeight: 1 }}>{total}</Typography>
          <Typography sx={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 700 }}>Total</Typography>
        </Box>
      </Box>
      <Stack spacing={1} sx={{ width: "100%" }}>
        {data.map((d, i) => (
          <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: colors[i % colors.length] }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textDark }}>{d.name}</Typography>
            </Stack>
            <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>
              {d.value} <span style={{ fontSize: 9 }}>({Math.round((d.value/total)*100)}%)</span>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

export default function AdminSecurityPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const data = await getSecurityPolicies();
        setPolicies(data);
      } catch (err) {
        setError("Failed to load policies.");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchSearch = search ? (
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.type || "").toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchType = typeFilter !== "all" ? p.type === typeFilter : true;
      const matchStatus = statusFilter !== "all" ? (p.status || "Active").toLowerCase() === statusFilter : true;
      
      return matchSearch && matchType && matchStatus;
    }).sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0));
  }, [policies, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPolicies.length / rowsPerPage);
  const paginatedPolicies = filteredPolicies.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    let active = 0, pending = 0, expired = 0;
    policies.forEach(p => {
      const s = (p.status || "Active").toLowerCase();
      if (s === "active") active++;
      else if (s === "pending review") pending++;
      else if (s === "expired") expired++;
    });
    return { total: policies.length, active, pending, expired };
  }, [policies]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(policies.map(p => p.type).filter(Boolean));
    return Array.from(types);
  }, [policies]);

  const typeData = useMemo(() => {
    const counts = {};
    policies.forEach(p => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [policies]);

  // UI Helpers
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "access control": return { color: "#8B6FC9", bg: "rgba(139, 111, 201, 0.12)", icon: <Security /> };
      case "authentication": return { color: "#4CAF7D", bg: "rgba(76, 175, 125, 0.12)", icon: <Lock /> };
      case "data protection": return { color: "#42A5F5", bg: "rgba(66, 165, 245, 0.12)", icon: <DataUsage /> };
      case "session security": return { color: "#FFA726", bg: "rgba(255, 167, 38, 0.12)", icon: <LockClock /> };
      case "privacy": return { color: "#E4749B", bg: "rgba(228, 116, 155, 0.12)", icon: <PrivacyTip /> };
      case "api security": return { color: "#F44336", bg: "rgba(244, 67, 54, 0.12)", icon: <Api /> };
      default: return { color: "#8B6FC9", bg: "rgba(139, 111, 201, 0.12)", icon: <Security /> };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#E4749B";
      case "medium": return "#FFA726";
      case "low": return "#4CAF7D";
      default: return "#78909C";
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "active";
    if (s === "active") return "#4CAF7D";
    if (s === "pending review") return "#FFA726";
    if (s === "expired") return "#E4749B";
    return "#78909C";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: "-", time: "-" };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const recentUpdates = [...policies].sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated)).slice(0, 3);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", pb: 4 }}>
      {/* Breadcrumbs */}
      <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mb: 1, fontWeight: 500 }}>
        Dashboard <span style={{ margin: "0 4px" }}>›</span> <span style={{ color: COLORS.textDark, fontWeight: 700 }}>Security & Policy</span>
      </Typography>

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>
            Security & Policy
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Manage security policies, access control, data protection, and platform compliance rules.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            backgroundColor: COLORS.primary, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3, py: 1,
            boxShadow: "0 4px 14px rgba(139,111,201,0.3)", "&:hover": { backgroundColor: COLORS.primaryDark }
          }}
        >
          Create New Policy
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid item xs={12} lg={9}>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { label: "Total Policies", val: stats.total, desc: "All security & policy rules", iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: <Security /> },
              { label: "Active Policies", val: stats.active, desc: "Currently enforced", iconColor: "#4CAF7D", bg: "rgba(76,175,125,0.1)", icon: <TaskAlt /> },
              { label: "Pending Review", val: stats.pending, desc: "Awaiting approval", iconColor: "#FFA726", bg: "rgba(255,167,38,0.1)", icon: <AccessTime /> },
              { label: "Expired Policies", val: stats.expired, desc: "Needs immediate action", iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: <WarningAmber /> }
            ].map((kpi, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2.5, border: "1px solid " + COLORS.cardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.02)" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 42, height: 42, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: kpi.bg, color: kpi.iconColor }}>
                      {kpi.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.textDark, lineHeight: 1 }}>{loading ? "-" : kpi.val}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.textDark, mt: 0.5 }}>{kpi.label}</Typography>
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>{kpi.desc}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Filters Row */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, borderRadius: "12px", px: 2, py: 1.25, flex: 1, minWidth: { xs: "100%", md: 300 } }}>
              <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
              <InputBase placeholder="Search policies by name, type, or description..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                size="small"
                displayEmpty
                sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 150, "& fieldset": { borderColor: COLORS.cardBorder } }}
              >
                <MenuItem value="all">All Policy Types</MenuItem>
                {uniqueTypes.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                displayEmpty
                sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 140, "& fieldset": { borderColor: COLORS.cardBorder } }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending review">Pending Review</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
              <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.textMuted, borderColor: COLORS.cardBorder, px: 2, whiteSpace: "nowrap" }}>
                Advanced Filters
              </Button>
            </Stack>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{error}</Alert>}

          {/* Main Content Area */}
          {loading ? (
            <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Stack>
          ) : (
            <>
              {!isMobile ? (
                /* Desktop Table */
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid " + COLORS.cardBorder, mb: 3 }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#FAF8FC" }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>POLICY NAME</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>TYPE</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>STATUS</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>PRIORITY</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>LAST UPDATED</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2, textAlign: "center" }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPolicies.length === 0 ? (
                        <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No policies found.</TableCell></TableRow>
                      ) : paginatedPolicies.map((p) => {
                        const tColor = getTypeColor(p.type);
                        const sColor = getStatusColor(p.status);
                        const pColor = getPriorityColor(p.priority);
                        const dt = formatDate(p.last_updated);

                        return (
                          <TableRow key={p.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            <TableCell sx={{ py: 2.5 }}>
                              <Stack direction="row" spacing={2} alignItems="flex-start">
                                <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: "transparent", border: `1.5px solid ${tColor.color}30`, display: "flex", alignItems: "center", justifyContent: "center", "& > svg": { fontSize: 18, color: tColor.color } }}>
                                  {tColor.icon}
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textDark, mb: 0.5 }}>{p.name}</Typography>
                                  <Typography sx={{ fontSize: 11, color: COLORS.textFaint, maxWidth: 300, lineHeight: 1.4 }}>{p.description}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Chip label={p.type} size="small" sx={{ backgroundColor: "transparent", color: tColor.color, fontWeight: 700, fontSize: 11, borderRadius: "6px", px: 0, '& .MuiChip-label': { padding: 0 } }} />
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Circle sx={{ fontSize: 6, color: sColor }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: sColor }}>{p.status}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Circle sx={{ fontSize: 6, color: pColor }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>{p.priority}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark }}>{dt.date}</Typography>
                              <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>{dt.time}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5, textAlign: "center" }}>
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <IconButton size="small" sx={{ color: COLORS.primary, backgroundColor: "rgba(139,111,201,0.1)", borderRadius: "6px" }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" sx={{ color: COLORS.primary, backgroundColor: "rgba(139,111,201,0.1)", borderRadius: "6px" }}><ContentCopy sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" sx={{ color: "#E4749B", backgroundColor: "rgba(228,116,155,0.1)", borderRadius: "6px" }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small"><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mobile Cards */
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {paginatedPolicies.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No policies found.</Box>
                  ) : paginatedPolicies.map((p) => {
                    const tColor = getTypeColor(p.type);
                    const sColor = getStatusColor(p.status);
                    const pColor = getPriorityColor(p.priority);

                    return (
                      <Box key={p.id} sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder, position: "relative" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                           <Stack direction="row" spacing={1.5}>
                             <Box sx={{ width: 32, height: 32, borderRadius: "8px", border: `1px solid ${tColor.color}30`, display: "flex", alignItems: "center", justifyContent: "center", "& > svg": { fontSize: 16, color: tColor.color } }}>
                               {tColor.icon}
                             </Box>
                             <Box sx={{ pr: 2 }}>
                               <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark, mb: 0.5 }}>{p.name}</Typography>
                               <Typography sx={{ fontSize: 11, color: COLORS.textFaint, lineHeight: 1.4 }}>{p.description}</Typography>
                             </Box>
                           </Stack>
                           <IconButton size="small" sx={{ p: 0.5, mt: -0.5, mr: -0.5 }}><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
                        </Stack>
                        
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, mt: 1 }}>
                          <Typography sx={{ color: tColor.color, fontWeight: 700, fontSize: 11 }}>{p.type}</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Circle sx={{ fontSize: 6, color: pColor }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textDark }}>{p.priority}</Typography>
                          </Stack>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: sColor, ml: "auto !important" }}>{p.status}</Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {/* Pagination */}
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>
                  Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredPolicies.length)} of {filteredPolicies.length} policies
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={(_, p) => setPage(p)} 
                    color="primary"
                    shape="rounded"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiPaginationItem-root": { fontWeight: 600, color: COLORS.textMuted },
                      "& .Mui-selected": { backgroundColor: "rgba(139,111,201,0.1) !important", color: COLORS.primary }
                    }}
                  />
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(e.target.value); setPage(1); }}
                    size="small"
                    sx={{ backgroundColor: "#FFF", borderRadius: "8px", fontSize: 12, fontWeight: 600, color: COLORS.textDark, "& fieldset": { borderColor: COLORS.cardBorder } }}
                  >
                    <MenuItem value={10}>10 / page</MenuItem>
                    <MenuItem value={25}>25 / page</MenuItem>
                  </Select>
                </Stack>
              </Stack>
            </>
          )}
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {/* Security Overview */}
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Security sx={{ fontSize: 18, color: COLORS.primary }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Security Overview</Typography>
              </Stack>
              
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Overall Security Score</Typography>
                    <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>Excellent</Typography>
                  </Box>
                  <Box sx={{ width: 46, height: 46, borderRadius: "50%", border: "3px solid #4CAF7D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#4CAF7D" }}>92%</Typography>
                  </Box>
                </Stack>
                
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <VerifiedUser sx={{ fontSize: 16, color: COLORS.textMuted }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Security Policies</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>12 <span style={{ color: "#4CAF7D", fontWeight: 600, fontSize: 11 }}>Active</span></Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <TaskAlt sx={{ fontSize: 16, color: COLORS.textMuted }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Compliance Status</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4CAF7D" }}>Compliant</Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <CalendarToday sx={{ fontSize: 16, color: COLORS.textMuted }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Last Security Audit</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark }}>Jul 24, 2026</Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Policy Types Chart */}
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 3 }}>Policy Types</Typography>
              <PolicyTypesDonut data={typeData} />
            </Box>

            {/* Recent Policy Updates */}
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 3 }}>Recent Policy Updates</Typography>
              <Stack spacing={2.5}>
                {recentUpdates.map((p, i) => {
                  const tColor = getTypeColor(p.type);
                  const isPending = p.status.toLowerCase() === "pending review";
                  return (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: tColor.bg, display: "flex", alignItems: "center", justifyContent: "center", "& > svg": { fontSize: 14, color: tColor.color } }}>
                        {tColor.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark, mb: 0.5 }}>{p.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>{formatDate(p.last_updated).date} {formatDate(p.last_updated).time}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: isPending ? "#FFA726" : "#4CAF7D" }}>
                        {isPending ? "Under Review" : "Updated"}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <Button endIcon={<ArrowForward sx={{ fontSize: 14 }} />} sx={{ mt: 3, textTransform: "none", fontWeight: 700, fontSize: 12, color: COLORS.primary, width: "100%" }}>
                View All Updates
              </Button>
            </Box>

            {/* Quick Actions */}
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: "Security Audit", icon: <Security /> },
                  { label: "Access Logs", icon: <DataUsage /> },
                  { label: "Backup Status", icon: <LockClock /> },
                  { label: "Compliance Report", icon: <PrivacyTip /> }
                ].map((act, i) => (
                  <Grid item xs={3} key={i}>
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ width: 40, height: 40, borderRadius: "10px", backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, "& > svg": { fontSize: 18 }, cursor: "pointer", "&:hover": { backgroundColor: "rgba(139,111,201,0.05)" } }}>
                        {act.icon}
                      </Box>
                      <Typography sx={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textAlign: "center", lineHeight: 1.2 }}>{act.label}</Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Box>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
