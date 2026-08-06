import api from "./api";

// Get notifications
export const getNotifications = async () => {
  const response = await api.get("/notifications/");
  return response.data;
};

// Mark notification as read
export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};