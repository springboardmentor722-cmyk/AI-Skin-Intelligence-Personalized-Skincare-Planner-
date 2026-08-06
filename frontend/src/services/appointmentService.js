import api from "./api";

// Get all appointments
export const getAppointments = async () => {
  const response = await api.get("/appointments");
  return response.data;
};

// Get one appointment
export const getAppointmentById = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

// Book appointment
export const createAppointment = async (data) => {
  const response = await api.post("/appointments", data);
  return response.data;
};

// Cancel appointment
export const deleteAppointment = async (id) => {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
};