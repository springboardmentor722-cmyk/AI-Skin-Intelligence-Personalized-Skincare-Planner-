import apiClient from "./auth";

// ============================================================
// CONSULTANT DASHBOARD APIs
// ============================================================

export async function getConsultantDashboard() {
  const res = await apiClient.get("/consultant/dashboard");
  return res.data;
}

export async function getConsultantUsers(search = "") {
  const url = search ? `/consultant/users?search=${encodeURIComponent(search)}` : "/consultant/users";
  const res = await apiClient.get(url);
  return res.data;
}

export async function getConsultantUserDetail(id) {
  const res = await apiClient.get(`/consultant/users/${id}`);
  return res.data;
}

export async function getConsultantAppointments() {
  const res = await apiClient.get("/consultant/appointments");
  return res.data;
}

export async function saveConsultantNotes(payload) {
  const res = await apiClient.post("/consultant/notes", payload);
  return res.data;
}

export async function getConsultantClient(id) {
  const res = await apiClient.get(`/consultant/clients/${id}`);
  return res.data;
}

export async function getAiSuggestion(id) {
  const res = await apiClient.get(`/consultant/clients/${id}/ai-suggest`);
  return res.data;
}

export async function saveProductRecommendation(payload) {
  const res = await apiClient.post("/consultant/product-recommendations", payload);
  return res.data;
}

export async function getProducts() {
  const res = await apiClient.get("/products");
  return res.data;
}

export async function getConsultantRoutine(id) {
  const res = await apiClient.get(`/consultant/routines/${id}`);
  return res.data;
}

export async function updateConsultantRoutine(id, payload) {
  const res = await apiClient.put(`/consultant/routines/${id}`, payload);
  return res.data;
}

// ============================================================
// DERMATOLOGIST DASHBOARD APIs
// ============================================================

export async function getDermatologistDashboard() {
  const res = await apiClient.get("/dermatologist/dashboard");
  return res.data;
}

export async function getDermatologistPatients(search = "") {
  const url = search ? `/dermatologist/patients?search=${encodeURIComponent(search)}` : "/dermatologist/patients";
  const res = await apiClient.get(url);
  return res.data;
}

export async function getDermatologistPatientDetail(id) {
  const res = await apiClient.get(`/dermatologist/patients/${id}`);
  return res.data;
}

export async function getDermatologistAppointments() {
  const res = await apiClient.get("/dermatologist/appointments");
  return res.data;
}

export async function saveDermatologistTreatment(payload) {
  const res = await apiClient.post("/dermatologist/treatment", payload);
  return res.data;
}

export async function saveDermatologistPrescription(payload) {
  const res = await apiClient.post("/dermatologist/prescription", payload);
  return res.data;
}

export async function updateDermatologistProfile(payload) {
  const res = await apiClient.put("/dermatologist/profile", payload);
  return res.data;
}

export async function getPatientReportPDF(patientId) {
  const res = await apiClient.get(`/dermatologist/reports/pdf/${patientId}`);
  return res.data;
}

// ============================================================
// USER DASHBOARD APIs
// ============================================================

export async function getUserProfile() {
  const res = await apiClient.get("/users/profile");
  return res.data;
}

export async function updateUserProfile(payload) {
  const res = await apiClient.put("/users/profile", payload);
  return res.data;
}

export async function uploadSkinImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/skin-analysis/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}

export async function getUserAssessmentHistory() {
  const res = await apiClient.get("/skin-analysis/history");
  return res.data;
}

export async function getUserLatestAssessment() {
  const res = await apiClient.get("/skin-analysis/latest");
  return res.data;
}

export async function getUserProgressHistory() {
  const res = await apiClient.get("/progress/history");
  return res.data;
}

export async function getProgressDashboard() {
  const res = await apiClient.get("/api/v1/progress/dashboard");
  return res.data;
}

export async function getLifestyleCurrent() {
  const res = await apiClient.get("/api/v1/lifestyle/current");
  return res.data;
}

export async function getUserActiveRoutine() {
  const res = await apiClient.get("/api/v1/routine");
  return res.data?.routine || res.data || [];
}

export async function logRoutineStep(stepId, completed) {
  const res = await apiClient.post("/api/v1/routine/log-step", {
    routine_step_id: stepId,
    completed,
  });
  return res.data;
}

export async function getUserRecommendedProducts() {
  // Uses JWT auth — no userId needed in URL
  const res = await apiClient.get("/recommendations");
  return res.data;
}

export async function listProducts() {
  const res = await apiClient.get("/products");
  return res.data;
}

export async function getProductDetails(id) {
  const res = await apiClient.get(`/products/${id}`);
  return res.data;
}

export async function adminAddProduct(payload) {
  const res = await apiClient.post("/admin/products", payload);
  return res.data;
}

export async function adminUpdateProduct(productId, payload) {
  const res = await apiClient.put(`/admin/products/${productId}`, payload);
  return res.data;
}

export async function adminDeleteProduct(productId) {
  const res = await apiClient.delete(`/admin/products/${productId}`);
  return res.data;
}

export async function adminAddIngredient(payload) {
  const res = await apiClient.post("/admin/ingredients", payload);
  return res.data;
}

export async function getConsultantsList() {
  const res = await apiClient.get("/appointments/consultants");
  return res.data;
}

export async function getDermatologistsList() {
  const res = await apiClient.get("/appointments/dermatologists");
  return res.data;
}

export async function bookConsultation(payload) {
  const res = await apiClient.post(
    `/appointments?scheduled_at=${encodeURIComponent(payload.scheduled_at)}&professional_id=${payload.professional_id}&professional_type=${payload.professional_type}&reason=${encodeURIComponent(payload.reason)}`
  );
  return res.data;
}

export async function getUserAppointments() {
  const res = await apiClient.get("/appointments/my");
  return res.data;
}

export async function getDoctorRecommendations() {
  const res = await apiClient.get("/doctor/recommendations");
  return res.data;
}

export async function getUserNotifications() {
  const res = await apiClient.get("/notifications/mine");
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await apiClient.patch(`/notifications/${id}/read`);
  return res.data;
}

// ============================================================
// ASSESSMENT ENGINE APIs (Milestone 2)
// ============================================================

/**
 * POST /api/v1/assessment/submit
 * All-in-one atomic assessment workflow.
 * Saves profile + lifestyle → runs scoring engine → generates routine → returns full result.
 */
export async function submitAssessment(payload) {
  const res = await apiClient.post("/api/v1/assessment/submit", payload);
  return res.data;
}

/**
 * POST /api/v1/assessment/save
 * Auto-saves assessment step draft in real-time.
 */
export async function saveAssessmentProgress(payload) {
  const res = await apiClient.post("/api/v1/assessment/save", payload);
  return res.data;
}

/**
 * GET /api/v1/assessment/current
 * Fetches current saved assessment & draft from backend database.
 */
export async function getSavedCurrentAssessment() {
  const res = await apiClient.get("/api/v1/assessment/current");
  return res.data;
}

/**
 * GET /api/v1/assessment/{id}
 * Fetch a specific assessment record by UUID.
 */
export async function getAssessmentById(id) {
  const res = await apiClient.get(`/api/v1/assessment/${id}`);
  return res.data;
}

/**
 * GET /api/v1/assessment/score/{id}
 * Re-run the scoring engine for a specific assessment.
 */
export async function getAssessmentScore(id) {
  const res = await apiClient.get(`/api/v1/assessment/score/${id}`);
  return res.data;
}

/**
 * GET /api/v1/assessment/score (latest)
 * Re-calculate score from latest stored profile + lifestyle.
 */
export async function getLatestAssessmentScore() {
  const res = await apiClient.get("/api/v1/assessment/score");
  return res.data;
}

/**
 * GET /api/v1/assessment/history
 * Returns historical score snapshots for progress charts.
 */
export async function getAssessmentScoreHistory() {
  const res = await apiClient.get("/api/v1/assessment/history");
  return res.data;
}

// ============================================================
// REPORT APIs (Milestone 2)
// ============================================================

/**
 * GET /api/v1/reports/latest
 * Full structured JSON report for the user's latest assessment.
 */
export async function getLatestReport() {
  const res = await apiClient.get("/api/v1/reports/latest");
  return res.data;
}

/**
 * GET /api/v1/reports/{assessmentId}
 * Full structured JSON report for a specific assessment.
 */
export async function getReportById(assessmentId) {
  const res = await apiClient.get(`/api/v1/reports/${assessmentId}`);
  return res.data;
}

/**
 * GET /api/v1/reports/{assessmentId}/pdf
 * Download a PDF report for a specific assessment.
 */
export async function downloadAssessmentPDF(assessmentId) {
  const response = await apiClient.get(`/api/v1/reports/${assessmentId}/pdf`, {
    responseType: "blob",
  });
  return response.data;
}

/**
 * GET /api/v1/reports/latest/pdf download
 */
export async function downloadLatestReportPDF() {
  // First get the latest report to get the assessment_id
  const report = await getLatestReport();
  if (!report?.assessment_id) throw new Error("No assessment found");
  return downloadAssessmentPDF(report.assessment_id);
}

/**
 * Compatibility helper for existing dashboard print button.
 */
export async function downloadReportPDF(idOrNull) {
  // If the user dashboard calls it, it passes user ID, so we want the latest report.
  // We can also check if we have a active assessment id or not.
  // To be safe, we try latest/pdf first unless we are sure it's a specific assessment.
  // Since we also want it to work for user.id, we hit /latest/pdf.
  const url = "/api/v1/reports/latest/pdf";
  const response = await apiClient.get(url, {
    responseType: "blob",
  });
  return response.data;
}


// ============================================================
// ADMIN APIs
// ============================================================

export async function getAdminStats() {
  const res = await apiClient.get("/admin/dashboard-stats");
  return res.data;
}

export async function activateUser(userId) {
  const res = await apiClient.post(`/admin/users/${userId}/activate`);
  return res.data;
}

// ============================================================
// LIFESTYLE APIs
// ============================================================

export async function getLatestLifestyleLog() {
  const res = await apiClient.get("/lifestyle/latest");
  return res.data;
}

export async function getMyLifestyleLogs() {
  const res = await apiClient.get("/lifestyle/");
  return res.data;
}

export async function saveLifestyleLog(payload) {
  const res = await apiClient.post("/lifestyle/", payload);
  return res.data;
}

// ============================================================
// REPORTS DASHBOARD APIs
// ============================================================

export async function getReportsDashboard() {
  const res = await apiClient.get("/api/v1/reports/dashboard");
  return res.data;
}

export async function uploadExternalReport(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/api/v1/reports/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}

// ============================================================
// DERMATOLOGIST ASSESSMENTS APIs
// ============================================================

export async function getDermatologistAssessments() {
  const res = await apiClient.get("/dermatologist/assessments");
  return res.data;
}

export async function getDermatologistAssessmentDetail(id) {
  const res = await apiClient.get(`/dermatologist/assessments/${id}`);
  return res.data;
}

export async function reviewDermatologistAssessment(id, payload) {
  const res = await apiClient.patch(`/dermatologist/assessments/${id}/review`, payload);
  return res.data;
}

