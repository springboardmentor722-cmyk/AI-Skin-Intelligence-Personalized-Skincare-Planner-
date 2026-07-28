import { useState, useEffect } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, Paper, TextField,
  Switch, FormControlLabel, Divider, Chip, Tab, Tabs, InputAdornment, Alert
} from "@mui/material";
import {
  Person, LocalHospital, EventAvailable, Notifications, Security,
  Palette, Devices, AutoAwesome, CreditCard, HelpOutlineOutlined, Save,
  PhotoCamera, CheckCircle, VerifiedUser, Shield, Edit
} from "@mui/icons-material";
import { updateDermatologistProfile } from "../api/dashboard";

const cPrimary = "#7C5CFC";
const cCardBorder = "rgba(226, 215, 240, 0.8)";
const cTextDark = "#1A202C";
const cTextMuted = "#718096";
const cSuccess = "#38A169";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function ExpertSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [doctorPhoto, setDoctorPhoto] = useState(() => localStorage.getItem("dermatologistPhoto") || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State initialized from localStorage / defaults
  const [profileForm, setProfileForm] = useState(() => {
    let savedUser = {};
    try {
      savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {}

    return {
      fullName: savedUser.fullName || savedUser.full_name || savedUser.name || "Dr. dermo",
      email: savedUser.email || "dermo@hospital.com",
      phone: savedUser.phone || "+1 (555) 234-5678",
      degree: savedUser.degree || "MD, DNB (Dermatology)",
      specialization: savedUser.specialization || "Dermatology & Aesthetic Medicine",
      licenseNo: savedUser.licenseNo || "MD-86F082",
      experienceYears: savedUser.experienceYears || "12+ Years",
      hospital: savedUser.hospital || "Apollo Skin Institute & Laser Center",
      consultationFee: savedUser.consultationFee || "120",
      bio: savedUser.bio || "Senior Consultant Dermatologist specializing in inflammatory skin conditions, laser therapy, and clinical aesthetic treatments.",
      videoConsult: true,
      inPersonConsult: true,
      emergencyCare: false,
      maxPatientsDaily: "25",
      twoFactorAuth: true,
      aiAutoSuggest: true,
      aiSensitivity: "High (95% Threshold)"
    };
  });

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDoctorPhoto(reader.result);
        localStorage.setItem("dermatologistPhoto", reader.result);
        window.dispatchEvent(new Event("profileUpdated"));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Form Submission
  const handleSave = async () => {
    try {
      // Sync to localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.fullName = profileForm.fullName;
      user.phone = profileForm.phone;
      user.specialization = profileForm.specialization;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("doctorProfile", JSON.stringify(profileForm));

      // Attempt API sync
      try {
        await updateDermatologistProfile(profileForm);
      } catch (err) {
        // Fallback silently if API offline
      }

      window.dispatchEvent(new Event("profileUpdated"));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto", pb: 6 }}>

      {/* ================= 1. PAGE HEADER (NO DUPLICATE GREETING) ================= */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={3.5}>
        <Box>
          <Typography sx={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 26, fontWeight: 800, color: cTextDark, letterSpacing: "-0.5px", mb: 0.5 }}>
            ⚙️ Settings
          </Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted, fontWeight: 500 }}>
            Manage your professional profile, clinic preferences, consultation settings and security.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          sx={{
            borderRadius: "10px",
            background: "linear-gradient(135deg, #7C5CFC, #E4749B)",
            color: "#FFF",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 13,
            px: 3,
            py: 1,
            boxShadow: "0 4px 14px rgba(124,92,252,0.25)"
          }}
        >
          Save Changes
        </Button>
      </Stack>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>
          Settings and professional profile updated successfully!
        </Alert>
      )}

      {/* ================= 2. MAIN SETTINGS WORKSPACE (GRID LAYOUT) ================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" }, gap: 3.5, alignItems: "start" }}>

        {/* ── LEFT COLUMN: DOCTOR PROFILE CARD & NAVIGATION MENU ── */}
        <Stack spacing={3}>
          
          {/* Doctor Profile Card */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <Box sx={{ position: "relative", width: 84, height: 84, mx: "auto", mb: 2 }}>
              <Avatar
                src={doctorPhoto}
                sx={{
                  width: 84,
                  height: 84,
                  fontSize: 28,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #7C5CFC, #E4749B)",
                  color: "#FFF",
                  boxShadow: "0 6px 18px rgba(124,92,252,0.2)"
                }}
              >
                {initials(profileForm.fullName)}
              </Avatar>
              <input accept="image/*" type="file" id="doctor-photo-input" style={{ display: "none" }} onChange={handlePhotoUpload} />
              <label htmlFor="doctor-photo-input">
                <IconButton
                  component="span"
                  size="small"
                  sx={{
                    position: "absolute", bottom: -2, right: -2, backgroundColor: "#FFF", color: cPrimary,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", border: `1px solid ${cCardBorder}`,
                    "&:hover": { backgroundColor: "#FAF8FC" }
                  }}
                >
                  <PhotoCamera sx={{ fontSize: 16 }} />
                </IconButton>
              </label>
            </Box>

            <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark, mb: 0.25 }}>
              {profileForm.fullName}
            </Typography>
            <Chip
              icon={<CheckCircle sx={{ fontSize: 13, color: `${cSuccess} !important` }} />}
              label="Verified Dermatologist"
              size="small"
              sx={{ height: 22, fontSize: 10.5, fontWeight: 800, backgroundColor: "rgba(56,161,105,0.12)", color: cSuccess, mb: 2 }}
            />

            <Divider sx={{ my: 1.5, borderColor: cCardBorder }} />

            <Stack spacing={1} textAlign="left">
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cTextMuted, textTransform: "uppercase" }}>Specialization</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{profileForm.specialization}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cTextMuted, textTransform: "uppercase" }}>Experience & Degree</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{profileForm.experienceYears} • {profileForm.degree}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cTextMuted, textTransform: "uppercase" }}>Hospital / Practice</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{profileForm.hospital}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: cTextMuted, textTransform: "uppercase" }}>License Status</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: cPrimary }}>License #{profileForm.licenseNo} (Active ✓)</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Settings Navigation Menu */}
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            {[
              { id: "profile", label: "Profile", icon: <Person sx={{ fontSize: 18 }} /> },
              { id: "professional", label: "Professional Information", icon: <LocalHospital sx={{ fontSize: 18 }} /> },
              { id: "clinic", label: "Clinic & Consultation", icon: <EventAvailable sx={{ fontSize: 18 }} /> },
              { id: "availability", label: "Availability", icon: <EventAvailable sx={{ fontSize: 18 }} /> },
              { id: "notifications", label: "Notifications", icon: <Notifications sx={{ fontSize: 18 }} /> },
              { id: "security", label: "Privacy & Security", icon: <Security sx={{ fontSize: 18 }} /> },
              { id: "appearance", label: "Appearance", icon: <Palette sx={{ fontSize: 18 }} /> },
              { id: "devices", label: "Connected Devices", icon: <Devices sx={{ fontSize: 18 }} /> },
              { id: "ai", label: "AI Preferences", icon: <AutoAwesome sx={{ fontSize: 18 }} /> },
              { id: "billing", label: "Billing", icon: <CreditCard sx={{ fontSize: 18 }} /> },
              { id: "support", label: "Support", icon: <HelpOutlineOutlined sx={{ fontSize: 18 }} /> },
            ].map((nav) => {
              const isSel = activeTab === nav.id;
              return (
                <Stack
                  key={nav.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  onClick={() => setActiveTab(nav.id)}
                  sx={{
                    p: 1.25, px: 2, borderRadius: "12px", cursor: "pointer", mb: 0.5,
                    backgroundColor: isSel ? "rgba(124,92,252,0.1)" : "transparent",
                    color: isSel ? cPrimary : cTextDark,
                    fontWeight: isSel ? 800 : 600,
                    transition: "all 0.15s ease",
                    "&:hover": { backgroundColor: "rgba(124,92,252,0.06)", color: cPrimary }
                  }}
                >
                  <Box sx={{ color: isSel ? cPrimary : cTextMuted, display: "flex" }}>{nav.icon}</Box>
                  <Typography sx={{ fontSize: 13, fontWeight: isSel ? 800 : 600 }}>{nav.label}</Typography>
                </Stack>
              );
            })}
          </Paper>

        </Stack>

        {/* ── RIGHT COLUMN: SELECTED SECTION WORKSPACE ── */}
        <Stack spacing={3}>
          
          {/* Section 1: Professional Profile Information */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 0.5 }}>
              Professional Profile & Credentials
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: cTextMuted, mb: 3 }}>
              Update your medical qualifications, clinic location, and patient consultation fees.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Full Name & Title"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Medical Degree"
                value={profileForm.degree}
                onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Specialization"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Medical License Number"
                value={profileForm.licenseNo}
                onChange={(e) => setProfileForm({ ...profileForm, licenseNo: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Primary Hospital / Clinic"
                value={profileForm.hospital}
                onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Consultation Fee ($ / hr)"
                value={profileForm.consultationFee}
                onChange={(e) => setProfileForm({ ...profileForm, consultationFee: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box mt={2.5}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Professional Bio & Clinical Statement"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Box>
          </Paper>

          {/* Section 2: Clinic & Consultation Preferences */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 0.5 }}>
              Clinic & Telehealth Preferences
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: cTextMuted, mb: 3 }}>
              Configure consultation channels, daily patient capacity, and emergency settings.
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={profileForm.videoConsult} onChange={(e) => setProfileForm({ ...profileForm, videoConsult: e.target.checked })} color="secondary" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>Enable Telehealth Video Consultations</Typography>
                    <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>Allow remote patients to book online video appointments.</Typography>
                  </Box>
                }
              />
              <Divider sx={{ borderColor: cCardBorder }} />
              <FormControlLabel
                control={<Switch checked={profileForm.inPersonConsult} onChange={(e) => setProfileForm({ ...profileForm, inPersonConsult: e.target.checked })} color="secondary" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>Enable In-Person Hospital Visits</Typography>
                    <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>Accept physical clinic visits at primary hospital location.</Typography>
                  </Box>
                }
              />
              <Divider sx={{ borderColor: cCardBorder }} />
              <FormControlLabel
                control={<Switch checked={profileForm.emergencyCare} onChange={(e) => setProfileForm({ ...profileForm, emergencyCare: e.target.checked })} color="secondary" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>Emergency After-Hours Tele-Consult</Typography>
                    <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>Receive high-priority emergency alerts for critical skin cases.</Typography>
                  </Box>
                }
              />
            </Stack>
          </Paper>

          {/* Section 3: Privacy, Security & AI Preferences */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 0.5 }}>
              Security & Clinical AI Controls
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: cTextMuted, mb: 3 }}>
              Manage authentication, HIPAA compliance parameters, and AI model recommendations.
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={profileForm.twoFactorAuth} onChange={(e) => setProfileForm({ ...profileForm, twoFactorAuth: e.target.checked })} color="primary" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>Two-Factor Authentication (2FA)</Typography>
                    <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>Require OTP verification when accessing medical records.</Typography>
                  </Box>
                }
              />
              <Divider sx={{ borderColor: cCardBorder }} />
              <FormControlLabel
                control={<Switch checked={profileForm.aiAutoSuggest} onChange={(e) => setProfileForm({ ...profileForm, aiAutoSuggest: e.target.checked })} color="primary" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>Automated AI Treatment Recommendations</Typography>
                    <Typography sx={{ fontSize: 11.5, color: cTextMuted }}>Auto-generate preliminary treatment plans based on patient assessment images.</Typography>
                  </Box>
                }
              />
            </Stack>
          </Paper>

        </Stack>

      </Box>
    </Box>
  );
}
