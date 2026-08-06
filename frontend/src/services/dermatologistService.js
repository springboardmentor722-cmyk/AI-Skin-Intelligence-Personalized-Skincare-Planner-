import api from "./api";

export const getDermatologistDashboard = async () => {
  const response = await api.get("/dermatologist/dashboard");
  return response.data;
};

export const getDermatologistAppointments = async () => {
  const response = await api.get("/dermatologist/appointments");
  return response.data;
};

export const getDermatologistPatient = async (appointmentId) => {
  const response = await api.get(
    `/dermatologist/patient/${appointmentId}`
  );
  return response.data;
};

export const saveTreatment = async (appointmentId, data) => {
  const response = await api.post(
    `/dermatologist/treatment/${appointmentId}`,
    data
  );
  return response.data;
};

export const getDermatologistPatients = async () => {

  const response = await api.get(
    "/dermatologist/patients"
  );

  return response.data;

};

export const getRecentActivity = async () => {
  const response = await api.get("/dermatologist/recent-activity");
  return response.data;
};