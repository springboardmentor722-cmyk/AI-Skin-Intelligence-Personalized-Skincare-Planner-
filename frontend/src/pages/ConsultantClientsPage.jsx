import { useState, useEffect, useCallback } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Chip, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Breadcrumbs, Link, Grid, Select, MenuItem
} from "@mui/material";
import {
  Search, Add, Visibility, MoreVert, FilterList, PeopleAltOutlined,
  Autorenew, FileDownloadOutlined, VerifiedUserOutlined, AssignmentLateOutlined,
  CalendarToday, ArrowForward
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";
import { getConsultantUsers, getConsultantDashboard, getConsultantAppointments } from "../api/dashboard";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";
const cSuccess = COLORS.success || "#38A169";
const cWarning = COLORS.warning || "#DD6B20";
const cDanger = COLORS.danger || "#E53E3E";
const cSecondary = "#4EA8DE";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function ConsultantClientsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState({ upcoming: [], completed: [], cancelled: [] });
  
  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [skinTypeFilter, setSkinTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, dashRes, apptRes] = await Promise.all([
        getConsultantUsers(),
        getConsultantDashboard(),
        getConsultantAppointments()
      ]);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setDashboardData(dashRes);
      setAppointments(apptRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics
  const stats = dashboardData?.stats || {};
  const notifications = dashboardData?.notifications || [];
  
  const todayAppts = appointments.upcoming.filter(a => {
    const d = new Date(a.scheduled_at);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  
  const upcomingAppts = appointments.upcoming.filter(a => {
    const d = new Date(a.scheduled_at);
    const today = new Date();
    return d > today && (d.getDate() !== today.getDate() || d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear());
  });

  // Filtered list
  const filteredClients = clients.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (skinTypeFilter !== "all" && c.skin_type?.toLowerCase() !== skinTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.full_name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      
      {/* Header section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={4} spacing={2}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 13, color: cTextMuted, mb: 1 }}>
            <Link underline="hover" color="inherit" href="/consultant/dashboard">Dashboard</Link>
            <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 700 }}>Clients</Typography>
          </Breadcrumbs>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Clients</Typography>
          <Typography sx={{ fontSize: 14, color: cTextMuted }}>Manage your assigned patients and monitor their progress.</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 16 }} />} sx={{ height: 36, borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12, px: 2 }}>
            Export
          </Button>
          <Button size="small" variant="outlined" onClick={loadData} startIcon={<Autorenew sx={{ fontSize: 16 }} />} sx={{ height: 36, borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12, px: 2 }}>
            Refresh
          </Button>
          <Button size="small" variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} sx={{ height: 36, backgroundColor: cPrimary, color: "#fff", textTransform: "none", fontWeight: 800, borderRadius: "10px", px: 2.5, fontSize: 12, boxShadow: "none", '&:hover': { backgroundColor: "#7c61b4", boxShadow: "none" } }}>
            Add Client
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={4}>
        {/* LEFT COLUMN - MAIN */}
        <Grid item xs={12} lg={9}>
          {/* KPI Cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
            {[
              { label: "Total Clients", val: stats.total_assigned_users || 0, color: cPrimary, icon: <PeopleAltOutlined sx={{color: cPrimary, fontSize: 20}}/>, change: "+12.5%" },
              { label: "Active Treatment", val: stats.active_skincare_plans || 0, color: cSuccess, icon: <VerifiedUserOutlined sx={{color: cSuccess, fontSize: 20}}/>, change: "+8.1%" },
              { label: "Pending Follow-ups", val: stats.pending_reviews || 0, color: cWarning, icon: <AssignmentLateOutlined sx={{color: cWarning, fontSize: 20}}/>, change: "-2.5%" },
              { label: "Completed Cases", val: stats.completed_consultations || 0, color: cSecondary, icon: <Visibility sx={{color: cSecondary, fontSize: 20}}/>, change: "+15.3%" }
            ].map((k, i) => (
              <Paper key={i} sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", position: 'relative', overflow: 'hidden' }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Box sx={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {k.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 700 }}>{k.label}</Typography>
                    <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, lineHeight: 1.2 }}>{k.val}</Typography>
                  </Box>
                </Stack>
                <Typography sx={{ fontSize: 11, color: k.change.startsWith("+") ? cSuccess : cDanger, fontWeight: 600 }}>{k.change.startsWith("+") ? "↑" : "↓"} {k.change} from last month</Typography>
                
                {/* Decorative mini sparkline */}
                <Box sx={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: 40, opacity: 0.2 }}>
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" width="100%" height="100%">
                    <path d="M0 30 Q 15 10 30 20 T 60 10 T 100 20 L 100 30 Z" fill="none" stroke={k.color} strokeWidth="3" />
                  </svg>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Filters and Search */}
          <Paper sx={{ p: 2.5, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 4, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#F9F8FA", border: "1px solid " + cCardBorder, borderRadius: "12px", px: 2, py: 1.5, flexGrow: 1, minWidth: 280 }}>
              <Search sx={{ fontSize: 20, color: cTextMuted }} />
              <InputBase placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 14, width: "100%", color: cTextDark }} />
            </Stack>
            
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Box>
                <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 0.5, fontWeight: 700 }}>Status</Typography>
                <Select size="small" variant="standard" disableUnderline value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ fontSize: 14, fontWeight: 600, color: cTextDark, minWidth: 100 }}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="ended">Resolved</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 0.5, fontWeight: 700 }}>Skin Type</Typography>
                <Select size="small" variant="standard" disableUnderline value={skinTypeFilter} onChange={(e) => setSkinTypeFilter(e.target.value)} sx={{ fontSize: 14, fontWeight: 600, color: cTextDark, minWidth: 100 }}>
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="oily">Oily</MenuItem>
                  <MenuItem value="dry">Dry</MenuItem>
                  <MenuItem value="combination">Combination</MenuItem>
                  <MenuItem value="sensitive">Sensitive</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                </Select>
              </Box>
              
              <Box>
                <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 0.5, fontWeight: 700 }}>Last Visit</Typography>
                <Select size="small" variant="standard" disableUnderline value="all" sx={{ fontSize: 14, fontWeight: 600, color: cTextDark, minWidth: 100 }}>
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </Box>
              
              <Button variant="outlined" startIcon={<FilterList />} sx={{ height: 42, mt: 2, borderRadius: "10px", textTransform: "none", color: cTextDark, borderColor: cCardBorder, fontWeight: 700 }}>
                Filters
              </Button>
              <Button onClick={() => { setSearch(""); setStatusFilter("all"); setSkinTypeFilter("all"); }} sx={{ height: 42, mt: 2, color: cPrimary, textTransform: "none", fontWeight: 700 }}>
                Reset
              </Button>
            </Box>
          </Paper>

          {/* Main Table */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                <CircularProgress sx={{ color: cPrimary }} />
              </Stack>
            ) : filteredClients.length === 0 ? (
              <Box sx={{ py: 10, px: 3, textAlign: "center" }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 1 }}>No matching clients found</Typography>
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>Try adjusting your filters or search query.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 1000 }}>
                    <TableHead sx={{ backgroundColor: "#FDFCFE" }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>CLIENT</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>AGE</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>SKIN TYPE</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>SKIN SCORE</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>CONCERN</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>ROUTINE PROGRESS</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>LAST VISIT</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>STATUS</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }} align="right">ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(c => {
                        let statusColor = c.status === "active" ? cSuccess : c.status === "pending" ? cWarning : cPrimary;
                        let typeColor = c.skin_type === "oily" ? "#3182CE" : c.skin_type === "dry" ? "#D69E2E" : c.skin_type === "combination" ? "#805AD5" : c.skin_type === "sensitive" ? "#E53E3E" : cSuccess;
                        
                        return (
                          <TableRow key={c.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 2 } }}>
                            <TableCell>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ width: 42, height: 42, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 14 }}>
                                  {initials(c.full_name)}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark }}>{c.full_name}</Typography>
                                  <Typography sx={{ fontSize: 12, color: cTextMuted }}>ID: CLI-{c.id.substring(0, 4).toUpperCase()}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: cTextDark, fontWeight: 600 }}>{c.age || "-"}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={c.skin_type || "N/A"} size="small" sx={{ backgroundColor: `${typeColor}15`, color: typeColor, fontWeight: 700, fontSize: 11, textTransform: "capitalize", borderRadius: "6px" }} />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ position: 'relative', display: 'inline-flex', width: 44, height: 44 }}>
                                <CircularProgress variant="determinate" value={100} size={44} sx={{ color: cCardBorder, position: "absolute", left: 0, top: 0 }} />
                                <CircularProgress variant="determinate" value={c.current_score || 0} size={44} sx={{ color: (c.current_score || 0) > 75 ? cSuccess : ((c.current_score || 0) < 40 ? cDanger : cWarning), position: "absolute", left: 0, top: 0, strokeLinecap: "round" }} />
                                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: cTextDark }}>{Math.round(c.current_score || 0)}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: cTextDark, fontWeight: 600, textTransform: "capitalize" }}>{c.primary_concern || "General"}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{c.routine_progress || 0}%</Typography>
                              </Stack>
                              <Box sx={{ width: '100%', maxWidth: 100, height: 6, borderRadius: 3, backgroundColor: `${cPrimary}20` }}>
                                <Box sx={{ width: `${c.routine_progress || 0}%`, height: '100%', borderRadius: 3, backgroundColor: cPrimary }} />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: cTextDark, fontWeight: 700 }}>{fmtDate(c.last_assessment_date)}</Typography>
                              <Typography sx={{ fontSize: 11, color: cTextMuted }}>{fmtTime(c.last_assessment_date)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor }} />
                                <Typography sx={{ fontSize: 13, color: statusColor, fontWeight: 700, textTransform: "capitalize" }}>{c.status}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <IconButton size="small" sx={{ color: cPrimary, backgroundColor: `${cPrimary}10`, '&:hover':{backgroundColor:`${cPrimary}20`} }}>
                                  <Visibility sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton size="small" sx={{ color: cTextMuted }}>
                                  <MoreVert sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                  <Typography sx={{ fontSize: 13, color: cTextMuted, fontWeight: 600 }}>
                    Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredClients.length)} of {filteredClients.length} results
                  </Typography>
                  <TablePagination 
                    component="div" 
                    count={filteredClients.length} 
                    page={page} 
                    onPageChange={(e, p) => setPage(p)} 
                    rowsPerPage={rowsPerPage} 
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
                    rowsPerPageOptions={[5, 10, 25]} 
                    labelRowsPerPage=""
                    sx={{ borderBottom: "none", '.MuiTablePagination-selectLabel': {display: 'none'}, '.MuiTablePagination-displayedRows': {display: 'none'} }}
                  />
                </Stack>
              </>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN - SIDEBAR */}
        <Grid item xs={12} lg={3}>
          {/* Today's Follow-ups */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 3, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarToday sx={{ fontSize: 18, color: cPrimary }} />
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Today's Follow-ups</Typography>
              </Stack>
              <Chip label={todayAppts.length} size="small" sx={{ backgroundColor: `${cDanger}15`, color: cDanger, fontWeight: 800, fontSize: 11, borderRadius: "8px" }} />
            </Stack>
            
            <Stack spacing={2.5}>
              {todayAppts.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No follow-ups today.</Typography>
              ) : todayAppts.slice(0,3).map(a => (
                <Stack key={a.id} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, backgroundColor: `${cPrimary}15`, color: cPrimary }}>
                      {initials(a.user_name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{a.user_name}</Typography>
                      <Typography sx={{ fontSize: 11, color: cTextMuted }}>{a.reason || "Routine review"}</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark }}>{fmtTime(a.scheduled_at)}</Typography>
                </Stack>
              ))}
            </Stack>
            <Button endIcon={<ArrowForward sx={{fontSize: 14}} />} sx={{ mt: 2, fontSize: 12, fontWeight: 700, textTransform: "none", p: 0, color: cPrimary }}>
              View all follow-ups
            </Button>
          </Paper>

          {/* Upcoming Appointments */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 3, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarToday sx={{ fontSize: 18, color: cSecondary }} />
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Upcoming Appointments</Typography>
              </Stack>
              <Chip label={upcomingAppts.length} size="small" sx={{ backgroundColor: `${cSecondary}15`, color: cSecondary, fontWeight: 800, fontSize: 11, borderRadius: "8px" }} />
            </Stack>
            
            <Stack spacing={2.5}>
              {upcomingAppts.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No upcoming appointments.</Typography>
              ) : upcomingAppts.slice(0,2).map(a => (
                <Stack key={a.id} direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, backgroundColor: `${cSecondary}15`, color: cSecondary }}>
                    {initials(a.user_name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{a.user_name}</Typography>
                    <Typography sx={{ fontSize: 11, color: cTextMuted }}>{fmtDate(a.scheduled_at)}, {fmtTime(a.scheduled_at)}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Button endIcon={<ArrowForward sx={{fontSize: 14}} />} sx={{ mt: 2, fontSize: 12, fontWeight: 700, textTransform: "none", p: 0, color: cPrimary }}>
              View all appointments
            </Button>
          </Paper>

          {/* Recent Messages */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 3, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Recent Messages</Typography>
              <Chip label={notifications.length} size="small" sx={{ backgroundColor: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 11, borderRadius: "8px" }} />
            </Stack>
            
            <Stack spacing={2.5}>
              {notifications.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No recent messages.</Typography>
              ) : notifications.slice(0,3).map(n => (
                <Stack key={n.id} direction="row" alignItems="flex-start" spacing={1.5}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, backgroundColor: `${cWarning}15`, color: cWarning }}>
                    C
                  </Avatar>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.25}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{n.title}</Typography>
                      <Typography sx={{ fontSize: 10, color: cTextMuted }}>{fmtDate(n.created_at)}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: cTextMuted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.message}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Button endIcon={<ArrowForward sx={{fontSize: 14}} />} sx={{ mt: 2, fontSize: 12, fontWeight: 700, textTransform: "none", p: 0, color: cPrimary }}>
              View all messages
            </Button>
          </Paper>

          {/* AI Recommendations */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#FDFCFE", boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: cDanger, display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              ⭐ AI Recommendations
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark, mb: 1 }}>
              {clients.filter(c => c.progress_status === "Needs Attention").length} clients need your attention
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 16, color: cTextMuted, fontSize: 12, lineHeight: 1.8 }}>
              <li>{clients.filter(c => c.progress_status === "Needs Attention").length} clients with decreasing skin score</li>
              <li>{todayAppts.length} pending follow-ups today</li>
              <li>{clients.filter(c => c.routine_progress < 50).length} routines not followed closely</li>
            </ul>
            <Button variant="outlined" sx={{ mt: 2.5, width: "100%", borderRadius: "10px", borderColor: cDanger, color: cDanger, textTransform: "none", fontWeight: 700 }}>
              View recommendations
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
