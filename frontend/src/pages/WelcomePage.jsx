import { keyframes } from "@emotion/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatLeaf = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1.5deg); }
`;

const drift = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

function AnimatedLeafArt() {
  return (
    <Box
      sx={{
        position: "relative",
        width: 220,
        height: 220,
        mx: "auto",
        animation: `${floatLeaf} 6s ease-in-out infinite`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: -40,
          borderRadius: "50%",
          border: `1px solid ${COLORS.primaryLight}`,
          opacity: 0.4,
          animation: `${drift} 40s linear infinite`,
        }}
      />
      <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
        <defs>
          <linearGradient id="leafGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLORS.secondaryLight} />
            <stop offset="55%" stopColor={COLORS.secondary} />
            <stop offset="100%" stopColor={COLORS.primary} />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={COLORS.primary} />
            <stop offset="100%" stopColor={COLORS.secondary} />
          </linearGradient>
        </defs>

        <path
          d="M110 20c-30 10-52 38-52 70 0 26 20 48 46 48 32 0 58-26 58-62 0-20-10-38-26-50-4 16-14 28-24 34 10-16 8-30-2-40z"
          fill="url(#leafGrad1)"
          fillOpacity="0.55"
        />
        <path
          d="M130 34c-26 8-44 32-44 58 0 22 17 40 39 40 27 0 49-22 49-52 0-17-8-32-22-42-3 13-12 24-20 29 8-13 7-25-2-33z"
          fill="url(#leafGrad2)"
          fillOpacity="0.9"
        />
        <path
          d="M46 150c14-4 24-16 24-30 0-11-8-20-19-20-13 0-24 11-24 26 0 9 4 17 11 22-1-6 1-11 5-15-2 6 0 12 3 17z"
          fill={COLORS.primary}
          fillOpacity="0.35"
        />
        <path
          d="M108 90c-6 26-6 54 4 76"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </Box>
  );
}

export default function WelcomePage({ onGetStarted }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundImage: "url('/background1.png')",
        backgroundSize: "cover",
        backgroundPosition: { xs: "65% center", sm: "center" },
        backgroundRepeat: "no-repeat",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        backgroundColor: "#F3E9FB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 6,
        textAlign: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Soft veil so text stays readable over busy areas of the photo */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 55%, rgba(255,255,255,0) 75%)",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, animation: `${fadeInUp} 0.7s ease both` }}>
        <AnimatedLeafArt />
      </Box>

      <Typography
        sx={{
          position: "relative",
          zIndex: 1,
          fontFamily: FONT_DISPLAY,
          fontSize: { xs: 34, sm: 40 },
          fontWeight: 600,
          color: COLORS.secondaryDark,
          mt: 3,
          animation: `${fadeInUp} 0.7s ease 0.15s both`,
        }}
      >
        Skin AI
      </Typography>

      <Typography
        sx={{
          position: "relative",
          zIndex: 1,
          color: COLORS.textMuted,
          fontSize: 15.5,
          mt: 1,
          maxWidth: 260,
          lineHeight: 1.6,
          animation: `${fadeInUp} 0.7s ease 0.28s both`,
        }}
      >
        Intelligence for Healthy Skin
      </Typography>

      <Stack
        spacing={1}
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 340,
          mt: { xs: 6, sm: 8 },
          animation: `${fadeInUp} 0.7s ease 0.4s both`,
        }}
      >
        <Button
          onClick={onGetStarted}
          fullWidth
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            py: 1.5,
            borderRadius: "999px",
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            background: COLORS.brandGradient,
            boxShadow: "0 14px 28px rgba(139, 111, 201, 0.35)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 18px 34px rgba(139, 111, 201, 0.42)",
              background: COLORS.brandGradient,
            },
          }}
        >
          Get Started
        </Button>
      </Stack>
    </Box>
  );
}
