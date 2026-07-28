import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Stack, Button, InputBase, Avatar, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem,
  CircularProgress, Alert, Pagination, Paper, useMediaQuery, useTheme, Grid
} from "@mui/material";
import {
  Search, Add, FilterList, MoreVert, Circle
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getAllUsers } from "../api/admin";

export default function AdminUsersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = search ? (
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone_number || "").includes(search)
      ) : true;
      const matchRole = roleFilter !== "all" ? u.role === roleFilter : true;
      let uStatus = u.status || "pending";
      if (uStatus === "approved") uStatus = "active";
      if (uStatus === "suspended" || uStatus === "rejected") uStatus = "deactivated";
      
      const matchStatus = statusFilter !== "all" ? uStatus === statusFilter : true;
      
      return matchSearch && matchRole && matchStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    let active = 0, pending = 0, deactivated = 0;
    users.forEach(u => {
      if (u.status === "approved") active++;
      else if (u.status === "pending") pending++;
      else if (u.status === "suspended" || u.status === "rejected") deactivated++;
    });
    return { total: users.length, active, pending, deactivated };
  }, [users]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "consultant": return { color: "#8B6FC9", bg: "rgba(139, 111, 201, 0.12)" }; // Primary
      case "dermatologist": return { color: "#42A5F5", bg: "rgba(66, 165, 245, 0.12)" }; // Blue
      case "admin": return { color: "#E4749B", bg: "rgba(228, 116, 155, 0.12)" }; // Danger/Pink
      default: return { color: "#4CAF7D", bg: "rgba(76, 175, 125, 0.12)" }; // Green
    }
  };

  const getRoleLabel = (role) => {
    if (role === "user") return "Patient";
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved" || s === "active") return { color: "#4CAF7D", bg: "rgba(76, 175, 125, 0.12)", dot: true };
    if (s === "pending") return { color: "#FFA726", bg: "rgba(255, 167, 38, 0.12)", dot: true };
    return { color: "#E4749B", bg: "rgba(228, 116, 155, 0.12)", dot: false };
  };

  const getStatusLabel = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved") return "Active";
    if (s === "suspended" || s === "rejected") return "Deactivated";
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: "-", time: "-" };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", pb: 4 }}>
      {/* Breadcrumbs */}
      <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mb: 1, fontWeight: 500 }}>
        Dashboard <span style={{ margin: "0 4px" }}>›</span> <span style={{ color: COLORS.textDark, fontWeight: 700 }}>User Management</span>
      </Typography>

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>
            User Management
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Manage and monitor all platform users. Create, update, and control user access with ease.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            backgroundColor: COLORS.primary,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            py: 1,
            boxShadow: "0 4px 14px rgba(139,111,201,0.3)",
            "&:hover": { backgroundColor: COLORS.primaryDark }
          }}
        >
          Create New User
        </Button>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Users", val: stats.total, desc: "All registered users", iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: "👤" },
          { label: "Active Users", val: stats.active, desc: "Currently active", iconColor: "#4CAF7D", bg: "rgba(76,175,125,0.1)", icon: "✓" },
          { label: "Pending Users", val: stats.pending, desc: "Awaiting approval", iconColor: "#FFA726", bg: "rgba(255,167,38,0.1)", icon: "🕒" },
          { label: "Deactivated", val: stats.deactivated, desc: "Inactive accounts", iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: "🚫" }
        ].map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: kpi.bg, color: kpi.iconColor, fontSize: 18 }}>
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
          <InputBase placeholder="Search by name, email, role or phone..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="small"
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 140, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="user">Patient</MenuItem>
            <MenuItem value="consultant">Consultant</MenuItem>
            <MenuItem value="dermatologist">Dermatologist</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 140, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="deactivated">Deactivated</MenuItem>
          </Select>
          <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.textMuted, borderColor: COLORS.cardBorder, px: 2 }}>
            Filters
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
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>USER</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>ROLE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>CONTACT</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>STATUS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>JOINED ON</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2, textAlign: "right" }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No users found.</TableCell></TableRow>
                  ) : paginatedUsers.map((u) => {
                    const rc = getRoleColor(u.role);
                    const sc = getStatusColor(u.status);
                    const dt = formatDate(u.created_at);
                    return (
                      <TableRow key={u.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ py: 2.5 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 40, height: 40, bgcolor: rc.bg, color: rc.color, fontSize: 14, fontWeight: 800 }}>
                              {getInitials(u.full_name)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textDark }}>{u.full_name || "Unknown"}</Typography>
                              <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>{u.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip label={getRoleLabel(u.role)} size="small" sx={{ backgroundColor: rc.bg, color: rc.color, fontWeight: 700, fontSize: 11, borderRadius: "6px" }} />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, fontSize: 13, color: COLORS.textDark, fontWeight: 500 }}>
                          {u.phone_number || "-"}
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip 
                            label={getStatusLabel(u.status)} 
                            size="small" 
                            icon={sc.dot ? <Circle sx={{ fontSize: "8px !important", color: sc.color }} /> : null}
                            sx={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11, borderRadius: "6px", "& .MuiChip-icon": { ml: 1 } }} 
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark }}>{dt.date}</Typography>
                          <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>{dt.time}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, textAlign: "right" }}>
                          <IconButton size="small"><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
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
              {paginatedUsers.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No users found.</Box>
              ) : paginatedUsers.map((u) => {
                const rc = getRoleColor(u.role);
                const sc = getStatusColor(u.status);
                return (
                  <Box key={u.id} sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder, position: "relative" }}>
                    <IconButton size="small" sx={{ position: "absolute", top: 12, right: 12 }}><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: rc.bg, color: rc.color, fontSize: 14, fontWeight: 800 }}>
                        {getInitials(u.full_name)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>{u.full_name || "Unknown"}</Typography>
                        <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>{u.email}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={getRoleLabel(u.role)} size="small" sx={{ backgroundColor: rc.bg, color: rc.color, fontWeight: 700, fontSize: 10, borderRadius: "6px" }} />
                      <Chip 
                        label={getStatusLabel(u.status)} 
                        size="small" 
                        sx={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 10, borderRadius: "6px" }} 
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Pagination */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>
              Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} records
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
                <MenuItem value={50}>50 / page</MenuItem>
              </Select>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
}
