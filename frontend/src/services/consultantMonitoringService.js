import api from "./api";

export const sendRecommendation = async (userId, data) => {

  const response = await api.post(
    `/consultant-monitoring/recommend/${userId}`,
    data
  );

  return response.data;

};

export const getMonitoredPatients = async () => {
  const response = await api.get("/consultant-monitoring/patients");
  return response.data;
};

export const getPatientMonitoringDetails = async (userId) => {
  const response = await api.get(
    `/consultant-monitoring/patient/${userId}`
  );
  return response.data;
};

export const getMyRecommendations = async () => {
  const response = await api.get(
    "/consultant-monitoring/my-recommendations"
  );

  return response.data;
};