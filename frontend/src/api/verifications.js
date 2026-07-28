import apiClient from "./auth";

export async function getVerificationKpis() {
  const res = await apiClient.get("/admin/verifications/statistics/kpis");
  return res.data;
}

export async function getVerifications(role = "All", status = "All") {
  const params = new URLSearchParams();
  if (role !== "All") params.append("role", role);
  if (status !== "All") params.append("status", status);
  
  const res = await apiClient.get(`/admin/verifications?${params.toString()}`);
  return res.data;
}

export async function getVerificationDetails(userId) {
  const res = await apiClient.get(`/admin/verifications/${userId}`);
  return res.data;
}

export async function approveProfessional(userId) {
  const res = await apiClient.put(`/admin/verifications/${userId}/approve`);
  return res.data;
}

export async function rejectProfessional(userId, reason, adminNotes) {
  const res = await apiClient.put(`/admin/verifications/${userId}/reject`, {
    reason,
    admin_notes: adminNotes
  });
  return res.data;
}

export async function uploadProfessionalDocuments(files, documentType) {
  const formData = new FormData();
  files.forEach(f => formData.append("files", f));
  formData.append("document_type", documentType);
  
  const res = await apiClient.post("/professionals/upload-documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
}
