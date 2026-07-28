import { useState, useEffect } from "react";
import {
  Box, Typography, Stack, Avatar, Divider, Popover, IconButton, Button,
  Chip, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem
} from "@mui/material";
import {
  SettingsOutlined, HelpOutlineOutlined, LogoutOutlined, PersonOutlineOutlined,
  VerifiedUser, Star, DescriptionOutlined, MedicalServices, EditOutlined,
  SaveOutlined, Close, Add, PhotoCamera
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "../api/dashboard";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];
const SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];

export default function ProfileDropdown({ user: propUser, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const savedProfile = localStorage.getItem("userProfile");
      const savedUser = localStorage.getItem("user");
      // Prioritize propUser, then savedUser, then userProfile
      let baseUser = propUser;
      if (!baseUser && savedUser) baseUser = JSON.parse(savedUser);
      let profileUser = savedProfile ? JSON.parse(savedProfile) : {};
      
      // If the ID doesn't match, discard the old userProfile cache
      if (baseUser && profileUser && baseUser.id !== profileUser.id) {
          profileUser = {};
          localStorage.removeItem("userProfile");
      }
      return { ...profileUser, ...baseUser };
    } catch (e) {
      return propUser || null;
    }
  });

  useEffect(() => {
    if (propUser) {
      setUserProfile(prev => ({ ...prev, ...propUser }));
    }
  }, [propUser]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    dob: "",
    gender: "",
    phone: "",
    altPhone: "",
    bloodGroup: "O+",
    emergencyContact: "",
    address: "",
    skinType: "Combination"
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile?.phone_number && !userProfile?.address) {
      getUserProfile()
        .then((data) => {
          if (data) {
            setUserProfile(prev => ({ ...prev, ...data }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const userData = userProfile || propUser || {};
  const isDoctor = userData.role === "dermatologist" || userData.role === "expert" || window.location.pathname.startsWith("/expert");

  // Extract / calculate fields
  const fullName = userData.full_name || userData.fullName || userData.name || "User";
  const initials = fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  const userId = userData.id ? `#ID-${String(userData.id).substring(0, 6).toUpperCase()}` : "#ID-XXXXXX";
  const email = userData.email || "";
  const phone = userData.phone_number || userData.phone || "";
  const altPhone = userData.alternate_phone || userData.altPhone || "";
  const dob = userData.date_of_birth || userData.dob || "";

  // Calculate age automatically from DOB
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = calculateAge(dob);
  const formattedDob = dob ? new Date(dob).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
  const ageDisplay = userAge ? `${userAge} Yrs (${formattedDob})` : formattedDob;

  const gender = userData.gender ? (userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)) : "";
  const address = userData.address || "";
  const bloodGroup = userData.blood_group || userData.bloodGroup || "O+";
  const emergencyContact = userData.emergency_contact || userData.emergencyContact || "";

  // Skin profile fields
  const skinType = userData.skin_type ? (userData.skin_type.charAt(0).toUpperCase() + userData.skin_type.slice(1)) : "Combination";
  const skinScore = userData.skin_score || 78;

  const handleOpenEditModal = () => {
    setEditForm({
      fullName: fullName,
      email: email,
      dob: dob || "",
      gender: gender || "Female",
      phone: phone || "",
      altPhone: altPhone || "",
      bloodGroup: bloodGroup || "O+",
      emergencyContact: emergencyContact || "",
      address: address || "",
      skinType: skinType || "Combination"
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = () => {
    const updated = {
      ...userData,
      full_name: editForm.fullName,
      fullName: editForm.fullName,
      email: editForm.email,
      date_of_birth: editForm.dob,
      dob: editForm.dob,
      gender: editForm.gender,
      phone_number: editForm.phone,
      phone: editForm.phone,
      alternate_phone: editForm.altPhone,
      altPhone: editForm.altPhone,
      blood_group: editForm.bloodGroup,
      bloodGroup: editForm.bloodGroup,
      emergency_contact: editForm.emergencyContact,
      emergencyContact: editForm.emergencyContact,
      address: editForm.address,
      skin_type: editForm.skinType
    };

    setUserProfile(updated);
    try {
      localStorage.setItem("userProfile", JSON.stringify(updated));
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updated }));
    } catch (e) {
      console.error(e);
    }
    setEditModalOpen(false);
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  return (
    <>
      {/* TRIGGER BAR IN HEADER */}
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        onClick={handleOpen}
        sx={{
          p: 0.75,
          pl: 1,
          pr: 1.5,
          borderRadius: "14px",
          backgroundColor: "#FAF8FC",
          border: "1px solid " + COLORS.cardBorder,
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "#F4EFF9",
            borderColor: COLORS.primary
          }
        }}
      >
        <Avatar src={userData.profile_photo} sx={{ width: 34, height: 34, background: COLORS.brandGradient, fontSize: 13, fontWeight: 800 }}>
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {fullName}
          </Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.primaryDark, fontWeight: 700 }}>
            Premium User ✓
          </Typography>
        </Box>
      </Stack>

      {/* HEALTHCARE ACCOUNT PANEL POPOVER */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: { xs: 340, sm: 500, md: 850 },
            borderRadius: "24px",
            boxShadow: "0 16px 48px rgba(139,111,201,0.18)",
            border: "1px solid " + COLORS.cardBorder,
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ maxHeight: "85vh", overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#EAE4F2" } }}>
          
          {/* ================= 1. PROFILE HEADER BAR ================= */}
          <Box
            sx={{
              p: 2.5,
              background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 50%, #F5ECF6 100%)",
              borderBottom: "1px solid " + COLORS.cardBorder,
              position: "relative"
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={userData.profile_photo}
                  sx={{
                    width: 60,
                    height: 60,
                    background: COLORS.brandGradient,
                    fontSize: 20,
                    fontWeight: 900,
                    border: "3px solid #FFF",
                    boxShadow: "0 6px 16px rgba(139,111,201,0.2)"
                  }}
                >
                  {initials}
                </Avatar>
                <IconButton
                  component="label"
                  size="small"
                  sx={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 24, height: 24,
                    backgroundColor: COLORS.primary, color: "#FFF",
                    border: "2px solid #FFF",
                    "&:hover": { backgroundColor: COLORS.primaryDark }
                  }}
                >
                  <PhotoCamera sx={{ fontSize: 12 }} />
                  <input type="file" accept="image/*" hidden onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result;
                        const updated = { ...userData, profile_photo: base64 };
                        setUserProfile(updated);
                        try {
                          localStorage.setItem("userProfile", JSON.stringify(updated));
                          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                          localStorage.setItem("user", JSON.stringify({ ...currentUser, profile_photo: base64 }));
                        } catch (err) { console.error(err); }
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </IconButton>
              </Box>
              <Box flexGrow={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.15 }}>
                    {fullName}
                  </Typography>
                  <IconButton size="small" onClick={handleOpenEditModal} title="Edit Profile Details" sx={{ color: COLORS.primary, backgroundColor: "rgba(139,111,201,0.1)" }}>
                    <EditOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
                <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mt: 0.25 }}>
                  User ID: <strong>{userId}</strong>
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textDark, fontWeight: 600, mt: 0.25 }}>
                  {email}
                </Typography>

                <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                  <Chip
                    icon={<VerifiedUser sx={{ fontSize: 12, color: "#FFF" }} />}
                    label="Verified User"
                    size="small"
                    sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: COLORS.success, color: "#FFF" }}
                  />
                  <Chip
                    icon={<Star sx={{ fontSize: 12, color: COLORS.primaryDark }} />}
                    label="Premium"
                    size="small"
                    sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* ================= 2. PRACTICE & CLINICAL OVERVIEW (DOCTOR vs PATIENT) ================= */}
          <Box sx={{ p: 2, backgroundColor: "#FFF", borderBottom: "1px solid " + COLORS.cardBorder }}>
            {isDoctor ? (
              <>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                  Clinical Practice Overview
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 1.25, borderRadius: "16px", backgroundColor: "#FAF8FC", border: "1px solid rgba(228,116,155,0.3)", boxShadow: "none" }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 800, textTransform: "uppercase" }}>SPECIALIZATION</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.secondary }}>Dermatology & Aesthetics</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 1.25, borderRadius: "16px", backgroundColor: "#FAF8FC", border: "1px solid rgba(139,111,201,0.2)", boxShadow: "none" }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 800, textTransform: "uppercase" }}>MEDICAL LICENSE</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.success }}>#MD-86F082 ✓</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                  Skin Profile Overview
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.25, borderRadius: "12px", backgroundColor: "#FAF8FC", border: "1px solid " + COLORS.cardBorder }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>SKIN TYPE</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark }}>{skinType}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.25, borderRadius: "12px", backgroundColor: "#FAF8FC", border: "1px solid " + COLORS.cardBorder }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>HEALTH SCORE</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.success }}>{skinScore} / 100</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>

          {/* ================= 3. USER INFORMATION ================= */}
          <Box sx={{ p: 2.25, backgroundColor: "#FFF", borderBottom: "1px solid " + COLORS.cardBorder }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                User Information
              </Typography>
              <Button
                size="small"
                startIcon={<EditOutlined sx={{ fontSize: 13 }} />}
                onClick={handleOpenEditModal}
                sx={{ textTransform: "none", fontSize: 11, fontWeight: 800, color: COLORS.primary }}
              >
                Fill Details
              </Button>
            </Stack>

            <Grid container spacing={1.5} sx={{ fontSize: 12 }}>
              {[
                { label: "Date of Birth / Age", val: ageDisplay },
                { label: "Gender", val: gender },
                { label: "Primary Phone", val: phone },
                { label: "Alternate Phone", val: altPhone },
                { label: "Blood Group", val: bloodGroup },
                { label: "Emergency Contact", val: emergencyContact },
              ].map((item, idx) => (
                <Grid item xs={12} sm={4} md="auto" key={idx} sx={{ flex: 1, minWidth: { md: 100 } }}>
                  <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>{item.label}</Typography>
                  {item.val ? (
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textDark }}>{item.val}</Typography>
                  ) : (
                    <Chip
                      label="+ Fill"
                      size="small"
                      onClick={handleOpenEditModal}
                      sx={{ height: 18, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(228,116,155,0.12)", color: COLORS.danger, cursor: "pointer", mt: 0.25 }}
                    />
                  )}
                </Grid>
              ))}

              <Grid item xs={12} sm={12} md="auto" sx={{ flex: 1.5, minWidth: { md: 150 } }}>
                <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted }}>Address</Typography>
                {address ? (
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textDark }}>{address}</Typography>
                ) : (
                  <Chip
                    label="+ Fill Address"
                    size="small"
                    onClick={handleOpenEditModal}
                    sx={{ height: 18, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(228,116,155,0.12)", color: COLORS.danger, cursor: "pointer", mt: 0.25 }}
                  />
                )}
              </Grid>
            </Grid>
          </Box>

          {/* ================= 4. QUICK ACTIONS ================= */}
          <Box sx={{ p: 1.5, backgroundColor: "#FFF" }}>
            <Stack spacing={0.5}>
              <Button
                fullWidth
                startIcon={<PersonOutlineOutlined />}
                onClick={handleOpenEditModal}
                sx={{ justifyContent: "flex-start", color: COLORS.textDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, py: 0.85, borderRadius: "10px", "&:hover": { backgroundColor: "#FAF8FC", color: COLORS.primary } }}
              >
                My Profile (Edit Details)
              </Button>
              <Button
                fullWidth
                startIcon={<DescriptionOutlined />}
                onClick={() => handleNavigate("/expert/reports")}
                sx={{ justifyContent: "flex-start", color: COLORS.textDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, py: 0.85, borderRadius: "10px", "&:hover": { backgroundColor: "#FAF8FC", color: COLORS.primary } }}
              >
                My Skin Reports
              </Button>
              <Button
                fullWidth
                startIcon={<MedicalServices />}
                onClick={() => handleNavigate("/expert/consultations")}
                sx={{ justifyContent: "flex-start", color: COLORS.textDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, py: 0.85, borderRadius: "10px", "&:hover": { backgroundColor: "#FAF8FC", color: COLORS.primary } }}
              >
                Appointments
              </Button>
              <Button
                fullWidth
                startIcon={<SettingsOutlined />}
                onClick={() => handleNavigate("/expert/settings")}
                sx={{ justifyContent: "flex-start", color: COLORS.textDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, py: 0.85, borderRadius: "10px", "&:hover": { backgroundColor: "#FAF8FC", color: COLORS.primary } }}
              >
                Settings
              </Button>
              <Button
                fullWidth
                startIcon={<HelpOutlineOutlined />}
                onClick={() => handleNavigate("/expert/settings")}
                sx={{ justifyContent: "flex-start", color: COLORS.textDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, py: 0.85, borderRadius: "10px", "&:hover": { backgroundColor: "#FAF8FC", color: COLORS.primary } }}
              >
                Help & Support
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* LOGOUT */}
          <Box sx={{ p: 1.5, backgroundColor: "#FAF8FC" }}>
            <Button
              fullWidth
              startIcon={<LogoutOutlined />}
              onClick={() => {
                handleClose();
                if (onLogout) onLogout();
              }}
              sx={{ justifyContent: "flex-start", color: COLORS.danger, textTransform: "none", fontWeight: 800, fontSize: 12.5, py: 0.85, borderRadius: "10px", "&:hover": { backgroundColor: "rgba(228,116,155,0.08)" } }}
            >
              Log Out
            </Button>
          </Box>

        </Box>
      </Popover>

      {/* ================= EDIT PROFILE DIALOG FORM ================= */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "24px", p: 1, boxShadow: "0 20px 60px rgba(139,111,201,0.25)" }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>
            Edit Profile Details
          </Typography>
          <IconButton onClick={() => setEditModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ borderColor: COLORS.cardBorder }}>
          <Stack spacing={2.5} py={1}>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>FULL NAME</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>EMAIL ADDRESS</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>DATE OF BIRTH</Typography>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>GENDER</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>PRIMARY PHONE</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="+91 9876543210"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>ALTERNATE PHONE</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="+91 9876500000"
                  value={editForm.altPhone}
                  onChange={(e) => setEditForm({ ...editForm, altPhone: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>BLOOD GROUP</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  {BLOOD_GROUPS.map((bg) => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>EMERGENCY CONTACT</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="+91 9123456789"
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>SKIN TYPE</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={editForm.skinType}
                  onChange={(e) => setEditForm({ ...editForm, skinType: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  {SKIN_TYPES.map((st) => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>ADDRESS</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Enter full address, city, state, pincode"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>
            </Grid>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: COLORS.textMuted }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            onClick={handleSaveProfile}
            sx={{
              background: COLORS.brandGradient,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 800,
              px: 3,
              py: 0.9
            }}
          >
            Save Profile Details
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
