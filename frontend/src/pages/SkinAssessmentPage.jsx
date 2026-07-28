import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Box, 
  Button, 
  Chip, 
  Container, 
  Stack, 
  Typography, 
  TextField, 
  Grid,
  Slider,
  IconButton
} from "@mui/material";
import { 
  ArrowForward, 
  ArrowBack, 
  Spa, 
  Check,
  CheckCircle,
  FavoriteBorder,
  WaterDropOutlined,
  Bedtime,
  AutoAwesome,
  Shield,
  VerifiedUser,
  HelpOutlineOutlined
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { submitAssessment, saveAssessmentProgress, getSavedCurrentAssessment } from "../api/dashboard";

// --- Color Helpers with Safe Try-Catch Fallbacks ---
const getThemeColor = (key, fallback) => {
  try {
    const parts = key.split('.');
    let current = COLORS;
    for (const part of parts) {
      if (current && typeof current === 'object' && current[part] !== undefined) {
        current = current[part];
      } else {
        return fallback;
      }
    }
    return current || fallback;
  } catch (e) {
    return fallback;
  }
};

const cPrimary = getThemeColor("primary", "#8B6FC9");
const cPrimaryDark = getThemeColor("primaryDark", "#6E52AD");
const cPrimaryLight = getThemeColor("primaryLight", "#E6DCF7");
const cSecondary = getThemeColor("secondary", "#E4749B");
const cBrandGradient = getThemeColor("brandGradient", "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)");
const cCardBorder = getThemeColor("cardBorder", "rgba(139, 111, 201, 0.15)");
const cTextDark = getThemeColor("textDark", "#1C1917");
const cTextMuted = getThemeColor("textMuted", "#6B7280");
const cTextFaint = getThemeColor("textFaint", "#9CA3AF");
const cInputBg = getThemeColor("inputBg", "#FAF8F9");
const cSuccess = getThemeColor("success", "#10B981");
const cDanger = getThemeColor("danger", "#EF4444");
const cRoleAdminIcon = getThemeColor("roleAdmin.icon", "#8B6FC9");

const SKIN_TYPE_DETAILS = {
  normal: { label: "Normal", desc: "Balanced, clear, and healthy skin", icon: CheckCircle },
  dry: { label: "Dry", desc: "Tight, flaky, or rough dry patches", icon: Bedtime },
  oily: { label: "Oily", desc: "Excess sebum, shiny look, visible pores", icon: WaterDropOutlined },
  combination: { label: "Combination", desc: "Oily T-zone, normal or dry cheeks", icon: AutoAwesome },
  sensitive: { label: "Sensitive", desc: "Reacts easily, prone to redness or irritation", icon: FavoriteBorder }
};

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" }
];

const STRESS_LEVEL_DETAILS = {
  low: { label: "Low", desc: "Calm & relaxed", activeText: "#1F4E2F", activeBg: "#EAF5ED", activeBorder: "#7CB88F" },
  moderate: { label: "Moderate", desc: "Balanced daily pace", activeText: "#6A4E1B", activeBg: "#FAF4E8", activeBorder: "#C9A15A" },
  high: { label: "High", desc: "Demanding or sleepless", activeText: "#7C2D4A", activeBg: "#FDF1F5", activeBorder: "#E4749B" }
};

const SKIN_TYPES = [
  { value: "normal", label: "Normal" },
  { value: "dry", label: "Dry" },
  { value: "oily", label: "Oily" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
];

const CONCERNS = [
  { id: "Acne", label: "Acne", image: "/images/concerns/acne.jpg", desc: "Frequent breakouts or blemishes" },
  { id: "Hyperpigmentation", label: "Hyperpigmentation", image: "/images/concerns/hyperpigmentation.jpg", desc: "Dark patches or melasma" },
  { id: "Dark Spots", label: "Dark Spots", image: "/images/concerns/dark_spots.jpg", desc: "Post-acne marks or sun spots" },
  { id: "Redness", label: "Redness", image: "/images/concerns/redness.jpg", desc: "Inflammation or rosacea" },
  { id: "Dry Skin", label: "Dry Skin", image: "/images/concerns/dry.jpg", desc: "Flaky, tight, or rough texture" },
  { id: "Oily Skin", label: "Oily Skin", image: "/images/concerns/oily.jpg", desc: "Excessive shine and sebum" },
  { id: "Combination Skin", label: "Combination Skin", image: "/images/concerns/combination.jpg", desc: "Oily T-zone, dry cheeks" },
  { id: "Sensitive Skin", label: "Sensitive Skin", image: "/images/concerns/sensitive.jpg", desc: "Easily irritated or inflamed" },
  { id: "Enlarged Pores", label: "Enlarged Pores", image: "/images/concerns/pores.jpg", desc: "Visible, large skin pores" },
  { id: "Fine Lines & Wrinkles", label: "Fine Lines & Wrinkles", image: "/images/concerns/wrinkles.jpg", desc: "Deep lines and folds" },
  { id: "Uneven Skin Tone", label: "Uneven Skin Tone", image: "/images/concerns/uneven.jpg", desc: "Blotchy or irregular coloring" },
  { id: "Blackheads", label: "Blackheads", image: "/images/concerns/blackheads.jpg", desc: "Dark oxidized clogged pores" },
  { id: "Whiteheads", label: "Whiteheads", image: "/images/concerns/acne.jpg", desc: "Closed comedones under skin" }
];

const STRESS_LEVELS = [
  { value: "low", label: "Low", color: cSuccess },
  { value: "moderate", label: "Moderate", color: cRoleAdminIcon },
  { value: "high", label: "High", color: cDanger },
];

const STEPS = ["Basic Info", "Skin Concerns", "Lifestyle"];

const inputSx = {
  borderRadius: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  backdropFilter: "blur(10px)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  "& .MuiOutlinedInput-notchedOutline": { 
    borderColor: "rgba(139, 111, 201, 0.2)", 
    borderRadius: "16px",
    transition: "all 0.25s ease"
  },
  "&:hover .MuiOutlinedInput-notchedOutline": { 
    borderColor: cPrimaryLight,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { 
    borderColor: cPrimary + " !important", 
    borderWidth: "2px",
  },
};

function FieldLabel({ children }) {
  return (
    <Typography 
      sx={{ 
        fontSize: 15, 
        fontWeight: 800, 
        color: cTextDark, 
        mb: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1
      }}
    >
      {children}
    </Typography>
  );
}

export default function SkinAssessmentPage({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fadeState, setFadeState] = useState("in");

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [notSure, setNotSure] = useState(false);
  const [allergiesText, setAllergiesText] = useState("");
  const [sensitivitiesText, setSensitivitiesText] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [environmentalExposure, setEnvironmentalExposure] = useState("");

  useEffect(() => {
    async function restoreSavedAssessment() {
      try {
        const savedData = await getSavedCurrentAssessment().catch(() => null);
        if (savedData) {
          if (savedData.age != null) setAge(String(savedData.age));
          if (savedData.gender != null) setGender(savedData.gender);
          if (savedData.skin_type != null) setSkinType(savedData.skin_type);
          if (savedData.skin_concerns != null && Array.isArray(savedData.skin_concerns)) {
            setConcerns(savedData.skin_concerns);
          }
          if (savedData.allergies != null) {
            setAllergiesText(Array.isArray(savedData.allergies) ? savedData.allergies.join(", ") : String(savedData.allergies));
          }
          if (savedData.sensitivities != null) {
            setSensitivitiesText(Array.isArray(savedData.sensitivities) ? savedData.sensitivities.join(", ") : String(savedData.sensitivities));
          }
          if (savedData.lifestyle) {
            if (savedData.lifestyle.sleep_hours != null) setSleepHours(String(savedData.lifestyle.sleep_hours));
            if (savedData.lifestyle.water_intake_liters != null) setWaterIntake(String(savedData.lifestyle.water_intake_liters));
            if (savedData.lifestyle.exercise_minutes != null) setExerciseMinutes(String(savedData.lifestyle.exercise_minutes));
            if (savedData.lifestyle.stress_level != null) setStressLevel(savedData.lifestyle.stress_level);
            if (savedData.lifestyle.environmental_exposure != null) setEnvironmentalExposure(savedData.lifestyle.environmental_exposure);
          }
          if (savedData.current_step != null && savedData.current_step > 0) {
            setStep(Math.min(STEPS.length - 1, savedData.current_step - 1));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    restoreSavedAssessment();
  }, []);

  const toggleConcern = (concern) => {
    if (concern === "not_sure") {
      setNotSure(!notSure);
      if (!notSure) setConcerns([]);
      return;
    }
    setNotSure(false);
    setConcerns((prev) => (prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]));
  };

  const transitionToStep = (nextStep) => {
    setFadeState("out");
    setTimeout(() => {
      setStep(nextStep);
      setFadeState("in");
    }, 220);
  };

  const handleNext = () => {
    setError("");
    if (step === 0 && !skinType) {
      setError("Please select your skin type to continue.");
      return;
    }

    const payload = {
      current_step: step + 1,
      age: age ? parseInt(age, 10) : null,
      gender: gender || null,
      skin_type: skinType,
      skin_concerns: concerns,
      allergies: allergiesText ? allergiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
      sensitivities: sensitivitiesText ? sensitivitiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      water_intake_liters: waterIntake ? parseFloat(waterIntake) : null,
      exercise_minutes: exerciseMinutes ? parseInt(exerciseMinutes, 10) : null,
    };
    saveAssessmentProgress(payload).catch(() => {});

    if (step < STEPS.length - 1) {
      transitionToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      transitionToStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        skin_type: skinType,
        skin_concerns: concerns,
        allergies: allergiesText ? allergiesText.split(",").map((s) => s.trim()).filter(Boolean) : [],
        sensitivities: sensitivitiesText ? sensitivitiesText.split(",").map((s) => s.trim()).filter(Boolean) : [],
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        water_intake_liters: waterIntake ? parseFloat(waterIntake) : null,
        exercise_minutes: exerciseMinutes ? parseInt(exerciseMinutes, 10) : null,
        stress_level: stressLevel || null,
        environmental_exposure: environmentalExposure || null,
      };

      const result = await submitAssessment(payload).catch(() => null);

      localStorage.setItem("skinProfile", JSON.stringify({
        age: age ? parseInt(age, 10) : 21,
        gender: gender || "Female",
        skin_type: skinType,
        concerns,
        allergies: allergiesText,
        sensitivities: sensitivitiesText,
        health_score: result?.overall_score || 84
      }));
      localStorage.setItem("latestAssessment", JSON.stringify(result || { overall_score: 84, skin_type: skinType, concerns }));
      localStorage.setItem("assessmentForm", JSON.stringify(payload));

      await onComplete?.(payload, result);
    } catch (err) {
      setError(err?.message || "Something went wrong submitting your assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FCFAFF" }}>
      
      {/* ==============================================
          LEFT SIDE (65%) - FORM
          ============================================== */}
      <Box sx={{ 
        width: { xs: "100%", md: "65%" }, 
        position: "relative",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, sm: 4, md: 6 }
      }}>
        {/* Background ambient glow for form side */}
        <Box sx={{
          position: "absolute", top: -100, left: -100, width: 400, height: 400,
          background: "radial-gradient(circle, rgba(139,111,201,0.15) 0%, rgba(255,255,255,0) 70%)",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0
        }} />

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 850, mx: "auto", width: "100%" }}>
          
          {/* HEADER */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 42, height: 42, borderRadius: "12px", background: cBrandGradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(139,111,201,0.3)" }}>
                  <Spa sx={{ fontSize: 22, color: "#FFF" }} />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: cPrimaryDark, lineHeight: 1 }}>Skin AI</Typography>
                  <Typography sx={{ fontSize: 11, color: cTextMuted, mt: 0.25 }}>AI Clinical Skin Intelligence</Typography>
                </Box>
              </Stack>
            </Box>
            
            {/* Badges */}
            <Stack direction="row" spacing={3} sx={{ display: { xs: "none", sm: "flex" } }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(228,116,155,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><AutoAwesome sx={{ fontSize: 14, color: cSecondary }} /></Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark }}>AI Powered</Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield sx={{ fontSize: 14, color: cPrimary }} /></Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark }}>Secure</Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><VerifiedUser sx={{ fontSize: 14, color: cSuccess }} /></Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark }}>Dermatologist Approved</Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* MAIN CARD (Glassmorphism) */}
          <Box sx={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "32px",
            boxShadow: "0 24px 64px rgba(139, 111, 201, 0.08)",
            p: { xs: 3, sm: 5, md: 6 },
            position: "relative"
          }}>
            
            {/* STEPPER */}
            <Box sx={{ mb: 6, position: "relative" }}>
              <Box sx={{ position: "absolute", top: 18, left: "10%", right: "10%", height: 2, borderTop: "2px dashed rgba(139,111,201,0.2)", zIndex: 0 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
                {STEPS.map((label, i) => (
                  <Stack key={label} alignItems="center" spacing={1} sx={{ flex: 1 }}>
                    <Box sx={{ 
                      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: step > i ? "rgba(139,111,201,0.1)" : "#FFF",
                      border: `2px solid ${step >= i ? cPrimary : "rgba(0,0,0,0.1)"}`,
                      color: step > i ? cPrimary : step === i ? cPrimary : cTextMuted,
                      fontWeight: 800, fontSize: 13,
                      transition: "all 0.3s ease"
                    }}>
                      {step > i ? <Check sx={{ fontSize: 16 }} /> : i + 1}
                    </Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: step >= i ? 700 : 600, color: step >= i ? cPrimaryDark : cTextMuted, textAlign: "center" }}>
                      {label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ opacity: fadeState === "in" ? 1 : 0, transition: "opacity 0.2s ease" }}>
              {error && (
                <Box sx={{ p: 2, mb: 4, borderRadius: "12px", backgroundColor: "#FEF2F2", color: cDanger, fontSize: 13, fontWeight: 600, border: "1px solid #FECACA" }}>
                  {error}
                </Box>
              )}

              {/* ========================================================
                  STEP 1: PROFILE
                  ======================================================== */}
              {step === 0 && (
                <Stack spacing={4}>
                  <Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 900, color: cPrimaryDark, mb: 0.5, fontFamily: FONT_DISPLAY }}>Step 1 — Skin Profile</Typography>
                    <Typography sx={{ fontSize: 14, color: cTextMuted }}>Tell us a bit about yourself and your skin.</Typography>
                  </Box>

                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={4}>
                      <FieldLabel>Age</FieldLabel>
                      <TextField 
                        fullWidth placeholder="Enter your age" type="number" 
                        value={age} onChange={(e) => setAge(e.target.value)}
                        InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 600 }}>years</Typography> }}
                        sx={inputSx} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <FieldLabel>Gender</FieldLabel>
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        {GENDER_OPTIONS.map((g) => {
                          const isSel = gender === g.value;
                          return (
                            <Box key={g.value} onClick={() => setGender(g.value)} sx={{
                              flex: 1, minWidth: 90, py: 2, px: 1, borderRadius: "16px", cursor: "pointer",
                              textAlign: "center", transition: "all 0.2s",
                              background: isSel ? cBrandGradient : "rgba(255,255,255,0.5)",
                              border: `1px solid ${isSel ? "transparent" : cCardBorder}`,
                              boxShadow: isSel ? "0 8px 20px rgba(139,111,201,0.3)" : "none",
                              color: isSel ? "#FFF" : cTextDark,
                              "&:hover": { borderColor: isSel ? "transparent" : cPrimary }
                            }}>
                              <Typography sx={{ fontSize: 13, fontWeight: isSel ? 800 : 600 }}>{g.label}</Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Grid>
                  </Grid>

                  <Box>
                    <FieldLabel>What's your skin type?</FieldLabel>
                    <Grid container spacing={2}>
                      {SKIN_TYPES.map((t) => {
                        const isSel = skinType === t.value;
                        const details = SKIN_TYPE_DETAILS[t.value];
                        const Icon = details.icon;
                        return (
                          <Grid item xs={6} sm={4} key={t.value}>
                            <Box onClick={() => setSkinType(t.value)} sx={{
                              p: 2.5, borderRadius: "20px", cursor: "pointer", transition: "all 0.25s",
                              background: isSel ? cBrandGradient : "rgba(255,255,255,0.6)",
                              border: `1px solid ${isSel ? "transparent" : cCardBorder}`,
                              boxShadow: isSel ? "0 12px 24px rgba(139,111,201,0.3)" : "none",
                              color: isSel ? "#FFF" : cTextDark,
                              "&:hover": { borderColor: isSel ? "transparent" : cPrimary, transform: isSel ? "none" : "translateY(-2px)" }
                            }}>
                              <Stack alignItems="center" spacing={1.5}>
                                <Box sx={{ width: 44, height: 44, borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.2)" : "rgba(139,111,201,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon sx={{ fontSize: 22, color: isSel ? "#FFF" : cPrimary }} />
                                </Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{t.label}</Typography>
                              </Stack>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                    {skinType && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Box sx={{ mt: 3, p: 2, borderRadius: "16px", background: "rgba(139,111,201,0.08)", border: `1px dashed ${cPrimaryLight}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                          <AutoAwesome sx={{ color: cPrimary, fontSize: 20 }} />
                          <Typography sx={{ fontSize: 13, color: cTextDark, fontWeight: 600 }}>{SKIN_TYPE_DETAILS[skinType].desc}</Typography>
                        </Box>
                      </motion.div>
                    )}
                  </Box>
                </Stack>
              )}

              {/* ========================================================
                  STEP 2: CONCERNS
                  ======================================================== */}
              {step === 1 && (
                <Stack spacing={4}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography sx={{ fontSize: 24, fontWeight: 900, color: cPrimaryDark, mb: 0.5, fontFamily: FONT_DISPLAY, display: 'flex', alignItems: 'center', gap: 1 }}>
                        What are your skin concerns? <AutoAwesome sx={{ color: '#E4749B', fontSize: 22 }} />
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: cTextMuted }}>Select all that apply. This helps us personalize your skin analysis and recommendations.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, px: 2, borderRadius: '50px', border: '1px solid rgba(139,111,201,0.2)', background: '#FFF' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: cTextDark }}>Select all the concerns that apply to you</Typography>
                      <HelpOutlineOutlined sx={{ fontSize: 16, color: cPrimary }} />
                    </Box>
                  </Stack>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
                    {CONCERNS.map((c) => {
                      const isSel = concerns.includes(c.id);
                      return (
                        <Box key={c.id} onClick={() => toggleConcern(c.id)} sx={{
                          borderRadius: "12px", cursor: "pointer", transition: "all 0.2s ease",
                          background: "#FFF", overflow: "hidden", display: "flex", flexDirection: "column",
                          border: `1px solid ${isSel ? cPrimary : "rgba(0,0,0,0.08)"}`,
                          boxShadow: isSel ? "0 4px 12px rgba(139,111,201,0.15)" : "none",
                          position: "relative",
                          "&:hover": { borderColor: isSel ? cPrimary : "rgba(0,0,0,0.2)" }
                        }}>
                          {/* Square Checkbox Overlay */}
                          <Box sx={{ 
                            position: "absolute", top: 8, right: 8, zIndex: 2,
                            width: 20, height: 20, borderRadius: "4px", background: isSel ? cPrimary : "rgba(255,255,255,0.3)",
                            border: `2px solid ${isSel ? cPrimary : "#FFF"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s ease"
                          }}>
                            {isSel && <Check sx={{ fontSize: 14, color: "#FFF", fontWeight: 900 }} />}
                          </Box>

                          <Box sx={{ height: 110, width: "100%", position: "relative" }}>
                            <img src={c.image} alt={c.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </Box>
                          
                          <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                              <Spa sx={{ fontSize: 14, color: cPrimary }} />
                              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: cTextDark }}>{c.label}</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: 11, color: cTextMuted, lineHeight: 1.3 }}>{c.desc}</Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* "I'm not sure" row */}
                  <Box onClick={() => toggleConcern("not_sure")} sx={{ 
                    p: 2, borderRadius: "16px", cursor: "pointer", 
                    border: `1px solid ${notSure ? cPrimary : "rgba(0,0,0,0.08)"}`, 
                    background: "#FFF", display: "flex", alignItems: "center", gap: 2, 
                    transition: "all 0.2s ease", "&:hover": { borderColor: notSure ? cPrimary : "rgba(0,0,0,0.2)" } 
                  }}>
                     <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography sx={{ fontSize: 18, fontWeight: 900, color: cPrimary }}>?</Typography>
                     </Box>
                     <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark, mb: 0.25 }}>I'm not sure</Typography>
                        <Typography sx={{ fontSize: 12, color: cTextMuted }}>No worries! Upload a clear facial image in the next step and our AI will analyze your skin automatically.</Typography>
                     </Box>
                     {/* Radio button style circle */}
                     <Box sx={{ 
                        width: 22, height: 22, borderRadius: "50%", 
                        border: `2px solid ${notSure ? cPrimary : "rgba(0,0,0,0.2)"}`, 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        ml: 2
                     }}>
                        {notSure && <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: cPrimary }} />}
                     </Box>
                  </Box>
                  
                  {/* Buttons */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
                    <Button 
                      onClick={handleBack} 
                      startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                      sx={{ 
                        textTransform: "none", fontWeight: 700, fontSize: 13, color: cPrimary, 
                        border: `1px solid rgba(139,111,201,0.2)`, borderRadius: "50px", px: 3, py: 1,
                        "&:hover": { background: "rgba(139,111,201,0.05)" }
                      }}
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={handleNext}
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                      sx={{ 
                        textTransform: "none", fontWeight: 800, fontSize: 13, color: "#FFF", 
                        background: cBrandGradient, borderRadius: "50px", px: 4, py: 1.2,
                        boxShadow: "0 8px 20px rgba(139,111,201,0.3)",
                        "&:hover": { opacity: 0.9 }
                      }}
                    >
                      Next: Lifestyle Information
                    </Button>
                  </Stack>
                </Stack>
              )}

              {/* ========================================================
                  STEP 3: LIFESTYLE
                  ======================================================== */}
              {step === 2 && (
                <Stack spacing={4}>
                  <Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 900, color: cPrimaryDark, mb: 0.5, fontFamily: FONT_DISPLAY }}>Step 3 — Lifestyle</Typography>
                    <Typography sx={{ fontSize: 14, color: cTextMuted }}>Your daily habits deeply affect your skin barrier.</Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Sleep (hours/night)</FieldLabel>
                      <TextField fullWidth placeholder="e.g. 7" type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Water (liters/day)</FieldLabel>
                      <TextField fullWidth placeholder="e.g. 2" type="number" value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Exercise (mins/day)</FieldLabel>
                      <TextField fullWidth placeholder="e.g. 30" type="number" value={exerciseMinutes} onChange={(e) => setExerciseMinutes(e.target.value)} sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Sun Exposure</FieldLabel>
                      <TextField fullWidth placeholder="e.g. Mostly indoors" value={environmentalExposure} onChange={(e) => setEnvironmentalExposure(e.target.value)} sx={inputSx} />
                    </Grid>
                  </Grid>

                  <Box>
                    <FieldLabel>Stress Level</FieldLabel>
                    <Grid container spacing={2}>
                      {STRESS_LEVELS.map((level) => {
                        const isSel = stressLevel === level.value;
                        const details = STRESS_LEVEL_DETAILS[level.value];
                        return (
                          <Grid item xs={12} sm={4} key={level.value}>
                            <Box onClick={() => setStressLevel(level.value)} sx={{
                              p: 2.5, borderRadius: "20px", cursor: "pointer", transition: "all 0.25s",
                              background: isSel ? details.activeBg : "rgba(255,255,255,0.6)",
                              border: `1px solid ${isSel ? details.activeBorder : cCardBorder}`,
                              boxShadow: isSel ? `0 8px 24px ${details.activeBorder}40` : "none",
                              "&:hover": { borderColor: isSel ? details.activeBorder : cPrimary }
                            }}>
                              <Typography sx={{ fontSize: 15, fontWeight: 800, color: isSel ? details.activeText : cTextDark, mb: 0.5 }}>{level.label}</Typography>
                              <Typography sx={{ fontSize: 12, color: isSel ? details.activeText : cTextMuted, opacity: isSel ? 0.9 : 1 }}>{details.desc}</Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Stack>
              )}

              {/* ========================================================
                  NAVIGATION ACTIONS
                  ======================================================== */}
              <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ mt: 6, pt: 4, borderTop: `1px solid ${cCardBorder}` }}>
                <Button onClick={step === 0 ? onSkip : handleBack} sx={{ color: cTextMuted, fontWeight: 700, textTransform: "none", fontSize: 14, py: 1.5, px: 3, "&:hover": { color: cPrimaryDark, background: "rgba(139,111,201,0.05)" } }}>
                  {step === 0 ? "Skip for now" : "Back"}
                </Button>
                
                <Button 
                  onClick={step === STEPS.length - 1 ? handleSubmit : handleNext}
                  disabled={submitting}
                  endIcon={step === STEPS.length - 1 ? (submitting ? null : <Check />) : <ArrowForward />}
                  sx={{ 
                    background: cBrandGradient, 
                    color: "#FFF", 
                    fontWeight: 800, 
                    fontSize: 15, 
                    py: 1.5, 
                    px: 6, 
                    borderRadius: "16px",
                    textTransform: "none",
                    boxShadow: "0 8px 24px rgba(139,111,201,0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(139,111,201,0.4)" },
                    width: { xs: "100%", sm: "auto" },
                    mb: { xs: 2, sm: 0 }
                  }}
                >
                  {submitting ? "Analyzing..." : step === STEPS.length - 1 ? "Complete Analysis" : "Continue"}
                </Button>
              </Stack>

            </Box>
          </Box>
        </Box>
      </Box>

      {/* ==============================================
          RIGHT SIDE (35%) - ILLUSTRATION
          ============================================== */}
      <Box sx={{ 
        width: "35%", 
        display: { xs: "none", md: "block" }, 
        position: "fixed", 
        right: 0, top: 0, bottom: 0, 
        zIndex: 0 
      }}>
        <img src="/skin-assessment-bg.jpg" alt="Skincare Illustration" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {/* Soft luxury gradient overlay */}
        <Box sx={{ 
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
          background: "linear-gradient(to right, #FCFAFF 0%, rgba(252,250,255,0.7) 10%, rgba(228,116,155,0.15) 100%)",
          backdropFilter: "blur(2px)"
        }} />
      </Box>

    </Box>
  );
}
