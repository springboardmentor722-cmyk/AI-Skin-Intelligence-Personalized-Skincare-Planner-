import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination
} from "@mui/material";
import {
  Search, FilterList, FileDownloadOutlined, DescriptionOutlined, BarChartOutlined
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";
import { getConsultantUsers } from "../api/dashboard";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ConsultantReportsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConsultantUsers();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = async (clientId) => {
    setDownloadingId(clientId);
    setTimeout(() => {
      alert(`Report generated for client #${clientId}. Ready for download.`);
      setDownloadingId(null);
    }, 1500);
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => c.full_name?.toLowerCase().includes(q) || c.skin_type?.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: cPrimary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={4}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Client Reports</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>Generate routine adherence and progress reports for your clients.</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Paper sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "12px", border: `1px solid ${cCardBorder}`, boxShadow: "0 2px 8px rgba(139,111,201,0.04)", width: 280, backgroundColor: "#fff" }}>
            <Search sx={{ color: cTextMuted, fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Search clients..." sx={{ fontSize: 13, flex: 1, color: cTextDark }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </Paper>
          <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, px: 2, '&:hover': { borderColor: cPrimary, backgroundColor: `${cPrimary}08` } }}>
            Filters
          </Button>
          <Button variant="contained" startIcon={<BarChartOutlined />} sx={{ borderRadius: "10px", backgroundColor: cPrimary, color: "#fff", textTransform: "none", fontWeight: 700, px: 2, boxShadow: "none", '&:hover': { backgroundColor: "#7B5EC0" } }}>
            Global Analytics
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", backgroundColor: "#fff" }}>
        {filteredClients.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <DescriptionOutlined sx={{ fontSize: 48, color: cCardBorder, mb: 2 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: cTextDark, mb: 1 }}>No clients found</Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted }}>You need active clients to generate reports.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TableHead sx={{ backgroundColor: "#FDFCFE" }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>CLIENT DETAILS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>LAST ASSESSMENT</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>REPORT TYPE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }} align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(c => (
                    <TableRow key={c.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 2 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 14 }}>
                            {initials(c.full_name)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: cTextDark }}>{c.full_name}</Typography>
                            <Typography sx={{ fontSize: 12, color: cTextMuted, mt: 0.25 }}>{c.age || 0} yrs</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: cTextDark }}>{fmtDate(c.last_assessment_date)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: cTextDark }}>Routine Progress Report</Typography>
                        <Typography sx={{ fontSize: 11, color: cTextMuted }}>PDF • Auto-generated</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="contained" 
                          startIcon={downloadingId === c.id ? <CircularProgress size={14} color="inherit" /> : <FileDownloadOutlined />} 
                          sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700, backgroundColor: cPrimary, color: "#fff", boxShadow: "none", '&:hover': { backgroundColor: "#7B5EC0" } }}
                          onClick={() => handleDownload(c.id)}
                          disabled={downloadingId === c.id}
                        >
                          Generate PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[]}
              component="div"
              count={filteredClients.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              sx={{ borderTop: `1px solid ${cCardBorder}`, color: cTextMuted, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13, fontWeight: 600 } }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
