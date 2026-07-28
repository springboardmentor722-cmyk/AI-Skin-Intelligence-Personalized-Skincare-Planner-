import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Stack, Button, InputBase, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem,
  CircularProgress, Alert, Pagination, Paper, useMediaQuery, useTheme, Grid
} from "@mui/material";
import {
  Search, Add, FilterList, MoreVert, Circle, Edit, Delete
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { listProducts } from "../api/dashboard"; // listProducts fetches from /products

export default function AdminProductsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await listProducts();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = search ? (
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchCategory = categoryFilter !== "all" ? p.category === categoryFilter : true;
      const matchStatus = statusFilter !== "all" ? (p.status || "active") === statusFilter : true;
      
      return matchSearch && matchCategory && matchStatus;
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedProducts = filteredProducts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    let active = 0, inactive = 0, removed = 0;
    products.forEach(p => {
      if ((p.status || "active") === "active") active++;
      else if (p.status === "inactive") inactive++;
      else if (p.status === "removed") removed++;
    });
    return { total: products.length, active, inactive, removed };
  }, [products]);

  // Unique categories for dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // UI Helpers
  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case "moisturizer": return { color: "#8B6FC9", bg: "rgba(139, 111, 201, 0.12)" };
      case "sunscreen": return { color: "#FFA726", bg: "rgba(255, 167, 38, 0.12)" };
      case "face wash": return { color: "#42A5F5", bg: "rgba(66, 165, 245, 0.12)" };
      case "serum": return { color: "#E4749B", bg: "rgba(228, 116, 155, 0.12)" };
      case "toner": return { color: "#4CAF7D", bg: "rgba(76, 175, 125, 0.12)" };
      default: return { color: "#78909C", bg: "rgba(120, 144, 156, 0.12)" };
    }
  };

  const getCategoryLabel = (cat) => {
    if (!cat) return "Unknown";
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "active";
    if (s === "active") return { color: "#4CAF7D", bg: "rgba(76, 175, 125, 0.12)", dot: true };
    if (s === "pending") return { color: "#FFA726", bg: "rgba(255, 167, 38, 0.12)", dot: true };
    return { color: "#78909C", bg: "rgba(120, 144, 156, 0.12)", dot: true };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: "-", time: "-" };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatPrice = (price) => {
    if (price == null) return "-";
    const inrPrice = Math.round(price * 83);
    return `₹${inrPrice.toLocaleString('en-IN')}`;
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", pb: 4 }}>
      {/* Breadcrumbs */}
      <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mb: 1, fontWeight: 500 }}>
        Dashboard <span style={{ margin: "0 4px" }}>›</span> <span style={{ color: COLORS.textDark, fontWeight: 700 }}>Product Catalog</span>
      </Typography>

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>
            Product Catalog
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Manage all skincare products in the system. Add, update, or remove products from the catalog.
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
          Add New Product
        </Button>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Products", val: stats.total, desc: "All products in catalog", iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: "📋" },
          { label: "Active Products", val: stats.active, desc: "Currently available", iconColor: "#4CAF7D", bg: "rgba(76,175,125,0.1)", icon: "✓" },
          { label: "Inactive Products", val: stats.inactive, desc: "Temporarily disabled", iconColor: "#FFA726", bg: "rgba(255,167,38,0.1)", icon: "🕒" },
          { label: "Removed Products", val: stats.removed, desc: "Moved to trash", iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: "🗑️" }
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
          <InputBase placeholder="Search by product name, brand, category..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            size="small"
            displayEmpty
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 150, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {uniqueCategories.map(c => (
              <MenuItem key={c} value={c}>{getCategoryLabel(c)}</MenuItem>
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
            <MenuItem value="inactive">Inactive</MenuItem>
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
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>PRODUCT</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>CATEGORY</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>BRAND</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>PRICE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>STATUS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2 }}>ADDED ON</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, py: 2, textAlign: "center" }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No products found.</TableCell></TableRow>
                  ) : paginatedProducts.map((p) => {
                    const catColor = getCategoryColor(getCategoryLabel(p.category));
                    const sc = getStatusColor(p.status);
                    const dt = formatDate(p.created_at);
                    
                    // Simple initials for image placeholder if no image
                    const initials = p.name ? p.name.substring(0, 2).toUpperCase() : "?";

                    return (
                      <TableRow key={p.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ py: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            {p.image_url ? (
                              <Box component="img" src={p.image_url} alt={p.name} sx={{ width: 40, height: 40, borderRadius: "8px", objectFit: "cover", backgroundColor: "#F5F5F5", border: "1px solid "+COLORS.cardBorder }} />
                            ) : (
                              <Box sx={{ width: 40, height: 40, borderRadius: "8px", backgroundColor: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 14, fontWeight: 800, border: "1px solid "+COLORS.cardBorder }}>
                                {initials}
                              </Box>
                            )}
                            <Box>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textDark, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Typography>
                              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, fontFamily: "monospace" }}>{p.id ? p.id.split('-')[0].toUpperCase() : ""}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip label={getCategoryLabel(p.category)} size="small" sx={{ backgroundColor: catColor.bg, color: catColor.color, fontWeight: 700, fontSize: 11, borderRadius: "6px" }} />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 500 }}>{p.brand || "-"}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2, fontSize: 13, color: COLORS.textDark, fontWeight: 700 }}>
                          {formatPrice(p.price)}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip 
                            label={(p.status || "active").charAt(0).toUpperCase() + (p.status || "active").slice(1)} 
                            size="small" 
                            icon={sc.dot ? <Circle sx={{ fontSize: "8px !important", color: sc.color }} /> : null}
                            sx={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11, borderRadius: "6px", "& .MuiChip-icon": { ml: 1 } }} 
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark }}>{dt.date}</Typography>
                          <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>{dt.time}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2, textAlign: "center" }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton size="small" sx={{ color: COLORS.primary, backgroundColor: "rgba(139,111,201,0.1)", borderRadius: "6px" }}><Edit sx={{ fontSize: 16 }} /></IconButton>
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
              {paginatedProducts.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No products found.</Box>
              ) : paginatedProducts.map((p) => {
                const catColor = getCategoryColor(getCategoryLabel(p.category));
                const sc = getStatusColor(p.status);
                const initials = p.name ? p.name.substring(0, 2).toUpperCase() : "?";

                return (
                  <Box key={p.id} sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder, position: "relative" }}>
                    <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 12, right: 12 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{formatPrice(p.price)}</Typography>
                      <IconButton size="small" sx={{ p: 0.5 }}><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
                    </Stack>
                    
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      {p.image_url ? (
                        <Box component="img" src={p.image_url} alt={p.name} sx={{ width: 48, height: 48, borderRadius: "8px", objectFit: "cover", backgroundColor: "#F5F5F5", border: "1px solid "+COLORS.cardBorder }} />
                      ) : (
                        <Box sx={{ width: 48, height: 48, borderRadius: "8px", backgroundColor: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 14, fontWeight: 800, border: "1px solid "+COLORS.cardBorder }}>
                          {initials}
                        </Box>
                      )}
                      <Box sx={{ pr: 6 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>{p.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace" }}>{p.id ? p.id.split('-')[0].toUpperCase() : ""}</Typography>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                      <Chip label={getCategoryLabel(p.category)} size="small" sx={{ backgroundColor: catColor.bg, color: catColor.color, fontWeight: 700, fontSize: 10, borderRadius: "6px" }} />
                      <Chip 
                        label={(p.status || "active").charAt(0).toUpperCase() + (p.status || "active").slice(1)} 
                        size="small" 
                        sx={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 10, borderRadius: "6px" }} 
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ borderTop: "1px solid "+COLORS.cardBorder, pt: 1.5 }}>
                      <Button size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} sx={{ flex: 1, color: COLORS.primary, backgroundColor: "rgba(139,111,201,0.1)", borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>Edit</Button>
                      <Button size="small" startIcon={<Delete sx={{ fontSize: 14 }} />} sx={{ flex: 1, color: "#E4749B", backgroundColor: "rgba(228,116,155,0.1)", borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>Remove</Button>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Pagination */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>
              Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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
                <MenuItem value={24}>24 / page</MenuItem>
                <MenuItem value={50}>50 / page</MenuItem>
              </Select>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
}
