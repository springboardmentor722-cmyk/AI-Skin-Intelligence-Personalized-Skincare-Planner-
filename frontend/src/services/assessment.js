import { assessmentApi } from "./api";

export const submitAssessment = (data) => assessmentApi.post("/api/v1/assessment/evaluate", data);

export const getLatestScore = () => assessmentApi.get("/api/v1/assessment/score");

export const getScoreHistory = (limit = 30) =>
  assessmentApi.get("/api/v1/assessment/history", { params: { limit } });

export const getConsistencyHistory = (days = 30) =>
  assessmentApi.get("/api/v1/assessment/consistency-history", { params: { days } });

export const getClientScore = (userId) =>
  assessmentApi.get(`/api/v1/assessment/client-score/${userId}`);

export const getClientHistory = (userId, limit = 30) =>
  assessmentApi.get(`/api/v1/assessment/client-history/${userId}`, { params: { limit } });

export const getAdminScoreOverview = () =>
  assessmentApi.get("/api/v1/assessment/admin/overview");

export const generateRoutine = () => assessmentApi.post("/api/v1/routine/generate");

export const getRoutine = () => assessmentApi.get("/api/v1/routine");

export const toggleRoutineStep = (routine_step_id, completed) =>
  assessmentApi.post("/api/v1/routine/logs", { routine_step_id, completed });
