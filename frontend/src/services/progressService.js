import api from "./api";

// AI Assessment History
export const getProgressHistory = async () => {
  const response = await api.get("/ai-assessment/history");
  return response.data;
};

// Latest AI Assessment
export const getLatestAssessment = async () => {
  const response = await api.get("/dashboard/latest-assessment");
  return response.data;
};