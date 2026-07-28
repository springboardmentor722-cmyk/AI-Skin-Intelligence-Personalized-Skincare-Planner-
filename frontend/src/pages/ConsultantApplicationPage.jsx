import { useState } from "react";
import { Box, Button, Container, Grid, Stack, TextField, Typography } from "@mui/material";
import { UploadFileRounded, CheckCircleRounded, Spa } from "@mui/icons-material";
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
        <input type="file" hidden accept="image/*,.pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </Button>
    </Box>
  );
}

export default function ConsultantApplicationPage({ onSubmitted, onLogout }) {
  const [specialization, setSpecialization] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [certification, setCertification] = useState("");
  const [bio, setBio] = useState("");

  const [governmentId, setGovernmentId] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!specialization || !yearsOfExperience || !certification) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!governmentId || !certificateFile) {
      setError("Government ID and your Professional Certificate are both required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("specialization", specialization);
      formData.append("years_of_experience", yearsOfExperience);
      formData.append("certification", certification);
      formData.append("bio", bio || "");
      formData.append("government_id", governmentId);
      formData.append("certificate", certificateFile);

      await apiClient.post("/consultant/apply", formData, {
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
            <Spa sx={{ color: "#fff", fontSize: 26 }} />
          </Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark }}>
            Consultant Application
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted, maxWidth: 420 }}>
            Submit your qualifications for admin review. Only approved consultants can access the Consultant Dashboard.
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
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Specialization"
                  placeholder="e.g. Acne Treatment"
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
                  label="Qualification / Certification"
                  placeholder="e.g. Certified Skincare Specialist, XYZ Institute"
                  fullWidth
                  required
                  value={certification}
                  onChange={(e) => setCertification(e.target.value)}
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
                  label="Professional Certificate"
                  required
                  file={certificateFile}
                  onChange={setCertificateFile}
                />
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
              {submitting ? "Submitting..." : "Submit for Approval"}
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
