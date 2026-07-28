import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  UploadFileRounded,
  CheckCircleRounded,
  MedicalServicesRounded,
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import apiClient from "../api/auth";

const inputSx = {
  borderRadius: "14px",
  backgroundColor: "#FFFFFF",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.cardBorder },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.primary },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.primary + " !important", borderWidth: "1.5px" },
};

function FileField({ label, required, file, onChange }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textDark, mb: 0.75 }}>
        {label} {required && <span style={{ color: COLORS.danger }}>*</span>}
      </Typography>
      <Button
        component="label"
        fullWidth
        startIcon={file ? <CheckCircleRounded sx={{ fontSize: 18 }} /> : <UploadFileRounded sx={{ fontSize: 18 }} />}
        sx={{
          textTransform: "none",
          justifyContent: "flex-start",
          borderRadius: "14px",
          border: "1.5px solid " + (file ? COLORS.primary : COLORS.cardBorder),
          color: file ? COLORS.primaryDark : COLORS.textMuted,
          backgroundColor: file ? "rgba(139,111,201,0.06)" : "#FFFFFF",
          py: 1.25,
          px: 2,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {file ? file.name : "Choose file..."}
        <input
          type="file"
          hidden
          accept="image/*,.pdf"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </Button>
    </Box>
  );
}

export default function DermatologistApplicationPage({ onSubmitted, onLogout }) {
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [medicalCouncilRegistration, setMedicalCouncilRegistration] = useState("");
  const [hospitalOrClinicName, setHospitalOrClinicName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");

  const [governmentId, setGovernmentId] = useState(null);
  const [medicalDegreeCertificate, setMedicalDegreeCertificate] = useState(null);
  const [medicalLicenseUpload, setMedicalLicenseUpload] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!medicalLicenseNumber || !medicalCouncilRegistration || !hospitalOrClinicName || !specialization || !yearsOfExperience) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!governmentId || !medicalDegreeCertificate || !medicalLicenseUpload) {
      setError("Government ID, Medical Degree Certificate, and Medical License upload are all required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("medical_license_number", medicalLicenseNumber);
      formData.append("medical_council_registration", medicalCouncilRegistration);
      formData.append("hospital_or_clinic_name", hospitalOrClinicName);
      formData.append("specialization", specialization);
      formData.append("years_of_experience", yearsOfExperience);
      formData.append("bio", bio || "");
      formData.append("government_id", governmentId);
      formData.append("medical_degree_certificate", medicalDegreeCertificate);
      formData.append("medical_license_upload", medicalLicenseUpload);
      if (profilePhoto) formData.append("profile_photo", profilePhoto);

      await apiClient.post("/dermatologist/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSubmitted?.();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong submitting your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #F8F5FD 0%, #FCF4F8 55%, #F5F7FD 100%)",
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack alignItems="center" spacing={1} sx={{ mb: 4, textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: COLORS.brandGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MedicalServicesRounded sx={{ color: "#fff", fontSize: 26 }} />
          </Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark }}>
            Dermatologist Verification
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted, maxWidth: 420 }}>
            Submit your credentials for admin review. Only verified dermatologists can access the Dermatologist Dashboard.
          </Typography>
        </Stack>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            border: "1px solid " + COLORS.cardBorder,
            boxShadow: "0 20px 45px rgba(139,111,201,0.12)",
            p: { xs: 3, sm: 4 },
          }}
        >
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Medical License Number"
                  fullWidth
                  required
                  value={medicalLicenseNumber}
                  onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                  InputProps={{ sx: inputSx }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Medical Council Registration"
                  fullWidth
                  required
                  value={medicalCouncilRegistration}
                  onChange={(e) => setMedicalCouncilRegistration(e.target.value)}
                  InputProps={{ sx: inputSx }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Hospital / Clinic Name"
                  fullWidth
                  required
                  value={hospitalOrClinicName}
                  onChange={(e) => setHospitalOrClinicName(e.target.value)}
                  InputProps={{ sx: inputSx }}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Specialization"
                  placeholder="e.g. Cosmetic Dermatology"
                  fullWidth
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  InputProps={{ sx: inputSx }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Years of Experience"
                  type="number"
                  fullWidth
                  required
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  InputProps={{ sx: inputSx }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Short Bio (optional)"
                  fullWidth
                  multiline
                  minRows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  InputProps={{ sx: inputSx }}
                />
              </Grid>
            </Grid>

            <Box sx={{ pt: 1, borderTop: "1px solid " + COLORS.cardBorder }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textDark, mb: 1.5, mt: 2 }}>
                Verification Documents
              </Typography>
              <Stack spacing={2}>
                <FileField label="Government ID" required file={governmentId} onChange={setGovernmentId} />
                <FileField
                  label="Medical Degree Certificate"
                  required
                  file={medicalDegreeCertificate}
                  onChange={setMedicalDegreeCertificate}
                />
                <FileField
                  label="Medical License Upload"
                  required
                  file={medicalLicenseUpload}
                  onChange={setMedicalLicenseUpload}
                />
                <FileField label="Profile Photo (optional)" file={profilePhoto} onChange={setProfilePhoto} />
              </Stack>
            </Box>

            {error && (
              <Typography sx={{ color: COLORS.danger, fontSize: 13, textAlign: "center" }}>{error}</Typography>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              sx={{
                py: 1.4,
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                background: COLORS.brandGradient,
                boxShadow: "0 12px 24px rgba(139,111,201,0.3)",
              }}
            >
              {submitting ? "Submitting..." : "Submit for Verification"}
            </Button>

            {onLogout && (
              <Typography
                onClick={onLogout}
                sx={{ textAlign: "center", fontSize: 12.5, color: COLORS.textFaint, cursor: "pointer" }}
              >
                Log out
              </Typography>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}