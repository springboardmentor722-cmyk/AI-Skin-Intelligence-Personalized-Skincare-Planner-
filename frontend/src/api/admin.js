import apiClient from "./auth";

export async function getPendingConsultants() {
  const res = await apiClient.get("/admin/consultants/pending");
  return res.data;
}

export async function getPendingDermatologists() {
  const res = await apiClient.get("/admin/dermatologists/pending");
  return res.data;
}

export async function decideConsultant(userId, decision, notes = "") {
  const res = await apiClient.post(`/admin/consultants/${userId}/decision`, { decision, notes });
  return res.data;
}

export async function decideDermatologist(userId, decision, notes = "") {
  const res = await apiClient.post(`/admin/dermatologists/${userId}/decision`, { decision, notes });
  return res.data;
}

export async function getAllUsers() {
  const res = await apiClient.get("/admin/users");
  return res.data;
}

export async function getAIRules() {
  const res = await apiClient.get("/admin/rules");
  return res.data;
}

export async function getPlatformAnalytics() {
  const res = await apiClient.get("/admin/platform-analytics");
  return res.data;
}

export async function getSecurityPolicies() {
  const res = await apiClient.get("/admin/policies");
  return res.data;
}

export async function getApiIntegrations() {
  const res = await apiClient.get("/admin/integrations");
  return res.data;
}

export async function getPlatformSettings() {
  const res = await apiClient.get("/admin/settings");
  return res.data;
}

export async function suspendUser(userId) {
  const res = await apiClient.post(`/admin/users/${userId}/suspend`);
  return res.data;
}