import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box, Stack, Typography, Paper, Avatar, Divider, Switch, Button, TextField,
  Grid, Chip, Select, MenuItem, Snackbar, IconButton, useMediaQuery, useTheme,
  Alert, Drawer
} from "@mui/material";
import {
  PersonOutlined, NotificationsNoneOutlined, LockOutlined, HelpOutlineOutlined,
  ColorLensOutlined, Language, Devices, Shield, FileDownload,
  WorkspacePremium, InfoOutlined, WarningAmber, CameraAlt, Check,
  ChevronRight, Spa, MenuOutlined, Close, LogoutOutlined, CheckCircle,
  VerifiedUser, Star
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getUserProfile, updateUserProfile } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

/* ================================================================
   DESIGN TOKENS
   ================================================================ */
const CARD_RADIUS = "20px";
const CARD_BORDER = "1px solid " + COLORS.cardBorder;
const CARD_BG = "#FFFFFF";

const TABS = [
  { key: "profile",       label: "Profile Information",  sub: "Personal details & account info",    icon: PersonOutlined },
  { key: "notifications", label: "Notifications",         sub: "Manage your alerts",                 icon: NotificationsNoneOutlined },
  { key: "security",      label: "Privacy & Security",    sub: "Password, 2FA & privacy",            icon: LockOutlined },
  { key: "skin_profile",  label: "Health Preferences",    sub: "Skin goals, allergies & preferences",icon: Spa },
  { key: "appearance",    label: "Appearance",            sub: "Theme, font & display",              icon: ColorLensOutlined },
  { key: "language",      label: "Language & Region",     sub: "Language, timezone & formats",       icon: Language },
  { key: "devices",       label: "Connected Devices",     sub: "Manage your devices",                icon: Devices },
  { key: "reports",       label: "Reports & Data",        sub: "Download & export your data",        icon: FileDownload },
  { key: "help",          label: "Help & Support",        sub: "FAQs, contact support",              icon: HelpOutlineOutlined },
  { key: "danger",        label: "Logout",                sub: "Sign out from your account",         icon: LogoutOutlined, danger: true }
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeTab, setActiveTab] = useState("profile");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Profile form
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    blood_group: "",
    emergency_contact: "",
    preferred_language: "English",
    account_type: "Premium"
  });

  // Notification toggles
  const [notifs, setNotifs] = useState({
    routine: true, appointment: true, insights: true,
    weekly_reports: true, products: true, consultant_messages: true,
    derm_messages: true, email: false
  });

  const [twoFA, setTwoFA] = useState(true);
  const [themeMode, setThemeMode] = useState("light");

  useEffect(() => {
    getUserProfile()
      .then((p) => {
        if (p) setFormData(prev => ({
          ...prev,
          full_name: p.full_name || "",
          email: p.email || "",
          phone: p.phone_number || "",
          dob: p.date_of_birth || "",
          gender: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          country: p.country || "India",
          postal_code: p.postal_code || "",
          blood_group: p.blood_group || "",
          emergency_contact: p.emergency_contact || "",
          account_type: p.subscription_plan || "Premium"
        }));
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ full_name: formData.full_name, phone_number: formData.phone }).catch(() => null);
      setToastMsg("Profile updated successfully!");
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (isMobile) setMobileNavOpen(false);
  };

  const memberSince = formData.created_at
    ? new Date(formData.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Jan 2025";

  /* ================================================================
     LEFT NAV
     ================================================================ */
  const NavContent = () => (
    <Box sx={{ p: 2 }}>
      {/* User Mini Profile */}
      <Stack spacing={1.5} alignItems="center" sx={{ py: 2, mb: 1 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={{
              width: 64, height: 64,
              background: COLORS.brandGradient,
              fontSize: 22, fontWeight: 900,
              border: "3px solid #FFF",
              boxShadow: "0 4px 14px rgba(139,111,201,0.2)"
            }}
          >
            {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <Box sx={{
            position: "absolute", bottom: 0, right: 0,
            width: 20, height: 20, borderRadius: "50%",
            backgroundColor: COLORS.success,
            border: "2px solid #FFF",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <CheckCircle sx={{ fontSize: 12, color: "#FFF" }} />
          </Box>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, lineHeight: 1.2 }}>
            {formData.full_name || "User"}
          </Typography>
          <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.5 }}>
            <Chip
              icon={<VerifiedUser sx={{ fontSize: 10, color: "#FFF" }} />}
              label="Premium User"
              size="small"
              sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: COLORS.primary, color: "#FFF" }}
            />
          </Stack>
          <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, mt: 0.5 }}>
            {formData.email}
          </Typography>
          <Chip label="✔ Verified" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, backgroundColor: "rgba(46,158,91,0.1)", color: COLORS.success, mt: 0.5 }} />
        </Box>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Nav Items */}
      <Stack spacing={0.5}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Stack
              key={tab.key}
              direction="row"
              alignItems="center"
              onClick={() => handleTabChange(tab.key)}
              sx={{
                p: 1.25, px: 1.5,
                borderRadius: "12px",
                cursor: "pointer",
                backgroundColor: isActive ? "rgba(139,111,201,0.1)" : "transparent",
                transition: "all 0.18s ease",
                "&:hover": { backgroundColor: isActive ? "rgba(139,111,201,0.12)" : "rgba(139,111,201,0.05)" }
              }}
            >
              <Box sx={{
                width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
                backgroundColor: isActive
                  ? "rgba(139,111,201,0.15)"
                  : tab.danger ? "rgba(228,116,155,0.08)" : "rgba(139,111,201,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                mr: 1.5
              }}>
                <Icon sx={{
                  fontSize: 17,
                  color: tab.danger ? COLORS.danger : isActive ? COLORS.primary : COLORS.textMuted
                }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: 12.5, fontWeight: isActive ? 800 : 600, lineHeight: 1.2,
                  color: tab.danger ? COLORS.danger : isActive ? COLORS.primaryDark : COLORS.textDark
                }}>
                  {tab.label}
                </Typography>
                <Typography sx={{ fontSize: 10, color: COLORS.textMuted, lineHeight: 1.2 }}>
                  {tab.sub}
                </Typography>
              </Box>
              <ChevronRight sx={{
                fontSize: 16,
                color: isActive ? COLORS.primary : COLORS.textMuted,
                opacity: isActive ? 1 : 0.5
              }} />
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );

  /* ================================================================
     RIGHT PANEL CONTENT
     ================================================================ */
  const renderContent = () => {

    /* ---- PROFILE INFORMATION ---- */
    if (activeTab === "profile") return (
      <Stack spacing={0}>
        {/* Panel Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ p: 3, pb: 2.5 }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>
              Profile Information
            </Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>
              Update your personal details and account information
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonOutlined sx={{ fontSize: 15 }} />}
            sx={{ borderColor: COLORS.cardBorder, color: COLORS.primaryDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 12, "&:hover": { borderColor: COLORS.primary } }}
          >
            Edit Profile
          </Button>
        </Stack>

        <Divider />

        {/* User Photo Row */}
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "center", sm: "center" }} spacing={2.5} sx={{ px: 3, py: 2.5 }}>
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar sx={{ width: 80, height: 80, background: COLORS.brandGradient, fontSize: 26, fontWeight: 900, border: "3px solid #FFF", boxShadow: "0 6px 20px rgba(139,111,201,0.2)" }}>
              {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <IconButton size="small" sx={{ position: "absolute", bottom: -2, right: -2, backgroundColor: COLORS.primary, color: "#FFF", width: 26, height: 26, "&:hover": { backgroundColor: COLORS.primaryDark } }}>
              <CameraAlt sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.75}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 900, color: COLORS.textDark }}>
                {formData.full_name || "—"}
              </Typography>
              <Chip label="Premium User" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark }} />
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>{formData.email}</Typography>
              <Chip icon={<Check sx={{ fontSize: 10, color: COLORS.success }} />} label="Verified" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, backgroundColor: "rgba(46,158,91,0.1)", color: COLORS.success }} />
            </Stack>
          </Box>
        </Stack>

        <Divider />

        {/* Info Grid — READ ONLY DISPLAY (matches screenshot) */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2
          }}>
            {[
              { label: "Date of Birth", value: formData.dob ? new Date(formData.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not Added" },
              { label: "Country",         value: formData.country || "Not Added" },
              { label: "Age",             value: formData.dob ? `${new Date().getFullYear() - new Date(formData.dob).getFullYear()} Years` : "Not Added" },
              { label: "Postal Code",     value: formData.postal_code || "Not Added" },
              { label: "Gender",          value: formData.gender || "Not Added" },
              { label: "Blood Group",     value: formData.blood_group || "Not Added" },
              { label: "Phone Number",    value: formData.phone || "Not Added" },
              { label: "Emergency Contact", value: formData.emergency_contact || "Not Added" },
              { label: "Email Address",   value: formData.email || "Not Added" },
              { label: "Preferred Language", value: formData.preferred_language || "English" },
              { label: "Address",         value: formData.address ? `${formData.address}${formData.city ? ", " + formData.city : ""}` : "Not Added" },
              { label: "Account Type",    value: formData.account_type || "Premium" },
              { label: "City",            value: formData.city || "Not Added" },
              { label: "Member Since",    value: memberSince },
              { label: "State",           value: formData.state || "Not Added" }
            ].map((field, idx) => (
              <Box key={idx}>
                <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, mb: 0.25 }}>
                  {field.label}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.textDark }}>
                  {field.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Editable Form Section */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>
            Edit Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name" size="small" fullWidth
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address" size="small" fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number" size="small" fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth" type="date" size="small" fullWidth
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={formData.gender || ""}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                size="small" fullWidth displayEmpty
                sx={{ borderRadius: "10px" }}
                renderValue={(v) => v || "Select Gender"}
              >
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Blood Group" size="small" fullWidth
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City" size="small" fullWidth
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="State" size="small" fullWidth
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country" size="small" fullWidth
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Postal Code" size="small" fullWidth
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address" size="small" fullWidth multiline rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Emergency Contact" size="small" fullWidth
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Footer Buttons */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/user/dashboard")}
            sx={{ borderColor: COLORS.cardBorder, color: COLORS.textDark, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3, "&:hover": { borderColor: COLORS.primary } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={saving}
            sx={{ background: COLORS.brandGradient, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 4, boxShadow: "0 4px 14px rgba(139,111,201,0.3)" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>
    );

    /* ---- NOTIFICATIONS ---- */
    if (activeTab === "notifications") return (
      <Stack spacing={0}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>Notification Preferences</Typography>
          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>Choose which alerts and reminders you receive.</Typography>
        </Box>
        <Divider />
        <Stack spacing={0} divider={<Divider />} sx={{ px: 3 }}>
          {[
            { key: "routine",              title: "Routine Reminders",          desc: "Morning and evening skincare routine alerts." },
            { key: "appointment",          title: "Appointment Reminders",      desc: "Push notifications before scheduled consultations." },
            { key: "insights",             title: "AI Daily Insights",          desc: "Personalized UV, weather, and hydration tips." },
            { key: "weekly_reports",       title: "Weekly Summary Reports",     desc: "Weekly email digest of your skin progress." },
            { key: "products",             title: "Product Recommendations",    desc: "Alerts when new formulations match your profile." },
            { key: "consultant_messages",  title: "Consultant Messages",        desc: "Direct messages from your skincare consultant." },
            { key: "derm_messages",        title: "Dermatologist Messages",     desc: "Treatment plan updates from your dermatologist." },
            { key: "email",                title: "Marketing Emails",           desc: "Promotions and skincare news." }
          ].map((item) => (
            <Stack key={item.key} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textDark }}>{item.title}</Typography>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>{item.desc}</Typography>
              </Box>
              <Switch
                checked={notifs[item.key]}
                onChange={(e) => setNotifs({ ...notifs, [item.key]: e.target.checked })}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.primary }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: COLORS.primary } }}
              />
            </Stack>
          ))}
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setToastMsg("Notification preferences saved!")} sx={{ background: COLORS.brandGradient, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 4 }}>
            Save Preferences
          </Button>
        </Stack>
      </Stack>
    );

    /* ---- SECURITY ---- */
    if (activeTab === "security") return (
      <Stack spacing={0}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>Privacy & Security</Typography>
          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>Manage password, 2FA, and active sessions.</Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>Change Password</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><TextField label="Current Password" type="password" size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="New Password" type="password" size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Confirm Password" type="password" size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} /></Grid>
          </Grid>
          <Button variant="outlined" onClick={() => setToastMsg("Password changed!")} sx={{ mt: 2, borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: COLORS.primary, color: COLORS.primary }}>
            Update Password
          </Button>
        </Box>
        <Divider />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>Two-Factor Authentication</Typography>
            <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted }}>Secure your account with TOTP authenticator apps.</Typography>
          </Box>
          <Switch checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.primary }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: COLORS.primary } }} />
        </Stack>
        <Divider />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 1.5 }}>Active Sessions</Typography>
          {[
            { device: "Windows PC (Chrome)", location: "Mumbai, India", time: "Active Now", active: true },
            { device: "iPhone 14 Pro (Safari)", location: "Mumbai, India", time: "2 hours ago", active: false }
          ].map((s, idx) => (
            <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: "12px", border: CARD_BORDER, mb: 1, backgroundColor: "#FAF8FC" }}>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textDark }}>{s.device}</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{s.location} · {s.time}</Typography>
              </Box>
              {s.active
                ? <Chip label="Active" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(46,158,91,0.12)", color: COLORS.success }} />
                : <Button size="small" sx={{ textTransform: "none", color: COLORS.danger, fontWeight: 700, fontSize: 11 }}>Revoke</Button>
              }
            </Stack>
          ))}
        </Box>
      </Stack>
    );

    /* ---- SKIN / HEALTH PREFERENCES ---- */
    if (activeTab === "skin_profile") return (
      <Stack spacing={0}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>Health Preferences</Typography>
          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>Your skin goals, known allergies and clinical preferences.</Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Grid container spacing={2}>
            {[
              { label: "Skin Type",        value: "Combination",          color: COLORS.primaryDark },
              { label: "Top Concerns",     value: "Acne, Post Acne Marks",color: COLORS.textDark },
              { label: "Known Allergies",  value: "Fragrance, High Alcohol", color: COLORS.danger },
              { label: "Sensitivity",      value: "Mild Sensitivity",     color: "#FFA726" }
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "14px", backgroundColor: "#FAF8FC", border: CARD_BORDER }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: item.color, mt: 0.5 }}>{item.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Button variant="contained" onClick={() => navigate("/user/profile")} sx={{ mt: 2.5, background: COLORS.brandGradient, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Edit Skin Profile
          </Button>
        </Box>
      </Stack>
    );

    /* ---- APPEARANCE ---- */
    if (activeTab === "appearance") return (
      <Stack spacing={0}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>Appearance & Theme</Typography>
          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>Customize the visual palette and font scaling.</Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>Theme Mode</Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
            {[
              { value: "light", label: "☀️ Light" },
              { value: "dark",  label: "🌙 Dark" },
              { value: "system",label: "💻 System" }
            ].map((m) => (
              <Paper
                key={m.value}
                elevation={0}
                onClick={() => setThemeMode(m.value)}
                sx={{
                  px: 3, py: 2, borderRadius: "14px", cursor: "pointer",
                  border: "2px solid " + (themeMode === m.value ? COLORS.primary : COLORS.cardBorder),
                  backgroundColor: themeMode === m.value ? "rgba(139,111,201,0.06)" : "#FFF",
                  transition: "all 0.2s ease"
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: themeMode === m.value ? COLORS.primaryDark : COLORS.textDark }}>{m.label}</Typography>
              </Paper>
            ))}
          </Stack>
          <Alert severity="info" sx={{ mt: 2.5, borderRadius: "12px", fontSize: 12 }}>
            Theme customisation will be fully supported in the next release.
          </Alert>
        </Box>
      </Stack>
    );

    /* ---- DANGER / LOGOUT ---- */
    if (activeTab === "danger") return (
      <Stack spacing={0}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.danger }}>Account Actions</Typography>
          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>Irreversible actions regarding your account data.</Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1px solid rgba(228,116,155,0.3)", backgroundColor: "#FFF5F8", mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.danger }}>Delete Account</Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted, my: 1, lineHeight: 1.5 }}>
              Once deleted, all assessments, skin photos, and clinical records will be permanently erased. This action cannot be undone.
            </Typography>
            <Button variant="contained" color="error" onClick={() => alert("Account deletion requested.")} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
              Delete My Account
            </Button>
          </Paper>
        </Box>
      </Stack>
    );

    /* ---- GENERIC TABS ---- */
    return (
      <Stack spacing={0}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark, textTransform: "capitalize" }}>
            {TABS.find(t => t.key === activeTab)?.label || activeTab}
          </Typography>
          <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>
            {TABS.find(t => t.key === activeTab)?.sub}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 3, py: 3 }}>
          <Alert severity="success" icon={<Check />} sx={{ borderRadius: "12px" }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Settings are active and configured.</Typography>
          </Alert>
        </Box>
      </Stack>
    );
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>

        {/* Page Title Row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: COLORS.textDark }}>
              Settings
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textMuted, mt: 0.25 }}>
              Manage your account, preferences and privacy settings
            </Typography>
          </Box>
          {isMobile && (
            <IconButton
              onClick={() => setMobileNavOpen(true)}
              sx={{ backgroundColor: "#FAF8FC", border: CARD_BORDER, borderRadius: "12px" }}
            >
              <MenuOutlined sx={{ color: COLORS.primaryDark }} />
            </IconButton>
          )}
        </Stack>

        {/* TWO-COLUMN LAYOUT */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, gap: 3, alignItems: "start" }}>

          {/* LEFT NAV — Desktop only */}
          {!isMobile && (
            <Paper
              elevation={0}
              sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, overflow: "hidden", position: "sticky", top: 20 }}
            >
              <NavContent />
            </Paper>
          )}

          {/* RIGHT CONTENT PANEL */}
          <Paper
            elevation={0}
            sx={{ borderRadius: CARD_RADIUS, border: CARD_BORDER, backgroundColor: CARD_BG, overflow: "hidden" }}
          >
            {renderContent()}
          </Paper>

        </Box>

        {/* MOBILE: Drawer Nav */}
        <Drawer
          anchor="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          PaperProps={{ sx: { width: 290, borderTopRightRadius: "20px", borderBottomRightRadius: "20px" } }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 2 }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 900, color: COLORS.textDark }}>Settings</Typography>
            <IconButton size="small" onClick={() => setMobileNavOpen(false)}><Close /></IconButton>
          </Stack>
          <NavContent />
        </Drawer>

        {/* TOAST */}
        <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg("")} message={toastMsg} />

      </Box>
    </motion.div>
  );
}
