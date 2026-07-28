import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Box, Paper, Typography, Stack, TextField, InputAdornment, Button, Chip,
  Grid, IconButton, Divider, useMediaQuery, useTheme
} from "@mui/material";
import {
  Search, AutoAwesome, CheckCircle, WarningAmber, Cancel,
  BookmarkBorder, Bookmark, LocalPharmacy, Science, CameraAlt,
  Upload, FilterList, Clear, Star, ArrowForward, InfoOutlined
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { listProducts, getUserLatestAssessment } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";
const CARD_RADIUS = "20px";
const CARD_SHADOW = "0 2px 12px rgba(139,111,201,0.07)";

/* ================================================================
   INGREDIENT DATABASE
   ================================================================ */
const INGREDIENT_DATABASE = {
  niacinamide: {
    id: "niacinamide",
    name: "Niacinamide",
    inciName: "Niacinamide",
    category: "Active Ingredient",
    origin: "Synthetic / Vitamin B3",
    mw: "122.12 g/mol",
    alsoKnownAs: "Vitamin B3, Nicotinamide",
    properties: ["Water Soluble", "pH: 5.0 - 7.0", "Stable Ingredient"],
    safetyScore: 94,
    safetyRating: "Excellent",
    safetySub: "Very safe for most skin types",
    safetyHighlights: [
      { label: "Low Irritation Risk", ok: true },
      { label: "Non-Comedogenic", ok: true },
      { label: "Clinically Researched", ok: true },
      { label: "Suitable for Daily Use", ok: true }
    ],
    researchStrength: 5,
    publishedStudies: "120+",
    dermApproved: true,
    fda: "FDA Approved",
    summary: "Niacinamide is an excellent ingredient for your combination skin. It helps regulate oil production, minimize enlarged pores, fade dark spots, and strengthen your skin barrier without causing irritation.",
    whatItDoes: [
      { title: "Brightening",      icon: "✨", stars: 5 },
      { title: "Oil Control",      icon: "🧴", stars: 5 },
      { title: "Pore Minimizer",   icon: "🔬", stars: 4 },
      { title: "Barrier Repair",   icon: "🛡️", stars: 4 },
      { title: "Anti-Inflammatory",icon: "🌿", stars: 4 },
      { title: "Hydration",        icon: "💧", stars: 3 }
    ],
    compatibility: {
      goodFor: ["Acne, Oily Skin, Enlarged Pores", "Hyperpigmentation, Barrier Repair"],
      useCarefully: ["Sensitive Skin, Pregnancy"],
      avoidIf: ["Allergy to Niacinamide is rare (perform patch test if concerned)"]
    },
    bestPairings: ["Hyaluronic Acid", "Ceramides", "Zinc", "Peptides", "Panthenol"],
    avoidCombining: ["High Strength Vitamin C", "Strong AHA/BHA"]
  },
  hyaluronic_acid: {
    id: "hyaluronic_acid",
    name: "Hyaluronic Acid",
    inciName: "Sodium Hyaluronate",
    category: "Humectant",
    origin: "Biotechnology / Fermentation",
    mw: "50-2000 kDa",
    alsoKnownAs: "HA, Sodium Hyaluronate",
    properties: ["Water Soluble", "pH: 5.5 - 7.5", "Deep Hydrator"],
    safetyScore: 98,
    safetyRating: "Outstanding",
    safetySub: "Ultra-Safe & Universal",
    safetyHighlights: [
      { label: "Zero Irritation Risk", ok: true },
      { label: "Non-Comedogenic", ok: true },
      { label: "Deep Moisture Attraction", ok: true },
      { label: "Pregnancy Safe", ok: true }
    ],
    researchStrength: 5,
    publishedStudies: "200+",
    dermApproved: true,
    fda: "FDA Approved",
    summary: "Attracts up to 1000x its weight in water to plump, hydrate, and restore elastic moisture layers. Perfect for all skin types.",
    whatItDoes: [
      { title: "Deep Hydration", icon: "💧", stars: 5 },
      { title: "Plumping",       icon: "✨", stars: 5 },
      { title: "Barrier Support",icon: "🛡️", stars: 4 },
      { title: "Soothing",       icon: "🌿", stars: 4 }
    ],
    compatibility: {
      goodFor: ["All Skin Types", "Dehydrated Skin, Fine Lines"],
      useCarefully: ["Use on damp skin in dry climates"],
      avoidIf: ["None"]
    },
    bestPairings: ["Niacinamide", "Ceramides", "Vitamin C", "Peptides"],
    avoidCombining: ["None"]
  },
  retinol: {
    id: "retinol",
    name: "Retinol",
    inciName: "Retinol / Vitamin A",
    category: "Cellular Turnover",
    origin: "Synthetic Vitamin A",
    mw: "286.45 g/mol",
    alsoKnownAs: "Vitamin A, Retinoid",
    properties: ["Lipid Soluble", "pH: 5.5 - 6.5", "Potent Regenerator"],
    safetyScore: 78,
    safetyRating: "Use with Caution",
    safetySub: "Active Cell Renewal Agent",
    safetyHighlights: [
      { label: "May Cause Peeling Initially", ok: false },
      { label: "Increases Photosensitivity", ok: false },
      { label: "Requires Daily Sunscreen", ok: false },
      { label: "Avoid in Pregnancy", ok: false }
    ],
    researchStrength: 5,
    publishedStudies: "500+",
    dermApproved: true,
    fda: "FDA Approved",
    summary: "Gold standard for anti-aging and acne turnover. Stimulates collagen synthesis and refines skin texture over consistent use.",
    whatItDoes: [
      { title: "Anti Aging",     icon: "⌛", stars: 5 },
      { title: "Texture Repair", icon: "✨", stars: 5 },
      { title: "Acne Control",   icon: "🎯", stars: 4 }
    ],
    compatibility: {
      goodFor: ["Aging Skin, Fine Lines", "Acne Prone Skin"],
      useCarefully: ["Sensitive Skin — start with low %"],
      avoidIf: ["Pregnancy", "Active Eczema / Rosacea"]
    },
    bestPairings: ["Hyaluronic Acid", "Ceramides", "Niacinamide (Buffer)"],
    avoidCombining: ["AHA/BHA Acids", "Benzoyl Peroxide", "High Strength Vitamin C"]
  }
};

const POPULAR = ["Niacinamide", "Hyaluronic Acid", "Vitamin C", "Ceramides", "Salicylic Acid"];
const LOOKUP = { "niacinamide": "niacinamide", "hyaluronic acid": "hyaluronic_acid", "retinol": "retinol" };

/* ================================================================
   STAR ROW
   ================================================================ */
function Stars({ count, max = 5 }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} sx={{ fontSize: 11, color: i < count ? "#FFC107" : "#E8E0F0" }} />
      ))}
    </Stack>
  );
}

/* ================================================================
   CIRCULAR SAFETY SCORE
   ================================================================ */
function SafetyGauge({ score, size = 88, color }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const col = color || (score >= 90 ? COLORS.success : score >= 70 ? "#FFA726" : COLORS.danger);
  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F0EBF8" strokeWidth={8} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={8} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <Stack alignItems="center" sx={{ zIndex: 1 }}>
        <Typography sx={{ fontSize: size > 70 ? 20 : 14, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>{score}</Typography>
        <Typography sx={{ fontSize: 8.5, color: COLORS.textMuted, lineHeight: 1 }}>/100</Typography>
      </Stack>
    </Box>
  );
}

/* ================================================================
   PRODUCT CARD (Recommended)
   ================================================================ */
function RecommendedCard({ product, matchPct, navigate }) {
  return (
    <Paper elevation={0} sx={{
      borderRadius: "16px", border: CARD_BORDER, p: 1.75, minWidth: 150, maxWidth: 180,
      backgroundColor: CARD_BG, flexShrink: 0, cursor: "pointer",
      transition: "all 0.2s ease", "&:hover": { borderColor: COLORS.primary, boxShadow: "0 4px 14px rgba(139,111,201,0.12)" }
    }}>
      <Chip label={`${matchPct}% Match`} size="small"
        sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, mb: 1 }} />
      <Box sx={{ width: "100%", height: 80, borderRadius: "10px", backgroundColor: "#FAF8FC", overflow: "hidden", mb: 1 }}>
        <img src={product.image_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&auto=format&fit=crop&q=80"}
          alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.3, mb: 0.25 }}>{product.name}</Typography>
      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mb: 0.75 }}>By {product.brand || "Brand"}</Typography>
      {product.price && (
        <Typography sx={{ fontSize: 12, fontWeight: 900, color: COLORS.primaryDark, mb: 0.75 }}>₹{product.price}</Typography>
      )}
      <Button fullWidth size="small" variant="outlined" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 10, borderColor: COLORS.primary, color: COLORS.primary, py: 0.5 }}>
        View Product
      </Button>
    </Paper>
  );
}

/* ================================================================
   FALLBACK PRODUCT CARDS (when no DB products)
   ================================================================ */
const FALLBACK_PRODUCTS = [
  { id: 1, name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", price: "650", match: 98,
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&auto=format&fit=crop&q=80" },
  { id: 2, name: "CeraVe PM Facial Moisturizing Lotion", brand: "CeraVe", price: "1,699", match: 92,
    img: "https://images.unsplash.com/photo-1608248597263-0007999658b0?w=200&auto=format&fit=crop&q=80" },
  { id: 3, name: "La Roche-Posay Effaclar Duo+", brand: "La Roche-Posay", price: "1,949", match: 89,
    img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200&auto=format&fit=crop&q=80" },
  { id: 4, name: "Minimalist 10% Niacinamide Serum", brand: "Minimalist", price: "599", match: 95,
    img: "https://images.unsplash.com/photo-1617897903246-719242758050?w=200&auto=format&fit=crop&q=80" }
];

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function IngredientAnalyzerPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [query, setQuery] = useState("Niacinamide");
  const [selectedKey, setSelectedKey] = useState("niacinamide");
  const [recentSearches, setRecentSearches] = useState(["Niacinamide", "Hyaluronic Acid", "Vitamin C", "Ceramides", "Salicylic Acid"]);
  const [isSaved, setIsSaved] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      getUserLatestAssessment().catch(() => null),
      listProducts().catch(() => [])
    ]).then(([ass, prods]) => {
      setAssessment(ass);
      setDbProducts(prods || []);
    });
  }, []);

  const ingredient = useMemo(() => {
    const key = selectedKey.toLowerCase().replace(/\s+/g, "_");
    return INGREDIENT_DATABASE[key] || INGREDIENT_DATABASE.niacinamide;
  }, [selectedKey]);

  const handleSearch = () => {
    const key = Object.keys(LOOKUP).find(k => query.toLowerCase().includes(k));
    if (key) {
      setSelectedKey(LOOKUP[key]);
      if (!recentSearches.includes(query)) setRecentSearches(prev => [query, ...prev].slice(0, 6));
    }
  };

  const handleChipSearch = (label) => {
    setQuery(label);
    const key = Object.keys(LOOKUP).find(k => label.toLowerCase().includes(k));
    if (key) setSelectedKey(LOOKUP[key]);
  };

  const safetyColor = ingredient.safetyScore >= 90 ? COLORS.success : ingredient.safetyScore >= 70 ? "#FFA726" : COLORS.danger;

  const skinType = assessment?.skin_type || "Combination";
  const topConcern = assessment?.concerns || "Acne & Marks";

  // Filter products by the current ingredient
  const matchingProducts = dbProducts.filter(p => 
    p.ingredients && p.ingredients.some(ing => ing.toLowerCase().includes(ingredient.name.toLowerCase()))
  );
  
  const displayProducts = matchingProducts.length > 0 
    ? matchingProducts.slice(0, 4).map((p, i) => ({ ...p, match: [98, 92, 89, 85][i] || 80 }))
    : (dbProducts.length > 0 
        ? dbProducts.slice(0, 4).map((p, i) => ({ ...p, match: [75, 72, 69, 65][i] || 60 }))
        : FALLBACK_PRODUCTS);

  /* ================================================================
     LEFT PANEL (Main ingredient info)
     ================================================================ */
  const LeftPanel = () => (
    <Stack spacing={2.5}>

      {/* Ingredient Identity Card */}
      <Paper elevation={0} sx={{
        borderRadius: CARD_RADIUS, border: CARD_BORDER,
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 60%, #F5ECF6 100%)",
        p: { xs: 2, sm: 2.5 }, boxShadow: CARD_SHADOW
      }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-start" }} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
            {/* Molecule Icon */}
            <Box sx={{
              width: 60, height: 60, borderRadius: "18px",
              background: "linear-gradient(135deg, #E6DCF7 0%, #F5ECF6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 12px rgba(139,111,201,0.18)"
            }}>
              <Typography sx={{ fontSize: 26 }}>🧬</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5} sx={{ mb: 0.5 }}>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 21, sm: 25 }, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>
                  {ingredient.name}
                </Typography>
                {ingredient.dermApproved && (
                  <Chip label="✔ Dermatologist Approved" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />
                )}
              </Stack>
              <Stack spacing={0.4} sx={{ mt: 0.75 }}>
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
                  <strong style={{ color: COLORS.textDark }}>INCI:</strong> {ingredient.inciName}
                </Typography>
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
                  <strong style={{ color: COLORS.textDark }}>Also Known As:</strong> {ingredient.alsoKnownAs}
                </Typography>
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
                  <strong style={{ color: COLORS.textDark }}>Category:</strong> {ingredient.category} &nbsp;·&nbsp;
                  <strong style={{ color: COLORS.textDark }}>Origin:</strong> {ingredient.origin}
                  {ingredient.mw && <> &nbsp;·&nbsp; <strong style={{ color: COLORS.textDark }}>MW:</strong> {ingredient.mw}</>}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={() => setIsSaved(!isSaved)} size="small"
            sx={{ border: CARD_BORDER, flexShrink: 0, alignSelf: { xs: "flex-end", sm: "flex-start" } }}>
            {isSaved ? <Bookmark sx={{ fontSize: 18, color: COLORS.primary }} /> : <BookmarkBorder sx={{ fontSize: 18 }} />}
          </IconButton>
        </Stack>

        {/* Properties Chips */}
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 2 }}>
          {ingredient.properties.map((p, i) => (
            <Chip key={i} label={p} size="small"
              sx={{ fontSize: 11, fontWeight: 700, height: 24, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark, border: "1px solid rgba(139,111,201,0.2)" }} />
          ))}
        </Stack>
      </Paper>

      {/* Two-column: Benefits + Compatibility */}
      <Grid container spacing={2.5}>

        {/* Benefits for Your Skin — Icon Tiles Grid */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, height: "100%", boxShadow: CARD_SHADOW }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Benefits for Your Skin</Typography>
              <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 12 }} />}
                sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, color: COLORS.primaryDark }}>View All</Button>
            </Stack>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1.25
            }}>
              {ingredient.whatItDoes.map((b, i) => {
                const bgColors = ["rgba(255,167,38,0.1)","rgba(139,111,201,0.1)","rgba(76,175,125,0.1)","rgba(66,165,245,0.1)","rgba(129,199,132,0.1)","rgba(100,181,246,0.1)"];
                const iconColors = ["#FFA726", COLORS.primary, COLORS.success, "#42A5F5", "#81C784", "#64B5F6"];
                return (
                  <Box key={i} sx={{
                    p: 1.25, borderRadius: "14px",
                    backgroundColor: bgColors[i % bgColors.length],
                    border: "1px solid rgba(139,111,201,0.08)"
                  }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography sx={{ fontSize: 18 }}>{b.icon}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.2 }}>{b.title}</Typography>
                    </Stack>
                    <Stars count={b.stars} />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Compatibility — Colored Rows */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, height: "100%", boxShadow: CARD_SHADOW }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>Compatibility</Typography>
            <Stack spacing={1.5}>

              {/* Good For */}
              <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(76,175,125,0.06)", border: "1px solid rgba(76,175,125,0.15)" }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <CheckCircle sx={{ fontSize: 16, color: COLORS.success }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.success }}>Good For</Typography>
                </Stack>
                {ingredient.compatibility.goodFor.map((g, i) => (
                  <Typography key={i} sx={{ fontSize: 11.5, color: COLORS.textDark, lineHeight: 1.5, ml: 0.5 }}>• {g}</Typography>
                ))}
              </Box>

              {/* Use Carefully */}
              <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(255,167,38,0.06)", border: "1px solid rgba(255,167,38,0.2)" }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <WarningAmber sx={{ fontSize: 16, color: "#FFA726" }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#FFA726" }}>Use Carefully</Typography>
                </Stack>
                {ingredient.compatibility.useCarefully.map((u, i) => (
                  <Typography key={i} sx={{ fontSize: 11.5, color: COLORS.textDark, lineHeight: 1.5, ml: 0.5 }}>• {u}</Typography>
                ))}
              </Box>

              {/* Avoid If */}
              <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(228,116,155,0.06)", border: "1px solid rgba(228,116,155,0.15)" }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <Cancel sx={{ fontSize: 16, color: COLORS.danger }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.danger }}>Avoid If</Typography>
                </Stack>
                {ingredient.compatibility.avoidIf.map((a, i) => (
                  <Typography key={i} sx={{ fontSize: 11.5, color: COLORS.textDark, lineHeight: 1.5, ml: 0.5 }}>• {a}</Typography>
                ))}
              </Box>

            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Recommended Products */}
      <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Recommended Products for You</Typography>
            <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>
              Based on your skin profile: {skinType}, {topConcern}
            </Typography>
          </Box>
          <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 12 }} />} onClick={() => navigate("/user/products")}
            sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, color: COLORS.primaryDark }}>
            View All Products
          </Button>
        </Stack>

        <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#EAE4F2", borderRadius: 4 } }}>
          {displayProducts.map((prod) => (
            <Paper
              key={prod.id}
              elevation={0}
              onClick={() => navigate("/user/products")}
              sx={{
                borderRadius: "16px", border: CARD_BORDER, p: 1.75,
                minWidth: 155, maxWidth: 175, flexShrink: 0, cursor: "pointer",
                backgroundColor: CARD_BG, transition: "all 0.2s ease",
                "&:hover": { borderColor: COLORS.primary, boxShadow: "0 4px 14px rgba(139,111,201,0.12)" }
              }}
            >
              <Chip label={`${prod.match}% Match`} size="small"
                sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, mb: 1 }} />
              <Box sx={{ width: "100%", height: 80, borderRadius: "10px", backgroundColor: "#FAF8FC", overflow: "hidden", mb: 1 }}>
                <img
                  src={prod.image_url || prod.img || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&auto=format&fit=crop&q=80"}
                  alt={prod.name}
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&auto=format&fit=crop&q=80"; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.3, mb: 0.25 }}>{prod.name}</Typography>
              <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mb: 0.75 }}>By {prod.brand || "Brand"}</Typography>
              {prod.price && (
                <Typography sx={{ fontSize: 12, fontWeight: 900, color: COLORS.primaryDark, mb: 0.75 }}>₹{prod.price}</Typography>
              )}
              <Button fullWidth size="small" variant="outlined"
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 10, borderColor: COLORS.primary, color: COLORS.primary, py: 0.5 }}>
                View Product
              </Button>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Stack>
  );

  /* ================================================================
     RIGHT PANEL (Safety score, science, AI insight)
     ================================================================ */
  const RightPanel = () => (
    <Stack spacing={2.5}>

      {/* AI Safety Score */}
      <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>AI Safety Score</Typography>
          <InfoOutlined sx={{ fontSize: 16, color: COLORS.textMuted }} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <SafetyGauge score={ingredient.safetyScore} size={88} />
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: safetyColor, lineHeight: 1 }}>
              {ingredient.safetyRating}
            </Typography>
            <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mt: 0.25 }}>{ingredient.safetySub}</Typography>
          </Box>
        </Stack>

        <Stack spacing={0.75}>
          {ingredient.safetyHighlights.map((h, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <CheckCircle sx={{ fontSize: 14, color: h.ok ? COLORS.success : "#FFA726" }} />
              <Typography sx={{ fontSize: 11.5, color: COLORS.textDark, fontWeight: 600 }}>{h.label}</Typography>
            </Stack>
          ))}
        </Stack>

        <Button size="small" sx={{ mt: 1.5, textTransform: "none", fontSize: 10.5, fontWeight: 700, color: COLORS.primary, p: 0 }}>
          How is this calculated? →
        </Button>
      </Paper>

      {/* Scientific Evidence */}
      <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 1.75 }}>Scientific Evidence</Typography>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>Research Strength</Typography>
            <Stars count={ingredient.researchStrength} />
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>Published Studies</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.primaryDark }}>{ingredient.publishedStudies}</Typography>
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>Dermatologist</Typography>
            <Chip label="Recommended" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(76,175,125,0.12)", color: COLORS.success }} />
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>Regulatory Status</Typography>
            <Chip label={ingredient.fda} size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark }} />
          </Stack>
        </Stack>
      </Paper>

      {/* AI Insight */}
      <Paper elevation={0} sx={{
        borderRadius: CARD_RADIUS, border: "1px solid rgba(139,111,201,0.2)",
        background: "linear-gradient(135deg, #FAF8FF 0%, #F5ECF6 100%)", p: 2.5, boxShadow: CARD_SHADOW
      }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <AutoAwesome sx={{ fontSize: 16, color: COLORS.primary }} />
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.primaryDark }}>AI Insight</Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, color: COLORS.textDark, lineHeight: 1.6 }}>
          "{ingredient.summary}"
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
          <Chip label={`Skin: ${skinType}`} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, backgroundColor: "#FFF", border: CARD_BORDER }} />
          <Chip label={topConcern} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, backgroundColor: "#FFF", border: CARD_BORDER }} />
        </Stack>
        <Button size="small" sx={{ mt: 1.25, textTransform: "none", fontSize: 10.5, fontWeight: 700, color: COLORS.primary, p: 0 }}>
          How is this calculated? →
        </Button>
      </Paper>

      {/* Best Pairings */}
      <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 1.25 }}>✅ Pairs Well With</Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {ingredient.bestPairings.map((p, i) => (
            <Chip key={i} label={p} size="small" onClick={() => handleChipSearch(p)}
              sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(76,175,125,0.1)", color: COLORS.success, cursor: "pointer" }} />
          ))}
        </Stack>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mt: 2, mb: 1.25 }}>⚠️ Avoid Combining</Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {ingredient.avoidCombining.map((a, i) => (
            <Chip key={i} label={a} size="small"
              sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(228,116,155,0.1)", color: COLORS.danger }} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Stack spacing={2.5}>

          {/* ============================================================
              ROW 1 — HEADER
              ============================================================ */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark }}>
                  Ingredient Analyzer
                </Typography>
                <AutoAwesome sx={{ fontSize: 22, color: COLORS.primary }} />
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, mt: 0.25 }}>
                Discover the science behind skincare ingredients and their impact on your skin.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined" size="small" startIcon={<CameraAlt sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, backgroundColor: CARD_BG, "&:hover": { borderColor: COLORS.primary } }}
              >
                Scan Product
              </Button>
              <Button
                variant="outlined" size="small" startIcon={<Upload sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: COLORS.cardBorder, color: COLORS.textDark, backgroundColor: CARD_BG, "&:hover": { borderColor: COLORS.primary } }}
              >
                Upload List
              </Button>
            </Stack>
          </Stack>

          {/* ============================================================
              ROW 2 — SEARCH BAR
              ============================================================ */}
          <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2, boxShadow: CARD_SHADOW }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search ingredient (e.g. Niacinamide, Hyaluronic Acid, Retinol)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "12px", fontSize: 13, backgroundColor: "#FAF8FC" }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ background: COLORS.brandGradient, borderRadius: "12px", px: { xs: "auto", sm: 4 }, textTransform: "none", fontWeight: 800, fontSize: 14, flexShrink: 0, minWidth: 100, boxShadow: "0 4px 14px rgba(139,111,201,0.3)" }}
              >
                Search
              </Button>
            </Stack>

            {/* Recent Searches */}
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>Recent Searches:</Typography>
              {recentSearches.map((s, i) => (
                <Chip
                  key={i}
                  label={s}
                  size="small"
                  onClick={() => handleChipSearch(s)}
                  sx={{ fontSize: 11, fontWeight: 700, height: 22, backgroundColor: "#FAF8FC", border: CARD_BORDER, cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(139,111,201,0.08)", borderColor: COLORS.primary } }}
                />
              ))}
              <Button size="small" onClick={() => setRecentSearches([])}
                sx={{ fontSize: 10.5, textTransform: "none", color: COLORS.textMuted, fontWeight: 700, ml: "auto", "&:hover": { color: COLORS.danger } }}>
                Clear All
              </Button>
            </Stack>
          </Paper>

          {/* ============================================================
              ROW 3 — MAIN CONTENT: LEFT + RIGHT
              ============================================================ */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 320px" },
            gap: 2.5,
            alignItems: "start"
          }}>
            <LeftPanel />
            <RightPanel />
          </Box>

        </Stack>
      </Box>
    </motion.div>
  );
}
