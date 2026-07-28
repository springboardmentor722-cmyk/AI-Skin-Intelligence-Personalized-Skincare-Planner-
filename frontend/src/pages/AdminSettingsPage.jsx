import React, { useState, useEffect } from "react";
import {
  Box, Typography, Stack, Button, TextField, Select, MenuItem, Switch,
  CircularProgress, Alert, Paper, useMediaQuery, useTheme, Grid,
  Divider, LinearProgress, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText
} from "@mui/material";
import {
  Settings, Save, Language, Person, Business, Security, VerifiedUser,
  Notifications, VpnKey, Storage, CloudQueue, Email, AutoAwesome,
  SettingsBackupRestore, History, Build, Palette, Circle, CheckCircle, Shield
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getPlatformSettings } from "../api/admin";

const SETTINGS_CATEGORIES = [
  { key: "general", label: "General Settings", icon: <Settings /> },
  { key: "admin", label: "Administrator Profile", icon: <Person /> },
  { key: "org", label: "Organization", icon: <Business /> },
  { key: "security", label: "Security", icon: <Security /> },
  { key: "roles", label: "Roles & Permissions", icon: <VerifiedUser /> },
  { key: "notif", label: "Notifications", icon: <Notifications /> },
  { key: "keys", label: "API Keys", icon: <VpnKey /> },
  { key: "db", label: "Database", icon: <Storage /> },
  { key: "storage", label: "Storage", icon: <CloudQueue /> },
  { key: "email", label: "Email & SMTP", icon: <Email /> },
  { key: "ai", label: "AI Configuration", icon: <AutoAwesome /> },
  { key: "backup", label: "Backup & Restore", icon: <SettingsBackupRestore /> },
  { key: "audit", label: "Audit Logs", icon: <History /> },
  { key: "maintenance", label: "System Maintenance", icon: <Build /> },
  { key: "appearance", label: "Appearance", icon: <Palette /> }
];

export default function AdminSettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  
  const [activeTab, setActiveTab] = useState("general");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await getPlatformSettings();
        setData(res);
      } catch (err) {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textDark,
      "& fieldset": { borderColor: COLORS.cardBorder },
      "&:hover fieldset": { borderColor: COLORS.primary },
      "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1px" }
    }
  };

  const switchStyle = {
    width: 38, height: 22, padding: 0,
    "& .MuiSwitch-switchBase": {
      padding: 0, margin: "2px", transitionDuration: "300ms",
      "&.Mui-checked": {
        transform: "translateX(16px)", color: "#fff",
        "& + .MuiSwitch-track": { backgroundColor: COLORS.primary, opacity: 1, border: 0 },
      },
    },
    "& .MuiSwitch-thumb": { boxSizing: "border-box", width: 18, height: 18 },
    "& .MuiSwitch-track": { borderRadius: 22 / 2, backgroundColor: "#E9E9EA", opacity: 1, transition: theme.transitions.create(["background-color"]) },
  };

  const SectionCard = ({ icon, title, children }) => (
    <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Box sx={{ color: COLORS.primary, "& > svg": { fontSize: 18 } }}>{icon}</Box>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{title}</Typography>
      </Stack>
      <Stack spacing={2.5}>{children}</Stack>
    </Box>
  );

  const renderGeneralSettings = () => {
    if (!data) return null;
    const { general, regional, system_preferences, session_access, file_upload, email_config, infrastructure } = data;

    return (
      <Grid container spacing={3}>
        {/* Row 1 */}
        <Grid item xs={12} md={4}>
          <SectionCard icon={<Settings />} title="Platform Configuration">
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Platform Name</Typography>
              <TextField fullWidth size="small" defaultValue={general.platform_name} sx={inputStyle} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Support Email</Typography>
              <TextField fullWidth size="small" defaultValue={general.support_email} sx={inputStyle} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Support Phone</Typography>
              <TextField fullWidth size="small" defaultValue={general.support_phone} sx={inputStyle} />
            </Box>
          </SectionCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <SectionCard icon={<Language />} title="Regional Settings">
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Time Zone</Typography>
              <Select fullWidth size="small" defaultValue={regional.time_zone} sx={inputStyle}>
                <MenuItem value={regional.time_zone}>{regional.time_zone}</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Date Format</Typography>
              <Select fullWidth size="small" defaultValue={regional.date_format} sx={inputStyle}>
                <MenuItem value={regional.date_format}>{regional.date_format}</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Language</Typography>
              <Select fullWidth size="small" defaultValue={regional.language} sx={inputStyle}>
                <MenuItem value={regional.language}>{regional.language}</MenuItem>
              </Select>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard icon={<Build />} title="System Preferences">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Allow User Registration</Typography>
              <Switch defaultChecked={system_preferences.allow_user_registration} sx={switchStyle} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Email Verification Required</Typography>
              <Switch defaultChecked={system_preferences.email_verification_required} sx={switchStyle} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Maintenance Mode</Typography>
              <Switch defaultChecked={system_preferences.maintenance_mode} sx={switchStyle} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Show Powered By</Typography>
              <Switch defaultChecked={system_preferences.show_powered_by} sx={switchStyle} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Enable Recaptcha</Typography>
              <Switch defaultChecked={system_preferences.enable_recaptcha} sx={switchStyle} />
            </Stack>
          </SectionCard>
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12} md={4}>
          <SectionCard icon={<Security />} title="Session & Access">
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Session Timeout</Typography>
              <Select fullWidth size="small" defaultValue={session_access.session_timeout} sx={inputStyle}>
                <MenuItem value={session_access.session_timeout}>{session_access.session_timeout}</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>JWT Expiry</Typography>
              <Select fullWidth size="small" defaultValue={session_access.jwt_expiry} sx={inputStyle}>
                <MenuItem value={session_access.jwt_expiry}>{session_access.jwt_expiry}</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Max Login Attempts</Typography>
              <TextField fullWidth size="small" defaultValue={session_access.max_login_attempts} sx={inputStyle} />
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard icon={<CloudQueue />} title="File Upload Settings">
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Max File Size</Typography>
              <Select fullWidth size="small" defaultValue={file_upload.max_file_size} sx={inputStyle}>
                <MenuItem value={file_upload.max_file_size}>{file_upload.max_file_size}</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Allowed File Types</Typography>
              <TextField fullWidth size="small" defaultValue={file_upload.allowed_file_types} sx={inputStyle} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Daily Upload Limit (Per User)</Typography>
              <TextField fullWidth size="small" defaultValue={file_upload.daily_upload_limit} sx={inputStyle} />
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard icon={<Email />} title="Email Configuration">
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Default Sender Name</Typography>
              <TextField fullWidth size="small" defaultValue={email_config.default_sender_name} sx={inputStyle} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mb: 1 }}>Default Sender Email</Typography>
              <TextField fullWidth size="small" defaultValue={email_config.default_sender_email} sx={inputStyle} />
            </Box>
            <Button variant="outlined" startIcon={<Settings sx={{ fontSize: 16 }} />} sx={{ mt: 2, borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.primary, borderColor: "rgba(139,111,201,0.3)", width: "max-content", fontSize: 12 }}>
              Configure SMTP Settings
            </Button>
          </SectionCard>
        </Grid>

        {/* Row 3 - Infrastructure Stats */}
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ color: COLORS.primary, "& > svg": { fontSize: 18 } }}><Storage /></Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>Database Status</Typography>
              </Stack>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#4CAF7D" }}>All Systems Operational</Typography>
            </Stack>
            <Stack spacing={2}>
              {infrastructure.databases.map(db => (
                <Stack key={db.name} direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark, width: "33%" }}>{db.name}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "33%" }}>
                    <Circle sx={{ fontSize: 6, color: "#4CAF7D" }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4CAF7D" }}>{db.status}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, width: "33%", textAlign: "right" }}>{db.ping}</Typography>
                </Stack>
              ))}
            </Stack>
            <Button variant="outlined" sx={{ mt: 3, borderRadius: "8px", textTransform: "none", fontWeight: 700, color: COLORS.primary, borderColor: "rgba(139,111,201,0.3)", fontSize: 11 }}>
              View Database Details
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box sx={{ color: COLORS.primary, "& > svg": { fontSize: 18 } }}><CloudQueue /></Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>Storage Overview</Typography>
            </Stack>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark, width: "33%" }}>Cloudinary</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "33%" }}>
                  <Circle sx={{ fontSize: 6, color: "#4CAF7D" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4CAF7D" }}>Connected</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, width: "33%", textAlign: "right" }}>{infrastructure.storage.cloudinary.used}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark, width: "33%" }}>AWS S3</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "33%" }}>
                  <Circle sx={{ fontSize: 6, color: "#4CAF7D" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4CAF7D" }}>Connected</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, width: "33%", textAlign: "right" }}>{infrastructure.storage.aws_s3.used}</Typography>
              </Stack>
            </Stack>
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark }}>Total Storage Used</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>
                  {infrastructure.storage.total_used} / {infrastructure.storage.total_capacity} <br/> <span style={{ float: 'right' }}>{infrastructure.storage.usage_percent}%</span>
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={infrastructure.storage.usage_percent} sx={{ height: 4, borderRadius: 2, backgroundColor: "rgba(139,111,201,0.1)", "& .MuiLinearProgress-bar": { backgroundColor: COLORS.primary } }} />
            </Box>
            <Button variant="outlined" sx={{ mt: 1, borderRadius: "8px", textTransform: "none", fontWeight: 700, color: COLORS.primary, borderColor: "rgba(139,111,201,0.3)", fontSize: 11 }}>
              Manage Storage
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box sx={{ color: COLORS.primary, "& > svg": { fontSize: 18 } }}><Build /></Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>System Information</Typography>
            </Stack>
            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Platform Version</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>{infrastructure.system_info.platform_version}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Environment</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#4CAF7D", backgroundColor: "rgba(76,175,125,0.1)", px: 1, py: 0.5, borderRadius: "6px" }}>{infrastructure.system_info.environment}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Server Time</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>{infrastructure.system_info.server_time}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>Uptime</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#4CAF7D" }}>{infrastructure.system_info.uptime}</Typography>
              </Stack>
            </Stack>
            <Button variant="outlined" sx={{ mt: 3, borderRadius: "8px", textTransform: "none", fontWeight: 700, color: COLORS.primary, borderColor: "rgba(139,111,201,0.3)", fontSize: 11 }}>
              View System Logs
            </Button>
          </Box>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ maxWidth: 1500, mx: "auto", width: "100%", pb: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>
            Settings
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Manage and configure your platform settings and preferences.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />} sx={{ backgroundColor: COLORS.primary, borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3, py: 1.25, boxShadow: "0 4px 14px rgba(139,111,201,0.3)", "&:hover": { backgroundColor: COLORS.primaryDark } }}>
          Save All Changes
        </Button>
      </Stack>

      {/* Main Layout Grid */}
      <Grid container spacing={4}>
        {/* Left Sidebar */}
        <Grid item xs={12} lg={2.5}>
          <List disablePadding>
            {SETTINGS_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.key;
              return (
                <ListItem key={cat.key} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    onClick={() => setActiveTab(cat.key)}
                    sx={{
                      borderRadius: "10px", py: 1.25, px: 2,
                      backgroundColor: isActive ? COLORS.primary : "transparent",
                      "&:hover": { backgroundColor: isActive ? COLORS.primary : "rgba(139,111,201,0.05)" }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isActive ? "#FFF" : COLORS.textMuted, "& > svg": { fontSize: 18 } }}>
                      {cat.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={cat.label} 
                      primaryTypographyProps={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? "#FFF" : COLORS.textDark }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Grid>

        {/* Right Content */}
        <Grid item xs={12} lg={9.5}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box sx={{ color: COLORS.primary, "& > svg": { fontSize: 20 } }}><CheckCircle /></Box>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: COLORS.textDark }}>
              {SETTINGS_CATEGORIES.find(c => c.key === activeTab)?.label}
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{error}</Alert>}
          
          {loading ? (
            <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Stack>
          ) : (
            <>
              {activeTab === "general" ? renderGeneralSettings() : (
                <Box sx={{ p: 5, textAlign: "center", backgroundColor: "#FFF", borderRadius: "16px", border: "1px solid " + COLORS.cardBorder }}>
                  <Typography sx={{ color: COLORS.textMuted, fontWeight: 600 }}>This settings section is under development.</Typography>
                </Box>
              )}
            </>
          )}

          {/* Footer Banner */}
          <Box sx={{ backgroundColor: "#F7F5FB", border: "1px solid rgba(139,111,201,0.2)", borderRadius: "16px", p: 3, mt: 4 }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: "rgba(139,111,201,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary }}>
                  <Shield sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark, mb: 0.25 }}>Your settings are secure</Typography>
                  <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>All configuration changes are encrypted and stored securely. Regular backups are enabled.</Typography>
                </Box>
              </Stack>
              <Button variant="outlined" startIcon={<History sx={{ fontSize: 16 }} />} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.primary, borderColor: "rgba(139,111,201,0.3)", backgroundColor: "#FFF", whiteSpace: "nowrap" }}>
                View Backup History
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
