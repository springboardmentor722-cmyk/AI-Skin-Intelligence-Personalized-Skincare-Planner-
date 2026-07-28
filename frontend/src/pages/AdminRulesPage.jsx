import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Stack, Button, InputBase, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem,
  CircularProgress, Alert, Pagination, Paper, useMediaQuery, useTheme, Grid
} from "@mui/material";
import {
  Search, Add, FilterList, MoreVert, Circle, Edit, Delete, ContentCopy,
  Opacity, Shield, LightMode, AutoFixHigh, MedicalServices
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getAIRules } from "../api/admin";

export default function AdminRulesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const data = await getAIRules();
        setRules(data);
      } catch (err) {
        setError("Failed to load rules.");
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchSearch = search ? (
        (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.type || "").toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchType = typeFilter !== "all" ? r.type === typeFilter : true;
      const matchStatus = statusFilter !== "all" ? (r.status || "Active").toLowerCase() === statusFilter : true;
      
      return matchSearch && matchType && matchStatus;
    }).sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0));
  }, [rules, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRules.length / rowsPerPage);
  const paginatedRules = filteredRules.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    let active = 0, pending = 0, archived = 0;
    rules.forEach(r => {
      const s = (r.status || "Active").toLowerCase();
      if (s === "active") active++;
      else if (s === "pending") pending++;
      else if (s === "archived") archived++;
    });
    return { total: rules.length, active, pending, archived };
  }, [rules]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(rules.map(r => r.type).filter(Boolean));
    return Array.from(types);
  }, [rules]);

  // UI Helpers
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "detection": return { color: "#8B6FC9", bg: "rgba(139, 111, 201, 0.12)" }; // Purple
      case "analysis": return { color: "#42A5F5", bg: "rgba(66, 165, 245, 0.12)" }; // Blue
      case "scoring": return { color: "#4CAF7D", bg: "rgba(76, 175, 125, 0.12)" }; // Green
      case "risk": return { color: "#FFA726", bg: "rgba(255, 167, 38, 0.12)" }; // Orange
      case "recommendation": return { color: "#E4749B", bg: "rgba(228, 116, 155, 0.12)" }; // Pink
      default: return { color: "#8B6FC9", bg: "rgba(139, 111, 201, 0.12)" };
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
    if (s === "pending") return "#FFA726";
    return "#E4749B";
  };
  
  const getRuleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "detection": return <Opacity sx={{ color: "#E4749B" }} />;
      case "analysis": return <Opacity sx={{ color: "#42A5F5" }} />;
      case "scoring": return <Shield sx={{ color: "#4CAF7D" }} />;
      case "risk": return <LightMode sx={{ color: "#FFA726" }} />;
      case "recommendation": return <AutoFixHigh sx={{ color: "#8B6FC9" }} />;
      default: return <MedicalServices sx={{ color: "#8B6FC9" }} />;
    }
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
        Dashboard <span style={{ margin: "0 4px" }}>›</span> <span style={{ color: COLORS.textDark, fontWeight: 700 }}>AI Engine Rules</span>
      </Typography>

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark }}>
              AI Engine Rules
            </Typography>
            <Chip label={`${stats.total} Total Rules`} size="small" sx={{ backgroundColor: "rgba(139, 111, 201, 0.1)", color: COLORS.primary, fontWeight: 700, fontSize: 11, borderRadius: "6px" }} />
          </Stack>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Create, manage and monitor AI engine rules that power skin analysis, recommendations and insights.
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
          Create New Rule
        </Button>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Rules", val: stats.total, desc: "All created rules", iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: "⚙️" },
          { label: "Active Rules", val: stats.active, desc: "Currently running", iconColor: "#4CAF7D", bg: "rgba(76,175,125,0.1)", icon: "✓" },
          { label: "Pending Rules", val: stats.pending, desc: "Awaiting activation", iconColor: "#FFA726", bg: "rgba(255,167,38,0.1)", icon: "🕒" },
          { label: "Archived Rules", val: stats.archived, desc: "Moved to archive", iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: "🗑️" }
        ].map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 42, height: 42, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: kpi.bg, color: kpi.iconColor, fontSize: 18 }}>
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
          <InputBase placeholder="Search rules by name, type, condition..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            size="small"
            displayEmpty
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 150, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="all">All Rule Types</MenuItem>
            {uniqueTypes.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            displayEmpty
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 130, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
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
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>RULE NAME</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>TYPE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>PRIORITY</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>STATUS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>LAST UPDATED</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2, textAlign: "center" }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRules.length === 0 ? (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No rules found.</TableCell></TableRow>
                  ) : paginatedRules.map((r) => {
                    const tColor = getTypeColor(r.type);
                    const sColor = getStatusColor(r.status);
                    const pColor = getPriorityColor(r.priority);
                    const dt = formatDate(r.last_updated);

                    return (
                      <TableRow key={r.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ py: 2.5 }}>
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box sx={{ width: 40, height: 40, borderRadius: "10px", backgroundColor: "rgba(139,111,201,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {getRuleIcon(r.type)}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textDark, mb: 0.5 }}>{r.name}</Typography>
                              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, maxWidth: 300, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.description}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip label={r.type || "Safety"} size="small" sx={{ backgroundColor: tColor.bg, color: tColor.color, fontWeight: 700, fontSize: 11, borderRadius: "6px" }} />
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Circle sx={{ fontSize: 8, color: pColor }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>{r.priority || "High"}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: sColor }}>{r.status || "Active"}</Typography>
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
              {paginatedRules.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No rules found.</Box>
              ) : paginatedRules.map((r) => {
                const tColor = getTypeColor(r.type);
                const sColor = getStatusColor(r.status);
                const pColor = getPriorityColor(r.priority);

                return (
                  <Box key={r.id} sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder, position: "relative" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                       <Stack direction="row" spacing={1.5}>
                         <Box sx={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: "rgba(139,111,201,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                           {getRuleIcon(r.type)}
                         </Box>
                         <Box sx={{ pr: 2 }}>
                           <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark, mb: 0.5 }}>{r.name}</Typography>
                           <Typography sx={{ fontSize: 11, color: COLORS.textFaint, lineHeight: 1.4 }}>{r.description}</Typography>
                         </Box>
                       </Stack>
                       <IconButton size="small" sx={{ p: 0.5, mt: -0.5, mr: -0.5 }}><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, mt: 1 }}>
                      <Chip label={r.type || "Safety"} size="small" sx={{ backgroundColor: tColor.bg, color: tColor.color, fontWeight: 700, fontSize: 10, borderRadius: "6px" }} />
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Circle sx={{ fontSize: 6, color: pColor }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textDark }}>{r.priority || "High"}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: sColor, ml: "auto !important" }}>{r.status || "Active"}</Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Pagination */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>
              Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredRules.length)} of {filteredRules.length} rules
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
