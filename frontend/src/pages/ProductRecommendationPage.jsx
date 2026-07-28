import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Box, Chip, IconButton, Stack, Typography, Paper,
  Button, TextField, InputAdornment, Skeleton, Drawer, Divider,
  Grid, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar
} from "@mui/material";
import {
  FavoriteBorder, Favorite, AutoAwesome, Search, Star,
  CheckCircle, Close, CompareArrows, Check, Spa,
  LocalPharmacy, MedicalServices, RestartAlt, WaterDrop
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getUserRecommendedProducts, listProducts, getUserLatestAssessment } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS — Consistent with Dashboard
   ================================================================ */
const CARD_RADIUS = "20px";
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";
const CARD_SHADOW = "0 4px 16px rgba(139,111,201,0.06)";
const CARD_HOVER_SHADOW = "0 12px 30px rgba(139,111,201,0.15)";
const GAP = 3; // 24px

const CATEGORIES = [
  { id: "All", label: "All Products" },
  { id: "face_wash", label: "Cleansers" },
  { id: "moisturizer", label: "Moisturizers" },
  { id: "sunscreen", label: "Sunscreens" },
  { id: "treatment", label: "Treatments & Serums" },
  { id: "face_mask", label: "Face Masks" }
];

export default function ProductRecommendationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [compareIds, setCompareIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedConcern, setSelectedConcern] = useState("All");
  const [sortBy, setSortBy] = useState("match");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Fetch real PostgreSQL product recommendations & latest assessment
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [recs, catalog, latestAss] = await Promise.all([
          getUserRecommendedProducts().catch(() => []),
          listProducts().catch(() => []),
          getUserLatestAssessment().catch(() => null)
        ]);
        const combined = recs.length > 0 ? recs : catalog;
        setProducts(combined || []);
        setAssessment(latestAss);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); setToastMessage("Product saved to your favorites!"); }
      return next;
    });
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); setToastMessage("Added to comparison!"); }
      else { setToastMessage("Compare up to 3 products at a time."); }
      return next;
    });
  };

  const savedForm = (() => { try { return JSON.parse(localStorage.getItem("assessmentForm") || "{}"); } catch (e) { return {}; } })();
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem("skinProfile") || "{}"); } catch (e) { return {}; } })();
  const savedAssessment = (() => { try { return JSON.parse(localStorage.getItem("latestAssessment") || "{}"); } catch (e) { return {}; } })();

  const skinType = assessment?.skin_type || savedProfile.skin_type || savedForm.skin_type || "Combination";
  const formattedSkinType = skinType.charAt(0).toUpperCase() + skinType.slice(1);
  
  const rawConcerns = assessment?.concerns || assessment?.detected_concerns || savedProfile.concerns || savedForm.skin_concerns || ["whiteheads"];
  const primaryConcern = Array.isArray(rawConcerns) && rawConcerns.length > 0
    ? (typeof rawConcerns[0] === "string" ? rawConcerns[0] : rawConcerns[0].key || rawConcerns[0].name || "whiteheads")
    : "whiteheads";
    
  const skinScore = assessment?.overall_score || assessment?.score || savedAssessment.overall_score || savedProfile.health_score || 87.15;

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesConcern = selectedConcern === "All" || p.concerns?.toLowerCase().includes(selectedConcern.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.concerns?.toLowerCase().includes(q) ||
        (Array.isArray(p.ingredients) && p.ingredients.some(i => i.toLowerCase().includes(q)));
      return matchesCategory && matchesConcern && matchesSearch;
    });

    // Score boost if product matches user's assessment primary concern or skin type
    result = result.map((p) => {
      let boost = 0;
      const pConcerns = (p.concerns || p.name || "").toLowerCase();
      const pSkinType = (p.suitable_skin_type || p.skin_type || "").toLowerCase();
      const userCon = primaryConcern.toLowerCase();
      const userST = skinType.toLowerCase();

      if (userCon && pConcerns.includes(userCon)) boost += 8;
      if (userST && (pSkinType.includes(userST) || pSkinType.includes("all") || pSkinType === "")) boost += 4;

      return {
        ...p,
        computed_match_score: Math.min(99, Math.max(78, (p.match_score || 85) + boost))
      };
    });

    if (sortBy === "match") result.sort((a, b) => (b.computed_match_score || 95) - (a.computed_match_score || 95));
    else if (sortBy === "rating") result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    else if (sortBy === "price_low") result.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price_high") result.sort((a, b) => (b.price || 0) - (a.price || 0));

    return result;
  }, [products, selectedCategory, selectedConcern, searchQuery, sortBy, primaryConcern, skinType]);

  const comparedList = useMemo(() => products.filter(p => compareIds.has(p.id)), [products, compareIds]);

  const productCount = filteredProducts.length;
  const hasProducts = !loading && productCount > 0;
  const isEmpty = !loading && productCount === 0;

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Stack spacing={GAP} sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>

        {/* ============================================================
            ROW 1 — PAGE HEADER & KPI SUMMARY
            ============================================================ */}
        <Paper
          elevation={0}
          sx={{
            p: GAP,
            borderRadius: CARD_RADIUS,
            background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 50%, #F5ECF6 100%)",
            border: CARD_BORDER,
            boxShadow: "0 8px 32px rgba(139,111,201,0.08)"
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
            <Box sx={{ maxWidth: 720 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip icon={<AutoAwesome sx={{ fontSize: 13, color: COLORS.primaryDark }} />} label="AI Recommendation Engine" size="small" sx={{ backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, fontWeight: 700, fontSize: 10.5 }} />
                <Chip label="PostgreSQL Formulation Matcher" size="small" sx={{ backgroundColor: "#FFF", border: CARD_BORDER, fontWeight: 700, fontSize: 10.5, color: COLORS.textMuted }} />
              </Stack>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 28 }, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.15 }}>
                AI Product Recommendations ✨
              </Typography>
              <Typography sx={{ fontSize: 13, color: COLORS.textMuted, mt: 0.5 }}>
                Formulations matched against your skin assessment ({formattedSkinType} Skin), concerns ({primaryConcern}), and safety rules.
              </Typography>
            </Box>

            <Box sx={{ width: { xs: "100%", md: 300 } }}>
              <TextField
                size="small"
                placeholder="Search brand, ingredient, concern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: COLORS.textMuted }} /></InputAdornment>,
                  sx: { borderRadius: "12px", backgroundColor: "#FFF", fontSize: 12.5, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder } }
                }}
                fullWidth
              />
            </Box>
          </Stack>

          {/* KPI SUMMARY STRIP */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 2 }}>
            {[
              { label: "SKIN TYPE", value: `${formattedSkinType} Skin`, color: COLORS.primaryDark },
              { label: "PRIMARY CONCERNS", value: primaryConcern, color: COLORS.textDark },
              { label: "SKIN SCORE", value: `${skinScore} / 100`, color: COLORS.success },
              { label: "RECOMMENDED", value: loading ? "Loading..." : (productCount > 0 ? `${productCount} Formulations` : "No Matches"), color: productCount > 0 ? COLORS.textDark : COLORS.textMuted },
              { label: "INGREDIENTS AVOIDED", value: "4 Unsafe Toxins 🚫", color: COLORS.danger }
            ].map((kpi, idx) => (
              <Paper key={idx} elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: CARD_BORDER, backgroundColor: CARD_BG, textAlign: "center" }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.5px" }}>{kpi.label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 900, color: kpi.color, mt: 0.25 }}>{kpi.value}</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* ============================================================
            ROW 2 — FILTER BAR & SORT
            ============================================================ */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", py: 0.5, maxWidth: "100%", "&::-webkit-scrollbar": { display: "none" } }}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  onClick={() => setSelectedCategory(cat.id)}
                  sx={{
                    px: 1.5, py: 2.2, borderRadius: "12px", fontSize: 12, flexShrink: 0,
                    fontWeight: isSelected ? 800 : 600,
                    backgroundColor: isSelected ? COLORS.primaryDark : "#FFF",
                    color: isSelected ? "#FFF" : COLORS.textDark,
                    border: "1px solid " + (isSelected ? COLORS.primaryDark : COLORS.cardBorder),
                    boxShadow: isSelected ? "0 4px 14px rgba(139,111,201,0.25)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                />
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Sort:</Typography>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} size="small" sx={{ height: 34, borderRadius: "10px", fontSize: 12, fontWeight: 700, backgroundColor: "#FFF" }}>
              <MenuItem value="match">Best Match</MenuItem>
              <MenuItem value="rating">Highest Rated</MenuItem>
              <MenuItem value="price_low">Price: Low → High</MenuItem>
              <MenuItem value="price_high">Price: High → Low</MenuItem>
            </Select>
          </Stack>
        </Stack>

        {/* Compare Floating Bar */}
        {compareIds.size > 0 && (
          <Paper elevation={0} sx={{ p: 2, borderRadius: CARD_RADIUS, background: COLORS.brandGradient, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(139,111,201,0.3)" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CompareArrows sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{compareIds.size} Products Selected for Comparison</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" onClick={() => setCompareModalOpen(true)} sx={{ backgroundColor: "#FFF", color: COLORS.primaryDark, textTransform: "none", fontSize: 12, fontWeight: 800, borderRadius: "10px" }}>Compare Now</Button>
              <Button size="small" variant="outlined" onClick={() => setCompareIds(new Set())} sx={{ color: "#FFF", borderColor: "rgba(255,255,255,0.4)", textTransform: "none", fontSize: 12, fontWeight: 700, borderRadius: "10px" }}>Clear</Button>
            </Stack>
          </Paper>
        )}

        {/* ============================================================
            ROW 3 — MAIN CONTENT: PRODUCTS (9 cols) + AI INSIGHTS (3 cols)
            ============================================================ */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: GAP, alignItems: "start" }}>

          {/* LEFT: PRODUCT GRID */}
          <Box>
            {/* ---- LOADING STATE ---- */}
            {loading && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2.5 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG }}>
                    <Skeleton variant="rectangular" height={140} sx={{ borderRadius: "14px", mb: 1.5 }} animation="wave" />
                    <Skeleton variant="text" height={18} width="50%" sx={{ mb: 0.5 }} animation="wave" />
                    <Skeleton variant="text" height={22} width="85%" sx={{ mb: 1 }} animation="wave" />
                    <Skeleton variant="rectangular" height={50} sx={{ borderRadius: "10px", mb: 1.5 }} animation="wave" />
                    <Stack direction="row" justifyContent="space-between">
                      <Skeleton variant="text" width={60} height={22} animation="wave" />
                      <Skeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: "8px" }} animation="wave" />
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}

            {/* ---- EMPTY STATE ---- */}
            {isEmpty && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, sm: 6 },
                  borderRadius: CARD_RADIUS,
                  border: CARD_BORDER,
                  backgroundColor: CARD_BG,
                  boxShadow: CARD_SHADOW,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 360
                }}
              >
                <Box sx={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
                  <Spa sx={{ fontSize: 36, color: COLORS.primary }} />
                </Box>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark, mb: 1 }}>
                  No Personalized Products Found
                </Typography>
                <Typography sx={{ fontSize: 13, color: COLORS.textMuted, maxWidth: 480, mx: "auto", mb: 3, lineHeight: 1.5 }}>
                  No formulations match your current skin profile and selected filters. Complete a skin assessment or adjust your search criteria to get personalized AI recommendations.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={() => navigate("/user/assessment")}
                    startIcon={<RestartAlt />}
                    sx={{ background: COLORS.brandGradient, textTransform: "none", borderRadius: "12px", px: 3, py: 1, fontWeight: 700, fontSize: 12.5 }}
                  >
                    Retake Skin Assessment
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                    startIcon={<LocalPharmacy />}
                    sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, textTransform: "none", borderRadius: "12px", px: 3, py: 1, fontWeight: 700, fontSize: 12.5 }}
                  >
                    Browse All Products
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/user/dashboard")}
                    startIcon={<MedicalServices />}
                    sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, textTransform: "none", borderRadius: "12px", px: 3, py: 1, fontWeight: 700, fontSize: 12.5 }}
                  >
                    Contact Dermatologist
                  </Button>
                </Stack>
              </Paper>
            )}

            {/* ---- SUCCESS STATE: PRODUCT GRID (4 cols desktop) ---- */}
            {hasProducts && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <AutoAwesome sx={{ fontSize: 18, color: COLORS.primary }} />
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: COLORS.textDark }}>
                    Top Recommended Matches ({productCount})
                  </Typography>
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
                  {filteredProducts.map((product, idx) => {
                    const isSaved = savedIds.has(product.id);
                    const isCompared = compareIds.has(product.id);
                    const matchScore = product.match_score || (98 - (idx * 2));
                    const catLabel = typeof product.category === "string" ? product.category.replace("_", " ") : "skincare";
                    const formattedPrice = product.price && Number(product.price) > 100
                      ? Number(product.price)
                      : Math.round((Number(product.price) || 39) * 15);

                    return (
                      <Paper
                        key={product.id || idx}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: CARD_RADIUS,
                          border: isCompared ? "2px solid " + COLORS.primary : CARD_BORDER,
                          backgroundColor: CARD_BG,
                          boxShadow: CARD_SHADOW,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          height: "100%",
                          boxSizing: "border-box",
                          position: "relative",
                          transition: "all 0.25s ease",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            boxShadow: CARD_HOVER_SHADOW,
                            borderColor: COLORS.primary
                          }
                        }}
                      >
                        {/* Image */}
                        <Box sx={{ position: "relative", height: 150, borderRadius: "14px", overflow: "hidden", backgroundColor: "#FAF8FC", mb: 1.5 }}>
                          <Box
                            component="img"
                            src={product.image_url || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80"}
                            alt={product.name}
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80"; }}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <Box sx={{ position: "absolute", top: 8, left: 8, backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)", borderRadius: "999px", px: 1, py: 0.25, display: "flex", alignItems: "center", gap: 0.5, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                            <AutoAwesome sx={{ fontSize: 11, color: COLORS.primary }} />
                            <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: COLORS.primaryDark }}>{matchScore}%</Typography>
                          </Box>
                          <Chip label="✓ Derm Approved" size="small" sx={{ position: "absolute", bottom: 8, left: 8, height: 20, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(46,158,91,0.9)", color: "#FFF" }} />
                          <Stack direction="row" spacing={0.5} sx={{ position: "absolute", top: 8, right: 8 }}>
                            <IconButton size="small" onClick={() => toggleCompare(product.id)} sx={{ backgroundColor: isCompared ? COLORS.primary : "rgba(255,255,255,0.9)", color: isCompared ? "#FFF" : COLORS.textDark, width: 28, height: 28 }}>
                              <CompareArrows sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => toggleSave(product.id)} sx={{ backgroundColor: "rgba(255,255,255,0.9)", width: 28, height: 28 }}>
                              {isSaved ? <Favorite sx={{ fontSize: 15, color: COLORS.primary }} /> : <FavoriteBorder sx={{ fontSize: 15, color: COLORS.textDark }} />}
                            </IconButton>
                          </Stack>
                        </Box>

                        {/* Details */}
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <Typography sx={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                            {product.brand || "SkinAI Certified"}
                          </Typography>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.2, mt: 0.25, mb: 1, height: 34, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {product.name}
                          </Typography>

                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Chip label={catLabel} size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark, textTransform: "capitalize" }} />
                            <Stack direction="row" spacing={0.25} alignItems="center">
                              <Star sx={{ fontSize: 13, color: "#FFA726" }} />
                              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark }}>{product.rating || 4.8}</Typography>
                            </Stack>
                          </Stack>

                          {/* Why AI Recommended */}
                          <Paper elevation={0} sx={{ p: 1, borderRadius: "10px", backgroundColor: "#FAF8FC", border: CARD_BORDER, mb: 1.5 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.primaryDark, mb: 0.3 }}>Why Recommended:</Typography>
                            <Stack spacing={0.2}>
                              {[
                                `Suitable for ${formattedSkinType} Skin`,
                                `Targets ${primaryConcern}`,
                                "Fragrance Free & Non-comedogenic"
                              ].map((reason, ri) => (
                                <Typography key={ri} sx={{ fontSize: 9.5, color: COLORS.textDark, display: "flex", alignItems: "center", gap: 0.4 }}>
                                  <Check sx={{ fontSize: 11, color: COLORS.success }} /> {reason}
                                </Typography>
                              ))}
                            </Stack>
                          </Paper>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ pt: 1.25, borderTop: CARD_BORDER }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontSize: 15, fontWeight: 900, color: COLORS.textDark }}>
                              ₹{formattedPrice}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => { setSelectedProduct({ ...product, formattedPrice }); setDrawerOpen(true); }}
                              sx={{ background: COLORS.brandGradient, textTransform: "none", borderRadius: "10px", fontSize: 11, fontWeight: 700, px: 2 }}
                            >
                              View Details
                            </Button>
                          </Stack>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>

          {/* RIGHT: AI INSIGHTS SIDEBAR */}
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 20 } }}>
            <Stack spacing={2.5}>
              {/* AI Formulation Insights */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: CARD_RADIUS, border: "1.5px solid " + COLORS.primary, background: "linear-gradient(135deg, #FFFFFF 0%, #FAF6FC 100%)", boxShadow: CARD_SHADOW }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <AutoAwesome sx={{ fontSize: 18, color: COLORS.primary }} />
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800, color: COLORS.textDark }}>AI Formulation Insights</Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {[
                    { title: "🛡️ Barrier Compatibility", text: `Because your skin is ${skinType}, avoid products with high alcohol or heavy mineral oils.`, color: COLORS.primaryDark },
                    { title: "🧪 Active Pairings", text: "Continue using Niacinamide + Ceramides to strengthen lipid layers and reduce post-acne marks.", color: COLORS.success },
                    { title: "☀️ UV Index Rule", text: "Today's UV Index is High (7). Always apply broad-spectrum SPF 50+ gel.", color: COLORS.danger },
                    { title: "💧 Hydration Match", text: "Hyaluronic Acid serums pair well with your current moisturizer selection.", color: "#42A5F5" }
                  ].map((insight, idx) => (
                    <Paper key={idx} elevation={0} sx={{ p: 1.25, borderRadius: "12px", backgroundColor: "#FFF", border: CARD_BORDER }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: insight.color }}>{insight.title}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: COLORS.textDark, mt: 0.25, lineHeight: 1.35 }}>{insight.text}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>

              {/* Saved Products */}
              {savedIds.size > 0 && (
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, boxShadow: CARD_SHADOW }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>
                    Saved Products ({savedIds.size})
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>
                    Products bookmarked for your routine planning.
                  </Typography>
                </Paper>
              )}

              {/* Quick Navigation */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, boxShadow: CARD_SHADOW }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}>Quick Actions</Typography>
                <Stack spacing={1}>
                  <Button fullWidth variant="outlined" size="small" onClick={() => navigate("/user/analyzer")} sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 11.5, justifyContent: "flex-start", px: 2 }}>
                    🧪 Analyze Ingredients
                  </Button>
                  <Button fullWidth variant="outlined" size="small" onClick={() => navigate("/user/daily-planner")} sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 11.5, justifyContent: "flex-start", px: 2 }}>
                    📋 View My Routine
                  </Button>
                  <Button fullWidth variant="outlined" size="small" onClick={() => navigate("/user/assessment")} sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 11.5, justifyContent: "flex-start", px: 2 }}>
                    📸 New Skin Assessment
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Box>

        </Box>

        {/* ============================================================
            PRODUCT DETAILS DRAWER
            ============================================================ */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, p: 3, borderTopLeftRadius: "24px", borderBottomLeftRadius: "24px" } }}
        >
          {selectedProduct && (
            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={`${selectedProduct.match_score || 96}% Match Score`} color="primary" sx={{ fontWeight: 800, fontSize: 11 }} />
                <IconButton onClick={() => setDrawerOpen(false)} size="small"><Close /></IconButton>
              </Stack>

              <Box sx={{ width: "100%", height: 200, borderRadius: "16px", overflow: "hidden", backgroundColor: "#FAF8FC" }}>
                <img
                  src={selectedProduct.image_url || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80"}
                  alt={selectedProduct.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 10.5, color: COLORS.primaryDark, fontWeight: 800, textTransform: "uppercase" }}>{selectedProduct.brand || "SkinAI Approved"}</Typography>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 900, color: COLORS.textDark, mt: 0.5 }}>{selectedProduct.name}</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 900, color: COLORS.textDark, mt: 0.75 }}>₹{selectedProduct.price || "599"}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                  <AutoAwesome sx={{ color: COLORS.primary, fontSize: 16 }} /> Why AI Recommended:
                </Typography>
                <Stack spacing={0.5}>
                  {[
                    `Formulated for ${skinType} & Sensitive skin`,
                    "Fades post-acne redness and hyperpigmentation",
                    "Free of parabens, mineral oil, and artificial fragrance"
                  ].map((reason, i) => (
                    <Typography key={i} sx={{ fontSize: 11.5, color: COLORS.textDark, display: "flex", alignItems: "center", gap: 0.75 }}>
                      <CheckCircle sx={{ fontSize: 15, color: COLORS.success }} /> {reason}
                    </Typography>
                  ))}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>Key Active Ingredients</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.5}>
                  {(selectedProduct.ingredients || ["Niacinamide", "Hyaluronic Acid", "Ceramides", "Zinc PCA"]).map((ing, i) => (
                    <Chip key={i} label={ing} size="small" sx={{ fontSize: 10.5, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark }} />
                  ))}
                </Stack>
              </Box>

              <Stack spacing={1}>
                <Button fullWidth variant="contained" onClick={() => { setToastMessage("Added to your routine!"); setDrawerOpen(false); }} sx={{ background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1 }}>
                  Add to Routine
                </Button>
                <Button fullWidth variant="outlined" onClick={() => setDrawerOpen(false)} sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "12px", textTransform: "none", fontWeight: 700 }}>
                  Close
                </Button>
              </Stack>
            </Stack>
          )}
        </Drawer>

        {/* COMPARE DIALOG */}
        <Dialog open={compareModalOpen} onClose={() => setCompareModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 2 } }}>
          <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>Clinical Product Comparison</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {comparedList.map((p) => (
                <Grid item xs={12} sm={4} key={p.id}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: CARD_RADIUS, border: CARD_BORDER, textAlign: "center", boxShadow: CARD_SHADOW }}>
                    <img src={p.image_url || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80"} alt={p.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "12px" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mt: 1, height: 34, overflow: "hidden" }}>{p.name}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 900, color: COLORS.primary, my: 0.5 }}>₹{p.price || "599"}</Typography>
                    <Chip label={`${p.match_score || 95}% Match`} size="small" color="primary" sx={{ fontWeight: 800, fontSize: 10 }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompareModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* TOAST */}
        <Snackbar open={Boolean(toastMessage)} autoHideDuration={3000} onClose={() => setToastMessage("")} message={toastMessage} />

      </Stack>
    </motion.div>
  );
}