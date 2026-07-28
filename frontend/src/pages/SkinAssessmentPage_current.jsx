import { useState, useEffect } from "react";
import { 
  Box, 
  Button, 
  Chip, 
  Container, 
  Stack, 
  Typography, 
  TextField, 
  Grid 
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
  ChevronRight
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
const cSecondaryLight = getThemeColor("secondaryLight", "#FCE4ED");
const cBrandGradient = getThemeColor("brandGradient", "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)");
const cCardBorder = getThemeColor("cardBorder", "rgba(139, 111, 201, 0.15)");
const cTextDark = getThemeColor("textDark", "#1C1917");
const cTextMuted = getThemeColor("textMuted", "#6B7280");
const cTextFaint = getThemeColor("textFaint", "#9CA3AF");
const cInputBg = getThemeColor("inputBg", "#FAF8F9");
const cSuccess = getThemeColor("success", "#10B981");
const cDanger = getThemeColor("danger", "#EF4444");
const cRoleAdminIcon = getThemeColor("roleAdmin.icon", "#8B6FC9");

// --- CSS Animations for Background Blobs ---
const animStyles = "@keyframes floatBlob1 { " +
  "0% { transform: translate(0px, 0px) scale(1); } " +
  "33% { transform: translate(40px, -30px) scale(1.06); } " +
  "66% { transform: translate(-40px, 30px) scale(0.94); } " +
  "100% { transform: translate(0px, 0px) scale(1); } " +
  "} " +
  "@keyframes floatBlob2 { " +
  "0% { transform: translate(0px, 0px) scale(1); } " +
  "50% { transform: translate(-50px, 40px) scale(0.94); } " +
  "100% { transform: translate(0px, 0px) scale(1); } " +
  "}";

// --- Visual Mapping Constants ---
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

const CONCERNS = ["Acne", "Hyperpigmentation", "Dark Spots", "Dry Skin", "Oily Skin", "Wrinkles", "Fine Lines", "Redness", "Uneven Skin Tone"];

const STRESS_LEVELS = [
  { value: "low", label: "Low", color: cSuccess },
  { value: "moderate", label: "Moderate", color: cRoleAdminIcon },
  { value: "high", label: "High", color: cDanger },
];

const STEPS = ["Skin Profile", "Concerns", "Lifestyle"];

const inputSx = {
  borderRadius: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.4)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  "& .MuiOutlinedInput-notchedOutline": { 
    borderColor: cCardBorder, 
    borderRadius: "16px",
    transition: "all 0.25s ease"
  },
  "&:hover .MuiOutlinedInput-notchedOutline": { 
    borderColor: cPrimaryLight,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { 
    borderColor: cPrimary + " !important", 
    borderWidth: "1.5px",
    boxShadow: "0 0 12px rgba(139, 111, 201, 0.12)"
  },
};

// --- Reusable Premium Layout Elements ---
function BackgroundBlobs() {
  return (
    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      <style dangerouslySetInnerHTML={{ __html: animStyles }} />
      <Box
        style={{
          position: "absolute",
          top: "-15%",
          left: "5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(230, 220, 247, 0.45) 0%, rgba(230, 220, 247, 0) 70%)",
          filter: "blur(90px)",
          animation: "floatBlob1 24s ease-in-out infinite",
        }}
      />
      <Box
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "5%",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(252, 228, 237, 0.5) 0%, rgba(252, 228, 237, 0) 70%)",
          filter: "blur(100px)",
          animation: "floatBlob2 28s ease-in-out infinite",
        }}
      />
    </Box>
  );
}

function StepIndicator({ current }) {
  return (
    <Box sx={{ width: "100%", maxWidth: 500, mx: "auto", mb: { xs: 4, sm: 6 }, position: "relative" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 2 }}>
        {STEPS.map((label, i) => {
          const isCompleted = current > i;
          const isActive = current === i;
          return (
            <Stack key={label} alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted
                    ? cBrandGradient
                    : isActive
                    ? "#FFFFFF"
                    : "rgba(255, 255, 255, 0.4)",
                  border: "2px solid " + (isCompleted ? "transparent" : isActive ? cPrimary : cCardBorder),
                  boxShadow: isActive
                    ? "0 0 20px rgba(139, 111, 201, 0.3)"
                    : "0 4px 12px rgba(0, 0, 0, 0.02)",
                  color: isCompleted ? "#FFFFFF" : isActive ? cPrimary : cTextMuted,
                  fontWeight: 700,
                  fontSize: 14,
                  transition: "all 0.3s ease",
                  transform: isActive ? "scale(1.06)" : "scale(1)",
                }}
              >
                {isCompleted ? <Check sx={{ fontSize: 16 }} /> : i + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: isActive || isCompleted ? 600 : 500,
                  color: isActive || isCompleted ? cTextDark : cTextFaint,
                  textAlign: "center",
                }}
              >
                {label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      {/* Progress connecting line */}
      <Box
        sx={{
          position: "absolute",
          top: 21,
          left: (100 / 6) + "%",
          right: (100 / 6) + "%",
          height: 2,
          backgroundColor: "rgba(139, 111, 201, 0.12)",
          zIndex: 1,
          transform: "translateY(-50%)",
        }}
      >
        <Box
          style={{
            height: "100%",
            background: cBrandGradient,
            borderRadius: "999px",
            width: ((current / (STEPS.length - 1)) * 100) + "%",
            transition: "width 0.4s ease-in-out",
          }}
        />
      </Box>
    </Box>
  );
}

function FieldLabel({ children }) {
  return (
    <Typography 
      sx={{ 
        fontSize: 14.5, 
        fontWeight: 700, 
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
  const [fadeState, setFadeState] = useState("in"); // "in" or "out" for smooth step transitions

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [allergiesText, setAllergiesText] = useState("");
  const [sensitivitiesText, setSensitivitiesText] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [environmentalExposure, setEnvironmentalExposure] = useState("");

  // Restore saved assessment from backend database on mount
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

    // Auto-save to backend database on Continue
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
        skin_concerns: concerns.map((c) => c.toLowerCase().replace(/\s+/g, "_")),
        allergies: allergiesText ? allergiesText.split(",").map((s) => s.trim()).filter(Boolean) : [],
        sensitivities: sensitivitiesText ? sensitivitiesText.split(",").map((s) => s.trim()).filter(Boolean) : [],
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        water_intake_liters: waterIntake ? parseFloat(waterIntake) : null,
        exercise_minutes: exerciseMinutes ? parseInt(exerciseMinutes, 10) : null,
        stress_level: stressLevel || null,
        environmental_exposure: environmentalExposure || null,
      };

      const result = await submitAssessment(payload).catch(() => null);

      // Save complete draft in localStorage for fast UI sync
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
    <Box 
      sx={{ 
        position: "relative",
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #F8F5FD 0%, #FFF5F7 50%, #F5F7FD 100%)", 
        py: { xs: 4, sm: 6 }, 
        px: { xs: 2.25, sm: 3 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        opacity: 1,
        transition: "opacity 0.6s ease"
      }}
    >
      <BackgroundBlobs />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        
        {/* --- Top Branding & Skip --- */}
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ mb: { xs: 4, sm: 6 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "12px",
                background: cBrandGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(139, 111, 201, 0.2)"
              }}
            >
              <Spa sx={{ fontSize: 19, color: "#FFFFFF" }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: cPrimaryDark, lineHeight: 1.1 }}>
                Skin AI
              </Typography>
              <Typography sx={{ fontSize: 10, color: cTextMuted, letterSpacing: "0.5px" }}>
                INTELLIGENT DERMATOLOGY
              </Typography>
            </Box>
          </Stack>

          {onSkip && (
            <Button
              onClick={onSkip}
              endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                color: cTextMuted,
                fontWeight: 600,
                fontSize: 13,
                px: 2,
                py: 0.8,
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: "1px solid " + cCardBorder,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  color: cTextDark,
                }
              }}
            >
              Skip
            </Button>
          )}
        </Stack>

        {/* --- Main Heading Block --- */}
        <Stack alignItems="center" spacing={0.5} sx={{ mb: 4, textAlign: "center" }}>
          <Typography 
            sx={{ 
              fontFamily: FONT_DISPLAY, 
              fontSize: { xs: 24, sm: 32 }, 
              fontWeight: 800, 
              color: cTextDark, 
              letterSpacing: "-0.5px",
              lineHeight: 1.2 
            }}
          >
            Let's Get to Know Your Skin
          </Typography>
          <Typography sx={{ color: cTextMuted, fontSize: 14, maxWidth: 360, mt: 0.5 }}>
            A premium onboarding flow to customize and track your personal skincare journey.
          </Typography>
        </Stack>

        <StepIndicator current={step} />

        {/* --- Glassmorphic Card Container --- */}
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(24px)",
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.55)",
            boxShadow: "0 24px 50px rgba(139, 111, 201, 0.08)",
            p: { xs: 3, sm: 4.5, md: 5.5 },
            position: "relative",
            opacity: fadeState === "in" ? 1 : 0,
            transform: fadeState === "in" ? "translateY(0px)" : "translateY(12px)",
            transition: "opacity 0.22s ease-out, transform 0.22s ease-out",
          }}
        >
          {/* --- STEP 0: Skin Profile --- */}
          {step === 0 && (
            <Stack spacing={4.25}>
              <Box>
                <FieldLabel>Basic Profile Information</FieldLabel>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Age" 
                      type="number" 
                      fullWidth 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      InputProps={{ sx: inputSx }} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextMuted, mb: 1, ml: 0.5 }}>
                      Gender Preference
                    </Typography>
                    <Box 
                      sx={{ 
                        display: "flex", 
                        flexWrap: "wrap", 
                        gap: 0.75, 
                        p: 0.75, 
                        borderRadius: "16px", 
                        backgroundColor: "rgba(255, 255, 255, 0.4)", 
                        border: "1px solid " + cCardBorder
                      }}
                    >
                      {GENDER_OPTIONS.map((opt) => {
                        const isSelected = gender === opt.value;
                        return (
                          <Box key={opt.value} sx={{ flex: 1, minWidth: { xs: "calc(50% - 6px)", sm: "80px" } }}>
                            <Button
                              fullWidth
                              onClick={() => setGender(opt.value)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "12px",
                                py: 1,
                                fontSize: 12,
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? "#FFFFFF" : cTextMuted,
                                background: isSelected ? cBrandGradient : "transparent",
                                boxShadow: isSelected ? "0 4px 12px rgba(139, 111, 201, 0.2)" : "none",
                                transition: "all 0.25s ease",
                                "&:hover": {
                                  backgroundColor: isSelected ? undefined : "rgba(139, 111, 201, 0.05)",
                                }
                              }}
                            >
                              {opt.label}
                            </Button>
                          </Box>
                        );
                      })}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <FieldLabel>What is your skin type?</FieldLabel>
                <Grid container spacing={2}>
                  {SKIN_TYPES.map((t) => {
                    const details = SKIN_TYPE_DETAILS[t.value] || { label: t.label, desc: "", icon: CheckCircle };
                    const Icon = details.icon || CheckCircle;
                    const isSelected = skinType === t.value;
                    return (
                      <Grid item xs={12} sm={6} key={t.value}>
                        <Box
                          onClick={() => setSkinType(t.value)}
                          sx={{
                            p: 2.25,
                            borderRadius: "18px",
                            border: "1.5px solid " + (isSelected ? cPrimary : cCardBorder),
                            backgroundColor: isSelected ? "rgba(139, 111, 201, 0.05)" : "#FFFFFF",
                            boxShadow: isSelected ? "0 8px 24px rgba(139, 111, 201, 0.08)" : "0 4px 10px rgba(0, 0, 0, 0.01)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              transform: "translateY(-1px)",
                            },
                            "&:active": {
                              transform: "scale(0.99)",
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "10px",
                              backgroundColor: isSelected ? cPrimary : cInputBg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isSelected ? "#FFFFFF" : cTextMuted,
                              flexShrink: 0,
                              transition: "all 0.25s",
                            }}
                          >
                            <Icon sx={{ fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: cTextDark }}>
                              {details.label}
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: cTextMuted, mt: 0.25, lineHeight: 1.3 }}>
                              {details.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Stack>
          )}

          {/* --- STEP 1: Concerns & Sensitivities --- */}
          {step === 1 && (
            <Stack spacing={4}>
              <Box>
                <FieldLabel>What are your skin concerns?</FieldLabel>
                <Typography sx={{ fontSize: 12.5, color: cTextMuted, mb: 2 }}>
                  Select the primary targets you want us to address (Select all that apply)
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1.25 }}>
                  {CONCERNS.map((c) => {
                    const isSelected = concerns.includes(c);
                    return (
                      <Chip
                        key={c}
                        label={c}
                        onClick={() => toggleConcern(c)}
                        sx={{
                          borderRadius: "999px",
                          fontWeight: 600,
                          fontSize: 13,
                          height: 38,
                          px: 1.5,
                          background: isSelected ? cBrandGradient : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : cTextMuted,
                          border: "1.5px solid " + (isSelected ? "transparent" : cCardBorder),
                          boxShadow: isSelected ? "0 4px 12px rgba(139, 111, 201, 0.25)" : "0 2px 6px rgba(0, 0, 0, 0.01)",
                          transition: "all 0.2s ease-in-out",
                          "& .MuiChip-label": { px: 1 },
                          "&:hover": { 
                            backgroundColor: isSelected ? undefined : "rgba(139, 111, 201, 0.05)",
                            transform: "translateY(-1px)"
                          },
                          "&:active": {
                            transform: "scale(0.97)"
                          }
                        }}
                        icon={isSelected ? <Check sx={{ "&&": { color: "#FFFFFF", fontSize: 15, marginLeft: "4px" } }} /> : undefined}
                      />
                    );
                  })}
                </Stack>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Allergies"
                    placeholder="e.g. fragrance, sulfates"
                    helperText="Separate multiple with commas"
                    fullWidth
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    InputProps={{ sx: inputSx }}
                    FormHelperTextProps={{ sx: { ml: 0.5, mt: 0.75, color: cTextFaint } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Sensitivities"
                    placeholder="e.g. sun exposure, alcohol"
                    helperText="Separate multiple with commas"
                    fullWidth
                    value={sensitivitiesText}
                    onChange={(e) => setSensitivitiesText(e.target.value)}
                    InputProps={{ sx: inputSx }}
                    FormHelperTextProps={{ sx: { ml: 0.5, mt: 0.75, color: cTextFaint } }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* --- STEP 2: Lifestyle Habits --- */}
          {step === 2 && (
            <Stack spacing={4}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Spa sx={{ fontSize: 20, color: cSecondary }} />
                <FieldLabel>Lifestyle & Habits</FieldLabel>
              </Stack>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Sleep hours / night" 
                    type="number" 
                    fullWidth 
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(e.target.value)} 
                    InputProps={{ sx: inputSx }} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Water intake (L/day)" 
                    type="number" 
                    fullWidth 
                    value={waterIntake} 
                    onChange={(e) => setWaterIntake(e.target.value)} 
                    InputProps={{ sx: inputSx }} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="Exercise (minutes/day)" 
                    type="number" 
                    fullWidth 
                    value={exerciseMinutes} 
                    onChange={(e) => setExerciseMinutes(e.target.value)} 
                    InputProps={{ sx: inputSx }} 
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: cTextDark, mb: 2 }}>
                  Daily Stress Level
                </Typography>
                <Grid container spacing={2}>
                  {STRESS_LEVELS.map((s) => {
                    const isSelected = stressLevel === s.value;
                    const details = STRESS_LEVEL_DETAILS[s.value] || {};
                    return (
                      <Grid item xs={12} sm={4} key={s.value}>
                        <Box
                          onClick={() => setStressLevel(s.value)}
                          sx={{
                            p: 2.25,
                            borderRadius: "18px",
                            border: "1.5px solid " + (isSelected ? (details.activeBorder || cPrimary) : cCardBorder),
                            backgroundColor: isSelected ? (details.activeBg || "rgba(139,111,201,0.05)") : "#FFFFFF",
                            boxShadow: isSelected ? "0 8px 24px rgba(0, 0, 0, 0.05)" : "0 4px 10px rgba(0, 0, 0, 0.01)",
                            cursor: "pointer",
                            textAlign: "center",
                            height: "100%",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            transition: "all 0.25s ease-in-out",
                            "&:hover": {
                              transform: "translateY(-1px)",
                            },
                            "&:active": {
                              transform: "scale(0.99)",
                            }
                          }}
                        >
                          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: isSelected ? (details.activeText || cPrimaryDark) : cTextDark }}>
                            {s.label}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: cTextMuted, mt: 0.5, lineHeight: 1.3 }}>
                            {details.desc || ""}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              <TextField
                label="Environmental exposure"
                placeholder="e.g. high pollution, frequent sun exposure"
                fullWidth
                value={environmentalExposure}
                onChange={(e) => setEnvironmentalExposure(e.target.value)}
                InputProps={{ sx: inputSx }}
              />
            </Stack>
          )}

          {/* --- Error Message Display --- */}
          {error && (
            <Typography sx={{ color: cDanger, fontSize: 13, fontWeight: 600, textAlign: "center", mt: 3 }}>
              {error}
            </Typography>
          )}

          {/* --- Bottom Navigation Control Bar --- */}
          <Stack 
            direction="row" 
            spacing={1.5} 
            sx={{ mt: 5, pt: 3, borderTop: "1px solid " + cCardBorder }}
          >
            {step > 0 && (
              <Button
                onClick={handleBack}
                startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: "none",
                  borderRadius: "14px",
                  fontWeight: 600,
                  fontSize: 14,
                  color: cTextMuted,
                  border: "1.5px solid " + cCardBorder,
                  px: { xs: 2.5, sm: 3.5 },
                  backgroundColor: "transparent",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    backgroundColor: "rgba(139, 111, 201, 0.05)",
                    color: cTextDark
                  }
                }}
              >
                Back
              </Button>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{ 
                  textTransform: "none", 
                  borderRadius: "16px", 
                  fontWeight: 700, 
                  fontSize: 14, 
                  color: "#fff", 
                  background: cBrandGradient, 
                  py: 1.5,
                  px: 4,
                  boxShadow: "0 10px 24px rgba(139, 111, 201, 0.3)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 14px 30px rgba(139, 111, 201, 0.4)",
                    transform: "translateY(-1px)"
                  },
                  "&:active": {
                    transform: "scale(0.98)"
                  }
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{ 
                  textTransform: "none", 
                  borderRadius: "16px", 
                  fontWeight: 700, 
                  fontSize: 14, 
                  color: "#fff", 
                  background: cBrandGradient, 
                  py: 1.5,
                  px: 4,
                  boxShadow: "0 10px 24px rgba(139, 111, 201, 0.3)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 14px 30px rgba(139, 111, 201, 0.4)",
                    transform: "translateY(-1px)"
                  },
                  "&:active": {
                    transform: "scale(0.98)"
                  }
                }}
              >
                {submitting ? "Saving..." : "Finish & Go to Dashboard"}
              </Button>
            )}
          </Stack>

        </Box>
      </Container>

      {/* --- Footer Caption Note --- */}
      <Box sx={{ position: "relative", zIndex: 1, mt: { xs: 4, sm: 6 }, textAlign: "center" }}>
        <Typography sx={{ fontSize: 11.5, color: cTextFaint, fontStyle: "italic" }}>
          "Healthy skin is a reflection of overall wellness."
        </Typography>
      </Box>
    </Box>
  );
}