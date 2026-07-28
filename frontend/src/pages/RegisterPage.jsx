import { useMemo, useState } from "react";
import { keyframes } from "@emotion/react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Person as PersonOutlineIcon } from "@mui/icons-material";
import { EmailOutlined as EmailOutlinedIcon } from "@mui/icons-material";
import { LockOutlined as LockOutlinedIcon } from "@mui/icons-material";
import { Visibility } from "@mui/icons-material";
import { VisibilityOff } from "@mui/icons-material";
import { Person as PersonIcon } from "@mui/icons-material";
import { Spa as SpaIcon } from "@mui/icons-material";
import { MedicalServicesOutlined as MedicalServicesOutlinedIcon } from "@mui/icons-material";
import { AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon } from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const STRENGTH_LEVELS = [
  { label: "Weak", color: "#E07A6B" },
  { label: "Fair", color: "#E0A96B" },
  { label: "Good", color: COLORS.secondary },
  { label: "Strong", color: COLORS.success },
];

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, STRENGTH_LEVELS.length - 1);
}

const ROLE_META = {
  user: { label: "User", Icon: PersonIcon, bg: COLORS.roleUser.bg, color: COLORS.roleUser.icon },
  consultant: { label: "Consultant", Icon: SpaIcon, bg: COLORS.roleConsultant.bg, color: COLORS.roleConsultant.icon },
  dermatologist: { label: "Dermatologist", Icon: MedicalServicesOutlinedIcon, bg: COLORS.roleDermatologist.bg, color: COLORS.roleDermatologist.icon },
  admin: { label: "Admin", Icon: AdminPanelSettingsOutlinedIcon, bg: COLORS.roleAdmin.bg, color: COLORS.roleAdmin.icon },
};

const inputSx = {
  borderRadius: "14px",
  backgroundColor: COLORS.inputBg,
  transition: "box-shadow 0.15s ease",
  "& fieldset": { borderColor: COLORS.cardBorder },
  "&:hover fieldset": { borderColor: COLORS.primaryLight },
  "&.Mui-focused fieldset": { borderColor: `${COLORS.primary} !important`, borderWidth: "1.5px" },
  "&.Mui-focused": { boxShadow: `0 0 0 4px ${COLORS.secondaryLight}55` },
};

export default function RegisterPage({ role = "user", onRegister, onNavigateLogin, onChangeRole }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strengthIndex = useMemo(() => getPasswordStrength(password), [password]);
  const strength = STRENGTH_LEVELS[strengthIndex];
  const roleMeta = ROLE_META[role] || ROLE_META.user;
  const RoleIcon = roleMeta.Icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Fill in all fields to create your account.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      await onRegister?.({ fullName, email, password, role });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
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
        <Stack alignItems="center" spacing={0.5} sx={{ mb: 2.5, animation: `${fadeInUp} 0.6s ease both` }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: COLORS.secondaryDark }}>
            Create Your Account
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>
            Join Skin AI and unlock personalized skincare insights.
          </Typography>

          <Chip
            icon={<RoleIcon sx={{ fontSize: 16, color: `${roleMeta.color} !important` }} />}
            label={`Signing up as ${roleMeta.label}`}
            onDelete={onChangeRole}
            deleteIcon={
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.primaryDark, pr: 0.5 }}>
                Change
              </Typography>
            }
            sx={{
              mt: 1,
              backgroundColor: roleMeta.bg,
              color: COLORS.textDark,
              fontWeight: 600,
              fontSize: 12.5,
              "& .MuiChip-deleteIcon": { width: "auto" },
            }}
          />
        </Stack>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow: "0 20px 45px rgba(139, 111, 201, 0.14)",
            p: { xs: 3, sm: 3.5 },
            animation: `${fadeInUp} 0.6s ease 0.1s both`,
          }}
        >
          <Stack spacing={1.75}>
            <TextField
              fullWidth
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: inputSx,
              }}
            />
            <TextField
              fullWidth
              placeholder="Email Address"
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
            <TextField
              fullWidth
              placeholder="Password"
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
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label="Toggle password visibility">
                      {showPassword ? <VisibilityOff sx={{ fontSize: 20, color: COLORS.textMuted }} /> : <Visibility sx={{ fontSize: 20, color: COLORS.textMuted }} />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: inputSx,
              }}
            />
            <TextField
              fullWidth
              placeholder="Confirm Password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm((s) => !s)} edge="end" aria-label="Toggle confirm password visibility">
                      {showConfirm ? <VisibilityOff sx={{ fontSize: 20, color: COLORS.textMuted }} /> : <Visibility sx={{ fontSize: 20, color: COLORS.textMuted }} />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: inputSx,
              }}
            />

            {password && (
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>Password Strength</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: strength.color }}>{strength.label}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  {STRENGTH_LEVELS.map((level, i) => (
                    <Box
                      key={level.label}
                      sx={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: i <= strengthIndex ? strength.color : COLORS.cardBorder,
                        transition: "background-color 0.25s ease",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                size="small"
                sx={{ p: 0, mt: "2px", color: COLORS.cardBorder, "&.Mui-checked": { color: COLORS.primary } }}
              />
              <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.5 }}>
                I agree to the{" "}
                <Link href="#" underline="hover" sx={{ color: COLORS.primaryDark, fontWeight: 600 }}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" underline="hover" sx={{ color: COLORS.primaryDark, fontWeight: 600 }}>
                  Privacy Policy
                </Link>
              </Typography>
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 16px 30px rgba(139, 111, 201, 0.4)",
                  background: COLORS.brandGradient,
                },
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <Typography sx={{ textAlign: "center", fontSize: 14, color: COLORS.textMuted }}>
              Already have an account?{" "}
              <Link component="button" type="button" onClick={onNavigateLogin} underline="hover" sx={{ color: COLORS.primaryDark, fontWeight: 600 }}>
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
