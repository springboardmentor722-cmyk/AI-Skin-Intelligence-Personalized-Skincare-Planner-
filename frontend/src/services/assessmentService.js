import api from "./api";

export const getAssessmentHistory = async () => {
  const response = await api.get("/ai-assessment/history");
  return response.data;
};