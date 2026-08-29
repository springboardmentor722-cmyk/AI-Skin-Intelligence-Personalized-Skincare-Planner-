import { recommendationApi } from "./api";

export const getRecommendations = () => recommendationApi.get("/api/v1/recommendations");

export const getClientRecommendations = (userId) =>
  recommendationApi.get(`/api/v1/recommendations/client/${userId}`);

export const getAdminRecommendationOverview = () =>
  recommendationApi.get("/api/v1/recommendations/admin/overview");
