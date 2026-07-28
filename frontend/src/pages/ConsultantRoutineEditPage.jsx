import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Paper, Grid, MenuItem, Select, TextField, Skeleton, Drawer, Chip, InputAdornment
} from "@mui/material";
import {
  ArrowBack, AutoAwesome, Search, FilterList, Star, Close, DragIndicator,
  DeleteOutlined, Add, FileCopyOutlined, MoreVert, CheckCircle, Cancel,
  WbSunnyOutlined, NightsStayOutlined, AccessTime, TrackChanges, CalendarToday,
  MedicalServicesOutlined, ShoppingBagOutlined, FormatBold, FormatItalic,
  FormatUnderlined, FormatListBulleted, FormatListNumbered, Link, Code,
  VisibilityOutlined, SaveOutlined, OpacityOutlined, SpaOutlined, EditOutlined,
  LightbulbOutlined, ImageOutlined, PictureAsPdfOutlined, MicOutlined
} from "@mui/icons-material";
import { getConsultantUserDetail, getConsultantRoutine, updateConsultantRoutine, getProducts, getUserProfile } from "../api/dashboard";

// --- APPLE HEALTH + STRIPE + LINEAR VIOLET THEME SYSTEM ---
const cPrimary = "#8B5CF6";       // Deep Violet
const cSecondary = "#A78BFA";     // Soft Lavender
const cAccent = "#F472B6";        // Soft Rose Accent
const cBg = "#F8FAFC";            // Ultra-clean Slate Ivory
const cCard = "#FFFFFF";          // Pure White
const cText = "#0F172A";          // Deep Slate Text
const cSecondaryText = "#64748B"; // Muted Slate
const cBorder = "#E2E8F0";        // Crisp Slate Border
const cBorderAccent = "#EDE9FE";  // Violet Tinted Border
const cSuccess = "#10B981";       // Emerald Green
const cWarning = "#F59E0B";       // Amber Warning
const cDanger = "#EF4444";        // Coral Red
const cGradient = "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// Fallback image helper
const fallbackImg = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80";

// Circular Score Widget
const CircularScoreWidget = ({ score = 73 }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress variant="determinate" value={100} size={64} thickness={4} sx={{ color: '#F3E8FF' }} />
    <CircularProgress variant="determinate" value={score} size={64} thickness={4.5} sx={{ color: cPrimary, position: 'absolute', strokeLinecap: 'round' }} />
    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontSize: 16, fontWeight: 800, color: cText, lineHeight: 1 }}>{score}</Typography>
      <Typography sx={{ fontSize: 8, color: cSecondaryText, fontWeight: 700 }}>/100</Typography>
    </Box>
  </Box>
);

export default function ConsultantRoutineEditPage() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State bindings
  const [morningRoutine, setMorningRoutine] = useState([]);
  const [nightRoutine, setNightRoutine] = useState([]);
  const [afternoonRoutine, setAfternoonRoutine] = useState([]);
  const [weeklyTreatments, setWeeklyTreatments] = useState([]);
  const [activeTab, setActiveTab] = useState("morning"); // morning, afternoon, night, weekly
  
  const [notes, setNotes] = useState("• Focus on hydration and barrier repair\n• Avoid harsh physical scrubs\n• Use sunscreen daily even indoors\n• Reassess progress after 4 weeks.");
  const [reviewDate, setReviewDate] = useState("");
  const [followUpInterval, setFollowUpInterval] = useState("4 Weeks");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerRoutineType, setDrawerRoutineType] = useState("morning");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [draggedItem, setDraggedItem] = useState(null);

  // Queries & Mutations
  const { data: userDetail, isLoading: loadingClient } = useQuery({
    queryKey: ["userDetail", routineId],
    queryFn: () => getConsultantUserDetail(routineId),
  });

  const { data: routineData, isLoading: loadingRoutine } = useQuery({
    queryKey: ["routine", routineId],
    queryFn: () => getConsultantRoutine(routineId),
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: consultantProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
  });

  // Extract Live Variables
  const info = userDetail?.user_info;
  const lifestyleData = userDetail?.lifestyle;
  const latestAssessment = userDetail?.assessments?.[0];
  const prevAssessment = userDetail?.assessments?.[1];

  // Dynamic Score & Delta
  const currentScore = useMemo(() => {
    return latestAssessment ? Math.round(latestAssessment.overall_score) : 73;
  }, [latestAssessment]);

  const scoreDiffText = useMemo(() => {
    if (latestAssessment && prevAssessment) {
      const diff = Math.round(latestAssessment.overall_score) - Math.round(prevAssessment.overall_score);
      return diff >= 0 ? `↑ ${diff} pts from last assessment` : `↓ ${Math.abs(diff)} pts from last assessment`;
    }
    return "Initial Assessment";
  }, [latestAssessment, prevAssessment]);

  // Dynamic Consultant Name
  const consultantName = useMemo(() => {
    if (consultantProfile?.full_name) return `Dr. ${consultantProfile.full_name}`;
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.full_name) return `Dr. ${u.full_name}`;
      } catch (e) {}
    }
    return "Dr. Ananya Rao";
  }, [consultantProfile]);

  // Dynamic Concerns Formatting
  const formatConcern = (c) => {
    if (!c) return "";
    let str = "";
    if (typeof c === "string") str = c;
    else if (typeof c === "object" && c.name) str = c.name;
    else if (typeof c === "object" && c.concern) str = c.concern;
    else str = String(c);
    
    return str.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const concernsText = useMemo(() => {
    if (latestAssessment?.detected_concerns) {
      if (Array.isArray(latestAssessment.detected_concerns)) {
        const formatted = latestAssessment.detected_concerns.map(formatConcern).filter(Boolean);
        if (formatted.length > 0) return formatted.join(", ");
      }
    }
    if (info?.skin_concerns) {
      if (Array.isArray(info.skin_concerns) && info.skin_concerns.length > 0) {
        return info.skin_concerns.map(formatConcern).join(", ");
      }
    }
    if (latestAssessment?.primary_concern) {
      return formatConcern(latestAssessment.primary_concern);
    }
    return "Dry Skin & Barrier Repair";
  }, [latestAssessment, info]);

  // Clean goal title text without raw underscores
  const goalTitle = useMemo(() => {
    const cleanConcerns = concernsText.replace(/_/g, " ");
    return `Reduce ${cleanConcerns} & Repair Barrier`;
  }, [concernsText]);

  // Dynamic Lifestyle Text
  const lifestyleText = useMemo(() => {
    if (!lifestyleData) return "Indoor • Moderate Stress";
    const env = lifestyleData.environmental_exposure || "Indoor";
    const stress = lifestyleData.stress_level
      ? `${lifestyleData.stress_level.charAt(0).toUpperCase() + lifestyleData.stress_level.slice(1)} Stress`
      : "Moderate Stress";
    return `${env} • ${stress}`;
  }, [lifestyleData]);

  // Dynamic Allergies & Sensitivities
  const allergiesText = useMemo(() => {
    if (!info) return "None • Low";
    const allg = Array.isArray(info.allergies) && info.allergies.length > 0 ? info.allergies.join(", ") : "None";
    const sens = Array.isArray(info.sensitivities) && info.sensitivities.length > 0 ? info.sensitivities.join(", ") : (info.sensitivities || "Low");
    return `${allg} • ${sens}`;
  }, [info]);

  // Dynamic Last Assessment Date
  const lastAssessmentDateText = useMemo(() => {
    if (latestAssessment?.created_at) {
      try {
        return new Date(latestAssessment.created_at).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric"
        });
      } catch (e) {}
    }
    return "26 Jul 2026";
  }, [latestAssessment]);

  // Dynamic Recommended/Avoid Ingredients based on Skin Type
  const { recommendedIngredients, avoidIngredients } = useMemo(() => {
    const st = (info?.skin_type || "").toLowerCase();
    if (st.includes("oily") || st.includes("acne")) {
      return {
        recommendedIngredients: ["Niacinamide", "Salicylic Acid", "Zinc PCA"],
        avoidIngredients: ["Heavy Oils", "Fragrance", "Comedogenic Waxes"]
      };
    } else if (st.includes("dry")) {
      return {
        recommendedIngredients: ["Hyaluronic Acid", "Ceramides", "Glycerin"],
        avoidIngredients: ["Alcohol", "Strong Sulfates", "Harsh Scrubs"]
      };
    } else if (st.includes("sensitive")) {
      return {
        recommendedIngredients: ["Centella Asiatica", "Aloe Vera", "Allantoin"],
        avoidIngredients: ["Fragrance", "Essential Oils", "High AHA/BHA"]
      };
    }
    return {
      recommendedIngredients: ["Niacinamide", "Ceramides", "Hyaluronic Acid"],
      avoidIngredients: ["Alcohol", "Fragrance", "Essential Oils"]
    };
  }, [info]);

  useEffect(() => {
    if (routineData) {
      if (Array.isArray(routineData.morningRoutine) && typeof routineData.morningRoutine[0] === 'object') {
        setMorningRoutine(routineData.morningRoutine);
      }
      if (Array.isArray(routineData.eveningRoutine) && typeof routineData.eveningRoutine[0] === 'object') {
        setNightRoutine(routineData.eveningRoutine);
      }
      
      const combinedNotes = routineData.instructions || "";
      if (combinedNotes.includes("Notes:\n")) {
        setNotes(combinedNotes.split("Notes:\n")[1]);
      } else if (combinedNotes) {
        setNotes(combinedNotes);
      }
      
      if (routineData.reviewDate) {
        setReviewDate(routineData.reviewDate.substring(0, 10));
      } else {
        const today = new Date();
        today.setDate(today.getDate() + 28);
        setReviewDate(today.toISOString().substring(0, 10));
      }
    }
  }, [routineData]);

  const mutation = useMutation({
    mutationFn: (payload) => updateConsultantRoutine(routineId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["userDetail", routineId]);
      queryClient.invalidateQueries(["routine", routineId]);
      navigate("/consultant/routines");
    }
  });

  const handleOpenDrawer = (type) => {
    setDrawerRoutineType(type);
    setIsDrawerOpen(true);
  };

  const handleAddProduct = (prod) => {
    const newItem = {
      id: `${prod.id}-${Date.now()}`,
      productId: prod.id,
      name: prod.name || "Unknown Product",
      brand: prod.brand || "Unknown Brand",
      category: prod.category || "General",
      frequency: "Daily",
      imageUrl: prod.image_url || fallbackImg,
      ingredients: prod.ingredients || [],
      purpose: "Targeted care & barrier repair",
      quantity: "Pea size",
      time: "AM"
    };

    if (drawerRoutineType === "morning") setMorningRoutine(prev => [...prev, newItem]);
    else if (drawerRoutineType === "night") setNightRoutine(prev => [...prev, newItem]);
    else if (drawerRoutineType === "afternoon") setAfternoonRoutine(prev => [...prev, newItem]);
    else if (drawerRoutineType === "weekly") setWeeklyTreatments(prev => [...prev, newItem]);
  };

  const handleRemoveProduct = (routineType, idToRemove) => {
    if (routineType === "morning") setMorningRoutine(prev => prev.filter(p => p.id !== idToRemove));
    else if (routineType === "night") setNightRoutine(prev => prev.filter(p => p.id !== idToRemove));
    else if (routineType === "afternoon") setAfternoonRoutine(prev => prev.filter(p => p.id !== idToRemove));
    else if (routineType === "weekly") setWeeklyTreatments(prev => prev.filter(p => p.id !== idToRemove));
  };

  const handleFrequencyChange = (routineType, index, value) => {
    const updater = (list) => {
      const updated = [...list];
      updated[index].frequency = value;
      return updated;
    };
    if (routineType === "morning") setMorningRoutine(updater);
    else if (routineType === "night") setNightRoutine(updater);
    else if (routineType === "afternoon") setAfternoonRoutine(updater);
    else if (routineType === "weekly") setWeeklyTreatments(updater);
  };

  const handleDragStart = (e, index, type) => {
    setDraggedItem({ index, type });
  };

  const handleDragEnter = (e, index, type) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type || draggedItem.index === index) return;
    
    const reorder = (list) => {
      const updated = [...list];
      const item = updated[draggedItem.index];
      updated.splice(draggedItem.index, 1);
      updated.splice(index, 0, item);
      return updated;
    };

    if (type === "morning") setMorningRoutine(reorder);
    else if (type === "night") setNightRoutine(reorder);
    else if (type === "afternoon") setAfternoonRoutine(reorder);
    else if (type === "weekly") setWeeklyTreatments(reorder);

    setDraggedItem({ index, type });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    const combinedNotes = `Review: ${reviewDate} | Interval: ${followUpInterval} \n\nNotes:\n${notes}`;
    mutation.mutate({
      morningRoutine,
      eveningRoutine: nightRoutine,
      instructions: combinedNotes,
      reviewDate: new Date(reviewDate).toISOString(),
      status: "active"
    });
  };

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter(p => {
      const pName = (p.name || "").toLowerCase();
      const pBrand = (p.brand || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const sQuery = searchQuery.toLowerCase();
      const fCat = categoryFilter.toLowerCase();

      const matchesSearch = pName.includes(sQuery) || pBrand.includes(sQuery) || pCat.includes(sQuery);
      const matchesCat = categoryFilter === "All" || pCat.includes(fCat) || fCat.includes(pCat);
      return matchesSearch && matchesCat;
    });
  }, [productsData, searchQuery, categoryFilter]);

  const recommendedProducts = useMemo(() => {
    if (!productsData || !info) return [];
    return productsData.filter(p => {
      const cat = (p.category || "").toLowerCase();
      return cat.includes("serum") || cat.includes("cleanser") || cat.includes("moisturizer") || cat.includes("treatment");
    }).slice(0, 4);
  }, [productsData, info]);

  // Master Card Styling Tokens
  const cardStyle = {
    backgroundColor: cCard,
    borderRadius: "20px",
    padding: "24px",
    border: `1px solid ${cBorderAccent}`,
    boxShadow: "0 4px 20px rgba(139, 92, 246, 0.04)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: cPrimary,
      boxShadow: "0 10px 30px rgba(139, 92, 246, 0.10)",
    }
  };

  const renderRoutineTable = (routineList, routineType) => {
    if (routineList.length === 0) {
      return (
        <Box sx={{ p: 5, textAlign: "center", border: `2px dashed ${cBorder}`, borderRadius: "16px", backgroundColor: "#FAF5FF", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ShoppingBagOutlined sx={{ fontSize: 36, color: cPrimary, mb: 1 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: cText, mb: 0.5 }}>No products assigned in this routine</Typography>
          <Typography sx={{ fontSize: 13, color: cSecondaryText, mb: 2.5, maxWidth: 360 }}>Select products from the library to build steps for this phase.</Typography>
          <Button onClick={() => handleOpenDrawer(routineType)} variant="contained" startIcon={<Add />} sx={{ textTransform: "none", fontWeight: 800, background: cGradient, color: "#FFF", borderRadius: "10px", px: 3, py: 1, fontSize: 13, boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)" }}>
            Add Step
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "50px 1.5fr 2fr 1fr 1fr 1fr 60px", gap: "16px", px: 2, py: 1.5, borderBottom: `1px solid ${cBorder}`, backgroundColor: "#FAFAFB", borderRadius: "10px 10px 0 0" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>Step</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>Product</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>How to Use</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>Quantity</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>Frequency</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>Time</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase", textAlign: "right" }}></Typography>
        </Box>

        {routineList.map((item, index) => (
          <Box 
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index, routineType)}
            onDragEnter={(e) => handleDragEnter(e, index, routineType)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            sx={{
              display: "grid",
              gridTemplateColumns: "50px 1.5fr 2fr 1fr 1fr 1fr 60px",
              gap: "16px",
              px: 2, py: 2,
              alignItems: "center",
              borderBottom: `1px solid ${cBorder}`,
              backgroundColor: "#FFF",
              opacity: draggedItem?.index === index && draggedItem?.type === routineType ? 0.4 : 1,
              '&:hover': { backgroundColor: "#FAF5FF" },
              transition: "all 0.2s"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DragIndicator sx={{ color: "#CBD5E1", cursor: "grab", fontSize: 18 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: cPrimary }}>{index + 1}</Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: "8px", border: `1px solid ${cBorder}`, p: 0.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
                <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText, lineHeight: 1.2 }}>{item.name}</Typography>
                <Typography sx={{ fontSize: 11, color: cSecondaryText }}>{item.brand}</Typography>
              </Box>
            </Stack>

            <Typography sx={{ fontSize: 12, color: cText }}>{item.purpose || "Massage on damp skin for 30 seconds."}</Typography>
            <Typography sx={{ fontSize: 12, color: cSecondaryText, fontWeight: 600 }}>{item.quantity || "Pea size"}</Typography>
            
            <Select size="small" value={item.frequency || "Daily"} onChange={(e) => handleFrequencyChange(routineType, index, e.target.value)} sx={{ height: 32, fontSize: 12, borderRadius: "6px" }}>
              <MenuItem value="Daily">Daily</MenuItem>
              <MenuItem value="Alternate Days">Alternate Days</MenuItem>
              <MenuItem value="Weekly">Weekly</MenuItem>
            </Select>

            <Chip label={routineType === 'morning' ? 'AM' : 'PM'} size="small" sx={{ fontSize: 11, fontWeight: 800, backgroundColor: routineType === 'morning' ? '#FEF3C7' : '#EDE9FE', color: routineType === 'morning' ? '#D97706' : '#6D28D9', borderRadius: '6px', width: 48 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
              <IconButton size="small" onClick={() => handleRemoveProduct(routineType, item.id)} sx={{ color: cDanger }}>
                <DeleteOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        ))}

        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Button onClick={() => handleOpenDrawer(routineType)} startIcon={<Add />} variant="outlined" sx={{ textTransform: "none", fontWeight: 800, color: cPrimary, borderColor: cBorderAccent, borderRadius: "10px", width: "100%", py: 1, fontSize: 13, borderStyle: "dashed" }}>
            Add Step
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ backgroundColor: cBg, minHeight: "100vh", color: cText, pb: 24 }}>
      
      {/* STICKY HEADER BAR */}
      <Box sx={{ backgroundColor: cCard, borderBottom: `1px solid ${cBorderAccent}`, px: { xs: 3, md: 5 }, py: 2.5, position: "sticky", top: 0, zIndex: 10 }}>
        <Box sx={{ maxWidth: 1720, margin: "0 auto" }}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => navigate("/consultant/routines")} sx={{ border: `1px solid ${cBorderAccent}`, width: 40, height: 40, borderRadius: "10px" }}>
                <ArrowBack sx={{ color: cText, fontSize: 18 }} />
              </IconButton>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: cText, letterSpacing: "-0.5px" }}>Edit Routine Plan</Typography>
                  <Chip label={info?.full_name || "Mahitha K"} size="small" sx={{ backgroundColor: "#F3E8FF", color: cPrimary, fontWeight: 800, borderRadius: "6px" }} />
                  <Chip label={info?.skin_type ? `${info.skin_type} Skin` : "Normal Skin"} size="small" sx={{ backgroundColor: "#E0E7FF", color: "#4338CA", fontWeight: 800, borderRadius: "6px" }} />
                  <Chip label="Assessment Complete" size="small" sx={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 800, borderRadius: "6px" }} />
                </Stack>
                <Typography sx={{ fontSize: 13, color: cSecondaryText, mt: 0.3 }}>Customize clinical routine & recommendations for the patient.</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button startIcon={<AutoAwesome sx={{ color: cPrimary }} />} variant="outlined" sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: "10px", color: cPrimary, borderColor: `${cPrimary}40`, backgroundColor: `${cPrimary}0A`, px: 2, py: 1 }}>
                AI Assistant
              </Button>
              <Button startIcon={<VisibilityOutlined />} variant="outlined" sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: "10px", color: cText, borderColor: cBorder, px: 2, py: 1 }}>
                Preview Routine
              </Button>
              <Button startIcon={<SaveOutlined />} variant="outlined" sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: "10px", color: cText, borderColor: cBorder, px: 2, py: 1 }}>
                Save Draft
              </Button>
              <Button onClick={handleSave} disabled={mutation.isPending} variant="contained" sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: "10px", background: cGradient, color: "#FFF", px: 3, py: 1, boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)", '&:hover': { background: cGradient, opacity: 0.9 } }}>
                {mutation.isPending ? "Publishing..." : "Publish Routine"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* WORKSPACE AREA */}
      <Box sx={{ maxWidth: 1720, margin: "0 auto", p: { xs: 2, sm: 3, md: 4 }, pb: { xs: 16, md: 24 } }}>
        
        {(loadingClient || loadingRoutine) ? (
          <Skeleton variant="rectangular" height={550} sx={{ borderRadius: "20px" }} />
        ) : (
          <Stack spacing="32px" width="100%">
            
            {/* TOP SECTION: 2-COLUMN LAYOUT (LEFT PROFILE 340px | RIGHT WORKSPACE FLEX:1) */}
            <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: "28px", alignItems: "flex-start", width: "100%" }}>
              
              {/* 1. LEFT PANEL: LIVE CLIENT PROFILE & HEALTH INDICATORS (340px) */}
              <Box sx={{ width: { xs: "100%", lg: "340px" }, flexShrink: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Live Client Profile Card */}
                <Paper sx={cardStyle}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Typography sx={{ fontSize: 17, fontWeight: 800, color: cText }}>Client Profile</Typography>
                    <IconButton size="small"><EditOutlined sx={{ color: cSecondaryText, fontSize: 18 }} /></IconButton>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" sx={{ width: 64, height: 64, border: `2px solid ${cPrimary}30` }}>
                      {initials(info?.full_name || "Mahitha K")}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: cText }}>{info?.full_name || "Mahitha K"}</Typography>
                      <Typography sx={{ fontSize: 13, color: cSecondaryText, mt: 0.2 }}>{info?.age ? `${info.age} yrs` : "20 yrs"} • {info?.gender || "Female"}</Typography>
                      <Chip label={`ID: ${routineId?.substring(0,8).toUpperCase() || "B0A1F282"}`} size="small" sx={{ mt: 0.5, borderRadius: "6px", backgroundColor: "#F3E8FF", color: cPrimary, fontWeight: 800, fontSize: 10 }} />
                    </Box>
                  </Stack>

                  {/* Live Skin Score Widget */}
                  <Box sx={{ p: 2, borderRadius: "14px", backgroundColor: "#FAF5FF", border: `1px solid ${cPrimary}20`, display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <CircularScoreWidget score={currentScore} />
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 800, color: cText }}>Skin Score</Typography>
                      <Typography sx={{ fontSize: 12, color: cSuccess, fontWeight: 700, mt: 0.2 }}>{scoreDiffText}</Typography>
                    </Box>
                  </Box>

                  {/* Live Patient Specs List */}
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Skin Type</Typography>
                      <Chip label={info?.skin_type || "Normal"} size="small" sx={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontWeight: 800, borderRadius: "6px", textTransform: "capitalize" }} />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Primary Concerns</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cDanger, textTransform: "capitalize" }}>{concernsText}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Allergies / Sensitivities</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cText, textTransform: "capitalize" }}>{allergiesText}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Lifestyle</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cText }}>{lifestyleText}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Last Assessment</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>{lastAssessmentDateText}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Assigned Consultant</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: cPrimary }}>{consultantName}</Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Health Assessment Summary Indicators */}
                <Paper sx={cardStyle}>
                  <Typography sx={{ fontSize: 16, fontWeight: 800, color: cText, mb: 2 }}>Assessment Summary</Typography>
                  <Stack spacing={1.8}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Hydration</Typography>
                      <Chip label={currentScore > 70 ? "Good" : "Needs Hydration"} size="small" sx={{ backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, fontSize: 11 }} />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Oil Level</Typography>
                      <Chip label="Normal" size="small" sx={{ backgroundColor: "#DBEAFE", color: "#1E40AF", fontWeight: 800, fontSize: 11 }} />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Sensitivity</Typography>
                      <Chip label={allergiesText.includes("None") ? "Low" : "Moderate"} size="small" sx={{ backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, fontSize: 11 }} />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Barrier Risk</Typography>
                      <Chip label="Moderate" size="small" sx={{ backgroundColor: "#FEF3C7", color: "#D97706", fontWeight: 800, fontSize: 11 }} />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>Pigmentation Risk</Typography>
                      <Chip label="Low" size="small" sx={{ backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, fontSize: 11 }} />
                    </Box>
                  </Stack>
                </Paper>

              </Box>

              {/* 2. RIGHT WORKSPACE: ROUTINE BUILDER & PRODUCT GALLERY (FLEX: 1) */}
              <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Routine Builder Header & Segmented Tabs */}
                <Paper sx={cardStyle}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: cText }}>Routine Builder</Typography>
                      <Typography sx={{ fontSize: 13, color: cSecondaryText, mt: 0.2 }}>Assign products to each step and define usage quantity and timing.</Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Select size="small" value={followUpInterval} onChange={(e) => setFollowUpInterval(e.target.value)} sx={{ height: 36, fontSize: 12, borderRadius: "8px" }}>
                        <MenuItem value="2 Weeks">2 Weeks</MenuItem>
                        <MenuItem value="4 Weeks">4 Weeks</MenuItem>
                        <MenuItem value="8 Weeks">8 Weeks</MenuItem>
                      </Select>
                      <Chip label="Active" sx={{ backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, height: 36, px: 1.5, fontSize: 12 }} />
                    </Stack>
                  </Stack>

                  {/* Segmented Routine Tabs */}
                  <Stack direction="row" spacing={1} sx={{ backgroundColor: "#FAFAFB", p: 0.8, borderRadius: "12px", border: `1px solid ${cBorder}`, overflowX: "auto", mb: 3 }}>
                    {[
                      { id: "morning", label: "Morning Routine", icon: <WbSunnyOutlined sx={{ fontSize: 18, color: cWarning }} /> },
                      { id: "afternoon", label: "Afternoon Routine", icon: <OpacityOutlined sx={{ fontSize: 18, color: cPrimary }} /> },
                      { id: "night", label: "Night Routine", icon: <NightsStayOutlined sx={{ fontSize: 18, color: "#8B5CF6" }} /> },
                      { id: "weekly", label: "Weekly Treatments", icon: <SpaOutlined sx={{ fontSize: 18, color: cSuccess }} /> },
                    ].map((tab) => (
                      <Button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        startIcon={tab.icon}
                        sx={{
                          flex: 1,
                          textTransform: "none",
                          fontWeight: 800,
                          fontSize: 13,
                          py: 1,
                          borderRadius: "8px",
                          backgroundColor: activeTab === tab.id ? "#FFF" : "transparent",
                          color: activeTab === tab.id ? cPrimary : cSecondaryText,
                          boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                          '&:hover': { backgroundColor: activeTab === tab.id ? "#FFF" : "#F3F4F6" }
                        }}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </Stack>

                  {/* Active Routine Step Cards / Table */}
                  {activeTab === "morning" && renderRoutineTable(morningRoutine, "morning")}
                  {activeTab === "afternoon" && renderRoutineTable(afternoonRoutine, "afternoon")}
                  {activeTab === "night" && renderRoutineTable(nightRoutine, "night")}
                  {activeTab === "weekly" && renderRoutineTable(weeklyTreatments, "weekly")}

                  <Box sx={{ mt: 2, p: 2, borderRadius: "12px", backgroundColor: "#FAF5FF", border: `1px solid ${cBorderAccent}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <LightbulbOutlined sx={{ color: cPrimary, fontSize: 20 }} />
                    <Typography sx={{ fontSize: 12, color: cText }}>
                      <strong>💡 Expert Tip:</strong> Apply products in the order shown for maximum effectiveness. You can drag and drop steps to reorder.
                    </Typography>
                  </Box>
                </Paper>

                {/* Product Gallery Carousel / Grid */}
                <Paper sx={cardStyle}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Box>
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: cText }}>Recommended Products</Typography>
                      <Typography sx={{ fontSize: 13, color: cSecondaryText }}>AI suggested products tailored to client assessment.</Typography>
                    </Box>
                    <Button onClick={() => handleOpenDrawer(activeTab)} startIcon={<Add />} variant="outlined" sx={{ textTransform: "none", fontWeight: 800, color: cPrimary, borderColor: cBorderAccent, borderRadius: "10px", fontSize: 12, px: 2, py: 0.8 }}>
                      Add Product
                    </Button>
                  </Stack>

                  {/* Horizontal Product Cards Grid */}
                  <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap="16px">
                    {recommendedProducts.map((prod, i) => (
                      <Paper key={`gal-${prod.id}`} sx={{ p: 2, borderRadius: "14px", border: `1px solid ${cBorder}`, position: "relative", transition: "all 0.2s", '&:hover': { borderColor: cPrimary, transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(139, 92, 246, 0.12)" } }}>
                        <Chip label={`${95 - i * 2}% Match`} size="small" sx={{ position: "absolute", top: 12, right: 12, backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, fontSize: 10, height: 20 }} />
                        <Box sx={{ width: "100%", height: 100, display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                          <img src={prod.image_url} alt={prod.name} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                        </Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSecondaryText, textTransform: "uppercase" }}>{prod.brand}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText, height: 36, overflow: "hidden", textOverflow: "ellipsis", mb: 1 }}>{prod.name}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: cPrimary, mb: 1.5 }}>₹{350 + i * 200}</Typography>
                        <Button fullWidth size="small" onClick={() => handleAddProduct(prod)} variant="outlined" sx={{ textTransform: "none", fontWeight: 700, fontSize: 11, borderRadius: "8px", borderColor: cBorderAccent, color: cPrimary }}>
                          View Details
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                </Paper>

              </Box>

            </Box>

            {/* LOWER SECTION: FULL-WIDTH BALANCED 2-COLUMN DASHBOARD GRID */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: "32px", width: "100%", mt: 5, mb: 8 }}>
              
              {/* ROW 1 LEFT: CONSULTANT NOTES CARD */}
              <Paper sx={{ ...cardStyle, height: "100%", display: "flex", flexDirection: "column" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: cText }}>Consultant Notes</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip icon={<ImageOutlined sx={{ fontSize: 14 }} />} label="Image" size="small" onClick={() => {}} sx={{ backgroundColor: "#FAFAFB", color: cSecondaryText, fontWeight: 700, cursor: "pointer", borderRadius: "6px" }} />
                    <Chip icon={<PictureAsPdfOutlined sx={{ fontSize: 14 }} />} label="PDF" size="small" onClick={() => {}} sx={{ backgroundColor: "#FAFAFB", color: cSecondaryText, fontWeight: 700, cursor: "pointer", borderRadius: "6px" }} />
                    <Chip icon={<MicOutlined sx={{ fontSize: 14 }} />} label="Voice" size="small" onClick={() => {}} sx={{ backgroundColor: "#FAFAFB", color: cSecondaryText, fontWeight: 700, cursor: "pointer", borderRadius: "6px" }} />
                  </Stack>
                </Stack>

                <Box sx={{ border: `1px solid ${cBorder}`, borderRadius: "14px", overflow: "hidden", flexGrow: 1, display: "flex", flexDirection: "column", backgroundColor: "#FFF" }}>
                  <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${cBorder}`, backgroundColor: "#FAFAFB", display: "flex", gap: 0.5, alignItems: "center" }}>
                    <IconButton size="small"><FormatBold sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small"><FormatItalic sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small"><FormatUnderlined sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small"><FormatListBulleted sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small"><FormatListNumbered sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small"><Link sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small"><Code sx={{ fontSize: 16 }} /></IconButton>
                  </Box>

                  <TextField
                    multiline rows={6} fullWidth
                    placeholder="Enter clinical notes, lifestyle advice, diet tips, and precautions for the client..."
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    inputProps={{ maxLength: 2000 }}
                    sx={{ p: 1.5, flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 0, '& fieldset': { border: 'none' } } }}
                  />
                  
                  <Box sx={{ px: 2, py: 1.2, borderTop: `1px solid ${cBorder}`, backgroundColor: "#FAFAFB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Button startIcon={<AutoAwesome sx={{ color: cPrimary }} />} size="small" sx={{ textTransform: "none", fontWeight: 700, color: cPrimary, fontSize: 12 }}>
                      AI Suggest Notes
                    </Button>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText, fontWeight: 600 }}>{notes.length} / 2000</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* ROW 1 RIGHT: AI QUICK INSIGHTS & ROUTINE COMPLETION SCORE */}
              <Paper sx={{ ...cardStyle, background: "linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)", borderColor: `${cPrimary}40`, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <AutoAwesome sx={{ color: cPrimary, fontSize: 22 }} />
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: cText }}>AI Quick Insights</Typography>
                    </Stack>
                    <Chip label="Confidence: 96%" size="small" sx={{ backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, fontSize: 11 }} />
                  </Stack>

                  <Grid container spacing={2} mb={2.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, color: cSecondaryText, fontWeight: 700, mb: 0.3 }}>Goal</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText }}>{goalTitle}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, color: cSecondaryText, fontWeight: 700, mb: 0.3 }}>Key Focus</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cPrimary }}>Hydration, Barrier Repair, Oil Control</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, color: cSecondaryText, fontWeight: 700, mb: 0.5 }}>Recommended Ingredients</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {recommendedIngredients.map(ing => (
                          <Chip key={ing} label={`✓ ${ing}`} size="small" sx={{ borderRadius: "6px", backgroundColor: "#F3E8FF", color: cPrimary, fontWeight: 700, fontSize: 10 }} />
                        ))}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, color: cSecondaryText, fontWeight: 700, mb: 0.5 }}>Ingredients to Avoid</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {avoidIngredients.map(ing => (
                          <Chip key={ing} label={`✕ ${ing}`} size="small" sx={{ borderRadius: "6px", backgroundColor: "#FEE2E2", color: "#991B1B", fontWeight: 700, fontSize: 10 }} />
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                {/* Routine Completion & Quality Score Bar (Clean spacing) */}
                <Box sx={{ p: 2, borderRadius: "14px", backgroundColor: "#FFF", border: `1px solid ${cBorderAccent}`, display: "flex", alignItems: "center", gap: 2.5 }}>
                  <CircularProgress variant="determinate" value={currentScore} size={52} thickness={5} sx={{ color: cSuccess, flexShrink: 0 }} />
                  <Box flexGrow={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: cText }}>
                        Routine Quality: <span style={{ color: cSuccess }}>Excellent</span>
                      </Typography>
                      <Chip label={`${currentScore}% Score`} size="small" sx={{ backgroundColor: "#D1FAE5", color: "#059669", fontWeight: 800, fontSize: 11, borderRadius: "6px" }} />
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText }}>Expected 82% improvement with 4-week compliance</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* ROW 2 LEFT: USAGE TIPS FOR CLIENT CHECKLIST */}
              <Paper sx={cardStyle}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: cText, mb: 2.5 }}>Usage Tips for Client</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#FAF5FF", border: `1px solid ${cBorderAccent}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircle sx={{ color: cPrimary, fontSize: 20 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>Patch test before first use</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#FAF5FF", border: `1px solid ${cBorderAccent}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircle sx={{ color: cPrimary, fontSize: 20 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>Apply on clean, dry skin</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#FAF5FF", border: `1px solid ${cBorderAccent}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <WbSunnyOutlined sx={{ color: cWarning, fontSize: 20 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>Use sunscreen daily</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#FFF5F5", border: `1px solid ${cDanger}30`, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Cancel sx={{ color: cDanger, fontSize: 20 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>Avoid harsh physical scrubs</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#F0F9FF", border: `1px solid #BAE6FD`, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircle sx={{ color: "#0284C7", fontSize: 20 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>Do not mix strong exfoliants</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#ECFDF5", border: `1px solid #A7F3D0`, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircle sx={{ color: cSuccess, fontSize: 20 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cText }}>Drink water & sleep before 11 PM</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* ROW 2 RIGHT: TIMELINE & EXPECTED RESULTS */}
              <Paper sx={cardStyle}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: cText, mb: 2.5 }}>Timeline & Expected Results</Typography>
                <Stack spacing={2.5} sx={{ position: "relative", pl: 2.5, borderLeft: `2px solid ${cBorderAccent}` }}>
                  <Box sx={{ position: "relative" }}>
                    <Box sx={{ position: "absolute", left: -25, top: 2, width: 12, height: 12, borderRadius: "50%", backgroundColor: cPrimary, border: "2px solid #FFF" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText }}>Week 1</Typography>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText }}>Hydration improves & skin tightness reduces</Typography>
                  </Box>

                  <Box sx={{ position: "relative" }}>
                    <Box sx={{ position: "absolute", left: -25, top: 2, width: 12, height: 12, borderRadius: "50%", backgroundColor: cSecondary, border: "2px solid #FFF" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText }}>Week 2</Typography>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText }}>Oil control improves & redness subsides</Typography>
                  </Box>

                  <Box sx={{ position: "relative" }}>
                    <Box sx={{ position: "absolute", left: -25, top: 2, width: 12, height: 12, borderRadius: "50%", backgroundColor: cSuccess, border: "2px solid #FFF" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText }}>Week 4</Typography>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText }}>Barrier repair & texture refinement</Typography>
                  </Box>

                  <Box sx={{ position: "relative" }}>
                    <Box sx={{ position: "absolute", left: -25, top: 2, width: 12, height: 12, borderRadius: "50%", backgroundColor: cWarning, border: "2px solid #FFF" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText }}>Week 6–8</Typography>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText }}>Pigmentation reduces & visible glow returns</Typography>
                  </Box>
                </Stack>
              </Paper>

            </Box>

          </Stack>
        )}
      </Box>

      {/* STICKY FOOTER ACTION BAR */}
      <Box sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20, backgroundColor: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderTop: `1px solid ${cBorderAccent}`, boxShadow: "0 -10px 30px rgba(139, 92, 246, 0.1)", px: { xs: 3, md: 5 }, py: 2 }}>
        <Box sx={{ maxWidth: 1720, margin: "0 auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button sx={{ color: cSecondaryText, fontWeight: 700, textTransform: "none", fontSize: 14, px: 3, borderRadius: "10px", border: `1px solid ${cBorder}` }} onClick={() => navigate("/consultant/routines")}>
              Cancel
            </Button>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<VisibilityOutlined />} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", color: cText, borderColor: cBorder, px: 3, py: 1, fontSize: 13 }}>
                Preview Routine
              </Button>
              <Button variant="outlined" startIcon={<SaveOutlined />} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", color: cText, borderColor: cBorder, px: 3, py: 1, fontSize: 13 }}>
                Save Draft
              </Button>
              <Button onClick={handleSave} disabled={mutation.isPending} variant="contained" sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", background: cGradient, color: "#FFF", px: 4, py: 1, fontSize: 13, boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)", '&:hover': { background: cGradient, opacity: 0.9 } }}>
                {mutation.isPending ? "Publishing..." : "Publish Routine"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* PRODUCT PICKER DRAWER */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', md: 500, lg: 600 }, backgroundColor: cBg } }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${cBorder}`, backgroundColor: "#FFF", position: "sticky", top: 0, zIndex: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: cText }}>Product Library</Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ backgroundColor: "#F3F4F6" }}>
              <Close />
            </IconButton>
          </Stack>
          
          <TextField
            fullWidth placeholder="Search products by name, brand, or ingredient..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: cSecondaryText, fontSize: 20 }} /></InputAdornment>,
            }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: "10px", backgroundColor: "#FFF" } }}
          />
          
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5, '&::-webkit-scrollbar': { display: "none" } }}>
            <Chip icon={<FilterList sx={{ fontSize: 16 }} />} label="Filter" variant="outlined" sx={{ borderRadius: "8px", fontWeight: 700, py: 1.5 }} />
            {["All", "Cleanser", "Serum", "Moisturizer", "Treatment"].map(cat => (
              <Chip key={cat} label={cat} onClick={() => setCategoryFilter(cat)}
                sx={{ borderRadius: "8px", fontWeight: 700, py: 1.5, backgroundColor: categoryFilter === cat ? cText : "#FFF", color: categoryFilter === cat ? "#FFF" : cText, border: `1px solid ${categoryFilter === cat ? cText : cBorder}` }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ p: 3, pb: 10 }}>
          {!searchQuery && categoryFilter === "All" && (
            <Box mb={3.5}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <AutoAwesome sx={{ color: cPrimary, fontSize: 18 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText, textTransform: "uppercase", letterSpacing: 1 }}>AI Recommended</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12, color: cSecondaryText, mb: 2 }}>Highly matched for client's skin profile</Typography>
              
              <Stack spacing={2}>
                {recommendedProducts.map(prod => (
                  <Paper key={`rec-${prod.id}`} sx={{ p: 2, borderRadius: "14px", border: `1px solid ${cPrimary}40`, backgroundColor: "#F3E8FF40", display: "flex", alignItems: "center", gap: 2, boxShadow: "none" }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: "10px", backgroundColor: "#FFF", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, p: 0.5 }}>
                      <img src={prod.image_url} alt={prod.name} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </Box>
                    <Box flexGrow={1}>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: cText, mb: 0.3 }}>{prod.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: cSecondaryText, mb: 0.8 }}>{prod.brand} • {prod.category}</Typography>
                      <Chip icon={<Star sx={{ fontSize: 12, color: "#D69E2E" }} />} label="98% Match" size="small" sx={{ backgroundColor: "#FEFCBF", color: "#744210", fontWeight: 800, borderRadius: "6px", height: 20, fontSize: 10 }} />
                    </Box>
                    <Button onClick={() => handleAddProduct(prod)} variant="contained" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, background: cGradient, color: "#FFF", px: 2, py: 0.6, fontSize: 12, boxShadow: "none" }}>Add</Button>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          <Typography sx={{ fontSize: 13, fontWeight: 800, color: cText, textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>
            {searchQuery ? "Search Results" : "All Products"}
          </Typography>
          
          <Stack spacing={1.5}>
            {loadingProducts ? <CircularProgress size={24} sx={{ display: "block", mx: "auto", my: 4 }} /> : (
              filteredProducts.length > 0 ? filteredProducts.map(prod => (
                <Paper key={prod.id} sx={{ p: 2, borderRadius: "14px", border: `1px solid ${cBorder}`, display: "flex", alignItems: "center", gap: 2, boxShadow: "none", '&:hover': { borderColor: cPrimary } }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: "10px", border: `1px solid ${cBorder}`, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, p: 0.5 }}>
                    <img src={prod.image_url} alt={prod.name} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </Box>
                  <Box flexGrow={1}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: cText, mb: 0.3 }}>{prod.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: cSecondaryText }}>{prod.brand} • {prod.category}</Typography>
                  </Box>
                  <Button onClick={() => handleAddProduct(prod)} variant="outlined" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, color: cText, borderColor: cBorder, px: 2, py: 0.6, fontSize: 12 }}>Add</Button>
                </Paper>
              )) : (
                <Box sx={{ py: 5, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: cSecondaryText, fontWeight: 600 }}>No products found.</Typography>
                </Box>
              )
            )}
          </Stack>
        </Box>
      </Drawer>

    </Box>
  );
}
