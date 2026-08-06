import api from "./api";

// Dashboard statistics
export const getConsultantDashboard = async () => {
  const response = await api.get("/consultant/dashboard");
  return response.data;
};

// Pending appointments
export const getPendingAppointments = async () => {
  const response = await api.get("/consultant/appointments");
  return response.data;
};

// Patient details
export const getPatientDetails = async (appointmentId) => {
  const response = await api.get(`/consultant/patient/${appointmentId}`);
  return response.data;
};

// Review appointment
export const reviewAppointment = async (appointmentId, data) => {
  const response = await api.put(
    `/consultant/review/${appointmentId}`,
    data
  );
  return response.data;
};

export const getWeeklyTrend = async () => {
  const response = await api.get("/consultant/weekly-trend");
  return response.data;
};

export const getPatientMonitoring = async () => {
  const response = await api.get("/consultant/monitoring");
  return response.data;
};