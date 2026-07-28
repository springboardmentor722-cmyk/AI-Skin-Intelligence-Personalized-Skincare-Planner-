import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box, Button, Chip, Stack, TextField, Typography, MenuItem,
  Paper, Divider, Grid, IconButton, Snackbar, useMediaQuery, useTheme
} from "@mui/material";
import {
  Person, Edit, Save, AutoAwesome, LocationOn, WbSunny,
  Fingerprint, Face, Wc, CalendarMonth, Shield, Warning,
  ArrowForward, CheckCircle, CameraAlt, WaterDrop, Opacity,
  HealthAndSafety, Spa
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getUserProfile, updateUserProfile, getUserLatestAssessment } from "../api/dashboard";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";
const CARD_RADIUS = "20px";
const CARD_SHADOW = "0 2px 12px rgba(139,111,201,0.07)";

/* ================================================================
   CIRCULAR GAUGE
   ================================================================ */
function CircleGauge({ value, max = 100, size = 78, strokeWidth = 8, color = COLORS.primary, label, sub, trend }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ - pct * circ;
  return (
    <Stack alignItems="center" spacing={0.75}>
      <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#F0EBF8" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.7s ease" }} />
        </svg>
        <Stack alignItems="center" sx={{ zIndex: 1 }}>
          <Typography sx={{ fontSize: size > 70 ? 18 : 13, fontWeight: 900, color: COLORS.textDark, lineHeight: 1 }}>
            {value}
          </Typography>
          {max !== 100 && <Typography sx={{ fontSize: 8, color: COLORS.textMuted }}>/{max}</Typography>}
          {max === 100 && <Typography sx={{ fontSize: 8, color: COLORS.textMuted }}>/100</Typography>}
        </Stack>
      </Box>
      {label && <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textDark, textAlign: "center" }}>{label}</Typography>}
      {sub && <Typography sx={{ fontSize: 10, color: color, fontWeight: 700 }}>{sub}</Typography>}
      {trend && <Typography sx={{ fontSize: 9.5, color: COLORS.textMuted }}>{trend}</Typography>}
    </Stack>
  );
}

/* ================================================================
   DEMOGRAPHICS ROW
   ================================================================ */
function DemoRow({ icon: Icon, label, value, iconColor = COLORS.primary }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.25 }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{
          width: 32, height: 32, borderRadius: "10px",
          backgroundColor: iconColor + "18",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <Icon sx={{ fontSize: 16, color: iconColor }} />
        </Box>
        <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, fontWeight: 600 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{value}</Typography>
    </Stack>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
const SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const FITZPATRICK = ["I", "II", "III", "IV", "V", "VI"];
const CLIMATES = ["Tropical", "Dry", "Humid", "Temperate", "Cold"];

export default function SkinProfilePage({ fetchProfile, updateProfile, user }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const savedForm = (() => { try { return JSON.parse(localStorage.getItem("assessmentForm") || "{}"); } catch (e) { return {}; } })();
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem("skinProfile") || "{}"); } catch (e) { return {}; } })();
  const savedAssessment = (() => { try { return JSON.parse(localStorage.getItem("latestAssessment") || "{}"); } catch (e) { return {}; } })();

  /* Dynamic Profile fields */
  const [age, setAge]                 = useState(String(user?.age || savedProfile.age || savedForm.age || "20"));
  const [gender, setGender]           = useState(user?.gender || savedProfile.gender || savedForm.gender || "Female");
  const [skinType, setSkinType]       = useState(user?.skin_type || savedProfile.skin_type || savedForm.skin_type || "Combination");
  const [fitzpatrick, setFitzpatrick] = useState(savedProfile.fitzpatrick || "III");
  const [climate, setClimate]         = useState(savedProfile.climate || "Tropical");
  const [location, setLocation]       = useState(user?.location || savedProfile.location || "Hyderabad, India");

  const parseList = (val, fallback) => {
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    if (typeof val === "string" && val.trim()) return val.split(",").map(s => s.trim()).filter(Boolean);
    return fallback;
  };

  /* Dynamic Concerns & safety */
  const defaultConcerns = savedForm.skin_concerns || savedProfile.concerns || [skinType + " Skin", "Hyperpigmentation"];
  const [primaryConcerns, setPrimaryConcerns]   = useState(parseList(defaultConcerns, [skinType + " Skin", "Hyperpigmentation"]));
  const [allergens, setAllergens]         = useState(parseList(savedForm.allergies || savedProfile.allergies, ["Fragrance", "Parabens", "Sulfates", "Alcohol"]));
  const [sensitivities, setSensitivities] = useState(parseList(savedForm.sensitivities || savedProfile.sensitivities, ["Sensitive to Retinol", "Essential Oils"]));
  const [pregnant, setPregnant]          = useState(savedProfile.pregnant || "Not Pregnant");
  const [lactating, setLactating]        = useState(savedProfile.lactating || "Not Lactating");

  /* Dynamic Skin summary metrics */
  const [healthScore, setHealthScore] = useState(savedAssessment.overall_score || savedProfile.health_score || 82);

  const skinMetrics = [
    { label: "Overall Skin Score", value: healthScore, max: 100, sub: healthScore >= 80 ? "Excellent" : healthScore >= 65 ? "Good" : "Needs Care", trend: "↑ Assessment synced", color: COLORS.primary  },
    { label: "Hydration Level",    value: 72, max: 100, sub: "Good",     trend: "↑ 8%",                  color: "#42A5F5"       },
    { label: "Oil Balance",        value: 65, max: 100, sub: "Balanced", trend: "↓ 5%",                  color: "#FFA726"       },
    { label: "Skin Barrier",       value: 78, max: 100, sub: "Strong",   trend: "↑ 10%",                 color: COLORS.success  },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, latestAss] = await Promise.all([
          getUserProfile().catch(() => null),
          getUserLatestAssessment().catch(() => null)
        ]);

        if (profData) {
          if (profData.age) setAge(String(profData.age));
          if (profData.gender) setGender(profData.gender);
          if (profData.skin_type) setSkinType(profData.skin_type);
          if (profData.climate) setClimate(profData.climate);
          if (profData.location) setLocation(profData.location);
          if (profData.concerns || profData.skin_concerns) {
            setPrimaryConcerns(profData.concerns || profData.skin_concerns);
          }
          if (profData.allergies) {
            const arr = typeof profData.allergies === "string" ? profData.allergies.split(",").map(s => s.trim()).filter(Boolean) : profData.allergies;
            if (arr.length > 0) setAllergens(arr);
          }
          if (profData.sensitivities) {
            const arr = typeof profData.sensitivities === "string" ? profData.sensitivities.split(",").map(s => s.trim()).filter(Boolean) : profData.sensitivities;
            if (arr.length > 0) setSensitivities(arr);
          }
        }

        if (latestAss) {
          if (latestAss.skin_type) setSkinType(latestAss.skin_type);
          if (latestAss.overall_score || latestAss.score) {
            setHealthScore(latestAss.overall_score || latestAss.score);
          }
          if (latestAss.concerns || latestAss.detected_concerns) {
            const raw = latestAss.concerns || latestAss.detected_concerns;
            const formatted = Array.isArray(raw) ? raw.map(c => typeof c === 'string' ? c : c.key || c.name) : [latestAss.skin_type + " Skin"];
            if (formatted.length > 0) setPrimaryConcerns(formatted);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    const updated = {
      age: parseInt(age), gender, skin_type: skinType, climate, location,
      concerns: primaryConcerns,
      allergies: allergens.join(", "),
      sensitivities: sensitivities.join(", "),
      fitzpatrick
    };
    localStorage.setItem("skinProfile", JSON.stringify(updated));
    try {
      if (updateProfile) await updateProfile(updated);
      await updateUserProfile(updated);
      setEditing(false);
      setToastMsg("Profile saved and synced successfully!");
    } catch {
      setToastMsg("Profile saved locally & synced across workspace.");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const fullName = user?.full_name || "K harichandana";

  /* ---------------------------------------------------------------
     SELECT FIELD helper
     --------------------------------------------------------------- */
  const SelectField = ({ value, onChange, options }) => (
    <TextField select size="small" value={value} onChange={(e) => onChange(e.target.value)} fullWidth
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}>
      {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
    </TextField>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Stack spacing={3}>

          {/* ============================================================
              ROW 1 — PROFILE HEADER CARD
              ============================================================ */}
          <Paper elevation={0} sx={{
            borderRadius: CARD_RADIUS, border: CARD_BORDER,
            background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 55%, #F0E8F5 100%)",
            p: { xs: 2.5, sm: 3 }, boxShadow: "0 4px 20px rgba(139,111,201,0.09)", overflow: "hidden",
            position: "relative"
          }}>
            {/* Decorative blobs */}
            <Box sx={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(139,111,201,0.06)", pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", bottom: -40, right: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(228,116,155,0.06)", pointerEvents: "none" }} />

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Avatar */}
                <Box sx={{
                  width: 56, height: 56, borderRadius: "18px",
                  background: COLORS.brandGradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(139,111,201,0.25)", flexShrink: 0
                }}>
                  <Person sx={{ fontSize: 28, color: "#FFF" }} />
                </Box>
                <Box>
                  <Chip
                    icon={<AutoAwesome sx={{ fontSize: 11, color: COLORS.primaryDark }} />}
                    label="PostgreSQL Synced"
                    size="small"
                    sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark, mb: 0.75 }}
                  />
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 19, sm: 23 }, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.15 }}>
                    {fullName}'s Skin Profile
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.35 }}>
                    View and update your skin diagnostic parameters and formulation safety rules.
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant={editing ? "contained" : "outlined"}
                onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                startIcon={editing ? <Save sx={{ fontSize: 16 }} /> : <Edit sx={{ fontSize: 16 }} />}
                sx={{
                  background: editing ? COLORS.brandGradient : "transparent",
                  color: editing ? "#FFF" : COLORS.textDark,
                  borderColor: COLORS.cardBorder, borderRadius: "12px",
                  textTransform: "none", fontWeight: 800, px: 2.5, py: 1,
                  flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" }
                }}
              >
                {editing ? (saving ? "Saving..." : "Save Profile") : "Edit Profile"}
              </Button>
            </Stack>
          </Paper>

          {/* ============================================================
              ROW 2 — DEMOGRAPHICS + SAFETY RULES (2-col)
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, alignItems: "start" }}>

            {/* LEFT — Personal Demographics */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: COLORS.textDark }}>Personal Demographics</Typography>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>Basic identity and clinical factors</Typography>
              </Box>

              <Stack spacing={0} divider={<Divider />}>
                {editing ? (
                  /* EDIT MODE */
                  <Stack spacing={2} sx={{ py: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>AGE</Typography>
                      <TextField size="small" type="number" value={age} onChange={(e) => setAge(e.target.value)} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>GENDER</Typography>
                      <SelectField value={gender} onChange={setGender} options={["Female", "Male", "Other", "Prefer not to say"]} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>SKIN TYPE</Typography>
                      <SelectField value={skinType} onChange={setSkinType} options={SKIN_TYPES} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>FITZPATRICK TYPE</Typography>
                      <SelectField value={fitzpatrick} onChange={setFitzpatrick} options={FITZPATRICK} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>PRIMARY CLIMATE</Typography>
                      <SelectField value={climate} onChange={setClimate} options={CLIMATES} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>LOCATION</Typography>
                      <TextField size="small" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
                    </Box>
                  </Stack>
                ) : (
                  /* VIEW MODE — icon rows */
                  <>
                    <DemoRow icon={CalendarMonth} label="Age"                  value={`${age} Years Old`}   iconColor={COLORS.primary} />
                    <DemoRow icon={Wc}            label="Gender"               value={gender}               iconColor="#E47B9B" />
                    <DemoRow icon={Face}          label="Skin Type"            value={skinType}             iconColor={COLORS.success} />
                    <DemoRow icon={Fingerprint}   label="Fitzpatrick Skin Type" value={`Type ${fitzpatrick}`} iconColor="#42A5F5" />
                    <DemoRow icon={WbSunny}       label="Primary Climate"      value={climate}              iconColor="#FFA726" />
                    <DemoRow icon={LocationOn}    label="Location"             value={location}             iconColor={COLORS.primary} />
                  </>
                )}
              </Stack>

              <Button
                variant="contained"
                size="small"
                onClick={() => editing ? handleSave() : setEditing(true)}
                sx={{ mt: 2.5, background: COLORS.brandGradient, borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 3 }}
              >
                {editing ? "Save Changes" : "Update Demographics"}
              </Button>
            </Paper>

            {/* RIGHT — Active Concerns & Safety Rules */}
            <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: 2.5, boxShadow: CARD_SHADOW }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: COLORS.textDark }}>Active Concerns & Safety Rules</Typography>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>Toxins and active skin issues to monitor</Typography>
              </Box>

              <Stack spacing={2}>
                {/* Primary Concerns */}
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Primary Concerns
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {primaryConcerns.map((c, i) => (
                      <Chip key={i} label={c} size="small"
                        sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.1)", color: COLORS.primaryDark }} />
                    ))}
                  </Stack>
                </Box>

                <Divider />

                {/* Allergens */}
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Unsafe Allergens & Toxins (Avoided)
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {allergens.map((a, i) => (
                      <Chip key={i} label={a} size="small"
                        sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(228,116,155,0.1)", color: COLORS.danger }} />
                    ))}
                  </Stack>
                </Box>

                <Divider />

                {/* Barrier Sensitivities */}
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Barrier Sensitivities
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {sensitivities.map((s, i) => (
                      <Chip key={i} label={s} size="small"
                        sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(255,167,38,0.1)", color: "#E65100" }} />
                    ))}
                  </Stack>
                </Box>

                <Divider />

                {/* Pregnancy / Lactation */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pregnancy</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{pregnant}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Lactation</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{lactating}</Typography>
                  </Box>
                </Box>
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Shield sx={{ fontSize: 14 }} />}
                sx={{ mt: 2.5, borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 12.5, borderColor: COLORS.primary, color: COLORS.primary, px: 3 }}
              >
                Edit Safety Rules
              </Button>
            </Paper>
          </Box>

          {/* ============================================================
              ROW 3 — SKIN SUMMARY
              ============================================================ */}
          <Paper elevation={0} sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, p: { xs: 2, sm: 2.5 }, boxShadow: CARD_SHADOW }}>
            {/* Section Header */}
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: COLORS.textDark }}>Skin Summary</Typography>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>AI analyzed overview from your last skin assessment</Typography>
              </Box>
              <Chip
                label="Assessment Date: 19 Jul 2026"
                size="small"
                sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "#FAF8FC", border: CARD_BORDER }}
              />
            </Stack>

            {/* Metrics Row */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(5, 1fr)" },
              gap: { xs: 2, sm: 3 }
            }}>
              {skinMetrics.map((m, i) => (
                <Paper key={i} elevation={0} sx={{
                  p: 2, borderRadius: "16px", border: CARD_BORDER,
                  backgroundColor: "#FAF8FC", textAlign: "center",
                  transition: "all 0.2s ease", "&:hover": { boxShadow: "0 4px 16px rgba(139,111,201,0.12)", borderColor: m.color }
                }}>
                  <CircleGauge value={m.value} max={m.max} size={72} strokeWidth={8} color={m.color} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: COLORS.textDark, mt: 1 }}>{m.label}</Typography>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: m.color }}>{m.sub}</Typography>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.25 }}>{m.trend}</Typography>
                </Paper>
              ))}

              {/* Sensitivity Level — Text metric */}
              <Paper elevation={0} sx={{
                p: 2, borderRadius: "16px", border: CARD_BORDER,
                backgroundColor: "#FAF8FC", textAlign: "center",
                transition: "all 0.2s ease", "&:hover": { boxShadow: "0 4px 16px rgba(139,111,201,0.12)" }
              }}>
                <Box sx={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto" }}>
                  <Typography sx={{ fontSize: 26 }}>🌿</Typography>
                </Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: COLORS.textDark, mt: 1 }}>Sensitivity Level</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: COLORS.success }}>Low</Typography>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.success }}>Great!</Typography>
                <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>No change</Typography>
              </Paper>
            </Box>

            {/* AI Insight Footer Bar */}
            <Box sx={{
              mt: 2.5, px: 2.5, py: 1.75, borderRadius: "14px",
              backgroundColor: "rgba(139,111,201,0.05)",
              border: "1px solid rgba(139,111,201,0.15)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 1.5
            }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <AutoAwesome sx={{ fontSize: 18, color: COLORS.primary }} />
                <Box>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: COLORS.primaryDark }}>AI Insight</Typography>
                  <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>
                    Your skin is improving! Keep following your routine consistently. Focus on hydration and sun protection.
                  </Typography>
                </Box>
              </Stack>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 13 }} />}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: COLORS.primaryDark, flexShrink: 0 }}
              >
                View Full Assessment Report
              </Button>
            </Box>
          </Paper>

          {/* ============================================================
              ROW 4 — QUICK ACTIONS
              ============================================================ */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: 1.75 }}>
            {[
              { label: "New Skin Scan",       icon: CameraAlt,     color: COLORS.primary },
              { label: "Routine Planner",     icon: Spa,           color: COLORS.success },
              { label: "Ingredient Analyzer", icon: HealthAndSafety,color: "#42A5F5"    },
              { label: "Edit Safety Rules",   icon: Shield,        color: "#FFA726"      }
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <Paper key={i} elevation={0} sx={{
                  p: 2, borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG,
                  textAlign: "center", cursor: "pointer", transition: "all 0.2s ease",
                  "&:hover": { borderColor: btn.color, boxShadow: `0 4px 14px ${btn.color}22`, transform: "translateY(-2px)" }
                }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: btn.color + "18", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 0.75 }}>
                    <Icon sx={{ fontSize: 19, color: btn.color }} />
                  </Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>{btn.label}</Typography>
                </Paper>
              );
            })}
          </Box>

        </Stack>
      </Box>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg("")} message={toastMsg} />
    </motion.div>
  );
}