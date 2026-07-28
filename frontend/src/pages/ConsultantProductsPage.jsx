import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Chip, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination
} from "@mui/material";
import {
  Search, Add, Visibility, FilterList, LocalMallOutlined, RecommendOutlined
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

export default function ConsultantProductsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const navigate = useNavigate();

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
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Product Recommendations</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>Recommend cleansers, serums, and moisturizers based on skin types.</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Paper sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "12px", border: `1px solid ${cCardBorder}`, boxShadow: "0 2px 8px rgba(139,111,201,0.04)", width: 280, backgroundColor: "#fff" }}>
            <Search sx={{ color: cTextMuted, fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Search clients..." sx={{ fontSize: 13, flex: 1, color: cTextDark }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </Paper>
          <Button variant="contained" startIcon={<RecommendOutlined />} sx={{ borderRadius: "10px", backgroundColor: cPrimary, color: "#fff", textTransform: "none", fontWeight: 700, px: 2, boxShadow: "none", '&:hover': { backgroundColor: "#7B5EC0" } }}>
            New Recommendation
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", backgroundColor: "#fff" }}>
        {filteredClients.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <LocalMallOutlined sx={{ fontSize: 48, color: cCardBorder, mb: 2 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: cTextDark, mb: 1 }}>No clients found</Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted }}>Assign clients to recommend products.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TableHead sx={{ backgroundColor: "#FDFCFE" }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>CLIENT</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>SKIN TYPE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>RECOMMENDATIONS</TableCell>
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
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark, textTransform: "capitalize", mb: 0.5 }}>{c.skin_type || "Unknown"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.health_score > 0 ? "Products Assigned" : "No Products"} size="small" sx={{ backgroundColor: c.health_score > 0 ? `${cPrimary}15` : cCardBorder, color: c.health_score > 0 ? cPrimary : cTextMuted, fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button onClick={() => navigate(`/consultant/products/recommend/${c.id}`)} size="small" variant="outlined" sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700, borderColor: cCardBorder, color: cTextDark }}>
                            Recommend
                          </Button>
                        </Stack>
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
              sx={{ borderTop: `1px solid ${cCardBorder}`, color: cTextMuted }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
