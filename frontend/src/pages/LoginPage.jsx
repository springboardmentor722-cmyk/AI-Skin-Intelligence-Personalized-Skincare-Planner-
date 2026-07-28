import { useState } from "react";
import { keyframes } from "@emotion/react";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { EmailOutlined as EmailOutlinedIcon } from "@mui/icons-material";
import { LockOutlined as LockOutlinedIcon } from "@mui/icons-material";
import { Visibility } from "@mui/icons-material";
import { VisibilityOff } from "@mui/icons-material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatLeaf = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`;

function LeafMark({ size = 44 }) {
  return (
    <Box sx={{ animation: `${floatLeaf} 5s ease-in-out infinite` }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="loginLeafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLORS.secondary} />
            <stop offset="100%" stopColor={COLORS.primary} />
          </linearGradient>
        </defs>
        <path
          d="M32 6C20 10 12 22 12 34c0 10 8 18 18 18 12 0 22-10 22-24 0-8-4-16-10-20-2 6-6 10-10 12 4-6 4-10 0-14z"
          fill="url(#loginLeafGrad)"
          fillOpacity="0.9"
        />
        <path d="M32 58C24 50 20 40 24 30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    </Box>
  );
}

function SocialPillButton({ label, icon, onClick }) {
  return (
    <Button
      onClick={onClick}
      fullWidth
      startIcon={icon}
      sx={{
        py: 1.1,
        borderRadius: "999px",
        border: `1px solid ${COLORS.cardBorder}`,
        textTransform: "none",
        fontSize: 13,
        fontWeight: 600,
        color: COLORS.textDark,
        backgroundColor: "#FFFFFF",
        transition: "all 0.15s ease",
        "&:hover": {
          backgroundColor: COLORS.inputBg,
          borderColor: COLORS.primaryLight,
          transform: "translateY(-1px)",
        },
      }}
    >
      {label}
    </Button>
  );
}

function FloralFlourish() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", opacity: 0.55, mt: 1 }}>
      <svg width="120" height="46" viewBox="0 0 120 46" fill="none">
        <defs>
          <linearGradient id="floralGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={COLORS.primaryLight} />
            <stop offset="100%" stopColor={COLORS.secondaryLight} />
          </linearGradient>
        </defs>
        <path d="M10 40C20 20 35 10 55 12" stroke="url(#floralGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M110 40C100 20 85 10 65 12" stroke="url(#floralGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="10" r="5" fill={COLORS.primaryLight} />
        <circle cx="52" cy="6" r="3.5" fill={COLORS.secondaryLight} />
        <circle cx="68" cy="6" r="3.5" fill={COLORS.secondaryLight} />
      </svg>
    </Box>
  );
}

const inputSx = {
  borderRadius: "14px",
  backgroundColor: COLORS.inputBg,
  transition: "box-shadow 0.15s ease",
  "& fieldset": { borderColor: COLORS.cardBorder },
  "&:hover fieldset": { borderColor: COLORS.primaryLight },
  "&.Mui-focused fieldset": { borderColor: `${COLORS.primary} !important`, borderWidth: "1.5px" },
  "&.Mui-focused": { boxShadow: `0 0 0 4px ${COLORS.secondaryLight}55` },
};

export default function LoginPage({ onSignIn, onNavigateRegister, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    try {
      await onSignIn?.({ email, password, rememberMe });
    } catch (err) {
      setError(err?.message || "Incorrect email or password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: { xs: "75% center", sm: "center" },
        backgroundRepeat: "no-repeat",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        backgroundColor: "#FDF0F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ mb: 3, animation: `${fadeInUp} 0.6s ease both` }}
        >
          <LeafMark />
          <Box sx={{ textAlign: "left" }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: COLORS.secondaryDark, lineHeight: 1.1 }}>
              Skin AI
            </Typography>
            <Typography sx={{ color: COLORS.textMuted, fontSize: 11.5 }}>
              Intelligence for Healthy Skin
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ animation: `${fadeInUp} 0.6s ease 0.05s both`, mb: 2.5 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: COLORS.textDark }}>
            Welcome Back
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: 14, mt: 0.5 }}>
            Log in to continue your personalized skincare journey.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow: "0 20px 45px rgba(139, 111, 201, 0.14)",
            p: { xs: 3, sm: 3.5 },
            animation: `${fadeInUp} 0.6s ease 0.12s both`,
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark, mb: 0.75 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark, mb: 0.75 }}>
                Password
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 20, color: COLORS.textMuted }} /> : <Visibility sx={{ fontSize: 20, color: COLORS.textMuted }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />
            </Box>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{ color: COLORS.cardBorder, "&.Mui-checked": { color: COLORS.primary } }}
                  />
                }
                label={<Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>Remember me</Typography>}
              />
              <Link component="button" type="button" onClick={onForgotPassword} underline="hover" sx={{ color: COLORS.primaryDark, fontSize: 13, fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </Stack>

            {error && (
              <Typography sx={{ color: COLORS.danger, fontSize: 13, textAlign: "center" }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              endIcon={
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowForwardIcon sx={{ fontSize: 15 }} />
                </Box>
              }
              sx={{
                py: 1.4,
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                background: COLORS.brandGradient,
                boxShadow: "0 12px 24px rgba(139, 111, 201, 0.32)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                justifyContent: "space-between",
                px: 3,
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 16px 30px rgba(139, 111, 201, 0.4)",
                  background: COLORS.brandGradient,
                },
              }}
            >
              Log In
            </Button>

            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ my: 0.25 }}>
              <Box sx={{ flex: 1, height: "1px", backgroundColor: COLORS.cardBorder }} />
              <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>or continue with</Typography>
              <Box sx={{ flex: 1, height: "1px", backgroundColor: COLORS.cardBorder }} />
            </Stack>

            <Stack direction="row" spacing={1}>
              <SocialPillButton
                label="Google"
                icon={
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.7 26.7 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
                  </svg>
                }
              />
              <SocialPillButton
                label="Apple"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={COLORS.textDark}>
                    <path d="M16.365 1.43c0 1.14-.468 2.222-1.157 3.026-.774.9-2.032 1.6-3.076 1.514-.13-1.1.42-2.263 1.15-3.03C13.99.94 15.35.25 16.365 1.43zM20.4 17.55c-.53 1.23-.78 1.78-1.46 2.86-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.96-3.87-.95-2 .01-2.42.97-3.9.95-1.66-.02-2.93-1.7-3.88-3.2C1.05 16.6.44 12.1 2.12 9.2c1.1-1.92 2.98-3.13 5-3.16 1.55-.03 3.01 1.03 3.87 1.03.86 0 2.61-1.27 4.4-1.08.75.03 2.86.3 4.21 2.28-.11.07-2.51 1.46-2.49 4.35.03 3.46 3.04 4.61 3.29 4.93z" />
                  </svg>
                }
              />
              <SocialPillButton
                label="Facebook"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.93 8.44-9.94z" />
                  </svg>
                }
              />
            </Stack>

            <Typography sx={{ textAlign: "center", fontSize: 14, color: COLORS.textMuted, pt: 0.5 }}>
              Don't have an account?{" "}
              <Link component="button" type="button" onClick={onNavigateRegister} underline="hover" sx={{ color: COLORS.primaryDark, fontWeight: 600 }}>
                Sign up
              </Link>
            </Typography>

            <FloralFlourish />
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
