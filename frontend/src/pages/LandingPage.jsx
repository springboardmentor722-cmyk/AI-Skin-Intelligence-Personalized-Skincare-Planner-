import { useState, useEffect } from "react";
import {
  Box, Stack, Typography, Button, Avatar, Accordion, AccordionSummary, AccordionDetails, IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Spa, FaceRetouchingNatural, EventNote, ScienceOutlined, PsychologyOutlined,
  WbSunnyOutlined, TrendingUp, SupportAgentOutlined, LockOutlined, ExpandMore, ChevronLeft, ChevronRight,
  StarRounded, ArrowForward, VerifiedUserOutlined, GroupsOutlined, MemoryOutlined, HealthAndSafetyOutlined,
  Visibility,
} from "@mui/icons-material";

// Fallback for framer-motion ESM resolution issues in Create React App / Webpack 5
const MotionDiv = motion?.div || "div";

// ============================================================
// DESIGN TOKENS — exact palette from brief
// ============================================================
const C = {
  primary: "#8B5CF6",
  secondary: "#C4B5FD",
  accent: "#F9A8D4",
  bg1: "#FFFDF9",
  bg2: "#FAF6F1",
  white: "#FFFFFF",
  text: "#2F3542",
  textMuted: "#6B7280",
  gradient: "linear-gradient(135deg, #8B5CF6 0%, #F9A8D4 100%)",
  border: "rgba(139,92,246,0.14)",
};
const DISPLAY_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Inter', 'Segoe UI', Arial, sans-serif";

function initialsAvatar(name, size = 46) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <Avatar sx={{ width: size, height: size, background: C.gradient, fontWeight: 700, fontSize: size * 0.36 }}>
      {initials}
    </Avatar>
  );
}

function SectionEyebrow({ children }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: C.primary, textTransform: "uppercase", mb: 1.25, textAlign: "center" }}>
      {children}
    </Typography>
  );
}

function SectionTitle({ children, sx = {} }) {
  return (
    <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: 28, sm: 36 }, fontWeight: 700, color: C.text, textAlign: "center", mb: { xs: 4, sm: 6 }, ...sx }}>
      {children}
    </Typography>
  );
}

// ============================================================
// NAV
// ============================================================
function Nav({ onLogin, onGetStarted, activeSection }) {
  const links = [
    { label: "Home", id: "home" },
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Results", id: "results" },
    { label: "Reviews", id: "reviews" },
    { label: "About", id: "about" },
    { label: "FAQ", id: "faq" }
  ];

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255,253,249,0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid " + C.border,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 }, py: 1.75 }}>
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={1.5}
          onClick={() => handleScroll("home")}
          aria-label="Skin AI Home"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleScroll("home");
            }
          }}
          sx={{ 
            cursor: "pointer",
            outline: "none",
            "&:focus-visible": {
              outline: "2px solid " + C.primary,
              outlineOffset: "4px",
              borderRadius: "4px"
            },
            "&:hover .brand-logo": {
              transform: "scale(1.06) rotate(8deg)",
            }
          }}
        >
          {/* Custom SVG logo mimicking the face profile gradient silhouette */}
          <Box 
            className="brand-logo"
            sx={{ 
              width: 38, 
              height: 38, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transformOrigin: "center"
            }}
          >
            <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" stroke="url(#logoGrad)" strokeWidth="3" fill="none" />
              <path
                d="M48 28 
                   C42 28, 38 33, 38 38 
                   C38 41, 35 43, 33 45 
                   C36 46, 37 47, 37 49 
                   C35 51, 38 52, 39 54 
                   C39 56, 36 58, 36 60 
                   C37 64, 43 67, 46 67
                   C51 67, 54 62, 54 48
                   C54 33, 51 28, 48 28 Z"
                fill="url(#logoGrad)"
                opacity="0.9"
              />
              <circle cx="62" cy="40" r="2.5" fill="#FBBF24" />
              <circle cx="65" cy="58" r="2" fill="#EC4899" />
            </svg>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: BODY_FONT, fontSize: 19.5, fontWeight: 900, color: C.primary, lineHeight: 1.1, letterSpacing: "-0.5px" }}>Skin AI</Typography>
            <Typography sx={{ fontFamily: BODY_FONT, fontSize: 9.5, color: C.textMuted, fontWeight: 700, mt: 0.1 }}>AI Skin Intelligence</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={4} sx={{ display: { xs: "none", lg: "flex" } }} role="navigation" aria-label="Main Navigation">
          {links.map((link) => (
            <Typography 
              key={link.id} 
              onClick={() => handleScroll(link.id)}
              aria-label={`Scroll to ${link.label}`}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleScroll(link.id);
                }
              }}
              sx={{ 
                fontFamily: BODY_FONT,
                fontSize: 14.5, 
                fontWeight: 700, 
                color: activeSection === link.id ? C.primary : C.text, 
                cursor: "pointer", 
                transition: "all 0.25s ease",
                position: "relative",
                outline: "none",
                "&:focus-visible": {
                  outline: "2px solid " + C.primary,
                  outlineOffset: "4px",
                  borderRadius: "2px"
                },
                "&:after": {
                  content: '""',
                  position: "absolute",
                  bottom: -4,
                  left: "50%",
                  width: activeSection === link.id ? "100%" : "0%",
                  height: "2.5px",
                  backgroundColor: C.primary,
                  transform: "translateX(-50%)",
                  transition: "all 0.25s ease"
                },
                "&:hover": { 
                  color: C.primary,
                  "&:after": {
                    width: "100%"
                  }
                } 
              }}
            >
              {link.label}
            </Typography>
          ))}
        </Stack>

        <Stack direction="row" spacing="14px" alignItems="center">
          <Button 
            onClick={onLogin} 
            aria-label="Login to Skin AI"
            sx={{ 
              textTransform: "none", 
              borderRadius: "999px", 
              fontWeight: 700, 
              fontSize: 14, 
              color: C.text, 
              border: "1.5px solid " + C.border, 
              px: 3.5, 
              py: 0.9,
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              outline: "none",
              "&:focus-visible": {
                outline: "2px solid " + C.primary,
                outlineOffset: "2px"
              },
              "&:hover": {
                transform: "translateY(-1.5px) scale(1.02)",
                backgroundColor: "rgba(139,92,246,0.04)",
                borderColor: C.primary,
                boxShadow: "0 6px 14px rgba(139,92,246,0.14)",
              }
            }}
          >
            Login
          </Button>
          <Button 
            onClick={onGetStarted} 
            aria-label="Get Started with Skin Assessment"
            sx={{ 
              textTransform: "none", 
              borderRadius: "999px", 
              fontWeight: 700, 
              fontSize: 14, 
              color: "#fff", 
              background: C.gradient, 
              px: 3.8, 
              py: 0.9, 
              boxShadow: "0 8px 20px rgba(139,92,246,0.25)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              outline: "none",
              "&:focus-visible": {
                outline: "2px solid " + C.primary,
                outlineOffset: "2px"
              },
              "&:hover": {
                transform: "translateY(-1.5px) scale(1.02)",
                boxShadow: "0 12px 26px rgba(139,92,246,0.4)",
                filter: "brightness(1.08)"
              }
            }}
          >
            Get Started
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

// ============================================================
// HERO
// ============================================================
function HeroDashboardPreview() {
  return (
    <Box
      sx={{
        backgroundColor: "#fff", borderRadius: "24px", border: "1px solid " + C.border,
        boxShadow: "0 30px 70px rgba(139,92,246,0.18)", p: 2.5, maxWidth: 440, mx: "auto",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Your Skin Dashboard</Typography>
        <Typography sx={{ fontSize: 10.5, color: C.textMuted }}>Good Morning ✨</Typography>
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <Box sx={{ flex: 1, borderRadius: "16px", backgroundColor: C.bg2, p: 1.75, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ position: "relative", width: 70, height: 70 }}>
            <svg width="70" height="70" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="35" cy="35" r="30" stroke={C.border} strokeWidth="7" fill="none" />
              <circle cx="35" cy="35" r="30" stroke={C.primary} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 * 0.13} />
            </svg>
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: C.text }}>87</Typography>
              <Typography sx={{ fontSize: 7, color: C.textMuted }}>/100</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1.2, borderRadius: "16px", backgroundColor: C.bg2, p: 1.75 }}>
          {[["Hydration", 86], ["Oil Balance", 72], ["Sensitivity", 65], ["Acne", 26]].map(([label, val]) => (
            <Box key={label} sx={{ mb: 0.75 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 9, color: C.textMuted }}>{label}</Typography>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: C.text }}>{val}%</Typography>
              </Stack>
              <Box sx={{ height: 4, borderRadius: 2, backgroundColor: C.border, mt: 0.25 }}>
                <Box sx={{ height: "100%", width: `${val}%`, borderRadius: 2, background: C.gradient }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Stack>
      <Box sx={{ mt: 1.5, borderRadius: "14px", background: "rgba(249,168,212,0.12)", p: 1.5 }}>
        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: C.primary, mb: 0.25 }}>✨ AI Recommendation</Typography>
        <Typography sx={{ fontSize: 10.5, color: C.text }}>Use Vitamin C Serum in the morning for better brightening results.</Typography>
      </Box>
    </Box>
  );
}

function Hero({ onGetStarted }) {
  return (
    <Box sx={{ position: "relative", overflow: "hidden", pt: { xs: 6, md: 9 }, pb: { xs: 6, md: 9 } }}>
      <Box sx={{ position: "absolute", top: -80, left: -100, width: 340, height: 340, borderRadius: "50%", background: C.secondary, opacity: 0.25, filter: "blur(90px)" }} />
      <Box sx={{ position: "absolute", bottom: -100, right: -80, width: 380, height: 380, borderRadius: "50%", background: C.accent, opacity: 0.22, filter: "blur(100px)" }} />

      <Box sx={{ position: "relative", maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" }, gap: 5, alignItems: "center" }}>
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.75, py: 0.6, borderRadius: "999px", backgroundColor: "rgba(139,92,246,0.08)", mb: 2.5 }}>
              <Spa sx={{ fontSize: 13, color: C.primary }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.primary }}>AI POWERED SKINCARE</Typography>
            </Box>
            <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: 34, sm: 46, md: 52 }, fontWeight: 700, color: C.text, lineHeight: 1.12 }}>
              Transform Your Skin<br />with{" "}
              <Box component="span" sx={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AI-Powered
              </Box>{" "}
              Personalized Care
            </Typography>
            <Typography sx={{ fontSize: 15.5, color: C.textMuted, mt: 2.5, maxWidth: 480, lineHeight: 1.7 }}>
              Receive personalized skincare routines based on your skin profile, lifestyle, environment, and ingredient intelligence.
            </Typography>
            <Stack direction="row" sx={{ mt: 4, gap: "12px", flexWrap: "wrap" }}>
              <Button
                onClick={onGetStarted}
                endIcon={<ArrowForward sx={{ fontSize: 17 }} />}
                sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 700, fontSize: 14.5, color: "#fff", background: C.gradient, px: 3.5, py: 1.4, boxShadow: "0 14px 30px rgba(139,92,246,0.35)" }}
              >
                Start Free Assessment
              </Button>
              <Button
                startIcon={<Visibility sx={{ fontSize: 19 }} />}
                sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 600, fontSize: 14.5, color: C.text, border: "1.5px solid " + C.border, px: 3, py: 1.4 }}
              >
                Watch Demo
              </Button>
            </Stack>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 4 }}>
              <Stack direction="row" sx={{ ml: 1 }}>
                {["A K", "R P", "S J"].map((n, i) => (
                  <Box key={n} sx={{ ml: i === 0 ? 0 : -1.2 }}>{initialsAvatar(n, 34)}</Box>
                ))}
              </Stack>
              <Box>
                <Stack direction="row" spacing={0.2}>
                  {[...Array(5)].map((_, i) => <StarRounded key={i} sx={{ fontSize: 14, color: "#F0B45E" }} />)}
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: C.textMuted }}>Trusted by 10,000+ users</Typography>
              </Box>
            </Stack>
          </MotionDiv>

          <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <HeroDashboardPreview />
          </MotionDiv>
        </Box>

        <Box sx={{ mt: { xs: 6, md: 8 }, backgroundColor: "#fff", borderRadius: "20px", border: "1px solid " + C.border, boxShadow: "0 10px 30px rgba(139,92,246,0.06)", p: { xs: 2.5, sm: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={{ xs: 2, sm: 4 }} justifyContent="space-between">
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>Trusted By</Typography>
            <Stack direction="row" spacing={{ xs: 2.5, sm: 4 }} flexWrap="wrap" justifyContent="center" rowGap={2}>
              {[
                [VerifiedUserOutlined, "Dermatologists"], [ScienceOutlined, "Skincare Experts"], [MemoryOutlined, "AI Researchers"],
                [HealthAndSafetyOutlined, "Healthcare Professionals"], [LockOutlined, "Privacy First"], [Spa, "Clinically Inspired"],
              ].map(([Icon, label]) => (
                <Stack key={label} alignItems="center" spacing={0.5} sx={{ opacity: 0.75 }}>
                  <Icon sx={{ fontSize: 20, color: C.textMuted }} />
                  <Typography sx={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap" }}>{label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================
// FEATURES
// ============================================================
const FEATURES = [
  { icon: FaceRetouchingNatural, title: "AI Skin Assessment", desc: "Advanced AI analyzes your skin from images, concerns, and lifestyle factors." },
  { icon: EventNote, title: "Personalized Routine", desc: "Get customized skincare routines tailored to your unique skin profile." },
  { icon: ScienceOutlined, title: "Ingredient Intelligence", desc: "Understand ingredient benefits, risks, and interactions with AI insights." },
  { icon: PsychologyOutlined, title: "Lifestyle Analysis", desc: "We analyze sleep, diet, stress, and habits that impact your skin health." },
  { icon: WbSunnyOutlined, title: "UV & Weather Adaptation", desc: "Real-time weather and UV index based skincare recommendations every day." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Track your skin improvement with visual charts and AI progress reports." },
  { icon: SupportAgentOutlined, title: "Expert Consultation", desc: "Connect with certified dermatologists for expert advice and support." },
  { icon: LockOutlined, title: "Secure Cloud Storage", desc: "Your data is stored securely with end-to-end encryption and privacy protection." },
];

function FeatureCard({ feature, i }) {
  const [hover, setHover] = useState(false);
  const Icon = feature.icon;
  return (
    <MotionDiv
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -6 }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.04, duration: 0.4 }}
    >
      <Box 
        sx={{ 
          backgroundColor: "#fff", 
          borderRadius: "20px", 
          border: "1px solid " + C.border, 
          p: 2.75, 
          height: "100%", 
          boxShadow: hover ? "0 16px 34px rgba(139,92,246,0.14)" : "0 4px 14px rgba(139,92,246,0.04)", 
          transition: "box-shadow 0.25s ease" 
        }}
      >
        <Box 
          sx={{ 
            width: 46, 
            height: 46, 
            borderRadius: "14px", 
            backgroundColor: hover ? C.primary : "rgba(139,92,246,0.08)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            mb: "20px",
            boxShadow: hover ? "0 6px 14px rgba(139,92,246,0.25)" : "none",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <Icon 
            sx={{ 
              fontSize: 22, 
              color: hover ? "#fff" : C.primary,
              transform: hover ? "scale(1.15) rotate(8deg)" : "scale(1) rotate(0)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }} 
          />
        </Box>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.text, mb: 0.75 }}>{feature.title}</Typography>
        <Typography sx={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6 }}>{feature.desc}</Typography>
      </Box>
    </MotionDiv>
  );
}

function FeaturesSection() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 }, py: { xs: 7, md: 10 } }}>
      <SectionEyebrow>Our Features</SectionEyebrow>
      <SectionTitle>Intelligent Skincare, Personalized for You</SectionTitle>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2,1fr)", md: "repeat(4,1fr)" }, gap: "28px" }}>
        {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} i={i} />)}
      </Box>
    </Box>
  );
}

// ============================================================
// HOW IT WORKS
// ============================================================
const STEPS = [
  { icon: GroupsOutlined, title: "Create Account", desc: "Sign up and create your personalized Skin AI profile." },
  { icon: FaceRetouchingNatural, title: "Complete Assessment", desc: "Answer a few questions about your skin and lifestyle." },
  { icon: Spa, title: "Get AI Recommendations", desc: "Our AI analyzes your data and generates your routine." },
  { icon: TrendingUp, title: "Track & Improve", desc: "Follow your routine and track your skin transformation." },
];

function StepCard({ s, i }) {
  const [hover, setHover] = useState(false);
  const Icon = s.icon;
  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 16 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ delay: i * 0.1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Stack alignItems="center" spacing={1.25} sx={{ position: "relative", zIndex: 1 }}>
        <Box 
          sx={{ 
            width: 58, 
            height: 58, 
            borderRadius: "50%", 
            backgroundColor: "#fff", 
            border: "2px solid " + (hover || i === 1 ? C.primary : C.border), 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            boxShadow: hover ? "0 12px 24px rgba(139,92,246,0.2)" : "0 8px 20px rgba(139,92,246,0.1)",
            transform: hover ? "scale(1.1)" : "scale(1)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <Icon 
            sx={{ 
              fontSize: 24, 
              color: hover || i === 1 ? C.primary : C.textMuted,
              transform: hover ? "scale(1.1) rotate(12deg)" : "scale(1) rotate(0)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }} 
          />
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.primary }}>Step {i + 1}</Typography>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.text, textAlign: "center" }}>{s.title}</Typography>
        <Typography sx={{ fontSize: 12, color: C.textMuted, textAlign: "center", maxWidth: 200 }}>{s.desc}</Typography>
      </Stack>
    </MotionDiv>
  );
}

function HowItWorks() {
  return (
    <Box sx={{ backgroundColor: C.bg2, py: { xs: 7, md: 10 } }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <SectionEyebrow>How It Works</SectionEyebrow>
        <SectionTitle>Simple Steps, Powerful Results</SectionTitle>
        <Box sx={{ position: "relative" }}>
          <Box sx={{ position: "absolute", top: 28, left: "12%", right: "12%", height: 2, background: `repeating-linear-gradient(90deg, ${C.border} 0 8px, transparent 8px 16px)`, display: { xs: "none", md: "block" } }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 4 }}>
            {STEPS.map((s, i) => (
              <StepCard key={s.title} s={s} i={i} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================
// BEFORE & AFTER — explicitly labeled illustrative demo data
// ============================================================
const TRANSFORMATIONS = [
  { label: "Acne Reduction", metric: "Acne Reduced", value: "+ 62%" },
  { label: "Hydration Boost", metric: "Hydration Increased", value: "+ 45%" },
  { label: "Pigmentation", metric: "Pigmentation Improved", value: "+ 53%" },
  { label: "Fine Lines & Wrinkles", metric: "Wrinkle Reduction", value: "+ 38%" },
];

function TransformCard({ t }) {
  return (
    <Box sx={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid " + C.border, p: 2, minWidth: 190 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text, mb: 1.25, textAlign: "center" }}>{t.label}</Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        {["Before", "After"].map((lbl, i) => (
          <Box key={lbl} sx={{ textAlign: "center" }}>
            <Box sx={{ width: 68, height: 68, borderRadius: "14px", background: i === 0 ? "linear-gradient(160deg,#EDEBE6,#DDD8D0)" : C.gradient, opacity: i === 0 ? 0.6 : 1 }} />
            <Typography sx={{ fontSize: 9.5, color: C.textMuted, mt: 0.5 }}>{lbl}</Typography>
          </Box>
        ))}
      </Stack>
      <Typography sx={{ fontSize: 11, color: C.textMuted, textAlign: "center", mt: 1.25 }}>{t.metric}</Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#2E9E5B", textAlign: "center" }}>{t.value}</Typography>
    </Box>
  );
}

function TransformationSection() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 }, py: { xs: 7, md: 10 } }}>
      <SectionEyebrow>Real Results (Illustrative Demo)</SectionEyebrow>
      <SectionTitle sx={{ mb: 1 }}>Visible Transformations, Backed by AI</SectionTitle>
      <Typography sx={{ fontSize: 12, color: C.textMuted, textAlign: "center", mb: 4 }}>
        *These cards show illustrative demo results, not real user photos or data.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1, justifyContent: { md: "center" } }}>
        {TRANSFORMATIONS.map((t) => <TransformCard key={t.label} t={t} />)}
        <Box sx={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid " + C.border, p: 2, minWidth: 190, textAlign: "center" }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text, mb: 1.5 }}>Skin Score</Typography>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: C.textMuted }}>42</Typography>
            <ArrowForward sx={{ fontSize: 16, color: C.primary }} />
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: C.primary }}>87</Typography>
          </Stack>
          <Typography sx={{ fontSize: 11, color: "#2E9E5B", fontWeight: 700, mt: 1 }}>Overall Skin Score Improved +107%</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// ============================================================
// REVIEWS
// ============================================================
const REVIEWS = [
  { name: "Ananya R.", loc: "Bangalore, India", text: "This platform completely transformed my skincare routine. My skin has never looked better." },
  { name: "Sneha P.", loc: "Hyderabad, India", text: "I finally understand which ingredients actually work for my skin. Highly recommended!" },
  { name: "Meera J.", loc: "Mumbai, India", text: "The AI recommendations are spot on. The progress tracking keeps me motivated daily." },
  { name: "Dr. Kavya Shetty", loc: "Dermatologist", text: "As a dermatologist, I recommend Skin AI to many of my patients. It's accurate and reliable." },
];

function ReviewsSection() {
  const [idx, setIdx] = useState(0);
  const visible = 3;
  const scroll = (dir) => setIdx((p) => Math.max(0, Math.min(REVIEWS.length - visible, p + dir)));
  return (
    <Box sx={{ backgroundColor: C.bg2, py: { xs: 7, md: 10 } }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <SectionEyebrow>What Our Users Say</SectionEyebrow>
        <SectionTitle>Loved by Thousands</SectionTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => scroll(-1)} sx={{ backgroundColor: "#fff", border: "1px solid " + C.border, display: { xs: "none", sm: "flex" } }}>
            <ChevronLeft />
          </IconButton>
          <Stack direction="row" spacing={2} sx={{ overflow: "hidden", flex: 1 }}>
            {REVIEWS.slice(idx, idx + visible).map((r) => (
              <Box key={r.name} sx={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid " + C.border, p: 2.5, flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.2} sx={{ mb: 1.25 }}>
                  {[...Array(5)].map((_, i) => <StarRounded key={i} sx={{ fontSize: 15, color: "#F0B45E" }} />)}
                </Stack>
                <Typography sx={{ fontSize: 13, color: C.text, lineHeight: 1.6, mb: 2, fontStyle: "italic" }}>"{r.text}"</Typography>
                <Stack direction="row" alignItems="center" sx={{ gap: 1 }}>
                  {initialsAvatar(r.name, 36)}
                  <Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{r.name}</Typography>
                    <Typography sx={{ fontSize: 10.5, color: C.textMuted }}>{r.loc}</Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
          <IconButton onClick={() => scroll(1)} sx={{ backgroundColor: "#fff", border: "1px solid " + C.border, display: { xs: "none", sm: "flex" } }}>
            <ChevronRight />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}

// ============================================================
// STATS — explicitly labeled as placeholders (no production data yet)
// ============================================================
const STATS = [
  { value: "10,000+", label: "Skin Assessments" },
  { value: "95%", label: "Satisfied Users" },
  { value: "250+", label: "Products Analyzed" },
  { value: "40+", label: "Ingredients Evaluated" },
  { value: "98%", label: "AI Accuracy Rate" },
];

function StatsSection() {
  return (
    <Box sx={{ background: C.gradient, py: { xs: 5, md: 6 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <Stack direction="row" flexWrap="wrap" justifyContent="space-around" rowGap={3}>
          {STATS.map((s) => (
            <Stack key={s.label} alignItems="center" spacing={0.5} sx={{ minWidth: 120 }}>
              <Typography sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 800, color: "#fff" }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{s.label}</Typography>
            </Stack>
          ))}
        </Stack>
        <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", textAlign: "center", mt: 3 }}>
          *Placeholder figures — will be replaced with live production statistics at launch.
        </Typography>
      </Box>
    </Box>
  );
}

// ============================================================
// ABOUT
// ============================================================
function AboutSection() {
  const points = ["AI-driven personalized skincare", "Dermatologist-backed recommendations", "Ingredient & product intelligence", "Secure, private & confidential"];
  const tech = [
    ["React", "Modern, fast & responsive UI"], ["FastAPI", "High-performance backend"],
    ["PostgreSQL", "Reliable relational database"], ["MongoDB", "Flexible document storage"],
    ["Artificial Intelligence", "Real skin analysis models"], ["Secure Authentication", "JWT + role-based access"],
  ];
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 }, py: { xs: 7, md: 10 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 6, alignItems: "center" }}>
        <Box>
          <SectionEyebrow>About Skin AI</SectionEyebrow>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: 26, sm: 32 }, fontWeight: 700, color: C.text, mb: 2 }}>
            Science. AI. Care.
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.75, mb: 2.5 }}>
            Skin AI combines artificial intelligence, dermatology-informed logic, and real ingredient science to help you build a skincare routine that actually fits your skin — not a generic one-size-fits-all plan.
          </Typography>
          <Stack spacing={1.25}>
            {points.map((p) => (
              <Stack key={p} direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fff" }} />
                </Box>
                <Typography sx={{ fontSize: 13, color: C.text }}>{p}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "1px", mb: 2 }}>Built With Modern Tech</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {tech.map(([name, desc]) => (
              <Box key={name} sx={{ backgroundColor: "#fff", borderRadius: "14px", border: "1px solid " + C.border, p: 1.75 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{name}</Typography>
                <Typography sx={{ fontSize: 10.5, color: C.textMuted, mt: 0.25 }}>{desc}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================
// EXPERTS
// ============================================================
const EXPERTS = [
  { name: "Dr. Kavya Shetty", role: "Dermatologist", exp: "8+ Years Exp." },
  { name: "Dr. Rohan Mehta", role: "Dermatologist", exp: "10+ Years Exp." },
  { name: "Anjali Desai", role: "Skincare Consultant", exp: "6+ Years Exp." },
  { name: "Arjun Nair", role: "AI Research Engineer", exp: "7+ Years Exp." },
  { name: "Priya Menon", role: "Research Specialist", exp: "5+ Years Exp." },
];

function ExpertsSection() {
  return (
    <Box sx={{ backgroundColor: C.bg2, py: { xs: 7, md: 10 } }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <SectionEyebrow>Our Experts</SectionEyebrow>
        <SectionTitle>Meet Our Experts</SectionTitle>
        <Stack direction="row" spacing={2.5} sx={{ overflowX: "auto", pb: 1, justifyContent: { md: "center" } }}>
          {EXPERTS.map((e) => (
            <Box key={e.name} sx={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid " + C.border, p: 2.5, minWidth: 170, textAlign: "center" }}>
              {initialsAvatar(e.name, 62)}
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.text, mt: 1.5 }}>{e.name}</Typography>
              <Typography sx={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>{e.role}</Typography>
              <Typography sx={{ fontSize: 10.5, color: C.textMuted, mt: 0.25 }}>{e.exp}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// ============================================================
// FAQ
// ============================================================
const FAQS = [
  { q: "How does AI analyze skin?", a: "Our AI evaluates your self-reported skin profile, concerns, and lifestyle data using a weighted scoring model, then generates a personalized routine based on the results." },
  { q: "Is my personal data secure?", a: "Yes. All data is encrypted, access is protected by JWT authentication, and your information is never shared without your consent." },
  { q: "Can I consult dermatologists?", a: "Yes. Skin AI lets you connect with verified skincare consultants and dermatologists directly through the platform." },
  { q: "How long until I see improvements?", a: "This varies by individual and routine consistency. Tracking your skin score over time helps you see real, measurable trends." },
  { q: "Can beginners use this app?", a: "Absolutely. The assessment is designed to guide anyone, regardless of skincare experience, to a routine that fits their skin." },
];

function FAQSection() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2.5, md: 4 }, py: { xs: 7, md: 10 } }}>
      <SectionEyebrow>Questions</SectionEyebrow>
      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <Stack spacing={1.25}>
        {FAQS.map((f) => (
          <Accordion key={f.q} disableGutters elevation={0} sx={{ border: "1px solid " + C.border, borderRadius: "14px !important", "&:before": { display: "none" }, overflow: "hidden" }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: C.primary }} />}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{f.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.65 }}>{f.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}

// ============================================================
// FINAL CTA
// ============================================================
function FinalCTA({ onGetStarted, onLogin }) {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 }, pb: { xs: 7, md: 10 } }}>
      <Box sx={{ background: C.gradient, borderRadius: "28px", p: { xs: 4, sm: 6 }, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: 26, sm: 34 }, fontWeight: 700, color: "#fff", mb: 1.5 }}>
          Ready to Begin Your Skin Journey?
        </Typography>
        <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.9)", mb: 3.5 }}>
          Take the first step towards healthier, glowing skin with AI-powered care.
        </Typography>
        <Stack direction="row" spacing="12px" justifyContent="center" flexWrap="wrap" rowGap="12px">
          <Button onClick={onGetStarted} endIcon={<ArrowForward sx={{ fontSize: 17 }} />} sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 700, fontSize: 14.5, color: C.primary, backgroundColor: "#fff", px: 3.5, py: 1.35, "&:hover": { backgroundColor: "#fff" } }}>
            Start Free Assessment
          </Button>
          <Button onClick={onLogin} sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 700, fontSize: 14.5, color: "#fff", border: "1.5px solid rgba(255,255,255,0.6)", px: 3.5, py: 1.35 }}>
            Sign In
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  const cols = [
    { title: "Platform", items: ["Features", "How It Works", "Results", "Reviews"] },
    { title: "Company", items: ["About Us", "Our Experts", "Careers", "Contact"] },
    { title: "Support", items: ["Help Center", "FAQs", "Privacy Policy", "Terms of Service"] },
  ];
  return (
    <Box sx={{ backgroundColor: "#fff", borderTop: "1px solid " + C.border, pt: 6, pb: 3 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.4fr 1fr 1fr 1fr" }, gap: 4, mb: 4 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: "9px", background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spa sx={{ color: "#fff", fontSize: 15 }} />
              </Box>
              <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: 15.5, fontWeight: 700, color: C.text }}>Skin AI</Typography>
            </Stack>
            <Typography sx={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, maxWidth: 260 }}>
              AI-powered skincare platform delivering personalized routines, expert insights, and real results.
            </Typography>
          </Box>
          {cols.map((c) => (
            <Box key={c.title}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.text, mb: 1.5 }}>{c.title}</Typography>
              <Stack spacing={1}>
                {c.items.map((it) => (
                  <Typography key={it} sx={{ fontSize: 12, color: C.textMuted, cursor: "pointer", "&:hover": { color: C.primary } }}>{it}</Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ pt: 3, borderTop: "1px solid " + C.border }}>
          <Typography sx={{ fontSize: 11, color: C.textMuted }}>© 2026 Skin AI. All rights reserved.</Typography>
          <Typography sx={{ fontSize: 11, color: C.textMuted }}>Made with 💜 for healthy skin</Typography>
        </Stack>
      </Box>
    </Box>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function LandingPage({ onGetStarted, onLogin }) {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sections = ["home", "features", "how-it-works", "results", "reviews", "about", "faq"];
    
    const observerCallback = (entries) => {
      const intersecting = entries.filter((e) => e.isIntersecting);
      if (intersecting.length > 0) {
        // Sort intersecting elements by proximity to the top of viewport
        intersecting.sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        setActiveSection(intersecting[0].target.id);
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: "-90px 0px -60% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Box sx={{ backgroundColor: C.bg1, fontFamily: BODY_FONT, overflowX: "hidden" }}>
      <Nav onLogin={onLogin} onGetStarted={onGetStarted} activeSection={activeSection} />
      
      <Box component="section" id="home" sx={{ scrollMarginTop: "90px" }}>
        <Hero onGetStarted={onGetStarted} />
      </Box>

      <Box component="section" id="features" sx={{ scrollMarginTop: "90px" }}>
        <FeaturesSection />
      </Box>

      <Box component="section" id="how-it-works" sx={{ scrollMarginTop: "90px" }}>
        <HowItWorks />
      </Box>

      <Box component="section" id="results" sx={{ scrollMarginTop: "90px" }}>
        <TransformationSection />
      </Box>

      <Box component="section" id="reviews" sx={{ scrollMarginTop: "90px" }}>
        <ReviewsSection />
      </Box>

      <StatsSection />

      <Box component="section" id="about" sx={{ scrollMarginTop: "90px" }}>
        <AboutSection />
      </Box>

      <ExpertsSection />

      <Box component="section" id="faq" sx={{ scrollMarginTop: "90px" }}>
        <FAQSection />
      </Box>

      <FinalCTA onGetStarted={onGetStarted} onLogin={onLogin} />
      <Footer />
    </Box>
  );
}