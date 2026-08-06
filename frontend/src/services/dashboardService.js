import api from "./api";

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getUserDashboardStats = async () => {
  const response = await api.get("/dashboard/user-stats");
  return response.data;
};

export const getLatestAssessment = async () => {
  const response = await api.get("/dashboard/latest-assessment");
  return response.data;
};

export const getProgressChart = async () => {
  const response = await api.get("/dashboard/progress-chart");
  return response.data;
};

export const getProgressHistory = async () => {
  const response = await api.get("/ai-assessment/history");
  return response.data;
};

export const getProgressSummary = async () => {
  const response = await api.get("/progress/summary");
  return response.data;
};

export const getProgressDashboard = async () => {
  const response = await api.get("/progress/dashboard");
  return response.data;
};